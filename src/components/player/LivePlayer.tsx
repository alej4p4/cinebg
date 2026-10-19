import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
  X,
} from 'lucide-react'
import { Capacitor } from '@capacitor/core'
import type { LiveChannel } from '@/services/liveChannels'
import { categoryLabel } from '@/services/liveChannels'
import { getLiveChannelEPG } from '@/services/epg'
import Focusable from '@/components/tv/Focusable'

interface LivePlayerProps {
  channel: LiveChannel
  onClose?: () => void
  onNextChannel?: () => void
  onPrevChannel?: () => void
  isFavorite?: boolean
  onToggleFavorite?: () => void
}

const LivePlayer = ({
  channel,
  onClose,
  onNextChannel,
  onPrevChannel,
  isFavorite,
  onToggleFavorite,
}: LivePlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const loadedRef = useRef(false)
  const playingRef = useRef(false)
  const watchdogRef = useRef<NodeJS.Timeout | null>(null)

  // OSD auto-hiding (oculta após 3.5 segundos sem interação)
  const [showOsd, setShowOsd] = useState(true)
  const osdTimerRef = useRef<NodeJS.Timeout | null>(null)

  const resetOsdTimer = () => {
    setShowOsd(true)
    if (osdTimerRef.current) clearTimeout(osdTimerRef.current)
    osdTimerRef.current = setTimeout(() => {
      setShowOsd(false)
    }, 3500)
  }

  // Ao abrir o canal, entra em tela cheia imediata (estilo YuCine)
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      import('@capacitor/status-bar')
        .then(({ StatusBar }) => {
          StatusBar.hide().catch(() => {})
        })
        .catch(() => {})
    }
    if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {})
    }

    resetOsdTimer()

    return () => {
      if (osdTimerRef.current) clearTimeout(osdTimerRef.current)
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {})
      }
      if (Capacitor.isNativePlatform()) {
        import('@capacitor/status-bar')
          .then(({ StatusBar }) => {
            StatusBar.show().catch(() => {})
          })
          .catch(() => {})
      }
    }
  }, [channel.id])

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
      resetOsdTimer()

      if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault()
        onPrevChannel?.()
      } else if (e.key === 'ArrowDown' || e.key === 'PageDown') {
        e.preventDefault()
        onNextChannel?.()
      } else if (e.key === 'ArrowLeft') {
        if (channel.sources.length > 1) {
          e.preventDefault()
          setSourceIndex((prev) => (prev - 1 + channel.sources.length) % channel.sources.length)
        }
      } else if (e.key === 'ArrowRight') {
        if (channel.sources.length > 1) {
          e.preventDefault()
          setSourceIndex((prev) => (prev + 1) % channel.sources.length)
        }
      } else if (e.key === 'Escape' || e.key === 'Backspace' || e.keyCode === 27 || e.keyCode === 4) {
        e.preventDefault()
        onClose?.()
      } else if (e.key === 'm' || e.key === 'M') {
        toggleMute()
      } else if (e.key === 'f' || e.key === 'F') {
        handleFullscreen()
      } else if (e.key === 'Enter') {
        setShowOsd((prev) => !prev)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [channel, onNextChannel, onPrevChannel, onClose])

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
    <div
      ref={containerRef}
      className="fixed inset-0 z-[9999] w-screen h-screen bg-black overflow-hidden flex items-center justify-center select-none"
      onMouseMove={resetOsdTimer}
      onTouchStart={resetOsdTimer}
      onClick={resetOsdTimer}
    >
      {/* Loading state */}
      {!loaded && !error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-20 gap-3 pointer-events-none">
          <div className="w-14 h-14 border-3 border-white/10 border-t-amber-400 rounded-full animate-spin" />
          {channel.logo && (
            <img
              src={channel.logo}
              alt={channel.name}
              className="h-14 max-w-[150px] object-contain opacity-80 drop-shadow"
              onError={(e) => {
                ;(e.target as HTMLElement).style.display = 'none'
              }}
            />
          )}
          <p className="text-white/80 text-sm font-bold tracking-wide">{statusMessage}</p>
          {channel.sources.length > 1 && (
            <p className="text-amber-400/80 text-xs font-mono">
              Sinal {sourceIndex + 1} de {channel.sources.length}
            </p>
          )}
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/95 z-30 gap-4 p-6 text-center">
          <AlertCircle className="h-14 h-14 text-accent-red animate-pulse" />
          <div>
            <h2 className="text-white font-extrabold text-xl">Canal Temporariamente Indisponível</h2>
            <p className="text-white/50 text-sm mt-1 max-w-md">
              Não foi possível sintonizar a transmissão ao vivo deste canal. Você pode testar outro sinal alternativo ou avançar para o próximo canal.
            </p>
          </div>

          {channel.sources.length > 1 && (
            <div className="flex flex-wrap items-center justify-center gap-2">
              {channel.sources.map((_, idx) => (
                <Focusable key={idx} onEnterPress={() => selectSource(idx)}>
                  <button
                    onClick={() => selectSource(idx)}
                    className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold transition-colors"
                  >
                    Testar Sinal {idx + 1}
                  </button>
                </Focusable>
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
            <Focusable onEnterPress={reload}>
              <button
                onClick={reload}
                className="flex items-center gap-2 bg-accent-red text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-red-600 transition-colors shadow-lg shadow-red-900/40"
              >
                <RefreshCw className="h-4 w-4" />
                Tentar Novamente
              </button>
            </Focusable>
            {onNextChannel && (
              <Focusable onEnterPress={onNextChannel}>
                <button
                  onClick={onNextChannel}
                  className="flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-black px-5 py-2.5 rounded-xl text-sm font-bold transition-colors shadow-lg shadow-amber-400/20"
                >
                  <span>Próximo Canal</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </Focusable>
            )}
            {onClose && (
              <Focusable onEnterPress={onClose}>
                <button
                  onClick={onClose}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white text-sm font-bold rounded-xl transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Voltar aos Canais
                </button>
              </Focusable>
            )}
          </div>
        </div>
      )}

      {/* Video Fullscreen */}
      <video
        key={`${channel.id}-${mountKey}`}
        ref={videoRef}
        title={channel.name}
        autoPlay
        playsInline
        className="w-full h-full object-contain bg-black cursor-pointer"
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
          resetOsdTimer()
          const v = videoRef.current
          if (!v) return
          if (v.paused) v.play().catch(() => {})
          else v.pause()
        }}
      />

      {/* OSD Top Bar (auto-hiding) */}
      <AnimatePresence>
        {showOsd && (
          <motion.div
            initial={{ opacity: 0, y: -24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -24 }}
            transition={{ duration: 0.25 }}
            className="absolute top-0 left-0 right-0 p-4 sm:p-6 bg-gradient-to-b from-black/95 via-black/60 to-transparent z-40 flex items-center justify-between pointer-events-auto"
          >
            <div className="flex items-center gap-3 min-w-0">
              {onClose && (
                <Focusable onEnterPress={onClose}>
                  <button
                    onClick={onClose}
                    className="p-2 sm:p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    title="Voltar aos Canais (Voltar/ESC)"
                  >
                    <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
                    <span className="text-xs font-bold hidden md:inline">Voltar</span>
                  </button>
                </Focusable>
              )}

              {channel.logo && (
                <img
                  src={channel.logo}
                  alt={channel.name}
                  className="h-8 sm:h-10 max-w-[80px] sm:max-w-[110px] object-contain drop-shadow"
                />
              )}

              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider bg-accent-red text-white px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    Ao Vivo
                  </span>
                  <h2 className="text-white font-black text-base sm:text-xl drop-shadow truncate">
                    {channel.name}
                  </h2>
                  <span className="px-2 py-0.5 rounded bg-white/10 text-white/70 text-xs font-semibold">
                    {categoryLabel(channel.category)}
                  </span>
                  {channel.quality && (
                    <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-xs font-bold">
                      {channel.quality}
                    </span>
                  )}
                </div>
                <p className="text-amber-400 font-bold text-xs sm:text-sm mt-0.5 drop-shadow flex items-center gap-1.5 truncate">
                  <Tv className="h-3.5 w-3.5 flex-shrink-0" />
                  <span>{epg.title}</span>
                  <span className="text-white/50 font-normal">({epg.start} às {epg.end})</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {onToggleFavorite && (
                <Focusable onEnterPress={onToggleFavorite}>
                  <button
                    onClick={onToggleFavorite}
                    className="p-2 sm:p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all text-xs font-bold"
                    title="Favoritar canal"
                  >
                    {isFavorite ? '❤️' : '🤍'}
                  </button>
                </Focusable>
              )}

              <Focusable onEnterPress={reload}>
                <button
                  onClick={reload}
                  className="p-2 sm:p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all"
                  title="Recarregar sinal"
                >
                  <RefreshCw className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>
              </Focusable>

              {onClose && (
                <Focusable onEnterPress={onClose}>
                  <button
                    onClick={onClose}
                    className="p-2 sm:p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all"
                    title="Fechar"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </Focusable>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* OSD Bottom Bar (auto-hiding) */}
      <AnimatePresence>
        {showOsd && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.25 }}
            className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 bg-gradient-to-t from-black/95 via-black/60 to-transparent z-40 pointer-events-auto space-y-3"
          >
            {/* Barra de progresso EPG do programa atual */}
            <div className="flex items-center gap-2 text-[11px] text-white/50 font-mono">
              <span>{epg.start}</span>
              <div className="flex-1 h-2 bg-white/15 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 via-orange-500 to-accent-red transition-all duration-300 rounded-full shadow-[0_0_10px_rgba(251,191,36,0.6)]"
                  style={{ width: `${epg.progress}%` }}
                />
              </div>
              <span>{epg.end}</span>
              <span className="text-white/60 ml-3 truncate hidden sm:inline">
                A seguir: <strong className="text-white font-bold">{epg.nextTitle}</strong>
              </span>
            </div>

            {/* Controles de zapping e sinais */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {onPrevChannel && (
                  <Focusable onEnterPress={onPrevChannel}>
                    <button
                      onClick={onPrevChannel}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-bold transition-all"
                      title="Canal Anterior (Seta Cima / PageUp)"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      <span>Anterior</span>
                    </button>
                  </Focusable>
                )}

                {onNextChannel && (
                  <Focusable onEnterPress={onNextChannel}>
                    <button
                      onClick={onNextChannel}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-bold transition-all"
                      title="Próximo Canal (Seta Baixo / PageDown)"
                    >
                      <span>Próximo</span>
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </Focusable>
                )}
              </div>

              <div className="flex items-center gap-2">
                {channel.sources.length > 1 && (
                  <div className="flex items-center gap-1.5 bg-black/50 backdrop-blur px-2 py-1 rounded-xl border border-white/10">
                    <Radio className="h-3.5 w-3.5 text-white/40 hidden sm:inline" />
                    {channel.sources.map((_, idx) => (
                      <Focusable key={idx} onEnterPress={() => selectSource(idx)}>
                        <button
                          onClick={() => selectSource(idx)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                            sourceIndex === idx
                              ? 'bg-amber-400 text-black shadow-lg shadow-amber-400/30'
                              : 'bg-white/5 hover:bg-white/15 text-white/70 hover:text-white'
                          }`}
                        >
                          Sinal {idx + 1}
                        </button>
                      </Focusable>
                    ))}
                  </div>
                )}

                <Focusable onEnterPress={toggleMute}>
                  <button
                    onClick={toggleMute}
                    className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all"
                    title={muted ? 'Ativar som (Tecla M)' : 'Silenciar (Tecla M)'}
                  >
                    {muted ? <VolumeX className="h-4 w-4 sm:h-5 sm:w-5" /> : <Volume2 className="h-4 w-4 sm:h-5 sm:w-5" />}
                  </button>
                </Focusable>

                <Focusable onEnterPress={handleFullscreen}>
                  <button
                    onClick={handleFullscreen}
                    className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all"
                    title="Tela cheia (Tecla F)"
                  >
                    <Maximize2 className="h-4 w-4 sm:h-5 sm:w-5" />
                  </button>
                </Focusable>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default LivePlayer
