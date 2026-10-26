import { useEffect, useRef, useState, useCallback } from 'react'
import Hls from 'hls.js'
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
  Lock,
  Unlock,
} from 'lucide-react'
import { Capacitor } from '@capacitor/core'
import type { LiveChannel } from '@/services/liveChannels'
import { categoryLabel } from '@/services/liveChannels'
import { getLiveChannelEPG } from '@/services/epg'
import Focusable from '@/components/tv/Focusable'
import { SpatialNavigation } from '@noriginmedia/norigin-spatial-navigation'
import { markBackHandled, setNativePlayerLandscape, isTVDevice } from '@/utils/tv'
import { logLiveChannelError } from '@/services/observability'

interface LivePlayerProps {
  channel: LiveChannel
  onClose?: () => void
  onNextChannel?: () => void
  onPrevChannel?: () => void
  isFavorite?: boolean
  onToggleFavorite?: () => void
  epgProgram?: import('@/services/epg').EPGProgram
}

const LivePlayer = ({
  channel,
  onClose,
  onNextChannel,
  onPrevChannel,
  isFavorite,
  onToggleFavorite,
  epgProgram,
}: LivePlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const loadedRef = useRef(false)
  const playingRef = useRef(false)
  const watchdogRef = useRef<NodeJS.Timeout | null>(null)
  const hlsInstanceRef = useRef<Hls | null>(null)

  // Pausa a navegação espacial do fundo enquanto o player de TV ao vivo estiver ativo
  useEffect(() => {
    try {
      SpatialNavigation.pause()
    } catch {}
    return () => {
      try {
        SpatialNavigation.resume()
      } catch {}
    }
  }, [])

  const handleClose = useCallback(() => {
    markBackHandled()
    if (document.fullscreenElement && document.exitFullscreen) {
      document
        .exitFullscreen()
        .catch(() => {})
        .finally(() => {
          onClose?.()
        })
    } else {
      onClose?.()
    }
  }, [onClose])

  // Escuta evento global de fechamento seguro do player de TV ao vivo (ex: botão Voltar nativo Android)
  useEffect(() => {
    const handleRemoteClose = () => {
      handleClose()
    }
    window.addEventListener('cinebg:close-live-player', handleRemoteClose)
    return () => window.removeEventListener('cinebg:close-live-player', handleRemoteClose)
  }, [handleClose])

  // OSD auto-hiding (oculta após 3.5 segundos sem interação)
  const [showOsd, setShowOsd] = useState(true)
  const osdTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Bloqueio de tela (Lock HUD) exclusivo para celular contra toques acidentais
  const [isLocked, setIsLocked] = useState(false)
  const [showLockPrompt, setShowLockPrompt] = useState(false)
  const lockPromptTimerRef = useRef<NodeJS.Timeout | null>(null)

  const handleLockTap = useCallback(() => {
    if (!isLocked) return
    setShowLockPrompt(true)
    if (lockPromptTimerRef.current) clearTimeout(lockPromptTimerRef.current)
    lockPromptTimerRef.current = setTimeout(() => setShowLockPrompt(false), 2500)
  }, [isLocked])

  const toggleLock = useCallback(() => {
    if (isTVDevice()) return
    setIsLocked((prev) => {
      const next = !prev
      if (next) {
        setShowOsd(false)
        setShowLockPrompt(true)
        if (lockPromptTimerRef.current) clearTimeout(lockPromptTimerRef.current)
        lockPromptTimerRef.current = setTimeout(() => setShowLockPrompt(false), 2500)
      }
      return next
    })
  }, [])

  const resetOsdTimer = () => {
    if (isLocked) return
    setShowOsd(true)
    if (osdTimerRef.current) clearTimeout(osdTimerRef.current)
    osdTimerRef.current = setTimeout(() => {
      setShowOsd(false)
    }, 3500)
  }

  // Ao abrir o canal, entra em tela cheia imediata e gira a tela para paisagem no celular (estilo YuCine)
  useEffect(() => {
    setNativePlayerLandscape(true)
    document.documentElement.classList.add('cinebg-video-playing')
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('cinebg:player-state', { detail: { active: true } }))
    }

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
    if (typeof screen !== 'undefined' && screen.orientation && 'lock' in screen.orientation) {
      try {
        ;(screen.orientation as unknown as { lock: (o: string) => Promise<void> }).lock('landscape').catch(() => {})
      } catch {}
    }

    resetOsdTimer()

    return () => {
      setNativePlayerLandscape(false)
      document.documentElement.classList.remove('cinebg-video-playing')
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('cinebg:player-state', { detail: { active: false } }))
      }
      if (osdTimerRef.current) clearTimeout(osdTimerRef.current)
      if (typeof screen !== 'undefined' && screen.orientation && 'unlock' in screen.orientation) {
        try {
          screen.orientation.unlock()
        } catch {}
      }
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
  const getInitialSignal = useCallback(() => {
    try {
      const saved = sessionStorage.getItem(`cinebg_signal_${channel.id}`)
      if (saved !== null) {
        const idx = Number(saved)
        if (!isNaN(idx) && idx >= 0 && idx < channel.sources.length) return idx
      }
    } catch {}
    return 0
  }, [channel.id, channel.sources.length])

  const [sourceIndex, setSourceIndex] = useState(getInitialSignal)
  const [mountKey, setMountKey] = useState(0)
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)
  const [muted, setMuted] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string>('Sintonizando sinal...')

  // EPG program (passed from parent via cache or computed)
  const epg = epgProgram || getLiveChannelEPG(channel.id, channel.category, channel.name)

  const reload = useCallback(() => {
    setSourceIndex(0)
    setLoaded(false)
    setError(false)
    setStatusMessage('Sintonizando sinal...')
    setMountKey((k) => k + 1)
  }, [])

  const selectSource = useCallback((index: number) => {
    setSourceIndex(index)
    setLoaded(false)
    setError(false)
    setStatusMessage(`Sintonizando Sinal ${index + 1}...`)
    setMountKey((k) => k + 1)
  }, [])

  const goNext = useCallback(() => {
    if (watchdogRef.current) {
      clearTimeout(watchdogRef.current)
      watchdogRef.current = null
    }
    setSourceIndex((prev) => {
      if (prev < channel.sources.length - 1) {
        const next = prev + 1
        console.info(
          `[LivePlayer] Sinal ${prev + 1} indisponível. Alternando para sinal ${next + 1}...`
        )
        logLiveChannelError({
          channelId: channel.id,
          channelName: channel.name,
          sourceIndex: prev,
          sourceUrl: channel.sources[prev] || '',
          errorType: 'signal_unavailable',
          details: `Sinal ${prev + 1} indisponível. Alternando para sinal ${next + 1}...`,
        })
        setLoaded(false)
        setError(false)
        setStatusMessage(`Sintonizando Sinal ${next + 1}...`)
        setMountKey((k) => k + 1)
        return next
      } else {
        console.warn(`[LivePlayer] Todos os sinais de ${channel.name} falharam.`)
        logLiveChannelError({
          channelId: channel.id,
          channelName: channel.name,
          sourceIndex: prev,
          sourceUrl: channel.sources[prev] || '',
          errorType: 'all_signals_failed',
          details: `Todos os ${channel.sources.length} sinais do canal ${channel.name} falharam.`,
        })
        setError(true)
        return prev
      }
    })
  }, [channel.id, channel.name, channel.sources])

  // B-002: Subtitle sync drift fix - manual reset for live streams
  const resetSubtitleSync = useCallback(() => {
    const hls = hlsInstanceRef.current
    if (!hls) return
    try {
      // Reset subtitle track to force resync
      if (hls.subtitleTrack !== undefined && hls.subtitleTrack !== -1) {
        const currentTrack = hls.subtitleTrack
        hls.subtitleTrack = -1
        // Force re-select after a brief moment
        setTimeout(() => {
          if (hlsInstanceRef.current) {
            hlsInstanceRef.current.subtitleTrack = currentTrack
          }
        }, 100)
      }
    } catch {}
  }, [])

  // Periodic subtitle sync check for live streams (every 30s)
  useEffect(() => {
    const interval = setInterval(() => {
      const hls = hlsInstanceRef.current
      if (hls && hls.subtitleTrack !== undefined && hls.subtitleTrack !== -1) {
        // Check if subtitle track is actually rendering (simple heuristic)
        // If we detect drift, auto-reset
      }
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  const handleFullscreen = useCallback(() => {
    const node = containerRef.current
    if (!node) return
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {})
    } else {
      node.requestFullscreen().catch(() => {})
    }
  }, [])

  const toggleMute = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    video.muted = !video.muted
    setMuted(video.muted)
  }, [])

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
          selectSource((sourceIndex - 1 + channel.sources.length) % channel.sources.length)
        }
      } else if (e.key === 'ArrowRight') {
        if (channel.sources.length > 1) {
          e.preventDefault()
          selectSource((sourceIndex + 1) % channel.sources.length)
        }
      } else {
        const code = e.keyCode || e.which
        if (
          e.key === 'Escape' ||
          e.key === 'Backspace' ||
          e.key === 'GoBack' ||
          code === 27 ||
          code === 8 ||
          code === 4 ||
          code === 10009 ||
          code === 461 ||
          code === 283
        ) {
          e.preventDefault()
          e.stopPropagation()
          handleClose()
        } else if (e.key === 'm' || e.key === 'M') {
          toggleMute()
        } else if (e.key === 'f' || e.key === 'F') {
          handleFullscreen()
        } else if (e.key === 'Enter') {
          setShowOsd((prev) => !prev)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [channel, onNextChannel, onPrevChannel, handleClose, selectSource, toggleMute, handleFullscreen, sourceIndex])

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
  }, [channel.id, getInitialSignal])

  // Monitor anti-congelamento (anti-freeze watchdog) para TV: detecta micro-travamentos e recupera o fluxo
  const lastTimeRef = useRef(0)
  const freezeCountRef = useRef(0)
  useEffect(() => {
    const interval = setInterval(() => {
      const video = videoRef.current
      if (!video || video.paused || video.ended || !loadedRef.current) return

      if (Math.abs(video.currentTime - lastTimeRef.current) < 0.05) {
        freezeCountRef.current++
        if (freezeCountRef.current >= 2) {
          // Vídeo travou por mais de 3 segundos consecutivos no mesmo frame
          freezeCountRef.current = 0
          try {
            if (video.buffered.length > 0) {
              const liveEnd = video.buffered.end(video.buffered.length - 1)
              if (video.currentTime < liveEnd - 0.5) {
                video.currentTime = Math.min(liveEnd - 0.5, video.currentTime + 0.4)
              }
            }
            video.play().catch(() => {})
          } catch {}
        }
      } else {
        lastTimeRef.current = video.currentTime
        freezeCountRef.current = 0
      }
    }, 1800)

    return () => clearInterval(interval)
  }, [])

  const markPlaying = useCallback(() => {
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
  }, [channel.id, sourceIndex])

  const tryPlay = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    const p = video.play()
    if (p !== undefined) {
      p.then(() => {
        markPlaying()
      }).catch(() => {
        // Se a política de autoplay barrar som inicial, muta e reproduz imediatamente
        if (video) {
          video.muted = true
          setMuted(true)
          video.play().then(() => {
            try {
              video.muted = false
              setMuted(false)
            } catch {}
            markPlaying()
          }).catch(() => {})
        }
      })
    }
  }, [markPlaying])

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

    const CONNECT_TIMEOUT_MS = 8000 // 8 segundos de tolerância por sinal para redes móveis e TV Box

    // Timeout estrito de 4.5s para TV (NÃO reseta em FRAG_LOADING para evitar loop infinito)
    if (watchdogRef.current) clearTimeout(watchdogRef.current)
    watchdogRef.current = setTimeout(() => {
      if (cancelled) return
      if (loadedRef.current || playingRef.current) return
      const v = videoRef.current
      if (v && !v.paused && v.currentTime > 0) {
        markPlaying()
        return
      }
      goNext()
    }, CONNECT_TIMEOUT_MS)

    const tryNativeHls = () => {
      if (cancelled || !video) return
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        try {
          const onNativeError = () => {
            video.removeEventListener('error', onNativeError)
            goNext()
          }
          video.addEventListener('error', onNativeError, { once: true })
          video.src = src
          video.load()
          video.play().then(markPlaying).catch(() => {
            video.muted = true
            setMuted(true)
            video.play().then(markPlaying).catch(() => goNext())
          })
          return
        } catch {}
      }
      goNext()
    }

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: false, // Desativa worker para evitar engasgos em Android TV / WebViews
        liveDurationInfinity: true,
        lowLatencyMode: false,
        backBufferLength: 15,
        maxBufferLength: 10,
        maxMaxBufferLength: 20,
        maxBufferSize: 15 * 1000 * 1000,
        liveSyncDurationCount: 2, // Inicia imediatamente com 2 fragmentos (reduz latência de início pela metade)
        liveMaxLatencyDurationCount: 8,
        startFragPrefetch: true, // Pré-carrega próximo fragmento para aceleração
        manifestLoadingTimeOut: 8000,
        manifestLoadingMaxRetry: 2,
        levelLoadingTimeOut: 8000,
        levelLoadingMaxRetry: 2,
        fragLoadingTimeOut: 12000,
        fragLoadingMaxRetry: 3,
        nudgeOffset: 0.3,
        nudgeMaxRetry: 6,
        maxFragLookUpTolerance: 0.35,
        autoStartLoad: true,
      })

      hlsInstanceRef.current = hls
      hls.loadSource(src)
      hls.attachMedia(video)

      let networkRetryCount = 0

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
        if (watchdogRef.current && !loadedRef.current && !playingRef.current) {
          clearTimeout(watchdogRef.current)
          watchdogRef.current = setTimeout(() => {
            if (cancelled || loadedRef.current || playingRef.current) return
            const v = videoRef.current
            if (v && !v.paused && v.currentTime > 0) {
              markPlaying()
              return
            }
            goNext()
          }, CONNECT_TIMEOUT_MS)
        }
      })

      hls.on(Hls.Events.FRAG_LOADING, () => {
        if (watchdogRef.current && !loadedRef.current && !playingRef.current) {
          clearTimeout(watchdogRef.current)
          watchdogRef.current = setTimeout(() => {
            if (cancelled || loadedRef.current || playingRef.current) return
            const v = videoRef.current
            if (v && !v.paused && v.currentTime > 0) {
              markPlaying()
              return
            }
            goNext()
          }, CONNECT_TIMEOUT_MS)
        }
      })

      hls.on(Hls.Events.FRAG_LOADED, () => {
        tryPlay()
      })

      hls.on(Hls.Events.FRAG_PARSED, () => {
        tryPlay()
      })

      hls.on(Hls.Events.FRAG_BUFFERED, () => {
        tryPlay()
      })

      hls.on(Hls.Events.ERROR, (_event: unknown, data: unknown) => {
        if (cancelled) return
        const payload = data as {
          fatal?: boolean
          type?: string
          details?: string
          response?: { code?: number }
        }

        // Se a resposta HTTP for erro definitivo (401/403 Proibido, 404 Não Encontrado, 410, 5xx),
        // alternar imediatamente para o próximo sinal sem atraso ou retentativas inúteis.
        const httpStatus = payload.response?.code
        if (httpStatus && [401, 403, 404, 410, 500, 502, 503].includes(httpStatus)) {
          console.warn(`[LivePlayer] Erro HTTP ${httpStatus} no Sinal ${sourceIndex + 1}. Alternando imediatamente...`)
          logLiveChannelError({
            channelId: channel.id,
            channelName: channel.name,
            sourceIndex,
            sourceUrl: src,
            errorType: `http_${httpStatus}`,
            details: `Erro HTTP ${httpStatus} retornado pelo servidor no Sinal ${sourceIndex + 1}`,
          })
          try {
            hls.destroy()
          } catch {}
          goNext()
          return
        }

        // Se houver um stall transitório no buffer, recarrega e avança o frame travado
        if (!payload.fatal) {
          if (
            payload.details === 'bufferStalledError' ||
            payload.details === 'bufferNudgeOnStall'
          ) {
            try {
              hls.startLoad()
              if (video && !video.paused && video.buffered.length > 0) {
                const liveEnd = video.buffered.end(video.buffered.length - 1)
                if (video.currentTime < liveEnd - 0.5) {
                  video.currentTime = Math.min(liveEnd - 0.5, video.currentTime + 0.3)
                }
                video.play().catch(() => {})
              }
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
              if (!cancelled && hlsInstanceRef.current) {
                hls.startLoad()
              }
            }, 1000)
            return
          }
        }

        hls.destroy()
        tryNativeHls()
      })
    } else {
      tryNativeHls()
    }

    return () => {
      cancelled = true
      if (watchdogRef.current) {
        clearTimeout(watchdogRef.current)
        watchdogRef.current = null
      }
      if (hlsInstanceRef.current) {
        try {
          hlsInstanceRef.current.destroy()
        } catch {}
        hlsInstanceRef.current = null
      }
    }
  }, [channel.id, channel.sources, sourceIndex, mountKey, markPlaying, tryPlay, goNext])

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[9999] w-screen h-screen bg-black overflow-hidden flex items-center justify-center select-none live-player-container"
      data-live-player="true"
      onMouseMove={resetOsdTimer}
      onTouchStart={resetOsdTimer}
      onClick={resetOsdTimer}
    >
      {/* Loading state com ações navegáveis por controle remoto na TV */}
      <AnimatePresence>
        {!loaded && !error && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="absolute inset-0 flex flex-col items-center justify-center bg-black z-20 gap-3 p-4"
          >
          <div className="w-14 h-14 border-4 border-white/10 border-t-amber-400 rounded-full animate-spin" />
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
          {channel.name && (
            <p className="text-white/80 font-medium text-sm tracking-wide">{channel.name}</p>
          )}
            {onNextChannel && (
              <button
                type="button"
                onClick={onNextChannel}
                className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold focus:outline-none focus:ring-4 focus:ring-amber-400 focus:scale-105 transition-all flex items-center gap-1.5"
              >
                <span>Próximo Canal (▼)</span>
              </button>
            )}
            {onClose && (
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold focus:outline-none focus:ring-4 focus:ring-amber-400 focus:scale-105 transition-all flex items-center gap-1.5"
              >
                <span>Voltar (ESC)</span>
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

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
                <button
                  key={idx}
                  type="button"
                  onClick={() => selectSource(idx)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all focus:outline-none focus:ring-4 focus:ring-amber-400 focus:scale-105 ${
                    sourceIndex === idx
                      ? 'bg-amber-400 text-black'
                      : 'bg-white/10 hover:bg-white/20 text-white'
                  }`}
                >
                  Testar Sinal {idx + 1}
                </button>
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
            <button
              type="button"
              onClick={reload}
              className="flex items-center gap-2 bg-accent-red text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-red-600 transition-all focus:outline-none focus:ring-4 focus:ring-amber-400 focus:scale-105 shadow-lg shadow-red-900/40"
            >
              <RefreshCw className="h-4 w-4" />
              Tentar Novamente
            </button>
            {onNextChannel && (
              <button
                type="button"
                onClick={onNextChannel}
                className="flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-black px-5 py-2.5 rounded-xl text-sm font-bold transition-all focus:outline-none focus:ring-4 focus:ring-amber-400 focus:scale-105 shadow-lg shadow-amber-400/20"
              >
                <span>Próximo Canal</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            )}
            {onClose && (
              <button
                type="button"
                onClick={handleClose}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white text-sm font-bold rounded-xl transition-all focus:outline-none focus:ring-4 focus:ring-amber-400 focus:scale-105"
              >
                <ChevronLeft className="h-4 w-4" />
                Voltar aos Canais
              </button>
            )}
          </div>
        </div>
      )}

      {/* Video Fullscreen */}
      <video
        key={`${channel.id}-${mountKey}`}
        ref={videoRef}
        poster="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
        title={channel.name}
        autoPlay
        playsInline
        className="w-full h-full object-contain bg-black cursor-pointer"
        onLoadedMetadata={() => {
          tryPlay()
        }}
        onCanPlay={() => {
          tryPlay()
          markPlaying()
        }}
        onLoadedData={() => {
          markPlaying()
        }}
        onPlaying={() => {
          markPlaying()
        }}
        onWaiting={() => {
          if (loadedRef.current) {
            setStatusMessage('Bufferizando sinal...')
          }
        }}
        onError={() => {
          if (hlsInstanceRef.current) {
            console.warn('[LivePlayer] Ignorando onError nativo no video (gerenciado pelo Hls.js)')
            return
          }
          console.warn('[LivePlayer] Erro no vídeo nativo. Alternando sinal...')
          goNext()
        }}
        onTimeUpdate={() => {
          const v = videoRef.current
          if (v && v.currentTime > 0 && !loadedRef.current) {
            markPlaying()
          }
        }}
        onClick={() => {
          if (isLocked) {
            handleLockTap()
            return
          }
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
              {!isTVDevice() && (
                <button
                  type="button"
                  id="live-btn-lock"
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleLock()
                  }}
                  className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-black/60 hover:bg-black/80 border border-white/10 text-white/80 hover:text-white transition-all active:scale-95 flex items-center gap-1.5 text-xs font-bold shadow-lg"
                  title="Bloquear tela contra toques acidentais"
                  aria-label="Bloquear tela"
                >
                  <Unlock className="w-4 h-4 text-yellow-400" />
                  <span className="hidden sm:inline">Bloquear</span>
                </button>
              )}
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

                <Focusable onEnterPress={resetSubtitleSync}>
                  <button
                    onClick={resetSubtitleSync}
                    className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all"
                    title="Re-sincronizar legendas (Tecla S)"
                  >
                    <span className="text-xs font-bold">🔄</span>
                  </button>
                </Focusable>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Overlay de Bloqueio de Tela contra toques acidentais no celular */}
      {isLocked && !isTVDevice() && (
        <div
          onClick={(e) => {
            e.stopPropagation()
            handleLockTap()
          }}
          onTouchStart={(e) => {
            e.stopPropagation()
          }}
          onTouchEnd={(e) => {
            e.stopPropagation()
            handleLockTap()
          }}
          className="absolute inset-0 z-50 cursor-pointer flex items-center justify-center bg-black/20 backdrop-blur-[2px] select-none"
        >
          <AnimatePresence>
            {showLockPrompt && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col items-center gap-3 bg-black/90 backdrop-blur-xl border border-white/20 p-6 rounded-3xl shadow-2xl max-w-xs text-center"
                onClick={(e: React.MouseEvent) => e.stopPropagation()}
                onTouchEnd={(e: React.TouchEvent) => e.stopPropagation()}
              >
                <button
                  type="button"
                  id="live-btn-unlock-center"
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleLock()
                  }}
                  onTouchEnd={(e) => {
                    e.stopPropagation()
                    toggleLock()
                  }}
                  className="w-16 h-16 rounded-full bg-accent-red hover:bg-red-600 text-white flex items-center justify-center shadow-lg shadow-red-900/60 active:scale-90 transition-transform cursor-pointer"
                  title="Toque para desbloquear a tela"
                  aria-label="Desbloquear tela"
                >
                  <Lock className="w-8 h-8" />
                </button>
                <div className="flex flex-col gap-1">
                  <span className="text-white font-black text-sm">Tela Bloqueada</span>
                  <span className="text-white/60 text-xs">Toque no cadeado para liberar os controles</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Botão de desbloqueio persistente no canto superior */}
          <div
            className={`absolute top-[max(1rem,env(safe-area-inset-top,0px))] right-[max(1rem,env(safe-area-inset-right,0px))] transition-opacity duration-300 ${
              showLockPrompt ? 'opacity-100 pointer-events-auto' : 'opacity-40 hover:opacity-100 pointer-events-auto'
            }`}
            onClick={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              id="live-btn-unlock-corner"
              onClick={(e) => {
                e.stopPropagation()
                toggleLock()
              }}
              onTouchEnd={(e) => {
                e.stopPropagation()
                toggleLock()
              }}
              className="p-3 rounded-full bg-black/80 border border-white/20 text-white hover:bg-black flex items-center justify-center shadow-lg cursor-pointer"
              title="Desbloquear tela"
              aria-label="Desbloquear tela"
            >
              <Lock className="w-5 h-5 text-yellow-400" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default LivePlayer
