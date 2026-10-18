import { useEffect, useRef, useState } from 'react'
import {
  AlertCircle,
  Maximize2,
  RefreshCw,
  Volume2,
  VolumeX,
  Radio,
  ChevronLeft,
  ChevronRight,
  Tv,
} from 'lucide-react'
import type { LiveChannel } from '@/services/liveChannels'
import { categoryLabel, countryFlag } from '@/services/liveChannels'
import { getLiveChannelEPG } from '@/services/epg'

interface LivePlayerProps {
  channel: LiveChannel
  onNextChannel?: () => void
  onPrevChannel?: () => void
}

const LivePlayer = ({ channel, onNextChannel, onPrevChannel }: LivePlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const loadedRef = useRef(false)
  const playingRef = useRef(false)
  const watchdogRef = useRef<NodeJS.Timeout | null>(null)

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

  // Obtém dados em tempo real da programação do canal
  const epg = getLiveChannelEPG(channel.id, channel.category, channel.name)

  // Suporte a atalhos de controle remoto e teclado para TV Box / Computador
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return

      if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault()
        onPrevChannel?.()
      } else if (e.key === 'ArrowDown' || e.key === 'PageDown') {
        e.preventDefault()
        onNextChannel?.()
      } else if (e.key === 'm' || e.key === 'M') {
        toggleMute()
      } else if (e.key === 'f' || e.key === 'F') {
        handleFullscreen()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onNextChannel, onPrevChannel])

  // Reinicia o player quando o canal muda.
  useEffect(() => {
    const initIdx = getInitialSignal()
    loadedRef.current = false
    playingRef.current = false
    if (watchdogRef.current) {
      clearTimeout(watchdogRef.current)
      watchdogRef.current = null
    }
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

    loadedRef.current = false
    playingRef.current = false
    if (watchdogRef.current) {
      clearTimeout(watchdogRef.current)
      watchdogRef.current = null
    }

    setLoaded(false)
    setError(false)
    setStatusMessage(
      channel.sources.length > 1 && sourceIndex > 0
        ? `Sintonizando Sinal ${sourceIndex + 1}...`
        : 'Sintonizando sinal...'
    )

    let cancelled = false
    let hlsInstance: { destroy: () => void; loadSource: (u: string) => void; startLoad: () => void } | null = null

    const goNext = () => {
      if (cancelled) return
      if (watchdogRef.current) {
        clearTimeout(watchdogRef.current)
        watchdogRef.current = null
      }
      if (sourceIndex < channel.sources.length - 1) {
        setSourceIndex((i) => i + 1)
      } else {
        setError(true)
      }
    }

    const markPlaying = () => {
      if (cancelled) return
      loadedRef.current = true
      playingRef.current = true
      setLoaded(true)
      setError(false)
      if (watchdogRef.current) {
        clearTimeout(watchdogRef.current)
        watchdogRef.current = null
      }
      try {
        sessionStorage.setItem(`cinebg_signal_${channel.id}`, String(sourceIndex))
      } catch {}
    }

    // Watchdog de segurança seguro usando refs: se não reproduzir após 12s, tenta o próximo sinal
    watchdogRef.current = setTimeout(() => {
      if (cancelled) return
      if (loadedRef.current || playingRef.current) return
      const v = videoRef.current
      if (v && !v.paused && v.currentTime > 0) {
        markPlaying()
        return
      }
      goNext()
    }, 12000)

    void import('hls.js').then((mod) => {
      if (cancelled) return
      const Hls = mod.default

      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: false, // Desativa worker para evitar engasgos em Android TV / WebViews
          liveDurationInfinity: true,
          lowLatencyMode: false,
          backBufferLength: 15,
          maxBufferLength: 20,
          maxMaxBufferLength: 40,
          maxBufferSize: 50 * 1000 * 1000,
          liveSyncDurationCount: 4, // 4 segmentos (~12s) de margem segura para IPTV estável sem travamento
          liveMaxLatencyDurationCount: 15,
          manifestLoadingTimeOut: 15000,
          manifestLoadingMaxRetry: 4,
          levelLoadingTimeOut: 15000,
          levelLoadingMaxRetry: 4,
          fragLoadingTimeOut: 20000,
          fragLoadingMaxRetry: 6,
          nudgeOffset: 0.2,
          nudgeMaxRetry: 5,
          maxFragLookUpTolerance: 0.3,
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
              markPlaying()
            }).catch(() => {
              // Se o navegador barrar o áudio por política de autoplay, silencia e reproduz imediatamente
              if (!cancelled && video) {
                video.muted = true
                setMuted(true)
                video.play().then(() => {
                  markPlaying()
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

        hls.on(Hls.Events.FRAG_LOADED, markPlaying)
        hls.on(Hls.Events.FRAG_PARSED, markPlaying)
        hls.on(Hls.Events.FRAG_BUFFERED, markPlaying)

        hls.on(Hls.Events.ERROR, (_event: unknown, data: unknown) => {
          if (cancelled) return
          const payload = data as { fatal?: boolean; type?: string; details?: string }

          // Se houver um stall transitório no buffer, apenas garante carregamento ativo sem salto destrutivo
          if (!payload.fatal) {
            if (
              payload.details === 'bufferStalledError' ||
              payload.details === 'bufferNudgeOnStall'
            ) {
              try {
                hls.startLoad()
              } catch {}
            }
            return
          }

          // Se o sub-manifesto temporário expirar, recarrega o master para obter o novo token dinâmico
          if (payload.details === 'levelLoadError' || payload.details === 'levelLoadTimeOut') {
            try {
              hls.loadSource(src)
              hls.startLoad()
              return
            } catch {}
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
      if (watchdogRef.current) {
        clearTimeout(watchdogRef.current)
        watchdogRef.current = null
      }
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
      {/* Barra de identificação do canal & EPG */}
      <div className="bg-[#111118] border border-white/5 rounded-t-xl px-4 py-2.5 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <span className="flex items-center gap-1.5 text-[10px] font-black tracking-wide text-white bg-accent-red px-2 py-0.5 rounded-full uppercase flex-shrink-0">
              <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
              Ao Vivo
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-white font-bold text-sm truncate">{channel.name}</p>
                <span className="px-1.5 py-0.2 rounded bg-white/10 text-white/60 text-[10px] font-semibold">
                  {categoryLabel(channel.category)}
                </span>
                {channel.quality && (
                  <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                    {channel.quality}
                  </span>
                )}
              </div>
              <p className="text-amber-400 font-semibold text-xs truncate flex items-center gap-1.5 mt-0.5">
                <Tv className="h-3 w-3 flex-shrink-0" />
                <span>{epg.title}</span>
                <span className="text-white/40 font-normal">({epg.start} às {epg.end})</span>
              </p>
            </div>
          </div>

          {/* Seleção de sinais, zapping e recarga */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {onPrevChannel && (
              <button
                onClick={onPrevChannel}
                className="px-2.5 py-1 text-white/70 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold"
                title="Canal Anterior (Seta Cima)"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Anterior</span>
              </button>
            )}
            {onNextChannel && (
              <button
                onClick={onNextChannel}
                className="px-2.5 py-1 text-white/70 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold"
                title="Próximo Canal (Seta Baixo)"
              >
                <span className="hidden sm:inline">Próximo</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            )}

            {channel.sources.length > 1 && (
              <div className="flex items-center gap-1 ml-1 mr-1">
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

        {/* Barra de Progresso EPG do programa em exibição */}
        <div className="flex items-center gap-2 pt-1.5 border-t border-white/5 text-[10px] text-white/40">
          <span className="font-mono text-white/60">{epg.start}</span>
          <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-400 via-orange-500 to-accent-red transition-all duration-300"
              style={{ width: `${epg.progress}%` }}
            />
          </div>
          <span className="font-mono text-white/60">{epg.end}</span>
          <span className="hidden md:inline text-white/50 ml-2 truncate">
            A seguir: <strong className="text-white/70 font-semibold">{epg.nextTitle}</strong>
          </span>
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

            <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
              <button
                onClick={reload}
                className="flex items-center gap-2 bg-accent-red text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-red-600 transition-colors shadow-lg shadow-red-900/40"
              >
                <RefreshCw className="h-4 w-4" />
                Tentar Novamente
              </button>
              {onNextChannel && (
                <button
                  onClick={onNextChannel}
                  className="flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-black px-5 py-2.5 rounded-xl text-sm font-bold transition-colors shadow-lg shadow-amber-400/20"
                >
                  <span>Próximo Canal</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              )}
            </div>
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
            loadedRef.current = true
            setLoaded(true)
            if (watchdogRef.current) {
              clearTimeout(watchdogRef.current)
              watchdogRef.current = null
            }
            try {
              sessionStorage.setItem(`cinebg_signal_${channel.id}`, String(sourceIndex))
            } catch {}
          }}
          onPlaying={() => {
            loadedRef.current = true
            playingRef.current = true
            setLoaded(true)
            if (watchdogRef.current) {
              clearTimeout(watchdogRef.current)
              watchdogRef.current = null
            }
            try {
              sessionStorage.setItem(`cinebg_signal_${channel.id}`, String(sourceIndex))
            } catch {}
          }}
          onTimeUpdate={() => {
            const v = videoRef.current
            if (v && v.currentTime > 0 && !loadedRef.current) {
              loadedRef.current = true
              playingRef.current = true
              setLoaded(true)
              if (watchdogRef.current) {
                clearTimeout(watchdogRef.current)
                watchdogRef.current = null
              }
              try {
                sessionStorage.setItem(`cinebg_signal_${channel.id}`, String(sourceIndex))
              } catch {}
            }
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
          {onPrevChannel && (
            <button
              onClick={onPrevChannel}
              className="p-2 bg-black/70 hover:bg-black/90 rounded-lg text-white/70 hover:text-white transition-colors backdrop-blur-sm"
              title="Canal Anterior (Seta Cima)"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}
          {onNextChannel && (
            <button
              onClick={onNextChannel}
              className="p-2 bg-black/70 hover:bg-black/90 rounded-lg text-white/70 hover:text-white transition-colors backdrop-blur-sm"
              title="Próximo Canal (Seta Baixo)"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          )}
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
