import { useEffect, useRef, useState } from 'react'
import { AlertCircle, Maximize2, RefreshCw, Volume2, VolumeX, Radio } from 'lucide-react'
import type { LiveChannel } from '@/services/liveChannels'
import { categoryLabel, countryFlag } from '@/services/liveChannels'

interface LivePlayerProps {
  channel: LiveChannel
}

const LivePlayer = ({ channel }: LivePlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Recupera o último sinal funcional salvo para este canal ou inicia em 0
  const getInitialSignal = () => {
    try {
      const saved = sessionStorage.getItem(`cinebg_signal_${channel.id}`)
      if (saved !== null) {
        const idx = Number(saved)
        if (!isNaN(idx) && idx >= 0 && idx < channel.sources.length) return idx
      }
    } catch {}
    return 0
  }

  const [sourceIndex, setSourceIndex] = useState(getInitialSignal)
  const [mountKey, setMountKey] = useState(0)
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)
  const [muted, setMuted] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string>('Sintonizando sinal...')

  // Reinicia o player quando o canal muda.
  useEffect(() => {
    const initIdx = getInitialSignal()
    setSourceIndex(initIdx)
    setMountKey(0)
    setLoaded(false)
    setError(false)
    setStatusMessage(initIdx > 0 ? `Sintonizando Sinal ${initIdx + 1}...` : 'Sintonizando sinal...')
  }, [channel.id])

  // Anexa o stream HLS atual com fallback automático, auto-recuperação e áudio PT
  useEffect(() => {
    const video = videoRef.current
    const src = channel.sources[sourceIndex]
    if (!video || !src) {
      setError(true)
      return
    }

    setLoaded(false)
    setError(false)
    setStatusMessage(
      channel.sources.length > 1 && sourceIndex > 0
        ? `Sintonizando Sinal ${sourceIndex + 1}...`
        : 'Sintonizando sinal...'
    )

    let cancelled = false
    let hlsInstance: { destroy: () => void } | null = null

    const goNext = () => {
      if (cancelled) return
      if (sourceIndex < channel.sources.length - 1) {
        setSourceIndex((i) => i + 1)
      } else {
        setError(true)
      }
    }

    // Watchdog de segurança: se o sinal não reproduzir em até 8.5s e houver outro sinal, avança automaticamente
    const stallWatchdog = setTimeout(() => {
      if (!cancelled && !loaded) {
        if (sourceIndex < channel.sources.length - 1) {
          goNext()
        }
      }
    }, 8500)

    void import('hls.js').then((mod) => {
      if (cancelled) return
      const Hls = mod.default

      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: false, // Desativa worker para evitar engasgos de thread em Android TV / WebViews
          liveDurationInfinity: true,
          lowLatencyMode: false,
          backBufferLength: 15,
          maxBufferLength: 15, // Buffer equilibrado (não tenta puxar além da janela do servidor)
          maxMaxBufferLength: 30,
          maxBufferSize: 30 * 1000 * 1000,
          liveSyncDurationCount: 3, // Ótimo para IPTV com janelas de 3-4 segmentos (evita travamento contínuo)
          liveMaxLatencyDurationCount: 10,
          manifestLoadingTimeOut: 6500, // Timeout ágil de 6.5s
          manifestLoadingMaxRetry: 2,
          levelLoadingTimeOut: 6500,
          levelLoadingMaxRetry: 2,
          fragLoadingTimeOut: 12000,
          fragLoadingMaxRetry: 3,
          nudgeOffset: 0.1,
          nudgeMaxRetry: 5,
          maxFragLookUpTolerance: 0.25,
          autoStartLoad: true,
        })

        hlsInstance = hls
        hls.loadSource(src)
        hls.attachMedia(video)

        let networkRetryCount = 0

        const tryPlay = () => {
          if (cancelled || !video) return
          const p = video.play()
          if (p !== undefined) {
            p.then(() => {
              if (!cancelled) {
                setLoaded(true)
                try {
                  sessionStorage.setItem(`cinebg_signal_${channel.id}`, String(sourceIndex))
                } catch {}
              }
            }).catch(() => {
              // Se o navegador barrar o áudio por política de autoplay, silencia e reproduz o vídeo imediatamente
              if (!cancelled && video) {
                video.muted = true
                setMuted(true)
                video.play().then(() => {
                  if (!cancelled) {
                    setLoaded(true)
                    try {
                      sessionStorage.setItem(`cinebg_signal_${channel.id}`, String(sourceIndex))
                    } catch {}
                  }
                }).catch(() => {})
              }
            })
          }
        }

        // Seleção automática do áudio em Português / Dublado
        const selectPortugueseAudio = () => {
          if (!hls.audioTracks || hls.audioTracks.length <= 1) return
          const ptIdx = hls.audioTracks.findIndex((t) => {
            const l = (t.lang || '').toLowerCase()
            const n = (t.name || '').toLowerCase()
            return (
              l.startsWith('por') ||
              l.startsWith('pt') ||
              n.includes('por') ||
              n.includes('dub') ||
              n.includes('brasil')
            )
          })
          if (ptIdx !== -1 && hls.audioTrack !== ptIdx) {
            hls.audioTrack = ptIdx
          }
        }

        hls.on(Hls.Events.AUDIO_TRACKS_UPDATED, selectPortugueseAudio)

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          selectPortugueseAudio()
          tryPlay()
        })

        hls.on(Hls.Events.FRAG_LOADED, () => {
          if (!cancelled) {
            setLoaded(true)
          }
        })

        hls.on(Hls.Events.ERROR, (_event: unknown, data: unknown) => {
          if (cancelled) return
          const payload = data as { fatal?: boolean; type?: string; details?: string }

          // Recuperação automática de pequenos saltos de timestamp / buraco no buffer IPTV
          if (!payload.fatal) {
            if (
              payload.details === 'bufferStalledError' ||
              payload.details === 'bufferNudgeOnStall'
            ) {
              if (video && !video.paused) {
                try {
                  video.currentTime += 0.1
                } catch {}
              }
            }
            return
          }

          if (payload.type === Hls.ErrorTypes.MEDIA_ERROR) {
            try {
              hls.recoverMediaError()
              return
            } catch {
              /* prossegue para o próximo sinal se falhar recuperação de mídia */
            }
          }

          if (payload.type === Hls.ErrorTypes.NETWORK_ERROR) {
            // Tenta 1 recuperação rápida de rede antes de alternar sinal
            if (networkRetryCount < 1) {
              networkRetryCount++
              setTimeout(() => {
                if (!cancelled && hlsInstance) {
                  hls.startLoad()
                }
              }, 1000)
              return
            }
          }

          hls.destroy()
          goNext()
        })
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Safari / iOS reproduz HLS nativamente quando Hls.js não é suportado
        video.src = src
        video.play().catch(() => {
          video.muted = true
          setMuted(true)
          video.play().catch(() => {})
        })
        const onErr = () => goNext()
        video.addEventListener('error', onErr)
      } else {
        setError(true)
      }
    })

    return () => {
      cancelled = true
      clearTimeout(stallWatchdog)
      if (hlsInstance) hlsInstance.destroy()
    }
  }, [channel.id, channel.sources, sourceIndex, mountKey])

  const reload = () => {
    setSourceIndex(0)
    setLoaded(false)
    setError(false)
    setStatusMessage('Sintonizando sinal...')
    setMountKey((k) => k + 1)
  }

  const selectSource = (index: number) => {
    setSourceIndex(index)
    setLoaded(false)
    setError(false)
    setStatusMessage(`Sintonizando Sinal ${index + 1}...`)
    setMountKey((k) => k + 1)
  }

  const handleFullscreen = () => {
    const node = containerRef.current
    if (!node) return
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {})
    } else {
      node.requestFullscreen().catch(() => {})
    }
  }

  const toggleMute = () => {
    const video = videoRef.current
    if (!video) return
    video.muted = !video.muted
    setMuted(video.muted)
  }

  return (
    <div className="space-y-0">
      {/* Barra de identificação do canal */}
      <div className="flex flex-wrap items-center justify-between bg-[#111118] border border-white/5 rounded-t-xl px-4 py-2.5 gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <span className="flex items-center gap-1.5 text-[10px] font-black tracking-wide text-white bg-accent-red px-2 py-0.5 rounded-full uppercase flex-shrink-0">
            <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
            Ao Vivo
          </span>
          <div className="min-w-0">
            <p className="text-white font-bold text-sm truncate">{channel.name}</p>
            <p className="text-white/40 text-xs truncate">
              {categoryLabel(channel.category)} · {countryFlag(channel.country)}
              {channel.quality ? ` · ${channel.quality}` : ''}
            </p>
          </div>
        </div>

        {/* Seleção de sinais / recarga */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {channel.sources.length > 1 && (
            <div className="flex items-center gap-1 mr-1">
              <Radio className="h-3.5 w-3.5 text-white/30 hidden sm:inline" />
              {channel.sources.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => selectSource(idx)}
                  className={`px-2 py-0.5 text-[11px] font-semibold rounded-md transition-colors ${
                    sourceIndex === idx
                      ? 'bg-accent-red text-white'
                      : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                  }`}
                  title={`Alternar para Sinal ${idx + 1}`}
                >
                  Sinal {idx + 1}
                </button>
              ))}
            </div>
          )}
          <button
            onClick={reload}
            className="p-1.5 text-white/40 hover:text-white transition-colors rounded-lg hover:bg-white/5 flex-shrink-0"
            title="Recarregar canal"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Container do player */}
      <div
        ref={containerRef}
        className="relative bg-black overflow-hidden rounded-b-xl aspect-video"
      >
        {!loaded && !error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0a0a10] z-10 gap-3 pointer-events-none">
            <div className="w-12 h-12 border-2 border-white/5 border-t-accent-red rounded-full animate-spin" />
            {channel.logo && (
              <img
                src={channel.logo}
                alt={channel.name}
                className="h-12 max-w-[140px] object-contain opacity-60"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none'
                }}
              />
            )}
            <p className="text-white/70 text-sm font-semibold">{statusMessage}</p>
            {channel.sources.length > 1 && (
              <p className="text-white/30 text-xs">
                Sinal {sourceIndex + 1} de {channel.sources.length}
              </p>
            )}
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0a0a10] z-10 gap-4 p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-400" />
            <div>
              <p className="text-white font-bold text-lg">Canal indisponível</p>
              <p className="text-white/40 text-sm mt-1 max-w-sm">
                Não foi possível conectar a transmissão ao vivo agora. Experimente alternar para outro sinal ou tentar novamente.
              </p>
            </div>
            
            {channel.sources.length > 1 && (
              <div className="flex flex-wrap items-center justify-center gap-2">
                {channel.sources.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => selectSource(idx)}
                    className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold transition-colors"
                  >
                    Testar Sinal {idx + 1}
                  </button>
                ))}
              </div>
            )}

            <button
              onClick={reload}
              className="flex items-center gap-2 bg-accent-red text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-red-600 transition-colors shadow-lg shadow-red-900/40"
            >
              <RefreshCw className="h-4 w-4" />
              Tentar Novamente
            </button>
          </div>
        )}

        <video
          key={`${channel.id}-${mountKey}`}
          ref={videoRef}
          title={channel.name}
          controls
          autoPlay
          playsInline
          className="w-full h-full bg-black cursor-pointer"
          onLoadedData={() => {
            setLoaded(true)
            try {
              sessionStorage.setItem(`cinebg_signal_${channel.id}`, String(sourceIndex))
            } catch {}
          }}
          onPlaying={() => {
            setLoaded(true)
            try {
              sessionStorage.setItem(`cinebg_signal_${channel.id}`, String(sourceIndex))
            } catch {}
          }}
          onClick={() => {
            const v = videoRef.current
            if (!v) return
            if (v.paused) v.play().catch(() => {})
            else v.pause()
          }}
        />

        {/* Controles flutuantes */}
        <div className="absolute bottom-3 right-3 flex items-center gap-2 z-30">
          <button
            onClick={toggleMute}
            className="p-2 bg-black/70 hover:bg-black/90 rounded-lg text-white/70 hover:text-white transition-colors backdrop-blur-sm"
            title={muted ? 'Ativar som' : 'Silenciar'}
          >
            {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>
          <button
            onClick={handleFullscreen}
            className="p-2 bg-black/70 hover:bg-black/90 rounded-lg text-white/70 hover:text-white transition-colors backdrop-blur-sm"
            title="Tela cheia"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default LivePlayer
