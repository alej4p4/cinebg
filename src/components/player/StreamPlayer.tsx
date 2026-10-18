import { useState, useRef, useEffect } from 'react'
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
  Lock,
  Unlock,
  Layers,
  FastForward,
  Expand,
  Server,
  Check,
} from 'lucide-react'
import {
  buildMovieUrl,
  buildShowUrl,
  getInitialMirrorForAudio,
  isMirrorSandboxed,
  resolveMegaEmbed,
  MIRRORS,
  type DirectCandidate,
} from '@/services/streams'
import { useAppStore } from '@/store/useAppStore'
import type { AudioOption } from '@/store/useAppStore'
import type { TMDBSeason } from '@/types'
import EpisodeSelector from './EpisodeSelector'
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
  seasons?: TMDBSeason[]
  onSelectEpisode?: (season: number, episode: number) => void
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
  seasons,
  onSelectEpisode,
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
  // ComeÃ§a "resolvendo" para nÃ£o piscar o iframe (com anÃºncio) antes de tentar o nativo.
  const [resolvingDirect, setResolvingDirect] = useState(true)

  const [candidates, setCandidates] = useState<DirectCandidate[]>([])
  const [candidateIndex, setCandidateIndex] = useState(0)

  // O espelho inicial se ajusta automaticamente ao áudio preferido
  const [activeMirror, setActiveMirror] = useState(() => getInitialMirrorForAudio(audioOption))
  const [key, setKey] = useState(0)
  // Só mostra o iframe se o usuário pedir explicitamente em caso extremo. O padrão é 100% nativo.
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

  // ===== Aprimoramentos YuCine (Modo Lock, Pular Abertura, Gaveta de Episódios) =====
  const [isLocked, setIsLocked] = useState(false)
  const [showLockPrompt, setShowLockPrompt] = useState(false)
  const [showSkipIntro, setShowSkipIntro] = useState(false)
  const [episodesDrawerOpen, setEpisodesDrawerOpen] = useState(false)
  const [fitMode, setFitMode] = useState<'contain' | 'cover'>('cover')
  const hasSkippedIntroRef = useRef(false)
  const lockPromptTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ===== Auto-fallback state =====
  const [fallbackAttempt, setFallbackAttempt] = useState(0)
  const [isAutoFallback, setIsAutoFallback] = useState(false)
  const fallbackSequence = audioOption === 'dub'
    ? ['megaembed', 'vidsrc-sh', 'vidsrc-io', 'vsembed', 'vidlink', 'multiembed']
    : ['vidsrc-sh', 'vidsrc-io', 'vsembed', 'megaembed', 'vidlink', 'multiembed']

  const embedUrl =
    type === 'movie'
      ? buildMovieUrl(tmdbId, audioOption, activeMirror)
      : buildShowUrl(tmdbId, season, episode, audioOption, activeMirror)

  // Alternância de áudio inteligente sem anúncios
  const switchAudio = (opt: AudioOption) => {
    setAudioOption(opt)
    if (opt === 'orig') {
      setActiveMirror('vidlink')
      setAllowIframe(true)
      setDirectSrc(null)
      setDirectKind(null)
      setCandidates([])
      setCandidateIndex(0)
    } else {
      setActiveMirror('megaembed')
      setAllowIframe(false)
      setDirectSrc(null)
      setDirectKind(null)
      setCandidates([])
      setCandidateIndex(0)
    }
    setLoaded(false)
    setError(false)
    setFallbackAttempt(0)
    setKey((k) => k + 1)
  }

  // Falha na reprodução direta da fonte atual: testa a próxima opção limpa da lista
  const handleDirectMediaError = () => {
    console.warn('[StreamPlayer] Falha na reprodução da fonte atual. Buscando próxima opção limpa...')
    setCandidateIndex((prevIndex) => {
      const nextIndex = prevIndex + 1
      if (nextIndex < candidates.length) {
        const next = candidates[nextIndex]
        console.info(`[StreamPlayer] Testando candidato alternativo: ${next.label} (${nextIndex + 1}/${candidates.length})`)
        nativeActiveRef.current = true
        setDirectSrc(next.url)
        setDirectKind(next.kind)
        setLoaded(false)
        setError(false)
        showFeedback(`Conectando: ${next.label}`)
        return nextIndex
      }
      // Se todos os candidatos diretos falharem, exibe estado de erro sem abrir iframe de anúncio
      nativeActiveRef.current = false
      setDirectSrc(null)
      setDirectKind(null)
      setError(true)
      return prevIndex
    })
  }

  const handleStreamFailure = () => {
    if (autoFallbackTimerRef.current) clearTimeout(autoFallbackTimerRef.current)
    handleDirectMediaError()
  }

  const handleManualRefresh = () => {
    loadedRef.current = false
    setAllowIframe(false)
    setLoaded(false)
    setError(false)
    setDirectSrc(null)
    setDirectKind(null)
    setCandidates([])
    setCandidateIndex(0)
    setFallbackAttempt(0)
    setActiveMirror('megaembed')
    setKey((k) => k + 1)
  }

  useEffect(() => {
    initAntiRedirectShield()
  }, [])

  useEffect(() => {
    loadedRef.current = false
    setLoaded(false)
    setError(false)

    if (autoFallbackTimerRef.current) clearTimeout(autoFallbackTimerRef.current)

    // Timeout de segurança: se nada carregar em 15s e não houver mídia nativa tocando, avança para a próxima fonte
    autoFallbackTimerRef.current = setTimeout(() => {
      if (loadedRef.current) return
      if (nativeActiveRef.current) return
      handleDirectMediaError()
    }, 15000)

    return () => {
      if (autoFallbackTimerRef.current) clearTimeout(autoFallbackTimerRef.current)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, tmdbId, season, episode, audioOption, activeMirror])

  // Resolve fontes nativas sem anúncios (MP4 / HLS direto via Capacitor/Fetch)
  useEffect(() => {
    if (audioOption === 'orig') {
      nativeActiveRef.current = false
      setResolvingDirect(false)
      setDirectSrc(null)
      setDirectKind(null)
      return
    }

    let cancelled = false
    nativeActiveRef.current = false
    setDirectSrc(null)
    setDirectKind(null)
    setCandidates([])
    setCandidateIndex(0)
    setResolvingDirect(true)

    const mediaType: 'movie' | 'tv' = type === 'movie' ? 'movie' : 'tv'
    resolveMegaEmbed(tmdbId, mediaType, season, episode)
      .then((resolved) => {
        if (cancelled) return
        const list = resolved.candidates || []
        setCandidates(list)
        setCandidateIndex(0)

        if (list.length > 0) {
          const first = list[0]
          nativeActiveRef.current = true
          setDirectSrc(first.url)
          setDirectKind(first.kind)
        } else if (resolved.dubbedMp4) {
          nativeActiveRef.current = true
          setDirectSrc(resolved.dubbedMp4)
          setDirectKind('mp4')
        } else if (resolved.hlsProxy) {
          nativeActiveRef.current = true
          setDirectSrc(resolved.hlsProxy)
          setDirectKind('hls')
        } else {
          nativeActiveRef.current = false
          setDirectSrc(null)
          setDirectKind(null)
          setError(true)
        }
      })
      .catch(() => {
        if (!cancelled) {
          nativeActiveRef.current = false
          setDirectSrc(null)
          setDirectKind(null)
          setError(true)
        }
      })
      .finally(() => {
        if (!cancelled) setResolvingDirect(false)
      })

    return () => {
      cancelled = true
    }
  }, [key, tmdbId, season, episode, audioOption, type])

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

      const hls = new Hls({
        enableWorker: true,
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
        maxBufferSize: 60 * 1000 * 1000,
        lowLatencyMode: false,
        manifestLoadingTimeOut: 15000,
        manifestLoadingMaxRetry: 4,
        levelLoadingTimeOut: 15000,
        fragLoadingTimeOut: 20000,
      })
      hlsInstance = hls
      hls.subtitleDisplay = true
      hls.loadSource(directSrc)
      hls.attachMedia(video)
      hls.on(Hls.Events.SUBTITLE_TRACKS_UPDATED, () => refreshTextTracks())
      hls.on(Hls.Events.MANIFEST_PARSED, () => window.setTimeout(() => refreshTextTracks(), 300))
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.warn('[StreamPlayer] Fatal network error, tentando recuperação automática...', data)
              hls.startLoad()
              break
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.warn('[StreamPlayer] Fatal media error, tentando recuperação automática...', data)
              hls.recoverMediaError()
              break
            default:
              hls.destroy()
              handleDirectMediaError()
              break
          }
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

  // Reseta o estado quando a fonte ou episódio muda.
  useEffect(() => {
    activeTrackRef.current = -1
    setActiveTrack(-1)
    setTracks([])
    resumedRef.current = false
    lastProgressRef.current = 0
    hasSkippedIntroRef.current = false
    setShowSkipIntro(false)
    setEpisodesDrawerOpen(false)
  }, [directSrc, season, episode])

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

  // Limpa timers ao desmontar.
  useEffect(
    () => () => {
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current)
      if (autoNextTimerRef.current) clearInterval(autoNextTimerRef.current)
      if (lockPromptTimerRef.current) clearTimeout(lockPromptTimerRef.current)
    },
    []
  )

  const handleLockTap = () => {
    if (!isLocked) return
    setShowLockPrompt(true)
    if (lockPromptTimerRef.current) clearTimeout(lockPromptTimerRef.current)
    lockPromptTimerRef.current = setTimeout(() => setShowLockPrompt(false), 2500)
  }

  const toggleLock = () => {
    setIsLocked((prev) => {
      const next = !prev
      if (next) {
        showFeedback('🔒 Tela Bloqueada')
        setShowLockPrompt(false)
      } else {
        showFeedback('🔓 Tela Desbloqueada')
      }
      return next
    })
  }

  const handleSkipIntro = () => {
    hasSkippedIntroRef.current = true
    setShowSkipIntro(false)
    seekBy(85)
  }

  const handleFullscreen = () => {
    if (containerRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {})
      } else {
        containerRef.current.requestFullscreen().catch(() => {})
      }
    }
  }

  const toggleFitMode = () => {
    setFitMode((prev) => {
      const next = prev === 'contain' ? 'cover' : 'contain'
      showFeedback(next === 'cover' ? 'Preencher Tela' : 'Ajustar (Original)')
      return next
    })
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
    // Liga automaticamente a primeira legenda quando ainda nÃ£o hÃ¡ escolha.
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
      /* PiP indisponÃ­vel neste contexto */
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

  // Ao carregar os metadados: lÃª legendas e retoma da posiÃ§Ã£o salva.
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
          /* seek invÃ¡lido */
        }
      }
    }
    resumedRef.current = true
  }

  // Salva a posição a cada ~5s de reprodução e gerencia o botão Pular Abertura.
  const handleTimeUpdate = () => {
    const video = videoRef.current
    if (!video) return
    const current = video.currentTime

    // Pular Abertura (+85s) durante os primeiros minutos de séries/animes
    if (type !== 'movie') {
      if (current >= 5 && current <= 110 && !hasSkippedIntroRef.current) {
        setShowSkipIntro(true)
      } else if (current > 115 || current < 5) {
        setShowSkipIntro(false)
      }
    }

    if (!onProgress) return
    if (Math.abs(current - lastProgressRef.current) >= 5) {
      lastProgressRef.current = current
      onProgress(current, Number.isFinite(video.duration) ? video.duration : 0)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return
    if (!videoRef.current) return

    // Se estiver bloqueado, qualquer tecla (exceto 'L' de desbloqueio) mostra aviso
    if (isLocked && e.key.toLowerCase() !== 'l') {
      handleLockTap()
      return
    }

    switch (e.key) {
      case 'ArrowRight':
        e.preventDefault()
        seekBy(10)
        break
      case 'ArrowLeft':
        e.preventDefault()
        seekBy(-10)
        break
      case 'ArrowUp':
        e.preventDefault()
        if (videoRef.current) {
          videoRef.current.volume = Math.min(1, Number((videoRef.current.volume + 0.1).toFixed(2)))
          showFeedback(`Vol ${Math.round(videoRef.current.volume * 100)}%`)
        }
        break
      case 'ArrowDown':
        e.preventDefault()
        if (videoRef.current) {
          videoRef.current.volume = Math.max(0, Number((videoRef.current.volume - 0.1).toFixed(2)))
          showFeedback(`Vol ${Math.round(videoRef.current.volume * 100)}%`)
        }
        break
      case ' ':
      case 'k':
      case 'Enter':
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
      case 'l':
      case 'L':
        e.preventDefault()
        toggleLock()
        break
      case 'a':
      case 'A':
        e.preventDefault()
        toggleFitMode()
        break
      case 'Escape':
        if (episodesDrawerOpen) {
          setEpisodesDrawerOpen(false)
        }
        break
      default:
        break
    }
  }

  const handleVideoDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isLocked) {
      handleLockTap()
      return
    }
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
            {audioOption === 'dub' ? '🇧🇷 Dublado' : '🇺🇸 Original / Legendado'}
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

        {/* Seleção de Servidor Limpo (Estilo YuCine) */}
        {candidates.length > 1 && (
          <div className="flex items-center gap-1 bg-[#1c1c28] p-1 rounded-lg border border-white/5">
            <span className="text-[11px] font-bold text-white/50 px-1.5 flex items-center gap-1">
              <Server className="h-3 w-3 text-amber-400" /> Servidor:
            </span>
            {candidates.map((cand, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setCandidateIndex(idx)
                  setDirectSrc(cand.url)
                  setDirectKind(cand.kind)
                  setLoaded(false)
                  setError(false)
                  showFeedback(`Conectando: ${cand.label}`)
                }}
                className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                  candidateIndex === idx
                    ? 'bg-amber-500 text-black shadow-md scale-105'
                    : 'text-white/60 hover:text-white hover:bg-white/10'
                }`}
                title={cand.label}
              >
                {idx + 1}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2">
          {directSrc && (
            <button
              onClick={() => {
                const next = fitMode === 'cover' ? 'contain' : 'cover'
                setFitMode(next)
                showFeedback(next === 'cover' ? 'Preencher Tela' : 'Ajustar (Original)')
              }}
              className={`p-1.5 transition-colors rounded-lg ${
                fitMode === 'cover'
                  ? 'text-accent-red bg-accent-red/10'
                  : 'text-white/40 hover:text-white hover:bg-white/5'
              }`}
              title={fitMode === 'cover' ? 'Ajustar para proporção original' : 'Preencher tela inteira'}
            >
              <Expand className="h-4 w-4" />
            </button>
          )}
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
        className="relative bg-black overflow-hidden rounded-b-xl aspect-video [&:fullscreen]:aspect-auto [&:fullscreen]:w-screen [&:fullscreen]:h-screen [&:fullscreen]:rounded-none outline-none"
      >
        {feedback && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50">
            <span className="bg-black/70 text-white text-2xl font-bold px-5 py-3 rounded-full">
              {feedback}
            </span>
          </div>
        )}

        {/* Botão de Bloqueio de Tela (Modo YuCine para Mobile / Tablet) */}
        {directSrc && (
          <div className="absolute top-3 left-3 z-40">
            <button
              onClick={toggleLock}
              className={`p-2.5 rounded-full transition-all duration-200 backdrop-blur-md ${
                isLocked
                  ? 'bg-accent-red text-white shadow-lg shadow-red-900/60 scale-110'
                  : 'bg-black/60 hover:bg-black/80 text-white/70 hover:text-white'
              }`}
              title={isLocked ? 'Desbloquear tela' : 'Bloquear tela'}
            >
              {isLocked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
            </button>
          </div>
        )}

        {/* Overlay de Bloqueio de Tela */}
        {isLocked && (
          <div
            onClick={handleLockTap}
            className="absolute inset-0 z-30 cursor-pointer flex items-center justify-center bg-transparent select-none"
          >
            {showLockPrompt && (
              <div className="bg-black/85 backdrop-blur-md border border-white/10 px-5 py-3 rounded-2xl flex items-center gap-3 animate-in fade-in zoom-in duration-200 shadow-2xl">
                <Lock className="h-5 w-5 text-accent-red" />
                <span className="text-white text-xs sm:text-sm font-semibold">
                  Tela bloqueada. Toque no cadeado para liberar.
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleLock()
                  }}
                  className="px-3 py-1 bg-accent-red text-white text-xs font-bold rounded-lg hover:bg-red-600 transition-colors shadow-md"
                >
                  Desbloquear
                </button>
              </div>
            )}
          </div>
        )}

        {/* Pular Abertura (+85s) Estilo YuCine */}
        {showSkipIntro && directSrc && !isLocked && (
          <div className="absolute bottom-16 right-4 z-30 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <button
              onClick={handleSkipIntro}
              className="flex items-center gap-2 px-4 py-2.5 bg-accent-red/90 hover:bg-accent-red text-white text-xs sm:text-sm font-bold rounded-xl shadow-xl shadow-red-900/40 backdrop-blur-md transition-all hover:scale-105 active:scale-95 border border-white/20"
            >
              <FastForward className="h-4 w-4" />
              <span>Pular Abertura (+85s)</span>
            </button>
          </div>
        )}

        {/* Gaveta de Episódios In-Player (Estilo YuCine) */}
        {episodesDrawerOpen && seasons && onSelectEpisode && !isLocked && (
          <div className="absolute inset-y-0 right-0 w-full sm:w-96 bg-[#0e0e16]/95 backdrop-blur-md border-l border-white/10 z-40 flex flex-col p-4 shadow-2xl animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-accent-red" />
                <span className="text-white font-bold text-sm">Episódios</span>
              </div>
              <button
                onClick={() => setEpisodesDrawerOpen(false)}
                className="p-1 text-white/50 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto pr-1">
              <EpisodeSelector
                showId={tmdbId}
                seasons={seasons}
                currentSeason={season}
                currentEpisode={episode}
                onSelect={(s, e) => {
                  onSelectEpisode(s, e)
                  setEpisodesDrawerOpen(false)
                }}
              />
            </div>
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
              <p className="text-white font-bold text-lg">Transmissão indisponível nesta opção</p>
              <p className="text-white/40 text-sm mt-1 max-w-md">
                Não foi possível conectar a este servidor no momento. Você pode testar outra opção limpa ou alternar o áudio.
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
              {candidates.length > 1 && (
                <button
                  onClick={handleDirectMediaError}
                  className="flex items-center gap-2 bg-amber-500 text-black px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-amber-400 transition-colors shadow-lg"
                >
                  <Server className="h-4 w-4" />
                  Próxima Opção ({candidateIndex + 1}/{candidates.length})
                </button>
              )}
              <button
                onClick={() => switchAudio(audioOption === 'dub' ? 'orig' : 'dub')}
                className="flex items-center gap-2 bg-white/10 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-white/20 transition-colors"
              >
                Mudar para {audioOption === 'dub' ? 'Legendado' : 'Dublado'}
              </button>
            </div>
          </div>
        )}

        {/*
          SANDBOX (escudo anti-popup/anti-redirect):
          Usamos `sandbox` COM `allow-same-origin`. Isso mantÃ©m a origem real do iframe
          (nÃ£o fica "opaca"), entÃ£o os detectores de sandbox do MegaEmbed e do vidsrc/sbx.js
          nÃ£o disparam e o vÃ­deo toca. Sem `allow-popups`/`allow-top-navigation`, a abertura
          de abas de propaganda e o redirect da janela principal ficam bloqueados.
        */}
        {showIframe && (
          <iframe
            key={`stream-${key}-${tmdbId}-${season}-${episode}-${audioOption}-${activeMirror}`}
            ref={iframeRef}
            src={embedUrl}
            title={title}
            className="w-full h-full border-0"
            allowFullScreen
            allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
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
            className={`w-full h-full bg-black transition-all duration-200 ${fitMode === 'cover' ? 'object-cover' : 'object-contain'}`}
            onLoadedData={handleDirectMediaReady}
            onLoadedMetadata={handleLoadedMetadata}
            onCanPlay={handleDirectMediaReady}
            onTimeUpdate={handleTimeUpdate}
            onError={handleDirectMediaError}
            onEnded={handleEnded}
          />
        )}

        {/* Controles Flutuantes Nativos CineBG */}
        <div className={`absolute bottom-3 right-3 flex items-center gap-2 z-30 transition-opacity duration-200 ${isLocked ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
          {/* Gaveta de Episódios In-Player (Estilo YuCine) */}
          {type !== 'movie' && seasons && seasons.length > 0 && onSelectEpisode && (
            <button
              onClick={() => setEpisodesDrawerOpen((prev) => !prev)}
              className="flex items-center gap-1.5 px-3 py-2 bg-black/70 hover:bg-black/90 rounded-lg text-white font-bold text-xs transition-colors backdrop-blur-sm border border-white/5"
              title="Lista de Episódios"
            >
              <Layers className="h-4 w-4 text-accent-red" />
              <span className="hidden sm:inline">Episódios</span>
            </button>
          )}
          {/* Alternar Preenchimento de Tela (Estilo YuCine: Ajustar vs Preencher) */}
          {directSrc && (
            <button
              onClick={toggleFitMode}
              className={`p-2 rounded-lg text-xs font-bold transition-colors backdrop-blur-sm ${
                fitMode === 'cover'
                  ? 'bg-accent-red text-white shadow-md shadow-red-900/40'
                  : 'bg-black/70 hover:bg-black/90 text-white/70 hover:text-white'
              }`}
              title={fitMode === 'cover' ? 'Ajustar para proporção original' : 'Preencher tela inteira'}
            >
              <Expand className="h-4 w-4" />
            </button>
          )}
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
                {speed}x
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

          {/* Legendas (Sempre visível para o usuário gerenciar legendas / áudio) */}
          {directSrc && (
            <div className="relative">
              <button
                onClick={() => {
                  setSubsOpen((v) => !v)
                  setSpeedOpen(false)
                }}
                className={`p-2 rounded-lg transition-colors backdrop-blur-sm ${
                  activeTrack >= 0 || audioOption === 'orig'
                    ? 'bg-accent-red text-white'
                    : 'bg-black/70 hover:bg-black/90 text-white/60 hover:text-white'
                }`}
                title="Opções de Legenda"
              >
                {activeTrack >= 0 || audioOption === 'orig' ? (
                  <Captions className="h-4 w-4" />
                ) : (
                  <CaptionsOff className="h-4 w-4" />
                )}
              </button>
              {subsOpen && (
                <div className="absolute bottom-full right-0 mb-2 bg-black/95 border border-white/10 rounded-lg p-1.5 flex flex-col min-w-[190px] max-h-60 overflow-y-auto shadow-2xl z-50">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-white/40 px-2 py-1">
                    Legendas
                  </div>
                  <button
                    onClick={() => applySubtitle(-1)}
                    className={`px-3 py-1.5 text-xs rounded text-left transition-colors flex items-center justify-between ${
                      activeTrack === -1
                        ? 'bg-accent-red text-white font-bold'
                        : 'text-white/70 hover:bg-white/10'
                    }`}
                  >
                    <span>Desativada</span>
                    {activeTrack === -1 && <Check className="h-3 w-3" />}
                  </button>
                  {tracks.map((t) => (
                    <button
                      key={t.index}
                      onClick={() => applySubtitle(t.index)}
                      className={`px-3 py-1.5 text-xs rounded text-left transition-colors truncate flex items-center justify-between ${
                        activeTrack === t.index
                          ? 'bg-accent-red text-white font-bold'
                          : 'text-white/70 hover:bg-white/10'
                      }`}
                    >
                      <span className="truncate">{t.label}</span>
                      {activeTrack === t.index && <Check className="h-3 w-3" />}
                    </button>
                  ))}
                  <div className="my-1 border-t border-white/10" />
                  <button
                    onClick={() => {
                      setSubsOpen(false)
                      switchAudio('orig')
                    }}
                    className="px-2.5 py-1.5 text-xs rounded text-left transition-colors hover:bg-white/10 text-white/80 flex items-center gap-2"
                  >
                    <span className="text-sm">🇧🇷</span>
                    <div className="flex flex-col">
                      <span className="font-semibold text-[11px] text-white">Ativar Legendado (PT-BR)</span>
                      <span className="text-[9px] text-white/50">Carregar player legendado</span>
                    </div>
                  </button>
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



