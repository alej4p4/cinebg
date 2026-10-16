import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import {
  Maximize2,
  RefreshCw,
  AlertCircle,
  Volume2,
  SkipForward,
  Captions,
  CaptionsOff,
  PictureInPicture2,
  X,
  RotateCcw,
} from 'lucide-react'
import {
  buildMovieUrl,
  buildShowUrl,
  getInitialMirrorForAudio,
  isMirrorSandboxed,
  resolveMegaEmbed,
  MIRRORS,
} from '@/services/streams'
import { useAppStore } from '@/store/useAppStore'
import type { AudioOption } from '@/store/useAppStore'
import { initAntiRedirectShield, setAntiRedirectShieldActive } from '@/utils/antiRedirect'

interface StreamPlayerProps {
  tmdbId: number
  type: 'movie' | 'tv' | 'anime'
  season?: number
  episode?: number
  title: string
  onNextEpisode?: () => void
  startAt?: number
  onProgress?: (seconds: number, duration: number) => void
}

const StreamPlayer = ({
  tmdbId,
  type,
  season = 1,
  episode = 1,
  title,
  onNextEpisode,
  startAt,
  onProgress,
}: StreamPlayerProps) => {
  const { audioOption, setAudioOption } = useAppStore()
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)
  // Fonte nativa direta: MP4 dublado (PT-BR) ou HLS proxy do MegaEmbed.
  const [directSrc, setDirectSrc] = useState<string | null>(null)
  const [directKind, setDirectKind] = useState<'mp4' | 'hls' | null>(null)
  // Começa "resolvendo" para não piscar o iframe (com anúncio) antes de tentar o nativo.
  const [resolvingDirect, setResolvingDirect] = useState(true)

  // O espelho inicial se ajusta automaticamente ao áudio preferido
  const [activeMirror, setActiveMirror] = useState(() => getInitialMirrorForAudio(audioOption))
  const [key, setKey] = useState(0)
  // Só mostra o iframe (provedor externo, sujeito a anúncios) após o usuário
  // pedir explicitamente por "outra fonte". O padrão é sempre o player nativo.
  const [allowIframe, setAllowIframe] = useState(false)

  const loadedRef = useRef(false)
  const nativeActiveRef = useRef(false)
  const autoFallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ===== Controles do player (Sprint 2) =====
  const [speed, setSpeed] = useState(1)
  const [speedOpen, setSpeedOpen] = useState(false)
  const [tracks, setTracks] = useState<{ index: number; label: string }[]>([])
  const [activeTrack, setActiveTrack] = useState(-1)
  const [subsOpen, setSubsOpen] = useState(false)
  const [pipActive, setPipActive] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const activeTrackRef = useRef(-1)
  const resumedRef = useRef(false)
  const lastProgressRef = useRef(0)

  const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 2]
  const AUTO_NEXT_DELAY = 10 // seconds

  const [autoNextCountdown, setAutoNextCountdown] = useState<number | null>(null)
  const autoNextTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [qualityOpen, setQualityOpen] = useState(false)
  const [availableQualities, _setAvailableQualities] = useState<{ label: string; url: string; type: 'hls' | 'mp4' }[]>([])
  const [currentQuality, setCurrentQuality] = useState<string | null>(null)

  // ===== Auto-fallback state =====
  const [fallbackAttempt, setFallbackAttempt] = useState(0)
  const [isAutoFallback, setIsAutoFallback] = useState(false)
  const fallbackSequence = useMemo(
    () =>
      audioOption === 'dub'
        ? ['megaembed', 'vidsrc-sh', 'vidsrc-io', 'vsembed', 'vidlink', 'multiembed']
        : ['vidsrc-sh', 'vidsrc-io', 'vsembed', 'megaembed', 'vidlink', 'multiembed'],
    [audioOption]
  )

  const embedUrl =
    type === 'movie'
      ? buildMovieUrl(tmdbId, audioOption, activeMirror)
      : buildShowUrl(tmdbId, season, episode, audioOption, activeMirror)

  // No modo Dublado tentamos tocar o MP4 dublado (PT-BR) diretamente; no modo
  // Original/Legendado, o HLS proxy do MegaEmbed (ambos nativos, sem iframe).
  const switchAudio = (opt: AudioOption) => {
    setAudioOption(opt)
    const nextMirror = getInitialMirrorForAudio(opt)
    setActiveMirror(nextMirror)
    setAllowIframe(nextMirror !== 'megaembed')
    setLoaded(false)
    setError(false)
    setDirectSrc(null)
    setDirectKind(null)
    setKey((k) => k + 1)
  }

  // Falha da transmissão nativa: mostra o aviso e deixa o iframe apenas sob
  // demanda. Não troca mais de provedor silenciosamente (evitava abrir anúncios).
  const handleStreamFailure = () => {
    if (autoFallbackTimerRef.current) clearTimeout(autoFallbackTimerRef.current)
    nativeActiveRef.current = false
    // Use functional update to avoid stale closure on fallbackAttempt
    setFallbackAttempt((prev) => {
      const nextIndex = prev + 1
      if (nextIndex >= fallbackSequence.length) {
        // Esgotou todas as fontes nativas -> tenta iframe
        setIsAutoFallback(false)
        setAllowIframe(true)
        return 0
      }
      setActiveMirror(fallbackSequence[nextIndex])
      setLoaded(false)
      setError(false)
      setDirectSrc(null)
      setDirectKind(null)
      setKey((k) => k + 1)
      return nextIndex
    })
  }

  const tryNextSource = useCallback(() => {
    setFallbackAttempt((prev) => {
      const nextIndex = prev + 1
      if (nextIndex >= fallbackSequence.length) {
        setIsAutoFallback(false)
        setAllowIframe(true)
        return 0
      }
      const nextMirror = fallbackSequence[nextIndex]
      setActiveMirror(nextMirror)
      setLoaded(false)
      setError(false)
      setDirectSrc(null)
      setDirectKind(null)
      // Espelhos não-megaembed só funcionam via iframe
      if (nextMirror !== 'megaembed') {
        setAllowIframe(true)
      }
      setKey((k) => k + 1)
      return nextIndex
    })
  }, [fallbackSequence])

  const handleManualRefresh = () => {
    loadedRef.current = false
    const initialMirror = getInitialMirrorForAudio(audioOption)
    setAllowIframe(initialMirror !== 'megaembed')
    setLoaded(false)
    setError(false)
    setDirectSrc(null)
    setDirectKind(null)
    setFallbackAttempt(0)
    setActiveMirror(initialMirror)
    setKey((k) => k + 1)
  }

  useEffect(() => {
    initAntiRedirectShield()
  }, [])

  // Define allowIframe inicial baseado no espelho ativo (não-megaembed = iframe)
  useEffect(() => {
    setAllowIframe(activeMirror !== 'megaembed')
  }, [activeMirror])


  useEffect(() => {
    loadedRef.current = false
    setLoaded(false)
    setError(false)

    if (autoFallbackTimerRef.current) clearTimeout(autoFallbackTimerRef.current)

    // Timeout de segurança: se nada carregar em 12s, mostra o aviso. Ignoramos
    // quando há uma fonte nativa tocando (o <video> tem onError próprio, então
    // MP4s grandes não são abortados pelo timer).
    autoFallbackTimerRef.current = setTimeout(() => {
      if (loadedRef.current) return
      if (nativeActiveRef.current) return
      handleStreamFailure()
    }, 12000)

    return () => {
      if (autoFallbackTimerRef.current) clearTimeout(autoFallbackTimerRef.current)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, tmdbId, season, episode, audioOption, activeMirror])

  // Resolve a fonte nativa: MP4 dublado (PT) ou HLS proxy do MegaEmbed.
  // Assim tocamos sem iframe -> sem abas de propaganda.
  useEffect(() => {
    let cancelled = false
    nativeActiveRef.current = false
    setDirectSrc(null)
    setDirectKind(null)
    setResolvingDirect(true)

    const mediaType: 'movie' | 'tv' = type === 'movie' ? 'movie' : 'tv'
    resolveMegaEmbed(tmdbId, mediaType, season, episode)
      .then((resolved) => {
        if (cancelled) return
        let hasSource = false
        if (audioOption === 'dub' && resolved.dubbedMp4) {
          nativeActiveRef.current = true
          setDirectSrc(resolved.dubbedMp4)
          setDirectKind('mp4')
          hasSource = true
        } else if (audioOption !== 'dub' && resolved.hlsProxy) {
          nativeActiveRef.current = true
          setDirectSrc(resolved.hlsProxy)
          setDirectKind('hls')
          hasSource = true
        }
        if (!hasSource) {
          tryNextSource()
        }
      })
      .catch(() => {
        if (!cancelled) {
          nativeActiveRef.current = false
          setDirectSrc(null)
          setDirectKind(null)
          tryNextSource()
        }
      })
      .finally(() => {
        if (!cancelled) setResolvingDirect(false)
      })

    return () => {
      cancelled = true
    }
  }, [key, tmdbId, season, episode, audioOption, type, tryNextSource])

  const handleIframeLoad = () => {
    loadedRef.current = true
    setLoaded(true)
    setError(false)
    if (autoFallbackTimerRef.current) clearTimeout(autoFallbackTimerRef.current)
  }

  const handleDirectMediaReady = () => {
    loadedRef.current = true
    setLoaded(true)
    setError(false)
    if (autoFallbackTimerRef.current) clearTimeout(autoFallbackTimerRef.current)
  }

  const handleDirectMediaError = () => {
    nativeActiveRef.current = false
    setDirectSrc(null)
    setDirectKind(null)
    handleStreamFailure()
  }

  // Anexa o HLS (m3u8) ao <video> via hls.js (CORS garantido pelo proxy do MegaEmbed).
  useEffect(() => {
    const video = videoRef.current
    if (!video || !directSrc || directKind !== 'hls') return

    // Safari/iOS toca HLS nativamente.
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = directSrc
      return
    }

    let cancelled = false
    let hlsInstance: { destroy: () => void } | null = null

    void import('hls.js').then((mod) => {
      if (cancelled) return
      const Hls = mod.default
      if (!Hls.isSupported()) {
        handleDirectMediaError()
        return
      }

      const hls = new Hls({ enableWorker: true })
      hlsInstance = hls
      hls.subtitleDisplay = true
      hls.loadSource(directSrc)
      hls.attachMedia(video)
      hls.on(Hls.Events.SUBTITLE_TRACKS_UPDATED, () => refreshTextTracks())
      hls.on(Hls.Events.MANIFEST_PARSED, () => window.setTimeout(() => refreshTextTracks(), 300))
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          hls.destroy()
          handleDirectMediaError()
        }
      })
    })

    return () => {
      cancelled = true
      if (hlsInstance) hlsInstance.destroy()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [directSrc, directKind])

  // Aplica a velocidade escolhida (inclusive ao trocar de fonte).
  useEffect(() => {
    const video = videoRef.current
    if (video) video.playbackRate = speed
  }, [speed, directSrc])

  // Reseta o estado de legendas quando a fonte muda.
  useEffect(() => {
    activeTrackRef.current = -1
    setActiveTrack(-1)
    setTracks([])
    resumedRef.current = false
    lastProgressRef.current = 0
  }, [directSrc])

  // Observa a entrada/saída do Picture-in-Picture (eventos não tipados pelo React).
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    const onEnter = () => setPipActive(true)
    const onLeave = () => setPipActive(false)
    video.addEventListener('enterpictureinpicture', onEnter)
    video.addEventListener('leavepictureinpicture', onLeave)
    return () => {
      video.removeEventListener('enterpictureinpicture', onEnter)
      video.removeEventListener('leavepictureinpicture', onLeave)
    }
  }, [directSrc])

  // Limpa o timer do feedback e auto-next ao desmontar.
  useEffect(
    () => () => {
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current)
      if (autoNextTimerRef.current) clearInterval(autoNextTimerRef.current)
    },
    []
  )

  const handleFullscreen = () => {
    if (containerRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {})
      } else {
        containerRef.current.requestFullscreen().catch(() => {})
      }
    }
  }

  const showFeedback = (text: string) => {
    setFeedback(text)
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current)
    feedbackTimerRef.current = setTimeout(() => setFeedback(null), 700)
  }

  const seekBy = (delta: number) => {
    const video = videoRef.current
    if (!video) return
    const max = Number.isFinite(video.duration) ? video.duration : Infinity
    video.currentTime = Math.max(0, Math.min(max, video.currentTime + delta))
    showFeedback(delta > 0 ? `+${delta}s` : `${delta}s`)
  }

  const togglePlay = () => {
    const video = videoRef.current
    if (!video) return
    if (video.paused) video.play().catch(() => {})
    else video.pause()
  }

  const toggleMute = () => {
    const video = videoRef.current
    if (!video) return
    video.muted = !video.muted
  }

  const refreshTextTracks = () => {
    const video = videoRef.current
    if (!video) return
    const list: { index: number; label: string }[] = []
    for (let i = 0; i < video.textTracks.length; i += 1) {
      const track = video.textTracks[i]
      list.push({ index: i, label: track.label || track.language || `Faixa ${i + 1}` })
    }
    setTracks(list)
    // Liga automaticamente a primeira legenda quando ainda no á escolha.
    if (list.length > 0 && activeTrackRef.current === -1) applySubtitle(0)
  }

  const applySubtitle = (index: number) => {
    const video = videoRef.current
    if (!video) return
    for (let i = 0; i < video.textTracks.length; i += 1) {
      video.textTracks[i].mode = i === index ? 'showing' : 'disabled'
    }
    activeTrackRef.current = index
    setActiveTrack(index)
    setSubsOpen(false)
  }

  const handlePip = async () => {
    const video = videoRef.current
    if (!video) return
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture()
      } else {
        await video.requestPictureInPicture()
      }
    } catch {
      /* PiP indisponível neste contexto */
    }
  }

  const handleEnded = () => {
    if (type !== 'movie' && onNextEpisode) {
      startAutoNextCountdown()
    } else if (onNextEpisode) {
      onNextEpisode()
    }
  }

  const startAutoNextCountdown = () => {
    let remaining = AUTO_NEXT_DELAY
    setAutoNextCountdown(remaining)
    autoNextTimerRef.current = setInterval(() => {
      remaining -= 1
      if (remaining <= 0) {
        if (autoNextTimerRef.current) clearInterval(autoNextTimerRef.current)
        setAutoNextCountdown(null)
        if (onNextEpisode) onNextEpisode()
      } else {
        setAutoNextCountdown(remaining)
      }
    }, 1000)
  }

  const cancelAutoNext = () => {
    if (autoNextTimerRef.current) clearInterval(autoNextTimerRef.current)
    setAutoNextCountdown(null)
  }

  // Ao carregar os metadados: lê legendas e retoma da posição salva.
  const handleLoadedMetadata = () => {
    refreshTextTracks()
    const video = videoRef.current
    if (!video) return
    if (!resumedRef.current && startAt && startAt > 5) {
      const duration = video.duration
      if (!Number.isFinite(duration) || startAt < duration - 15) {
        try {
          video.currentTime = startAt
        } catch {
          /* seek inválido */
        }
      }
    }
    resumedRef.current = true
  }

  // Salva a posição a cada ~5s de reprodução.
  const handleTimeUpdate = () => {
    const video = videoRef.current
    if (!video || !onProgress) return
    const current = video.currentTime
    if (Math.abs(current - lastProgressRef.current) >= 5) {
      lastProgressRef.current = current
      onProgress(current, Number.isFinite(video.duration) ? video.duration : 0)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return
    if (!videoRef.current) return
    switch (e.key) {
      case 'ArrowRight':
        e.preventDefault()
        seekBy(10)
        break
      case 'ArrowLeft':
        e.preventDefault()
        seekBy(-10)
        break
      case ' ':
      case 'k':
        e.preventDefault()
        togglePlay()
        break
      case 'f':
      case 'F':
        handleFullscreen()
        break
      case 'm':
      case 'M':
        toggleMute()
        break
      default:
        break
    }
  }

  const handleVideoDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    setSpeedOpen(false)
    setSubsOpen(false)
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = e.clientX - rect.left
    seekBy(x < rect.width / 2 ? -10 : 10)
  }

  const audioLabels = {
    dub: '🇧🇷 Dublado (PT-BR)',
    sub: 'Legendado (PT-BR)',
    orig: '🇺🇸 Original',
  }

  const getMirrorLabel = (id: string) => {
    const mirror = MIRRORS.find(m => m.id === id)
    return mirror ? mirror.name : id
  }

  // O iframe (provedor externo) só entra em cena se o usuário pedir explicitamente.
  const showIframe = allowIframe && !resolvingDirect

  // Ativa/desativa o escudo anti-redirect conforme o iframe é exibido
  useEffect(() => {
    setAntiRedirectShieldActive(showIframe)
  }, [showIframe])

  return (
    <div className="space-y-0">
      {/* ====== SELETOR DE ÁUDIO NATIVO (Estilo YuCine - Sem Exibir Servidores Técnicos) ====== */}
      <div className="flex flex-wrap items-center justify-between bg-[#111118] border border-white/5 rounded-t-xl px-4 py-2.5 gap-2">
        <div className="flex items-center gap-2">
          <Volume2 className="h-4 w-4 text-accent-red" />
          <span className="text-white/60 text-xs font-semibold">
            {audioOption === 'dub' ? 'Dublado' : 'Original / Legendado'}
          </span>
        </div>

        {/* Seleção Simplificada de Idioma */}
        <div className="flex items-center gap-1 bg-[#1c1c28] p-1 rounded-lg border border-white/5">
          <button
            onClick={() => switchAudio('dub')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-bold transition-all duration-200 ${
              audioOption === 'dub'
                ? 'bg-accent-red text-white shadow-lg shadow-red-900/40'
                : 'text-white/40 hover:text-white/70'
            }`}
          >
            <span className="text-sm leading-none">🇧🇷</span>
            <span>Dublado</span>
          </button>

          <button
            onClick={() => switchAudio('orig')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-bold transition-all duration-200 ${
              audioOption === 'orig'
                ? 'bg-accent-red text-white shadow-lg shadow-red-900/40'
                : 'text-white/40 hover:text-white/70'
            }`}
          >
            <span className="text-sm leading-none">🇺🇸</span>
            <span>Original / Legendado</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleManualRefresh}
            className="p-1.5 text-white/30 hover:text-white transition-colors rounded-lg hover:bg-white/5"
            title="Recarregar player"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ====== CONTAINER DO PLAYER ====== */}
      <div
        ref={containerRef}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onDoubleClick={handleVideoDoubleClick}
        className="relative bg-black overflow-hidden rounded-b-xl aspect-video outline-none"
      >
        {feedback && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
            <span className="bg-black/70 text-white text-2xl font-bold px-5 py-3 rounded-full">
              {feedback}
            </span>
          </div>
        )}
        {/* Loading Overlay */}
        {!loaded && !error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0a0a10] z-10 gap-3">
            <div className="w-12 h-12 border-2 border-white/5 border-t-accent-red rounded-full animate-spin" />
            <div className="text-center">
              <p className="text-white/80 text-sm font-semibold">
                {isAutoFallback
                  ? `Tentando ${getMirrorLabel(activeMirror)} (${fallbackAttempt + 1}/${fallbackSequence.length})...`
                  : 'Carregando transmissão...'}
              </p>
              <p className="text-white/40 text-xs mt-0.5">{audioLabels[audioOption]}</p>
            </div>
          </div>
        )}

        {/* Error Overlay */}
        {error && !isAutoFallback && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0a0a10] z-10 gap-4 p-6">
            <AlertCircle className="h-12 w-12 text-red-400" />
            <div className="text-center">
              <p className="text-white font-bold text-lg">Transmissão indisponível</p>
              <p className="text-white/40 text-sm mt-1">
                Não foi possível conectar a esta fonte no momento. Tente novamente ou use outra fonte.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={handleManualRefresh}
                className="flex items-center gap-2 bg-accent-red text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-red-600 transition-colors shadow-lg shadow-red-900/40"
              >
                <RefreshCw className="h-4 w-4" />
                Tentar Novamente
              </button>
              <button
                onClick={() => {
                  setError(false)
                  setLoaded(false)
                  setAllowIframe(true)
                }}
                className="flex items-center gap-2 bg-white/10 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-white/20 transition-colors"
              >
                Usar outra fonte
              </button>
            </div>
          </div>
        )}

        {/* Auto-fallback indicator */}
        {isAutoFallback && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0a0a10]/95 z-20 gap-3">
            <RotateCcw className="h-10 w-10 text-accent-red animate-spin" />
            <div className="text-center">
              <p className="text-white font-semibold text-lg">Tentando próxima fonte...</p>
              <p className="text-white/70 text-sm mt-1">
                {getMirrorLabel(activeMirror)} ({fallbackAttempt + 1}/{fallbackSequence.length})
              </p>
              <p className="text-white/40 text-xs mt-2">
                Isso acontece automaticamente. Aguarde...
              </p>
            </div>
            <button
              onClick={() => {
                setIsAutoFallback(false)
                setAllowIframe(true)
              }}
              className="mt-4 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Pular para iframe
            </button>
          </div>
        )}

        {/*
          SANDBOX (escudo anti-popup/anti-redirect):
          Usamos `sandbox` COM `allow-same-origin`. Isso mantém a origem real do iframe
          (não fica "opaca"), então os detectores de sandbox do MegaEmbed e do vidsrc/sbx.js
          não disparam e o vídeo toca. Sem `allow-popups`/`allow-top-navigation`, a abertura
          de abas de propaganda e o redirect da janela principal ficam bloqueados.
        */}
        {showIframe && (
          <iframe
            key={`stream-${key}-${tmdbId}-${season}-${episode}-${audioOption}-${activeMirror}`}
            ref={iframeRef}
            src={embedUrl}
            title={title}
            allowFullScreen
            allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
            className="w-full h-full border-0"
            sandbox={
              isMirrorSandboxed(activeMirror)
                ? 'allow-scripts allow-same-origin allow-forms allow-presentation allow-pointer-lock allow-orientation-lock allow-modals allow-downloads allow-encrypted-media'
                : undefined
            }
            referrerPolicy="no-referrer"
            onLoad={handleIframeLoad}
            onError={handleStreamFailure}
          />
        )}

        {/* Fonte nativa direta: MP4 dublado (PT-BR) ou HLS proxy (hls.js).
            Sem iframe = sem abas de propaganda. */}
        {directSrc && (
          <video
            key={`direct-${key}-${tmdbId}-${season}-${episode}-${directKind}`}
            ref={videoRef}
            {...(directKind === 'mp4' ? { src: directSrc } : {})}
            title={title}
            controls
            autoPlay
            playsInline
            className="w-full h-full bg-black"
            onLoadedData={handleDirectMediaReady}
            onLoadedMetadata={handleLoadedMetadata}
            onCanPlay={handleDirectMediaReady}
            onTimeUpdate={handleTimeUpdate}
            onError={handleDirectMediaError}
            onEnded={handleEnded}
          />
        )}

        {/* Controles Flutuantes Nativos CineBG */}
        <div className="absolute bottom-3 right-3 flex items-center gap-2 z-30">
          {/* Velocidade de reprodução */}
          {directSrc && (
            <div className="relative">
              <button
                onClick={() => {
                  setSpeedOpen((v) => !v)
                  setSubsOpen(false)
                }}
                className="px-2.5 py-2 bg-black/70 hover:bg-black/90 rounded-lg text-white text-xs font-bold transition-colors backdrop-blur-sm"
                title="Velocidade de reprodução"
              >
                {speed}×
              </button>
              {speedOpen && (
                <div className="absolute bottom-full right-0 mb-2 bg-black/95 border border-white/10 rounded-lg p-1 flex flex-col min-w-[72px]">
                  {SPEED_OPTIONS.map((option) => (
                    <button
                      key={option}
                      onClick={() => {
                        setSpeed(option)
                        setSpeedOpen(false)
                      }}
                      className={`px-3 py-1.5 text-xs rounded text-left transition-colors ${
                        speed === option
                          ? 'bg-accent-red text-white font-bold'
                          : 'text-white/70 hover:bg-white/10'
                      }`}
                    >
                      {option}×
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Legendas (só aparece quando a fonte traz faixas) */}
          {directSrc && tracks.length > 0 && (
            <div className="relative">
              <button
                onClick={() => {
                  setSubsOpen((v) => !v)
                  setSpeedOpen(false)
                }}
                className={`p-2 rounded-lg transition-colors backdrop-blur-sm ${
                  activeTrack >= 0
                    ? 'bg-accent-red text-white'
                    : 'bg-black/70 hover:bg-black/90 text-white/60 hover:text-white'
                }`}
                title="Legendas"
              >
                {activeTrack >= 0 ? (
                  <Captions className="h-4 w-4" />
                ) : (
                  <CaptionsOff className="h-4 w-4" />
                )}
              </button>
              {subsOpen && (
                <div className="absolute bottom-full right-0 mb-2 bg-black/95 border border-white/10 rounded-lg p-1 flex flex-col min-w-[150px] max-h-56 overflow-y-auto">
                  <button
                    onClick={() => applySubtitle(-1)}
                    className={`px-3 py-1.5 text-xs rounded text-left transition-colors ${
                      activeTrack === -1
                        ? 'bg-accent-red text-white font-bold'
                        : 'text-white/70 hover:bg-white/10'
                    }`}
                  >
                    Desativada
                  </button>
                  {tracks.map((t) => (
                    <button
                      key={t.index}
                      onClick={() => applySubtitle(t.index)}
                      className={`px-3 py-1.5 text-xs rounded text-left transition-colors truncate ${
                        activeTrack === t.index
                          ? 'bg-accent-red text-white font-bold'
                          : 'text-white/70 hover:bg-white/10'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Picture-in-Picture */}
          {directSrc && typeof document !== 'undefined' && document.pictureInPictureEnabled && (
            <button
              onClick={handlePip}
              className={`p-2 rounded-lg transition-colors backdrop-blur-sm ${
                pipActive
                  ? 'bg-accent-red text-white'
                  : 'bg-black/70 hover:bg-black/90 text-white/60 hover:text-white'
              }`}
              title="Picture-in-Picture"
            >
              <PictureInPicture2 className="h-4 w-4" />
            </button>
          )}

          {onNextEpisode && type !== 'movie' && (
            <button
              onClick={() => {
                cancelAutoNext()
                onNextEpisode()
              }}
              className="flex items-center gap-1.5 px-3 py-2 bg-accent-red hover:bg-red-600 rounded-lg text-white font-bold text-xs transition-colors backdrop-blur-sm shadow-lg shadow-red-900/40"
              title="Próximo Episódio"
            >
              <SkipForward className="h-3.5 w-3.5" />
              <span>Próximo Ep</span>
            </button>
          )}

          {autoNextCountdown !== null && (
            <div className="flex items-center gap-2 bg-black/80 text-white px-3 py-1.5 rounded-lg text-xs font-mono backdrop-blur-sm border border-white/10">
              <span>Próximo em</span>
              <span className="bg-accent-red text-white px-2 py-0.5 rounded">{autoNextCountdown}s</span>
              <button
                onClick={cancelAutoNext}
                className="ml-1 p-1 hover:bg-white/10 rounded"
                title="Cancelar"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}

          {directSrc && availableQualities.length > 1 && (
            <div className="relative">
              <button
                onClick={() => setQualityOpen(!qualityOpen)}
                className="px-2.5 py-2 bg-black/70 hover:bg-black/90 rounded-lg text-white text-xs font-bold transition-colors backdrop-blur-sm"
                title="Qualidade"
              >
                {currentQuality || 'Auto'}
              </button>
              {qualityOpen && (
                <div className="absolute bottom-full right-0 mb-2 bg-black/95 border border-white/10 rounded-lg p-1 flex flex-col min-w-[80px]">
                  <button
                    onClick={() => {
                      setCurrentQuality(null)
                      setQualityOpen(false)
                    }}
                    className={`px-3 py-1.5 text-xs rounded text-left transition-colors ${!currentQuality ? 'bg-accent-red text-white font-bold' : 'text-white/70 hover:bg-white/10'}`}
                  >
                    Auto
                  </button>
                  {availableQualities.map((q) => (
                    <button
                      key={q.label}
                      onClick={() => {
                        setCurrentQuality(q.label)
                        setQualityOpen(false)
                      }}
                      className={`px-3 py-1.5 text-xs rounded text-left transition-colors ${currentQuality === q.label ? 'bg-accent-red text-white font-bold' : 'text-white/70 hover:bg-white/10'}`}
                    >
                      {q.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <button
            onClick={handleManualRefresh}
            className="p-2 bg-black/70 hover:bg-black/90 rounded-lg text-white/60 hover:text-white transition-colors backdrop-blur-sm"
            title="Recarregar"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <button
            onClick={handleFullscreen}
            className="p-2 bg-black/70 hover:bg-black/90 rounded-lg text-white/60 hover:text-white transition-colors backdrop-blur-sm"
            title="Tela cheia"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default StreamPlayer



