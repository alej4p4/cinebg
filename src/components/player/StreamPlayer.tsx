import { useState, useRef, useEffect, useCallback } from 'react'
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
  RotateCw,
  Lock,
  Unlock,
  Layers,
  FastForward,
  Expand,
  Server,
  Check,
  Play,
  Pause,
  Star,
  Download,
  ArrowLeft,
  Sliders,
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
import {
  fetchPortugueseSubtitles,
  clearActiveSubtitleBlobs,
  type SubtitleTrackOption,
} from '@/services/subtitles'
import { useAppStore } from '@/store/useAppStore'
import type { AudioOption } from '@/store/useAppStore'
import type { TMDBSeason } from '@/types'
import EpisodeSelector from './EpisodeSelector'
import PlaybackSettingsModal from './PlaybackSettingsModal'
import { initAntiRedirectShield, setAntiRedirectShieldActive } from '@/utils/antiRedirect'
import { isTVDevice, isMobileDevice } from '@/utils/tv'
import { SpatialNavigation } from '@noriginmedia/norigin-spatial-navigation'

interface StreamPlayerProps {
  tmdbId: number
  type: 'movie' | 'tv' | 'anime'
  season?: number
  episode?: number
  title: string
  originalLanguage?: string
  onNextEpisode?: () => void
  startAt?: number
  onProgress?: (seconds: number, duration: number) => void
  seasons?: TMDBSeason[]
  onSelectEpisode?: (season: number, episode: number) => void
  onBack?: () => void
  onDownload?: () => void
}

const StreamPlayer = ({
  tmdbId,
  type,
  season = 1,
  episode = 1,
  title,
  originalLanguage,
  onNextEpisode,
  startAt,
  onProgress,
  seasons,
  onSelectEpisode,
  onBack,
  onDownload,
}: StreamPlayerProps) => {
  const {
    audioOption,
    subtitleOption,
    setAudioOption,
    setSubtitleOption,
    favorites,
    addFavorite,
    removeFavorite,
    tvMode,
  } = useAppStore()
  const isTv = isTVDevice() || tvMode || !isMobileDevice()
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Pausa a navegação espacial externa enquanto o player de vídeo estiver aberto
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

  const isFavorite = favorites.some((f) => f.id === tmdbId)
  const handleToggleFavorite = () => {
    if (isFavorite) {
      removeFavorite(tmdbId)
      showFeedback('Removido dos Favoritos')
    } else {
      addFavorite({
        id: tmdbId,
        type,
        title,
        posterPath: null,
        rating: 0,
        addedAt: Date.now(),
      })
      showFeedback('Adicionado aos Favoritos')
    }
  }

  const [settingsModalOpen, setSettingsModalOpen] = useState(false)
  const [subDelay, setSubDelay] = useState(0)
  const [subLang, setSubLang] = useState<'off' | 'pt' | 'en'>(() => {
    return subtitleOption || 'pt'
  })
  const [subStyle, setSubStyle] = useState<'white' | 'yellow' | 'boxed'>('boxed')
  const stallTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)
  // Fonte nativa direta: MP4 dublado (PT-BR) ou HLS proxy do MegaEmbed.
  const [directSrc, setDirectSrc] = useState<string | null>(null)
  const [directKind, setDirectKind] = useState<'mp4' | 'hls' | null>(null)
  // Começa "resolvendo" para não piscar o iframe (com anúncio) antes de tentar o nativo.
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
  const mediaKey = `${type}-${tmdbId}-${season}-${episode}`
  const lastCheckedMediaRef = useRef<string>('')
  const userManualAudioRef = useRef<AudioOption | null>(null)

  // Legendas externas PT-BR (Stremio / OpenSubtitles / Forçadas)
  const [externalSubs, setExternalSubs] = useState<SubtitleTrackOption[]>([])

  // ===== Controles do player (Sprint 2) =====
  const [speed, setSpeed] = useState(1)
  const [speedOpen, setSpeedOpen] = useState(false)
  const [tracks, setTracks] = useState<{ index: number; label: string; isForced?: boolean }[]>([])
  const [activeTrack, setActiveTrack] = useState(-1)
  const [subsOpen, setSubsOpen] = useState(false)
  const [pipActive, setPipActive] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const activeTrackRef = useRef(-1)
  const resumedRef = useRef(false)
  const lastProgressRef = useRef(0)

  // Customização de aparência das legendas
  const [subSize, setSubSize] = useState<'sm' | 'md' | 'lg' | 'xl'>(() => {
    try {
      return (localStorage.getItem('cinebg_subs_size') as any) || 'md'
    } catch {
      return 'md'
    }
  })
  const [subColor, setSubColor] = useState<'yellow' | 'white' | 'cyan' | 'green'>(() => {
    try {
      return (localStorage.getItem('cinebg_subs_color') as any) || 'yellow'
    } catch {
      return 'yellow'
    }
  })
  const [subBg, setSubBg] = useState<'solid' | 'box' | 'transparent'>(() => {
    try {
      return (localStorage.getItem('cinebg_subs_bg') as any) || 'box'
    } catch {
      return 'box'
    }
  })

  const updateSubSize = (size: 'sm' | 'md' | 'lg' | 'xl') => {
    setSubSize(size)
    try {
      localStorage.setItem('cinebg_subs_size', size)
    } catch {}
  }

  const updateSubColor = (color: 'yellow' | 'white' | 'cyan' | 'green') => {
    setSubColor(color)
    try {
      localStorage.setItem('cinebg_subs_color', color)
    } catch {}
  }

  const updateSubBg = (bg: 'solid' | 'box' | 'transparent') => {
    setSubBg(bg)
    try {
      localStorage.setItem('cinebg_subs_bg', bg)
    } catch {}
  }

  useEffect(() => {
    const fontSize =
      subSize === 'sm'
        ? '16px'
        : subSize === 'md'
        ? '22px'
        : subSize === 'lg'
        ? '28px'
        : '34px'

    const color =
      subColor === 'yellow'
        ? '#fde047'
        : subColor === 'white'
        ? '#ffffff'
        : subColor === 'cyan'
        ? '#38bdf8'
        : '#4ade80'

    const backgroundColor =
      subBg === 'solid'
        ? 'rgba(0, 0, 0, 0.92)'
        : subBg === 'box'
        ? 'rgba(0, 0, 0, 0.65)'
        : 'transparent'

    const textShadow =
      subBg === 'transparent'
        ? '-2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000, 0 3px 6px rgba(0,0,0,1)'
        : '0px 2px 4px rgba(0,0,0,0.95)'

    const styleId = 'cinebg-custom-sub-style'
    let el = document.getElementById(styleId) as HTMLStyleElement | null
    if (!el) {
      el = document.createElement('style')
      el.id = styleId
      document.head.appendChild(el)
    }
    el.textContent = `
      video::cue {
        font-size: ${fontSize} !important;
        color: ${color} !important;
        background-color: ${backgroundColor} !important;
        text-shadow: ${textShadow} !important;
        border-radius: 6px !important;
        padding: 3px 8px !important;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
        line-height: 1.35 !important;
      }
    `
  }, [subSize, subColor, subBg])

  // Ajuste fino de sincronização de tempo de legendas (subDelay)
  const lastAppliedSubDelayRef = useRef(0)
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    const delta = subDelay - lastAppliedSubDelayRef.current
    if (Math.abs(delta) < 0.01) return
    lastAppliedSubDelayRef.current = subDelay

    for (let i = 0; i < video.textTracks.length; i += 1) {
      const track = video.textTracks[i]
      if (track.cues) {
        for (let j = 0; j < track.cues.length; j += 1) {
          const cue = track.cues[j] as VTTCue
          if (cue) {
            cue.startTime = Math.max(0, cue.startTime + delta)
            cue.endTime = Math.max(0, cue.endTime + delta)
          }
        }
      }
    }
  }, [subDelay])

  // Escudo JavaScript contra pop-ups e redirecionamentos no player
  useEffect(() => {
    try {
      const originalOpen = window.open
      window.open = () => null
      return () => {
        window.open = originalOpen
      }
    } catch {}
  }, [])

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
  const [fitMode, setFitMode] = useState<'cover' | 'contain' | 'fill' | 'classic'>('cover')
  const [resumeToast, setResumeToast] = useState<{ seconds: number } | null>(null)
  const hasSkippedIntroRef = useRef(false)
  const lockPromptTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ===== Orientação Mobile (Retrato / Paisagem) =====
  const [isPortrait, setIsPortrait] = useState(
    typeof window !== 'undefined' ? window.innerHeight > window.innerWidth : false
  )

  // ===== Estado do HUD / Controles Imersivos Estilo YuCine =====
  const [showHud, setShowHud] = useState(true)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)
  const hudTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ===== Gestos Touch & Toque Duplo (Avançar/Voltar 10s) =====
  const [doubleTapFeedback, setDoubleTapFeedback] = useState<{
    direction: 'left' | 'right'
    seconds: number
    key: number
  } | null>(null)

  const isTouchRef = useRef(false)
  const touchStartRef = useRef<{ time: number; x: number; y: number }>({ time: 0, x: 0, y: 0 })
  const lastTapRef = useRef<{ time: number; x: number; side: 'left' | 'right' } | null>(null)
  const singleTapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const doubleTapAccumulatorRef = useRef<{
    side: 'left' | 'right'
    seconds: number
    timer: ReturnType<typeof setTimeout> | null
  }>({
    side: 'right',
    seconds: 0,
    timer: null,
  })

  // Monitora redimensionamento e orientação da tela para adaptar celular
  useEffect(() => {
    const handleOrientationCheck = () => {
      setIsPortrait(window.innerHeight > window.innerWidth)
    }

    window.addEventListener('resize', handleOrientationCheck)
    window.addEventListener('orientationchange', handleOrientationCheck)
    if (typeof screen !== 'undefined' && screen.orientation) {
      screen.orientation.addEventListener('change', handleOrientationCheck)
    }

    // Se estiver em dispositivo móvel, tenta travar em horizontal na inicialização
    if (isMobileDevice() || (typeof window !== 'undefined' && window.innerWidth < 850)) {
      if (typeof screen !== 'undefined' && screen.orientation && 'lock' in screen.orientation) {
        try {
          (screen.orientation as any).lock('landscape').catch(() => {})
        } catch {}
      }
    }

    return () => {
      window.removeEventListener('resize', handleOrientationCheck)
      window.removeEventListener('orientationchange', handleOrientationCheck)
      if (typeof screen !== 'undefined' && screen.orientation) {
        screen.orientation.removeEventListener('change', handleOrientationCheck)
      }
    }
  }, [])

  // Alterna manualmente a orientação no celular
  const handleToggleOrientation = async () => {
    try {
      const isCurrentlyLandscape = window.innerWidth > window.innerHeight
      if (isCurrentlyLandscape) {
        if (typeof screen !== 'undefined' && screen.orientation) {
          if ('unlock' in screen.orientation) {
            screen.orientation.unlock()
          }
          if ('lock' in screen.orientation) {
            await (screen.orientation as any).lock('portrait').catch(() => {})
          }
        }
        showFeedback('Retrato 📱')
      } else {
        if (containerRef.current && !document.fullscreenElement) {
          await containerRef.current.requestFullscreen().catch(() => {})
        }
        if (typeof screen !== 'undefined' && screen.orientation && 'lock' in screen.orientation) {
          await (screen.orientation as any).lock('landscape').catch(() => {})
        }
        showFeedback('Paisagem / Tela Cheia 🔄')
      }
    } catch {}
  }

  const resetHudTimer = useCallback(() => {
    setShowHud(true)
    if (hudTimerRef.current) clearTimeout(hudTimerRef.current)
    hudTimerRef.current = setTimeout(() => {
      // Auto-oculta o HUD e todos os textos da tela cheia se nenhum modal estiver aberto
      if (
        !settingsModalOpen &&
        !episodesDrawerOpen &&
        !speedOpen &&
        !subsOpen &&
        !qualityOpen
      ) {
        setShowHud(false)
      }
    }, 3000)
  }, [settingsModalOpen, episodesDrawerOpen, speedOpen, subsOpen, qualityOpen])

  useEffect(() => {
    resetHudTimer()
    return () => {
      if (hudTimerRef.current) clearTimeout(hudTimerRef.current)
    }
  }, [resetHudTimer])

  const formatTime = (secs: number) => {
    if (!Number.isFinite(secs) || secs < 0) return '00:00'
    const h = Math.floor(secs / 3600)
    const m = Math.floor((secs % 3600) / 60)
    const s = Math.floor(secs % 60)
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value)
    if (videoRef.current) {
      videoRef.current.currentTime = val
      setCurrentTime(val)
    }
    resetHudTimer()
  }

  // ===== Auto-fallback state =====
  const [fallbackAttempt, setFallbackAttempt] = useState(0)
  const [isAutoFallback, setIsAutoFallback] = useState(false)
  const fallbackSequence = audioOption === 'dub'
    ? ['megaembed', 'vidlink', 'vidsrc-sh', 'vidsrc-io', 'vsembed', 'multiembed']
    : ['vidlink', 'vidsrc-sh', 'vidsrc-io', 'vsembed', 'megaembed', 'multiembed']

  const embedUrl =
    type === 'movie'
      ? buildMovieUrl(tmdbId, audioOption, activeMirror)
      : buildShowUrl(tmdbId, season, episode, audioOption, activeMirror)

  // Alternância de áudio inteligente sem anúncios
  const switchAudio = (opt: AudioOption) => {
    userManualAudioRef.current = opt
    setAudioOption(opt)
    if (opt === 'orig') {
      // Prioridade máxima: verifica se há candidato direto nativo com áudio original
      const directOrig = candidates.find((c) => !c.isDubbedHint)
      if (directOrig) {
        console.info('[StreamPlayer] Reproduzindo fonte original direta nativa (sem anúncios):', directOrig.label)
        nativeActiveRef.current = true
        setDirectSrc(directOrig.url)
        setDirectKind(directOrig.kind)
        setAllowIframe(false)
        setLoaded(false)
        setError(false)
        showFeedback(`Conectando: ${directOrig.label}`)
        return
      }
      setActiveMirror('vidlink')
      setAllowIframe(true)
      setDirectSrc(null)
      setDirectKind(null)
    } else {
      setActiveMirror('megaembed')
      setAllowIframe(false)
      const directDub = candidates.find((c) => c.isDubbedHint) || candidates[0]
      if (directDub) {
        nativeActiveRef.current = true
        setDirectSrc(directDub.url)
        setDirectKind(directDub.kind)
        setLoaded(false)
        setError(false)
        showFeedback(`Conectando: ${directDub.label}`)
        return
      }
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
      // Se todos os candidatos diretos falharem, alternamos automaticamente para o espelho com áudio original e legenda PT-BR
      console.info('[StreamPlayer] Fontes diretas esgotadas. Alternando para espelho legendado PT-BR (VidLink)...')
      setAudioOption('orig')
      nativeActiveRef.current = false
      setDirectSrc(null)
      setDirectKind(null)
      setActiveMirror('vidlink')
      setAllowIframe(true)
      setError(false)
      showFeedback('Conectando espelho legendado...')
      return prevIndex
    })
  }

  const handleStreamFailure = () => {
    if (autoFallbackTimerRef.current) clearTimeout(autoFallbackTimerRef.current)
    if (directSrc) {
      handleDirectMediaError()
    } else {
      // Se estiver em iframe (legendado), tenta o próximo espelho da sequência
      setFallbackAttempt((prev) => {
        const nextAttempt = prev + 1
        if (nextAttempt < fallbackSequence.length) {
          const nextMirror = fallbackSequence[nextAttempt]
          console.info(`[StreamPlayer] Iframe falhou. Alternando para próximo espelho: ${nextMirror}`)
          setActiveMirror(nextMirror)
          setLoaded(false)
          setError(false)
          setKey((k) => k + 1)
          return nextAttempt
        }
        setError(true)
        return prev
      })
    }
  }

  const handleManualRefresh = () => {
    loadedRef.current = false
    lastCheckedMediaRef.current = ''
    userManualAudioRef.current = null
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

  const handleStall = () => {
    if (loadedRef.current) return
    if (stallTimerRef.current) clearTimeout(stallTimerRef.current)
    stallTimerRef.current = setTimeout(() => {
      if (!loadedRef.current) {
        console.warn('[StreamPlayer] Vídeo estagnado na rede (12s). Avançando para próxima opção...')
        handleDirectMediaError()
      }
    }, 12000)
  }

  useEffect(() => {
    // Se ainda está consultando a API para descobrir fontes diretas, aguarda resolução sem abortar
    if (resolvingDirect) return

    // Se não há fonte direta nem espelho ativo, não inicia contagem regressiva
    if (!directSrc && !allowIframe) return

    loadedRef.current = false
    setLoaded(false)
    setError(false)

    if (autoFallbackTimerRef.current) clearTimeout(autoFallbackTimerRef.current)

    // Timeout de segurança generoso para conexões residenciais e TV Boxes: 14s para buffer inicial
    autoFallbackTimerRef.current = setTimeout(() => {
      if (loadedRef.current) return
      console.warn(`[StreamPlayer] Timeout de carregamento (14s) na opção ${candidateIndex + 1}. Tentando próxima opção...`)
      handleDirectMediaError()
    }, 14000)

    return () => {
      if (autoFallbackTimerRef.current) clearTimeout(autoFallbackTimerRef.current)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, tmdbId, season, episode, audioOption, activeMirror, candidateIndex, directSrc, resolvingDirect, allowIframe])

  // Verificação e resolução inteligente de áudio:
  // Ao entrar em um filme ou episódio, verifica se tem em português (dublado).
  // Se tiver, deixa marcado 'Dublado' (audioOption='dub') e reproduz a fonte em português.
  // Se não tiver áudio em português, muda automaticamente para o idioma original com legenda em português (audioOption='orig').
  useEffect(() => {
    const isNewMedia = lastCheckedMediaRef.current !== mediaKey
    if (isNewMedia) {
      lastCheckedMediaRef.current = mediaKey
      userManualAudioRef.current = null
      // Sempre define Dublado como padrão ao abrir qualquer filme ou série novo
      setAudioOption('dub')
    }

    // Se o usuário selecionou manualmente Original para este conteúdo, respeitamos a decisão manual
    if (userManualAudioRef.current === 'orig' || userManualAudioRef.current === 'sub') {
      const directOrig = candidates.find((c) => !c.isDubbedHint)
      if (directOrig) {
        nativeActiveRef.current = true
        setResolvingDirect(false)
        setDirectSrc(directOrig.url)
        setDirectKind(directOrig.kind)
        setAllowIframe(false)
        return
      }
      nativeActiveRef.current = false
      setResolvingDirect(false)
      setDirectSrc(null)
      setDirectKind(null)
      setActiveMirror('vidlink')
      setAllowIframe(true)
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

        // Verifica se há alguma fonte explicitamente dublada
        const hasDubbedSource = list.some((c) => c.isDubbedHint) || !!resolved.dubbedMp4

        if (hasDubbedSource) {
          // Possui áudio em português! Deixa marcado Dublado como padrão absoluto
          console.info('[StreamPlayer] Áudio em português encontrado. Deixando marcado Dublado como padrão.')
          setAudioOption('dub')
          setCandidates(list)
          setCandidateIndex(0)

          const firstDubbed = list.find((c) => c.isDubbedHint) || list[0]
          if (firstDubbed) {
            nativeActiveRef.current = true
            setDirectSrc(firstDubbed.url)
            setDirectKind(firstDubbed.kind)
          } else if (resolved.dubbedMp4) {
            nativeActiveRef.current = true
            setDirectSrc(resolved.dubbedMp4)
            setDirectKind('mp4')
          } else if (resolved.hlsProxy) {
            nativeActiveRef.current = true
            setDirectSrc(resolved.hlsProxy)
            setDirectKind('hls')
          }
        } else {
          // Nenhuma fonte dublada disponível no MegaEmbed (comum em séries turcas, doramas ou produções com áudio original)
          // Alterna automaticamente para o reprodutor com áudio original e legenda em português (VidLink / VidSrc / MultiEmbed)
          console.info('[StreamPlayer] Nenhuma fonte dublada disponível no MegaEmbed. Alternando para áudio original com legendas PT-BR...')
          setAudioOption('orig')
          setCandidates([])
          setCandidateIndex(0)
          nativeActiveRef.current = false
          setDirectSrc(null)
          setDirectKind(null)
          setActiveMirror('vidlink')
          setAllowIframe(true)
          setError(false)
          if (originalLanguage === 'tr') {
            showFeedback('Série Turca (Áudio Original / Legendas PT-BR)')
          } else {
            showFeedback('Iniciando em versão legendada PT-BR...')
          }
        }
      })
      .catch((err) => {
        if (cancelled) return
        console.warn('[StreamPlayer] Erro ao carregar fontes diretas. Alternando para espelho legendado:', err)
        setAudioOption('orig')
        setCandidates([])
        setCandidateIndex(0)
        nativeActiveRef.current = false
        setActiveMirror('vidlink')
        setAllowIframe(true)
        setDirectSrc(null)
        setDirectKind(null)
        setError(false)
      })
      .finally(() => {
        if (!cancelled) setResolvingDirect(false)
      })

    return () => {
      cancelled = true
    }
  }, [key, mediaKey, tmdbId, season, episode, type, originalLanguage, setAudioOption])

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

  // Busca e carrega legendas em Português (PT-BR) públicas e forçadas
  useEffect(() => {
    let alive = true
    fetchPortugueseSubtitles(type, tmdbId, season, episode).then((subs) => {
      if (alive) {
        setExternalSubs(subs)
        setTimeout(() => refreshTextTracks(), 400)
      }
    })
    return () => {
      alive = false
      clearActiveSubtitleBlobs()
    }
  }, [type, tmdbId, season, episode])

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
    if (!isLocked || isTv) return
    setShowLockPrompt(true)
    if (lockPromptTimerRef.current) clearTimeout(lockPromptTimerRef.current)
    lockPromptTimerRef.current = setTimeout(() => setShowLockPrompt(false), 2500)
  }

  const toggleLock = () => {
    if (isTv) {
      setIsLocked(false)
      return
    }
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

  const handleFullscreen = async () => {
    if (containerRef.current) {
      if (document.fullscreenElement) {
        if (typeof screen !== 'undefined' && screen.orientation && 'unlock' in screen.orientation) {
          try {
            screen.orientation.unlock()
          } catch {}
        }
        await document.exitFullscreen().catch(() => {})
      } else {
        await containerRef.current.requestFullscreen().catch(() => {})
        if (typeof screen !== 'undefined' && screen.orientation && 'lock' in screen.orientation) {
          try {
            await (screen.orientation as any).lock('landscape').catch(() => {})
          } catch {}
        }
      }
    }
    // Ao alternar tela cheia, esconde os controles rapidamente após 800ms
    setTimeout(() => {
      setShowHud(false)
    }, 800)
  }

  const toggleFitMode = () => {
    setFitMode((prev) => {
      let next: 'cover' | 'contain' | 'fill' | 'classic' = 'contain'
      let label = 'Padrão (16:9)'
      if (prev === 'cover') {
        next = 'contain'
        label = 'Padrão (16:9)'
      } else if (prev === 'contain') {
        next = 'fill'
        label = 'Esticar (100%)'
      } else if (prev === 'fill') {
        next = 'classic'
        label = 'Clássico (4:3)'
      } else {
        next = 'cover'
        label = 'Preencher Tela'
      }
      showFeedback(`Proporção: ${label}`)
      return next
    })
  }

  const showFeedback = (text: string) => {
    setFeedback(text)
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current)
    feedbackTimerRef.current = setTimeout(() => setFeedback(null), 700)
  }

  const seekBy = (delta: number, showDefaultFeedback = true) => {
    const video = videoRef.current
    if (!video) return
    const max = Number.isFinite(video.duration) ? video.duration : Infinity
    video.currentTime = Math.max(0, Math.min(max, video.currentTime + delta))
    if (showDefaultFeedback) {
      showFeedback(delta > 0 ? `+${delta}s` : `${delta}s`)
    }
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

  const applySubtitle = (index: number) => {
    const video = videoRef.current
    if (!video) return
    for (let i = 0; i < video.textTracks.length; i += 1) {
      video.textTracks[i].mode = i === index ? 'showing' : 'disabled'
    }
    activeTrackRef.current = index
    setActiveTrack(index)
    setSubsOpen(false)
    if (index >= 0) {
      const selected = video.textTracks[index]
      const label = (selected?.label || selected?.language || '').toLowerCase()
      const inferredLang: 'off' | 'pt' | 'en' =
        label.includes('eng') || label.includes('en') ? 'en' : 'pt'
      setSubLang(inferredLang)
      setSubtitleOption(inferredLang)
      showFeedback(`Legenda: ${selected?.label || 'Ativada 🇧🇷'}`)
    } else {
      setSubLang('off')
      setSubtitleOption('off')
      showFeedback('Legendas: Desativadas 🚫')
    }
  }

  const applySubtitleLang = useCallback((lang: 'off' | 'pt' | 'en') => {
    setSubLang(lang)
    setSubtitleOption(lang)
    const video = videoRef.current
    if (!video) return

    if (lang === 'off') {
      for (let i = 0; i < video.textTracks.length; i += 1) {
        video.textTracks[i].mode = 'disabled'
      }
      activeTrackRef.current = -1
      setActiveTrack(-1)
      showFeedback('Legendas: Desativadas 🚫')
      return
    }

    let targetIndex = -1
    for (let i = 0; i < video.textTracks.length; i += 1) {
      const track = video.textTracks[i]
      const label = (track.label || track.language || '').toLowerCase()
      if (
        lang === 'pt' &&
        (label.includes('port') || label.includes('pt') || label.includes('pob') || label.includes('bra'))
      ) {
        targetIndex = i
        break
      }
      if (
        lang === 'en' &&
        (label.includes('eng') || label.includes('ing') || label.includes('en'))
      ) {
        targetIndex = i
        break
      }
    }

    if (targetIndex === -1 && video.textTracks.length > 0) {
      targetIndex = 0
    }

    if (targetIndex !== -1) {
      for (let i = 0; i < video.textTracks.length; i += 1) {
        video.textTracks[i].mode = i === targetIndex ? 'showing' : 'disabled'
      }
      activeTrackRef.current = targetIndex
      setActiveTrack(targetIndex)
      const selected = video.textTracks[targetIndex]
      showFeedback(`Legenda: ${selected?.label || (lang === 'pt' ? 'Português 🇧🇷' : 'Inglês 🇺🇸')}`)
    } else {
      showFeedback(lang === 'pt' ? 'Legendas: Português 🇧🇷' : 'Legendas: Inglês 🇺🇸')
    }
  }, [setSubtitleOption])

  const cycleSubtitles = useCallback(() => {
    setSubLang((prev) => {
      const nextLang: 'off' | 'pt' | 'en' = prev === 'off' ? 'pt' : prev === 'pt' ? 'en' : 'off'
      applySubtitleLang(nextLang)
      return nextLang
    })
  }, [applySubtitleLang])

  const refreshTextTracks = () => {
    const video = videoRef.current
    if (!video) return
    const list: { index: number; label: string; isForced?: boolean }[] = []
    for (let i = 0; i < video.textTracks.length; i += 1) {
      const track = video.textTracks[i]
      const label = track.label || track.language || `Faixa ${i + 1}`
      const isForced = /forced|forcad|forçad|falas/i.test(label)
      list.push({ index: i, label, isForced })
    }
    setTracks(list)

    if (list.length > 0) {
      if (subLang === 'off') {
        for (let i = 0; i < video.textTracks.length; i += 1) {
          video.textTracks[i].mode = 'disabled'
        }
        activeTrackRef.current = -1
        setActiveTrack(-1)
      } else {
        let targetIndex = list.findIndex((t) => {
          const l = t.label.toLowerCase()
          return subLang === 'pt'
            ? l.includes('port') || l.includes('pt') || l.includes('pob') || l.includes('bra')
            : l.includes('eng') || l.includes('ing') || l.includes('en')
        })
        if (targetIndex === -1) targetIndex = 0
        applySubtitle(targetIndex)
      }
    }
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
          setResumeToast({ seconds: Math.floor(startAt) })
          setTimeout(() => setResumeToast(null), 8000)
        } catch {
          /* seek inválido */
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
    setCurrentTime(current)
    const dur = Number.isFinite(video.duration) ? video.duration : 0
    setDuration(dur)
    setIsPlaying(!video.paused)

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
    resetHudTimer()
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
        if (!isTv) {
          toggleLock()
        }
        break
      case 'a':
      case 'A':
        e.preventDefault()
        {
          const nextOpt = audioOption === 'dub' ? 'orig' : 'dub'
          switchAudio(nextOpt)
          showFeedback(nextOpt === 'dub' ? 'Áudio: Dublado 🇧🇷' : 'Áudio: Legendado / Original 🇺🇸')
        }
        break
      case 's':
      case 'S':
        e.preventDefault()
        cycleSubtitles()
        break
      case 'c':
      case 'C':
        e.preventDefault()
        setSettingsModalOpen((prev) => !prev)
        break
      case 'z':
      case 'Z':
        e.preventDefault()
        toggleFitMode()
        break
      case 'Escape':
      case 'GoBack':
        if (settingsModalOpen) {
          setSettingsModalOpen(false)
        } else if (episodesDrawerOpen) {
          setEpisodesDrawerOpen(false)
        } else if (onBack) {
          onBack()
        }
        break
      default:
        break
    }
  }

  // Listener Global de Teclas do Controle Remoto (Android TV / TV Box / D-Pad)
  useEffect(() => {
    const handleGlobalRemoteKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable) return

      const key = e.key
      const code = e.keyCode || e.which

      // Teclas especiais de Back no Android TV (keycode 4, Escape, GoBack)
      if (key === 'Escape' || key === 'GoBack' || key === 'Backspace' || code === 4) {
        if (settingsModalOpen) {
          e.preventDefault()
          setSettingsModalOpen(false)
          setTimeout(() => {
            const btn = document.getElementById('hud-btn-settings')
            btn?.focus()
          }, 50)
          return
        }
        if (episodesDrawerOpen) {
          e.preventDefault()
          setEpisodesDrawerOpen(false)
          setTimeout(() => {
            const btn = document.getElementById('hud-btn-episodes')
            btn?.focus()
          }, 50)
          return
        }
        if (showHud) {
          e.preventDefault()
          setShowHud(false)
          const activeEl = document.activeElement as HTMLElement | null
          activeEl?.blur()
          return
        }
        if (onBack) {
          e.preventDefault()
          onBack()
          return
        }
      }

      // Se um modal ou gaveta de episódios estiver aberto, permite navegação nativa pelos botões focáveis
      if (settingsModalOpen || episodesDrawerOpen) {
        return
      }

      // Qualquer tecla no controle remoto reativa e exibe o HUD por 4.5 segundos
      resetHudTimer()

      // Lista de botões focáveis do HUD
      const getHudButtons = (): HTMLElement[] => {
        if (!containerRef.current) return []
        return Array.from(
          containerRef.current.querySelectorAll<HTMLElement>(
            'button[data-hud-btn="true"]:not([disabled])'
          )
        )
      }

      // Tecla D-Pad Para Baixo
      if (key === 'ArrowDown' || code === 40 || code === 20) {
        if (!showHud) {
          e.preventDefault()
          setShowHud(true)
          setTimeout(() => {
            const subBtn = document.getElementById('hud-btn-subtitles') || document.getElementById('hud-btn-play')
            subBtn?.focus()
          }, 50)
          return
        }

        const currentFocused = document.activeElement as HTMLElement | null
        if (!currentFocused || !currentFocused.matches('button[data-hud-btn="true"]')) {
          e.preventDefault()
          const subBtn = document.getElementById('hud-btn-subtitles') || document.getElementById('hud-btn-play')
          subBtn?.focus()
          return
        }
      }

      // Tecla D-Pad Para Cima
      if (key === 'ArrowUp' || code === 38 || code === 19) {
        if (!showHud) {
          e.preventDefault()
          setShowHud(true)
          setTimeout(() => {
            const scrubber = document.getElementById('hud-scrubber') || document.getElementById('hud-btn-back')
            scrubber?.focus()
          }, 50)
          return
        }

        const currentFocused = document.activeElement as HTMLElement | null
        if (currentFocused && currentFocused.matches('button[data-hud-btn="true"]')) {
          e.preventDefault()
          const scrubber = document.getElementById('hud-scrubber') || document.getElementById('hud-btn-back')
          scrubber?.focus()
          return
        }
      }

      // Tecla D-Pad Para a Esquerda
      if (key === 'ArrowLeft' || code === 37 || code === 21) {
        if (showHud) {
          const btns = getHudButtons()
          const activeIndex = btns.indexOf(document.activeElement as HTMLElement)
          if (activeIndex > 0) {
            e.preventDefault()
            btns[activeIndex - 1].focus()
            return
          } else if (activeIndex === -1 && btns.length > 0) {
            e.preventDefault()
            const subBtn = document.getElementById('hud-btn-subtitles') || btns[0]
            subBtn?.focus()
            return
          }
        }
        if (document.activeElement?.tagName !== 'BUTTON') {
          e.preventDefault()
          seekBy(-10)
        }
        return
      }

      // Tecla D-Pad Para a Direita
      if (key === 'ArrowRight' || code === 39 || code === 22) {
        if (showHud) {
          const btns = getHudButtons()
          const activeIndex = btns.indexOf(document.activeElement as HTMLElement)
          if (activeIndex >= 0 && activeIndex < btns.length - 1) {
            e.preventDefault()
            btns[activeIndex + 1].focus()
            return
          } else if (activeIndex === -1 && btns.length > 0) {
            e.preventDefault()
            const subBtn = document.getElementById('hud-btn-subtitles') || btns[0]
            subBtn?.focus()
            return
          }
        }
        if (document.activeElement?.tagName !== 'BUTTON') {
          e.preventDefault()
          seekBy(10)
        }
        return
      }

      // Tecla Enter / OK / D-Pad Center
      if (key === 'Enter' || code === 13 || code === 23 || code === 66) {
        if (!showHud) {
          e.preventDefault()
          setShowHud(true)
          setTimeout(() => {
            const subBtn = document.getElementById('hud-btn-subtitles') || document.getElementById('hud-btn-play')
            subBtn?.focus()
          }, 50)
          return
        }

        const currentFocused = document.activeElement as HTMLElement | null
        if (!currentFocused || currentFocused === document.body || currentFocused.tagName === 'VIDEO') {
          e.preventDefault()
          const subBtn = document.getElementById('hud-btn-subtitles') || document.getElementById('hud-btn-play')
          subBtn?.focus()
          return
        }
      }

      // Teclas de atalho para Teclados / Remotos com teclas dedicadas:
      if (
        key === ' ' ||
        key === 'k' ||
        key === 'K' ||
        key === 'MediaPlay' ||
        key === 'MediaPause' ||
        key === 'MediaPlayPause'
      ) {
        if (document.activeElement?.tagName !== 'BUTTON') {
          e.preventDefault()
          togglePlay()
        }
      } else if (key === 'a' || key === 'A') {
        e.preventDefault()
        const nextOpt = audioOption === 'dub' ? 'orig' : 'dub'
        switchAudio(nextOpt)
        showFeedback(nextOpt === 'dub' ? 'Áudio: Dublado 🇧🇷' : 'Áudio: Legendado / Original 🇺🇸')
      } else if (
        key === 's' ||
        key === 'S' ||
        key === 'Subtitle' ||
        key === 'Captions' ||
        key === 'ClosedCaptioning' ||
        code === 460
      ) {
        e.preventDefault()
        cycleSubtitles()
      } else if (key === 'c' || key === 'C' || key === 'Menu' || code === 82) {
        e.preventDefault()
        setSettingsModalOpen((prev) => !prev)
      } else if (key === 'e' || key === 'E') {
        if (type !== 'movie') {
          e.preventDefault()
          setEpisodesDrawerOpen((prev) => !prev)
        }
      } else if (key === 'n' || key === 'N') {
        if (type !== 'movie' && onNextEpisode) {
          e.preventDefault()
          onNextEpisode()
        }
      }
    }

    window.addEventListener('keydown', handleGlobalRemoteKey)
    return () => {
      window.removeEventListener('keydown', handleGlobalRemoteKey)
    }
  }, [settingsModalOpen, episodesDrawerOpen, onBack, audioOption, type, onNextEpisode, cycleSubtitles, showHud])

  // Tratamento inteligente de toque mobile e cliques na tela do player
  const handlePlayerTap = (clientX: number, _clientY: number) => {
    if (isLocked) {
      handleLockTap()
      return
    }

    if (settingsModalOpen || episodesDrawerOpen || speedOpen || subsOpen || qualityOpen) {
      setSettingsModalOpen(false)
      setEpisodesDrawerOpen(false)
      setSpeedOpen(false)
      setSubsOpen(false)
      setQualityOpen(false)
      return
    }

    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return

    const relativeX = clientX - rect.left
    const width = rect.width
    const ratio = relativeX / width

    // Zonas de toque: Esquerda (< 35%: Voltar 10s), Direita (> 65%: Avançar 10s), Centro (35% a 65%: Controles)
    let side: 'left' | 'right' | 'center' = 'center'
    if (ratio < 0.35) side = 'left'
    else if (ratio > 0.65) side = 'right'

    const now = Date.now()
    const last = lastTapRef.current
    const isDoubleTap = (side === 'left' || side === 'right') && last && last.side === side && now - last.time < 350

    if ((side === 'left' || side === 'right') && isDoubleTap) {
      const activeSide: 'left' | 'right' = side
      // Cancelar qualquer timer de toque único para não piscar os controles da HUD
      if (singleTapTimerRef.current) {
        clearTimeout(singleTapTimerRef.current)
        singleTapTimerRef.current = null
      }

      const delta = activeSide === 'left' ? -10 : 10
      seekBy(delta, false) // busca rápida sem feedback central genérico

      // Acumula segundos no feedback de toque duplo (+10s, +20s, +30s...)
      if (doubleTapAccumulatorRef.current.timer) {
        clearTimeout(doubleTapAccumulatorRef.current.timer)
      }

      if (doubleTapAccumulatorRef.current.side === activeSide) {
        doubleTapAccumulatorRef.current.seconds += 10
      } else {
        doubleTapAccumulatorRef.current.side = activeSide
        doubleTapAccumulatorRef.current.seconds = 10
      }

      const totalSecs = doubleTapAccumulatorRef.current.seconds
      setDoubleTapFeedback({
        direction: activeSide,
        seconds: totalSecs,
        key: Date.now(),
      })

      doubleTapAccumulatorRef.current.timer = setTimeout(() => {
        setDoubleTapFeedback(null)
        doubleTapAccumulatorRef.current.seconds = 0
        doubleTapAccumulatorRef.current.timer = null
      }, 750)

      lastTapRef.current = { time: now, x: clientX, side: activeSide }
    } else {
      // Primeiro toque em uma lateral ou toque no centro
      lastTapRef.current = side !== 'center' ? { time: now, x: clientX, side: side as 'left' | 'right' } : null

      if (side === 'center') {
        if (singleTapTimerRef.current) {
          clearTimeout(singleTapTimerRef.current)
          singleTapTimerRef.current = null
        }
        setShowHud((prev) => {
          if (!prev) resetHudTimer()
          return !prev
        })
      } else {
        // Aguarda 280ms para confirmar se é toque único ou se virá um segundo toque
        if (singleTapTimerRef.current) clearTimeout(singleTapTimerRef.current)
        singleTapTimerRef.current = setTimeout(() => {
          setShowHud((prev) => {
            if (!prev) resetHudTimer()
            return !prev
          })
          singleTapTimerRef.current = null
        }, 280)
      }
    }
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
    <div
      ref={containerRef}
      tabIndex={0}
      onTouchStart={(e) => {
        resetHudTimer()
        if (e.touches.length > 0) {
          touchStartRef.current = {
            time: Date.now(),
            x: e.touches[0].clientX,
            y: e.touches[0].clientY,
          }
        }
      }}
      onTouchEnd={(e) => {
        if (e.changedTouches.length === 0) return
        const touch = e.changedTouches[0]
        const deltaX = Math.abs(touch.clientX - touchStartRef.current.x)
        const deltaY = Math.abs(touch.clientY - touchStartRef.current.y)
        const duration = Date.now() - touchStartRef.current.time

        // Se foi um movimento de arrastar/swipe longo (> 25px ou > 500ms), não trata como toque
        if (deltaX > 25 || deltaY > 25 || duration > 500) {
          return
        }

        isTouchRef.current = true
        handlePlayerTap(touch.clientX, touch.clientY)
      }}
      onClick={(e) => {
        if (isTouchRef.current) {
          isTouchRef.current = false
          return
        }
        handlePlayerTap(e.clientX, e.clientY)
      }}
      onKeyDown={handleKeyDown}
      onMouseMove={resetHudTimer}
      style={{ outline: 'none', border: 'none', boxShadow: 'none' }}
      className="player-container relative w-full h-full min-h-screen bg-black overflow-hidden flex flex-col justify-between outline-none ring-0 border-0 select-none cursor-pointer"
    >
      {/* ====== BARRA SUPERIOR HUD (Estilo YuCine TV) ====== */}
      <div
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
        className={`absolute top-0 left-0 right-0 z-40 p-4 sm:p-6 pl-[max(1rem,env(safe-area-inset-left,0px))] pr-[max(1rem,env(safe-area-inset-right,0px))] pt-[max(1rem,env(safe-area-inset-top,0px))] bg-gradient-to-b from-black/90 via-black/50 to-transparent flex items-center justify-between transition-opacity duration-300 ${
          showHud ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            id="hud-btn-back"
            data-hud-btn="true"
            onClick={onBack ? onBack : () => window.history.back()}
            className="flex items-center gap-2 bg-black/60 hover:bg-black/90 text-white px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold backdrop-blur-md border border-white/10 transition-all focus:outline-none focus:ring-4 focus:ring-yellow-400 focus:border-yellow-400 focus:bg-yellow-400 focus:text-black focus:scale-105 shadow-lg"
            title="Voltar"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar</span>
          </button>

          <div className="flex flex-col min-w-0">
            <h1 className="text-white font-extrabold text-sm sm:text-base md:text-lg truncate drop-shadow-md">
              {title}
            </h1>
            {type !== 'movie' && season && episode && (
              <span className="text-yellow-400 text-xs font-bold">
                Temporada {season} · Episódio {episode}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="bg-black/60 border border-white/10 px-3 py-1.5 rounded-xl text-xs font-bold text-white/90 backdrop-blur-md">
            {audioOption === 'dub' ? '🇧🇷 Dublado' : '🇺🇸 Legendado'}
          </span>
        </div>
      </div>
        {feedback && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50">
            <span className="bg-black/70 text-white text-2xl font-bold px-5 py-3 rounded-full">
              {feedback}
            </span>
          </div>
        )}

        {/* Feedback visual de Toque Duplo (Voltar 10s à Esquerda) */}
        {doubleTapFeedback && doubleTapFeedback.direction === 'left' && (
          <div
            key={`dt-left-${doubleTapFeedback.key}`}
            className="absolute left-[max(1.5rem,env(safe-area-inset-left,0px))] top-1/2 -translate-y-1/2 z-50 pointer-events-none flex flex-col items-center justify-center animate-in fade-in zoom-in duration-150"
          >
            <div className="relative flex flex-col items-center justify-center w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-black/85 backdrop-blur-md border border-white/20 shadow-2xl">
              <span className="absolute inset-0 rounded-full bg-yellow-400/20 animate-ping pointer-events-none" />
              <RotateCcw className="w-8 h-8 sm:w-10 sm:h-10 text-yellow-400 mb-1" />
              <span className="text-white font-black text-sm sm:text-base tracking-wide drop-shadow-md">
                -{doubleTapFeedback.seconds}s
              </span>
              <span className="text-[10px] text-yellow-400/90 font-bold uppercase tracking-wider">
                Voltar
              </span>
            </div>
          </div>
        )}

        {/* Feedback visual de Toque Duplo (Avançar 10s à Direita) */}
        {doubleTapFeedback && doubleTapFeedback.direction === 'right' && (
          <div
            key={`dt-right-${doubleTapFeedback.key}`}
            className="absolute right-[max(1.5rem,env(safe-area-inset-right,0px))] top-1/2 -translate-y-1/2 z-50 pointer-events-none flex flex-col items-center justify-center animate-in fade-in zoom-in duration-150"
          >
            <div className="relative flex flex-col items-center justify-center w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-black/85 backdrop-blur-md border border-white/20 shadow-2xl">
              <span className="absolute inset-0 rounded-full bg-yellow-400/20 animate-ping pointer-events-none" />
              <RotateCw className="w-8 h-8 sm:w-10 sm:h-10 text-yellow-400 mb-1" />
              <span className="text-white font-black text-sm sm:text-base tracking-wide drop-shadow-md">
                +{doubleTapFeedback.seconds}s
              </span>
              <span className="text-[10px] text-yellow-400/90 font-bold uppercase tracking-wider">
                Avançar
              </span>
            </div>
          </div>
        )}

        {/* Botão de Rotação Rápida para Celular (se segurando em pé/retrato) */}
        {!isTv && !isTVDevice() && !tvMode && isPortrait && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              handleToggleOrientation()
            }}
            onTouchStart={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
            className="absolute top-[calc(4.5rem+env(safe-area-inset-top,0px))] right-[max(1rem,env(safe-area-inset-right,0px))] z-40 bg-yellow-400 hover:bg-yellow-300 text-black px-3.5 py-2 rounded-full text-xs font-black flex items-center gap-1.5 shadow-2xl active:scale-95 transition-all animate-bounce"
            title="Girar para tela cheia na horizontal"
          >
            <RotateCw className="w-4 h-4" />
            <span>Girar Tela</span>
          </button>
        )}

        {/* Botão de Bloqueio de Tela (Exclusivo para Mobile com tela de toque; Oculto em TV) */}
        {directSrc && !isTv && !isTVDevice() && !tvMode && (
          <div className="absolute top-[max(0.75rem,env(safe-area-inset-top,0px))] left-[max(0.75rem,env(safe-area-inset-left,0px))] z-40">
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

        {/* Overlay de Bloqueio de Tela (Exclusivo para Mobile com tela de toque; Oculto em TV) */}
        {isLocked && !isTv && !isTVDevice() && !tvMode && (
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
        {/* Loading Overlay com botões clicáveis por controle remoto na TV */}
        {!loaded && !error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0a0a10] z-20 gap-3 p-4">
            <div className="w-12 h-12 border-4 border-white/10 border-t-yellow-400 rounded-full animate-spin" />
            <div className="text-center">
              <p className="text-white font-black text-lg">
                {resolvingDirect
                  ? 'Localizando transmissão direta dublada...'
                  : candidates[candidateIndex]?.label
                  ? `Conectando: ${candidates[candidateIndex]?.label}`
                  : isAutoFallback
                  ? `Tentando ${getMirrorLabel(activeMirror)}...`
                  : 'Carregando transmissão...'}
              </p>
              <p className="text-white/60 text-xs mt-1">{audioLabels[audioOption]}</p>
            </div>

            {/* Ações clicáveis com o controle remoto da TV */}
            <div className="flex flex-wrap items-center justify-center gap-3 mt-4 z-30">
              {candidates.length > 1 && (
                <button
                  type="button"
                  onClick={handleDirectMediaError}
                  className="px-4 py-2 bg-yellow-400 text-black rounded-xl text-xs font-black hover:bg-yellow-300 focus:outline-none focus:ring-4 focus:ring-yellow-400 focus:border-yellow-400 focus:scale-105 transition-all flex items-center gap-2 shadow-lg"
                >
                  <Server className="w-4 h-4" />
                  <span>Pular Opção ({candidateIndex + 1}/{candidates.length})</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => switchAudio(audioOption === 'dub' ? 'orig' : 'dub')}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold focus:outline-none focus:ring-4 focus:ring-yellow-400 focus:border-yellow-400 focus:scale-105 transition-all"
              >
                Mudar para {audioOption === 'dub' ? 'Legendado' : 'Dublado'}
              </button>
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
          Escudo anti-popup/anti-redirect é mantido pelo `initAntiRedirectShield()` global
          e pela camada de segurança do Capacitor/WebView, sem utilizar o atributo `sandbox`
          que ativa detectores de anti-tamper (como "Please disable sandbox" no VidLink/VidSrc).
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
            autoPlay
            playsInline
            className={`w-full h-full bg-black transition-all duration-200 ${
              fitMode === 'cover'
                ? 'object-cover'
                : fitMode === 'fill'
                ? '[object-fit:fill]'
                : fitMode === 'classic'
                ? 'w-auto max-w-full aspect-[4/3] object-contain mx-auto'
                : 'object-contain'
            }`}
            onLoadedData={handleDirectMediaReady}
            onLoadedMetadata={handleLoadedMetadata}
            onCanPlay={handleDirectMediaReady}
            onTimeUpdate={handleTimeUpdate}
            onWaiting={handleStall}
            onStalled={handleStall}
            onError={handleDirectMediaError}
            onEnded={handleEnded}
            onPlay={() => {
              setIsPlaying(true)
              if (isMobileDevice() && typeof screen !== 'undefined' && screen.orientation && 'lock' in screen.orientation) {
                try {
                  (screen.orientation as any).lock('landscape').catch(() => {})
                } catch {}
              }
            }}
            onPause={() => setIsPlaying(false)}
          >
            {externalSubs.map((sub) => (
              <track
                key={sub.id}
                kind="subtitles"
                label={sub.label}
                src={sub.vttUrl}
                srcLang={sub.language}
                default={false}
              />
            ))}
          </video>
        )}

        {/* Indicador Central de Play / Pause */}
        {!isPlaying && directSrc && !error && (
          <div
            onClick={togglePlay}
            className="absolute inset-0 flex items-center justify-center z-30 cursor-pointer bg-black/35 backdrop-blur-[2px]"
          >
            <div className="w-20 h-20 rounded-full bg-yellow-400 text-black flex items-center justify-center shadow-2xl shadow-yellow-400/50 transform transition-transform hover:scale-110 active:scale-95">
              <Play className="w-10 h-10 fill-black ml-1" />
            </div>
          </div>
        )}

        {/* Toast Flutuante de Retomada Inteligente */}
        {resumeToast && (
          <div className="absolute top-4 left-4 z-40 flex items-center gap-2.5 bg-black/85 border border-white/20 px-3.5 py-2 rounded-xl backdrop-blur-md shadow-2xl">
            <Play className="w-3.5 h-3.5 text-accent-red fill-accent-red flex-shrink-0" />
            <span className="text-xs text-white">
              Continuando de <b>{Math.floor(resumeToast.seconds / 60)}:{(resumeToast.seconds % 60).toString().padStart(2, '0')}</b>
            </span>
            <button
              onClick={() => {
                if (videoRef.current) videoRef.current.currentTime = 0
                setResumeToast(null)
                showFeedback('Reiniciado do início')
              }}
              className="ml-1.5 px-2 py-0.5 bg-white/10 hover:bg-white/20 text-white rounded text-[10px] font-bold transition-colors"
            >
              Reiniciar
            </button>
            <button
              onClick={() => setResumeToast(null)}
              className="text-white/40 hover:text-white ml-0.5"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Barra Inferior HUD Integrada (Linha do Tempo + Ações Estilo YuCine) */}
        <div
          className={`absolute bottom-0 inset-x-0 z-40 bg-gradient-to-t from-black/95 via-black/80 to-transparent pt-12 pb-6 px-4 sm:px-8 pl-[max(1rem,env(safe-area-inset-left,0px))] pr-[max(1rem,env(safe-area-inset-right,0px))] pb-[max(1.5rem,env(safe-area-inset-bottom,0px))] transition-opacity duration-300 ${
            showHud ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
          onClick={(e) => {
            e.stopPropagation()
            resetHudTimer()
          }}
          onTouchStart={(e) => {
            e.stopPropagation()
            resetHudTimer()
          }}
          onTouchEnd={(e) => {
            e.stopPropagation()
          }}
        >
          {/* Linha do Tempo / Scrubber */}
          {directSrc && duration > 0 && (
            <div className="flex items-center gap-3 sm:gap-4 mb-4">
              <button
                type="button"
                id="hud-btn-play"
                data-hud-btn="true"
                onClick={togglePlay}
                className="p-2 sm:p-2.5 bg-yellow-400 hover:bg-yellow-300 text-black rounded-full font-bold transition-transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-4 focus:ring-yellow-400"
                title={isPlaying ? 'Pausar' : 'Reproduzir'}
              >
                {isPlaying ? <Pause className="w-5 h-5 fill-black" /> : <Play className="w-5 h-5 fill-black ml-0.5" />}
              </button>
              
              <span className="text-xs sm:text-sm font-mono text-white/90 min-w-[45px] select-none">
                {formatTime(currentTime)}
              </span>

              <div className="relative flex-1 flex items-center group py-2">
                <input
                  id="hud-scrubber"
                  type="range"
                  min={0}
                  max={duration || 100}
                  step={1}
                  value={currentTime}
                  onChange={handleSeekChange}
                  className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />
              </div>

              <span className="text-xs sm:text-sm font-mono text-white/60 min-w-[45px] select-none text-right">
                {formatTime(duration)}
              </span>
            </div>
          )}

          {/* Barra de Ações Estilo YuCine (Otimizada para D-Pad / Controle Remoto da TV) */}
          <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {/* 1. Tela cheia */}
              <button
                type="button"
                id="hud-btn-fullscreen"
                data-hud-btn="true"
                onClick={handleFullscreen}
                className="flex items-center justify-center gap-2 bg-[#171824]/90 hover:bg-[#232538] text-white px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold border border-white/10 transition-all focus:outline-none focus:ring-4 focus:ring-yellow-400 focus:border-yellow-400 focus:bg-yellow-400 focus:text-black focus:scale-105 shadow-md"
              >
                <Expand className="w-4 h-4 text-yellow-400 group-focus:text-black" />
                <span>Tela cheia</span>
              </button>

              {/* Botão de Orientação / Girar Tela (exclusivo para celular) */}
              {!isTv && !isTVDevice() && !tvMode && (
                <button
                  type="button"
                  id="hud-btn-rotate"
                  data-hud-btn="true"
                  onClick={handleToggleOrientation}
                  className="flex items-center justify-center gap-1.5 bg-[#171824]/90 hover:bg-[#232538] text-white px-3 py-2.5 rounded-xl text-xs sm:text-sm font-bold border border-white/10 transition-all focus:outline-none focus:ring-4 focus:ring-yellow-400 shadow-md"
                  title="Alternar orientação Paisagem/Retrato"
                >
                  <RotateCw className="w-4 h-4 text-yellow-400" />
                  <span>Girar</span>
                </button>
              )}

              {/* 2. Áudio 1-Click (Dublado / Legendado - Estilo YuCine) */}
              <button
                type="button"
                id="hud-btn-audio"
                data-hud-btn="true"
                onClick={() => {
                  const nextOpt = audioOption === 'dub' ? 'orig' : 'dub'
                  switchAudio(nextOpt)
                  showFeedback(nextOpt === 'dub' ? 'Áudio: Dublado 🇧🇷' : 'Áudio: Legendado / Original 🇺🇸')
                }}
                className="flex items-center justify-center gap-1.5 bg-[#171824]/90 hover:bg-[#232538] text-white px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold border border-white/10 transition-all focus:outline-none focus:ring-4 focus:ring-yellow-400 focus:border-yellow-400 focus:bg-yellow-400 focus:text-black focus:scale-105 shadow-md"
                title="Clique ou pressione A no controle para alternar áudio"
              >
                <Volume2 className="w-4 h-4 text-yellow-400 group-focus:text-black" />
                <span>{audioOption === 'dub' ? '🇧🇷 Dublado' : '🇺🇸 Legendado'}</span>
              </button>

              {/* 3. Legendas 1-Click (Ativar / Desativar / Alternar no controle remoto) */}
              <button
                type="button"
                id="hud-btn-subtitles"
                data-hud-btn="true"
                onClick={cycleSubtitles}
                className="flex items-center justify-center gap-1.5 bg-[#171824]/90 hover:bg-[#232538] text-white px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold border border-white/10 transition-all focus:outline-none focus:ring-4 focus:ring-yellow-400 focus:border-yellow-400 focus:bg-yellow-400 focus:text-black focus:scale-105 shadow-md"
                title="Clique ou pressione S no controle para alternar legendas"
              >
                <Captions className={`w-4 h-4 ${subLang !== 'off' ? 'text-yellow-400' : 'text-white/40'}`} />
                <span>{subLang === 'off' ? '🚫 Sem Legenda' : subLang === 'pt' ? '🇧🇷 Legenda PT' : '🇺🇸 Legenda EN'}</span>
              </button>

              {/* 4. Ajustes de Reprodução (Abre o modal) */}
              <button
                type="button"
                id="hud-btn-settings"
                data-hud-btn="true"
                onClick={() => setSettingsModalOpen(true)}
                className={`flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all border shadow-md focus:outline-none focus:ring-4 focus:ring-yellow-400 focus:border-yellow-400 focus:scale-105 ${
                  settingsModalOpen
                    ? 'bg-yellow-400 text-black border-yellow-400 shadow-yellow-400/30'
                    : 'bg-[#171824]/90 hover:bg-[#232538] text-white border-white/10'
                }`}
                title="Ajustes completos de áudio, legendas, sincronização e estilos (Tecla C)"
              >
                <Sliders className="w-4 h-4 text-yellow-400" />
                <span>Ajustes</span>
              </button>

              {/* 3. Resolução / Opção de Servidor */}
              <button
                type="button"
                id="hud-btn-server"
                data-hud-btn="true"
                onClick={handleDirectMediaError}
                className="flex items-center justify-center gap-2 bg-[#171824]/90 hover:bg-[#232538] text-white px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold border border-white/10 transition-all focus:outline-none focus:ring-4 focus:ring-yellow-400 focus:border-yellow-400 focus:bg-yellow-400 focus:text-black focus:scale-105 shadow-md"
                title="Alternar servidor ou resolução"
              >
                <Server className="w-4 h-4 text-yellow-400" />
                <span>{candidates.length > 0 ? `Opção ${candidateIndex + 1}` : 'Resolução'}</span>
              </button>

              {/* 4. Episódios (Para Séries) */}
              {type !== 'movie' && seasons && seasons.length > 0 && onSelectEpisode && (
                <button
                  type="button"
                  id="hud-btn-episodes"
                  data-hud-btn="true"
                  onClick={() => setEpisodesDrawerOpen((prev) => !prev)}
                  className={`flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all border shadow-md focus:outline-none focus:ring-4 focus:ring-yellow-400 focus:border-yellow-400 focus:scale-105 ${
                    episodesDrawerOpen
                      ? 'bg-yellow-400 text-black border-yellow-400'
                      : 'bg-[#171824]/90 hover:bg-[#232538] text-white border-white/10'
                  }`}
                  title="Lista de Episódios"
                >
                  <Layers className="w-4 h-4 text-yellow-400" />
                  <span>Episódios</span>
                </button>
              )}

              {/* 5. Favorito */}
              <button
                type="button"
                id="hud-btn-favorite"
                data-hud-btn="true"
                onClick={handleToggleFavorite}
                className={`flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all border shadow-md focus:outline-none focus:ring-4 focus:ring-yellow-400 focus:border-yellow-400 focus:scale-105 ${
                  isFavorite
                    ? 'bg-yellow-400 text-black border-yellow-400 shadow-yellow-400/30'
                    : 'bg-[#171824]/90 hover:bg-[#232538] text-white border-white/10'
                }`}
              >
                <Star className={`w-4 h-4 ${isFavorite ? 'text-black fill-black' : 'text-yellow-400'}`} />
                <span>{isFavorite ? 'Favorito' : 'Favoritar'}</span>
              </button>

              {/* 6. Baixar */}
              <button
                type="button"
                id="hud-btn-download"
                data-hud-btn="true"
                onClick={() => {
                  if (onDownload) {
                    onDownload()
                  } else {
                    const btn = document.getElementById('watch-download-btn')
                    if (btn) btn.click()
                    else showFeedback('Preparando download...')
                  }
                }}
                className="flex items-center justify-center gap-2 bg-[#171824]/90 hover:bg-[#232538] text-white px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold border border-white/10 transition-all focus:outline-none focus:ring-4 focus:ring-yellow-400 focus:border-yellow-400 focus:bg-yellow-400 focus:text-black focus:scale-105 shadow-md"
              >
                <Download className="w-4 h-4 text-yellow-400" />
                <span>Baixar</span>
              </button>
            </div>

            {/* Ações Secundárias (Ajuste de Tela, Recarregar, Próximo Ep) */}
            <div className="flex items-center gap-2">
              {/* Ajustar / Preencher tela (Estilo YuCine) */}
              {directSrc && (
                <button
                  type="button"
                  id="hud-btn-fit"
                  data-hud-btn="true"
                  onClick={toggleFitMode}
                  className={`p-2.5 rounded-xl text-xs font-bold transition-all border border-white/10 focus:outline-none focus:ring-4 focus:ring-yellow-400 ${
                    fitMode === 'cover'
                      ? 'bg-yellow-400 text-black font-extrabold'
                      : 'bg-[#171824]/90 hover:bg-[#232538] text-white/80 hover:text-white'
                  }`}
                  title={fitMode === 'cover' ? 'Ajustar para proporção original' : 'Preencher tela inteira'}
                >
                  <Expand className="w-4 h-4" />
                </button>
              )}

              {/* Recarregar Stream */}
              <button
                type="button"
                id="hud-btn-refresh"
                data-hud-btn="true"
                onClick={handleManualRefresh}
                className="p-2.5 bg-[#171824]/90 hover:bg-[#232538] rounded-xl text-white/80 hover:text-white transition-all border border-white/10 focus:outline-none focus:ring-4 focus:ring-yellow-400"
                title="Recarregar"
              >
                <RefreshCw className="w-4 h-4" />
              </button>

              {/* Próximo Episódio */}
              {onNextEpisode && type !== 'movie' && (
                <button
                  type="button"
                  id="hud-btn-next-ep"
                  data-hud-btn="true"
                  onClick={() => {
                    cancelAutoNext()
                    onNextEpisode()
                  }}
                  className="flex items-center gap-1.5 px-3 py-2.5 bg-yellow-400 hover:bg-yellow-300 rounded-xl text-black font-bold text-xs transition-transform hover:scale-105 shadow-md focus:outline-none focus:ring-4 focus:ring-yellow-400"
                  title="Próximo Episódio"
                >
                  <SkipForward className="h-4 w-4 fill-black" />
                  <span>Próximo</span>
                </button>
              )}
            </div>
          </div>
        </div>



      {/* Modal de Configurações de Reprodução (Imagem 2) */}
      <PlaybackSettingsModal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        audioOption={audioOption === 'dub' ? 'dub' : 'orig'}
        onChangeAudio={(opt) => {
          switchAudio(opt)
          setSettingsModalOpen(false)
        }}
        subtitleLang={subLang}
        onChangeSubtitleLang={(lang) => {
          applySubtitleLang(lang)
        }}
        subtitleDelay={subDelay}
        onChangeSubtitleDelay={(delta) => setSubDelay(prev => Number((prev + delta).toFixed(1)))}
        onResetSubtitleDelay={() => setSubDelay(0)}
        subtitleSize={subSize === 'xl' ? 'lg' : subSize}
        onChangeSubtitleSize={(size) => updateSubSize(size)}
        subtitleStyle={subStyle}
        onChangeSubtitleStyle={(st) => {
          setSubStyle(st)
          if (st === 'white') {
            updateSubColor('white')
            updateSubBg('solid')
          } else if (st === 'yellow') {
            updateSubColor('yellow')
            updateSubBg('solid')
          } else {
            updateSubColor('yellow')
            updateSubBg('box')
          }
        }}
      />
    </div>
  )
}

export default StreamPlayer



