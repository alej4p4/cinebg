import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import Hls from 'hls.js'
import {
  RefreshCw,
  AlertCircle,
  Volume2,
  SkipForward,
  Captions,
  X,
  RotateCcw,
  RotateCw,
  Lock,
  Unlock,
  Layers,
  FastForward,
  Expand,
  Server,
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
  resolveMegaEmbed,
  getCachedMegaEmbed,
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

interface ScreenOrientationWithLock extends ScreenOrientation {
  lock?: (orientation: 'landscape' | 'portrait' | string) => Promise<void>
}
import type { TMDBSeason } from '@/types'
import EpisodeSelector from './EpisodeSelector'
import PlaybackSettingsModal from './PlaybackSettingsModal'
import { initAntiRedirectShield, setAntiRedirectShieldActive } from '@/utils/antiRedirect'
import { isTVDevice, isMobileDevice, markBackHandled, setNativePlayerLandscape } from '@/utils/tv'
import { trackStreamPlayback } from '@/services/observability'
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
  initialAudio?: 'dub' | 'orig'
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
  initialAudio,
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
  const isTv =
    isTVDevice() ||
    tvMode ||
    !isMobileDevice() ||
    (typeof window !== 'undefined' &&
      window.innerWidth > window.innerHeight &&
      !/iPhone|iPod|Android.*Mobile|Mobile.*Android/i.test(navigator.userAgent))
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
  const hlsRef = useRef<Hls | null>(null)

  // Áudio ativo específico da mídia em reprodução (padrão: Dublado / Português se disponível)
  const [activeAudio, setActiveAudio] = useState<'dub' | 'orig'>(() => initialAudio || 'dub')

  const isPtOriginal = (originalLanguage || '').toLowerCase() === 'pt'
  const initialMediaType: 'movie' | 'tv' = type === 'movie' ? 'movie' : 'tv'
  const initialCachedStream = getCachedMegaEmbed(tmdbId, initialMediaType, season, episode, originalLanguage)
  const initialFirstCandidate =
    (activeAudio === 'orig' && !isPtOriginal)
      ? initialCachedStream?.candidates?.find((c) => !c.isDubbedHint) || initialCachedStream?.candidates?.[0] || null
      : initialCachedStream?.candidates?.find((c) => c.isDubbedHint) || initialCachedStream?.candidates?.[0] || null

  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)
  // Fonte nativa direta hidratada instantaneamente do cache em 0ms (se já pré-resolvida na tela de Detalhes)
  const [directSrc, setDirectSrc] = useState<string | null>(
    initialFirstCandidate?.url || initialCachedStream?.dubbedMp4 || initialCachedStream?.hlsProxy || null
  )
  const [directKind, setDirectKind] = useState<'mp4' | 'hls' | null>(
    initialFirstCandidate?.kind || (initialCachedStream?.dubbedMp4 ? 'mp4' : initialCachedStream?.hlsProxy ? 'hls' : null)
  )
  // Se já existe no cache, não exibe tela de resolução intermediária
  const [resolvingDirect, setResolvingDirect] = useState(!initialCachedStream)

  const [candidates, setCandidates] = useState<DirectCandidate[]>(initialCachedStream?.candidates || [])
  const [candidateIndex, setCandidateIndex] = useState(0)
  const candidatesRef = useRef<DirectCandidate[]>(initialCachedStream?.candidates || [])
  const candidateIndexRef = useRef(0)
  useEffect(() => {
    candidatesRef.current = candidates
  }, [candidates])
  useEffect(() => {
    candidateIndexRef.current = candidateIndex
  }, [candidateIndex])

  // O espelho inicial se ajusta automaticamente ao áudio preferido
  const [activeMirror, setActiveMirror] = useState(() => getInitialMirrorForAudio(activeAudio))
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

  // Fallback automático de fontes
  const [isAutoFallback, _setIsAutoFallback] = useState(false)
  const [fallbackAttempt, setFallbackAttempt] = useState(0)
  const [_activeTrack, setActiveTrack] = useState(-1)

  // ===== Controles do player (Sprint 2) =====
  const [speed] = useState(1)
  const [speedOpen, setSpeedOpen] = useState(false)
  const [_tracks, setTracks] = useState<{ index: number; label: string; isForced?: boolean }[]>([])
  const [subsOpen, setSubsOpen] = useState(false)
  const [_pipActive, setPipActive] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const activeTrackRef = useRef(-1)
  const resumedRef = useRef(false)
  const lastProgressRef = useRef(0)
  const refreshTextTracksRef = useRef<(() => void) | null>(null)

  // Customização de aparência das legendas
  const [subSize, setSubSize] = useState<'sm' | 'md' | 'lg' | 'xl'>(() => {
    try {
      const val = localStorage.getItem('cinebg_subs_size')
      if (val === 'sm' || val === 'md' || val === 'lg' || val === 'xl') return val
      return 'md'
    } catch {
      return 'md'
    }
  })
  const [subColor, setSubColor] = useState<'yellow' | 'white' | 'cyan' | 'green'>(() => {
    try {
      const val = localStorage.getItem('cinebg_subs_color')
      if (val === 'yellow' || val === 'white' || val === 'cyan' || val === 'green') return val
      return 'yellow'
    } catch {
      return 'yellow'
    }
  })
  const [subBg, setSubBg] = useState<'solid' | 'box' | 'transparent'>(() => {
    try {
      const val = localStorage.getItem('cinebg_subs_bg')
      if (val === 'solid' || val === 'box' || val === 'transparent') return val
      return 'box'
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

  const AUTO_NEXT_DELAY = 10 // seconds

  const [autoNextCountdown, setAutoNextCountdown] = useState<number | null>(null)
  const autoNextTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [qualityOpen, setQualityOpen] = useState(false)

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
  const [isPlaying, setIsPlaying] = useState(false)
  const [isScrubbing, setIsScrubbing] = useState(false)
  const isScrubbingRef = useRef(false)
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
          (screen.orientation as unknown as ScreenOrientationWithLock).lock?.('landscape').catch(() => {})
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
        setNativePlayerLandscape(false)
        if (typeof screen !== 'undefined' && screen.orientation) {
          if ('unlock' in screen.orientation) {
            screen.orientation.unlock()
          }
          if ('lock' in screen.orientation) {
            await (screen.orientation as unknown as ScreenOrientationWithLock).lock?.('portrait').catch(() => {})
          }
        }
        showFeedback('Retrato 📱')
      } else {
        setNativePlayerLandscape(true)
        if (containerRef.current && !document.fullscreenElement) {
          await containerRef.current.requestFullscreen().catch(() => {})
        }
        if (typeof screen !== 'undefined' && screen.orientation && 'lock' in screen.orientation) {
          await (screen.orientation as unknown as ScreenOrientationWithLock).lock?.('landscape').catch(() => {})
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
    setCurrentTime(val)
  }

  const handleScrubberStart = () => {
    isScrubbingRef.current = true
    setIsScrubbing(true)
  }

  const handleScrubberCommit = (val: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = val
      setCurrentTime(val)
    }
    isScrubbingRef.current = false
    setIsScrubbing(false)
    resetHudTimer()
  }

  // ===== Auto-fallback state =====
  const fallbackSequence = useMemo(
    () => (activeAudio === 'dub' ? ['megaembed', 'superflix', 'vidlink'] : ['vidlink', 'superflix', 'megaembed']),
    [activeAudio]
  )

  const embedUrl =
    type === 'movie'
      ? buildMovieUrl(tmdbId, activeAudio, activeMirror)
      : buildShowUrl(tmdbId, season, episode, activeAudio, activeMirror)

  const showFeedback = useCallback((text: string) => {
    setFeedback(text)
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current)
    feedbackTimerRef.current = setTimeout(() => setFeedback(null), 700)
  }, [])

  // Alternância de áudio inteligente sem anúncios com suporte transparente a HLS multi-áudio
  const switchAudio = useCallback((opt: AudioOption) => {
    userManualAudioRef.current = opt
    setActiveAudio(opt === 'orig' ? 'orig' : 'dub')

    // 1. Se estiver rodando HLS nativo com múltiplas faixas de áudio no mesmo stream:
    const hls = hlsRef.current
    if (hls && hls.audioTracks && hls.audioTracks.length > 1) {
      if (opt === 'dub') {
        const ptIdx = hls.audioTracks.findIndex((t) => {
          const l = (t.lang || '').toLowerCase()
          const n = (t.name || '').toLowerCase()
          return l.startsWith('por') || l.startsWith('pt') || n.includes('por') || n.includes('dub') || n.includes('bra')
        })
        if (ptIdx !== -1) {
          hls.audioTrack = ptIdx
          setSubLang('off')
          setSubtitleOption('off')
          showFeedback('Áudio: Português 🇧🇷')
          return
        }
      } else {
        const origIdx = hls.audioTracks.findIndex((t) => {
          const l = (t.lang || '').toLowerCase()
          const n = (t.name || '').toLowerCase()
          return !l.startsWith('por') && !l.startsWith('pt') && !n.includes('por') && !n.includes('dub')
        })
        if (origIdx !== -1) {
          hls.audioTrack = origIdx
          setSubLang('pt')
          setSubtitleOption('pt')
          showFeedback('Áudio: Original (Legendado) 🇺🇸')
          return
        }
      }
    }

    // 2. Se for seleção entre candidatos de mídia direta (MP4/HLS):
    const list = candidatesRef.current
    if (opt === 'orig') {
      setSubLang('pt')
      setSubtitleOption('pt')
      // Prioridade máxima: verifica se há candidato direto nativo com áudio original/multi e legenda PT-BR
      const origIdx = list.findIndex((c) => !c.isDubbedHint)
      if (origIdx !== -1) {
        const directOrig = list[origIdx]
        console.info('[StreamPlayer] Reproduzindo fonte original direta nativa (sem anúncios):', directOrig.label)
        nativeActiveRef.current = true
        candidateIndexRef.current = origIdx
        setCandidateIndex(origIdx)
        setDirectSrc(directOrig.url)
        setDirectKind(directOrig.kind)
        setAllowIframe(false)
        setLoaded(false)
        setError(false)
        showFeedback(`Conectando: ${directOrig.label} (Legendado)`)
        return
      }
      setActiveMirror('vidlink')
      setAllowIframe(true)
      setDirectSrc(null)
      setDirectKind(null)
    } else {
      setSubLang('off')
      setSubtitleOption('off')
      setActiveMirror('megaembed')
      setAllowIframe(false)
      const dubIdx = list.findIndex((c) => c.isDubbedHint)
      const targetIdx = dubIdx !== -1 ? dubIdx : 0
      const directDub = list[targetIdx]
      if (directDub) {
        nativeActiveRef.current = true
        candidateIndexRef.current = targetIdx
        setCandidateIndex(targetIdx)
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
  }, [setSubtitleOption, showFeedback])

  // Falha na reprodução direta da fonte atual: testa a próxima opção limpa da lista sem closure obsoleta
  const handleDirectMediaError = useCallback(() => {
    const list = candidatesRef.current
    const nextIndex = candidateIndexRef.current + 1
    console.warn(`[StreamPlayer] Falha na opção atual (${candidateIndexRef.current + 1}/${list.length}). Buscando próxima opção limpa...`)
    if (nextIndex < list.length) {
      const next = list[nextIndex]
      console.info(`[StreamPlayer] Testando candidato alternativo: ${next.label} (${nextIndex + 1}/${list.length})`)
      candidateIndexRef.current = nextIndex
      setCandidateIndex(nextIndex)
      nativeActiveRef.current = true
      setAllowIframe(false)
      setDirectSrc(next.url)
      setDirectKind(next.kind)
      setLoaded(false)
      setError(false)
      return
    }
    // Se todos os candidatos diretos falharem, alternamos automaticamente para o espelho alternativo
    console.info('[StreamPlayer] Fontes diretas esgotadas. Alternando para espelho alternativo...')
    nativeActiveRef.current = false
    setDirectSrc(null)
    setDirectKind(null)
    setActiveMirror(activeAudio === 'dub' ? 'superflix' : 'vidlink')
    setAllowIframe(true)
    setLoaded(false)
    setError(false)
  }, [activeAudio])

  // Alternância manual cíclica pelo botão "Opção 1 / Servidor" no controle remoto
  const handleCycleServerOption = useCallback(() => {
    const list = candidatesRef.current
    if (list.length > 0 && !allowIframe) {
      const nextIndex = (candidateIndexRef.current + 1) % list.length
      const next = list[nextIndex]
      candidateIndexRef.current = nextIndex
      setCandidateIndex(nextIndex)
      nativeActiveRef.current = true
      setAllowIframe(false)
      setDirectSrc(next.url)
      setDirectKind(next.kind)
      setLoaded(false)
      setError(false)
      showFeedback(`Conectando: ${next.label}`)
      return
    }
    // Se estiver em modo espelho (iframe), cicla entre os espelhos disponíveis ou retorna para a Opção 1 direta
    if (list.length > 0 && allowIframe) {
      const first = list[0]
      candidateIndexRef.current = 0
      setCandidateIndex(0)
      nativeActiveRef.current = true
      setAllowIframe(false)
      setDirectSrc(first.url)
      setDirectKind(first.kind)
      setLoaded(false)
      setError(false)
      showFeedback(`Conectando: ${first.label}`)
      return
    }
    const nextAttempt = (fallbackAttempt + 1) % fallbackSequence.length
    const nextMirror = fallbackSequence[nextAttempt]
    setFallbackAttempt(nextAttempt)
    setActiveMirror(nextMirror)
    setAllowIframe(true)
    setLoaded(false)
    setError(false)
    setKey((k) => k + 1)
    showFeedback(`Servidor: ${nextAttempt + 1}/${fallbackSequence.length}`)
  }, [allowIframe, fallbackAttempt, fallbackSequence, showFeedback])

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
        // Todos os espelhos esgotados: mostra erro limpo sem botão de retry
        setError(true)
        return prev
      })
    }
  }

  const handleManualRefresh = () => {
    loadedRef.current = false
    trackStreamPlayback({
      action: 'stream_start',
      tmdbId,
      mediaType: type,
      sourceName: candidates[candidateIndex]?.label || `Mirror-${activeMirror}`,
      audioOption,
    })
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

  
  // Anti-freeze watchdog para TV / conexões oscilantes: recupera playback caso o buffer trave no mesmo segundo
  const lastPlaybackTimeRef = useRef(0)
  const freezeCountRef = useRef(0)
  useEffect(() => {
    const interval = setInterval(() => {
      const video = videoRef.current
      if (!video || video.paused || video.ended || !loadedRef.current) return

      if (Math.abs(video.currentTime - lastPlaybackTimeRef.current) < 0.05) {
        freezeCountRef.current++
        if (freezeCountRef.current >= 3) {
          // Travado por mais de 5s no mesmo frame
          freezeCountRef.current = 0
          try {
            if (video.buffered.length > 0) {
              const bufEnd = video.buffered.end(video.buffered.length - 1)
              if (video.currentTime < bufEnd - 0.5) {
                video.currentTime = Math.min(bufEnd - 0.5, video.currentTime + 0.3)
              }
            }
            video.play().catch(() => {})
          } catch {}
        }
      } else {
        lastPlaybackTimeRef.current = video.currentTime
        freezeCountRef.current = 0
      }
    }, 1800)

    return () => clearInterval(interval)
  }, [])

  const handleStall = () => {
    if (loadedRef.current) return
    if (stallTimerRef.current) clearTimeout(stallTimerRef.current)
    stallTimerRef.current = setTimeout(() => {
      if (!loadedRef.current) {
        console.warn('[StreamPlayer] Vídeo estagnado na rede (7s). Avançando para próxima opção...')
        handleDirectMediaError()
      }
    }, 5000)
  }

  useEffect(() => {
    // Se ainda está consultando a API para descobrir fontes diretas, aguarda resolução sem abortar
    if (resolvingDirect) return

    // Se não há fonte direta nem espelho ativo, não inicia contagem regressiva
    if (!directSrc && !allowIframe) return

    loadedRef.current = false
    trackStreamPlayback({
      action: 'stream_start',
      tmdbId,
      mediaType: type,
      sourceName: candidates[candidateIndex]?.label || `Mirror-${activeMirror}`,
      audioOption: activeAudio,
    })
    setLoaded(false)
    setError(false)

    if (autoFallbackTimerRef.current) clearTimeout(autoFallbackTimerRef.current)

    // Timeout ágil para conexões residenciais e TV Boxes: 5s para buffer inicial antes de pular para a próxima opção
    autoFallbackTimerRef.current = setTimeout(() => {
      if (loadedRef.current) return
      console.warn(`[StreamPlayer] Timeout de carregamento (5s) na opção ${candidateIndex + 1}. Tentando próxima opção...`)
      handleDirectMediaError()
    }, 5000)

    return () => {
      if (autoFallbackTimerRef.current) clearTimeout(autoFallbackTimerRef.current)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, tmdbId, season, episode, activeAudio, activeMirror, candidateIndex, directSrc, resolvingDirect, allowIframe])

  // Verificação e resolução inteligente de áudio:
  // Ao entrar em um filme ou episódio, verifica se tem áudio em português (dublado ou nacional).
  // Quando houver áudio em português disponível, ele é selecionado automaticamente como idioma principal.
  // Se não houver versão em português disponível, inicia em idioma original com legendas em português.
  useEffect(() => {
    const isNewMedia = lastCheckedMediaRef.current !== mediaKey
    if (isNewMedia) {
      lastCheckedMediaRef.current = mediaKey
      // Respeita se o usuário escolheu explicitamente na tela anterior (Watch query / initialAudio)
      userManualAudioRef.current = initialAudio === 'orig' ? 'orig' : initialAudio === 'dub' ? 'dub' : null
    }

    let cancelled = false
    const mediaType: 'movie' | 'tv' = type === 'movie' ? 'movie' : 'tv'
    const cachedNow = getCachedMegaEmbed(tmdbId, mediaType, season, episode, originalLanguage)
    if (!cachedNow) {
      nativeActiveRef.current = false
      setDirectSrc(null)
      setDirectKind(null)
      setCandidates([])
      candidatesRef.current = []
      setCandidateIndex(0)
      candidateIndexRef.current = 0
      setResolvingDirect(true)
    }

    resolveMegaEmbed(tmdbId, mediaType, season, episode, originalLanguage)
      .then((resolved) => {
        if (cancelled) return
        const list = resolved.candidates || []
        candidatesRef.current = list
        setCandidates(list)

        const isPtOriginal = (originalLanguage || '').toLowerCase() === 'pt'
        const hasDubbedSource = isPtOriginal || list.some((c) => c.isDubbedHint)

        // Se o usuário solicitou explicitamente áudio original (e não é produção original nacional em PT)
        const wantsOriginal = userManualAudioRef.current === 'orig' && !isPtOriginal
        if (wantsOriginal) {
          setActiveAudio('orig')
          setSubLang('pt')
          setSubtitleOption('pt')
          const origIdx = list.findIndex((c) => !c.isDubbedHint)
          if (origIdx !== -1) {
            const origCandidate = list[origIdx]
            candidateIndexRef.current = origIdx
            setCandidateIndex(origIdx)
            nativeActiveRef.current = true
            setAllowIframe(false)
            setDirectSrc(origCandidate.url)
            setDirectKind(origCandidate.kind)
            return
          }
          nativeActiveRef.current = false
          setDirectSrc(null)
          setDirectKind(null)
          setActiveMirror('vidlink')
          setAllowIframe(true)
          return
        }

        // SE HOUVER ÁUDIO EM PORTUGUÊS DISPONÍVEL, SELECIONA AUTOMATICAMENTE
        if (hasDubbedSource) {
          setActiveAudio('dub')
          if (!userManualAudioRef.current) {
            setSubLang('off')
            setSubtitleOption('off')
          }
          const firstIdx = list.findIndex((c) => c.isDubbedHint)
          const targetIdx = firstIdx !== -1 ? firstIdx : 0
          const firstCandidate = list[targetIdx] || list[0]
          if (firstCandidate) {
            candidateIndexRef.current = targetIdx
            setCandidateIndex(targetIdx)
            nativeActiveRef.current = true
            setAllowIframe(false)
            setDirectSrc(firstCandidate.url)
            setDirectKind(firstCandidate.kind)
          }
        } else if (list.length > 0) {
          // Sem dublagem em PT: inicia em áudio original com legenda PT-BR (sem poluir o perfil global)
          console.info('[StreamPlayer] Título sem dublagem PT disponível. Iniciando com áudio original e legenda PT-BR...')
          setActiveAudio('orig')
          setSubLang('pt')
          setSubtitleOption('pt')
          const firstCandidate = list[0]
          candidateIndexRef.current = 0
          setCandidateIndex(0)
          nativeActiveRef.current = true
          setAllowIframe(false)
          setDirectSrc(firstCandidate.url)
          setDirectKind(firstCandidate.kind)
        } else {
          // Nenhuma fonte direta disponível no MegaEmbed. Vai para espelho legendado PT-BR.
          console.info('[StreamPlayer] Nenhuma fonte direta disponível no MegaEmbed. Usando espelho legendado PT-BR...')
          setActiveAudio('orig')
          setSubLang('pt')
          setSubtitleOption('pt')
          setCandidateIndex(0)
          candidateIndexRef.current = 0
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
        console.warn('[StreamPlayer] Erro ao carregar fontes diretas:', err)
        setActiveAudio('orig')
        setCandidates([])
        candidatesRef.current = []
        setCandidateIndex(0)
        candidateIndexRef.current = 0
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, mediaKey, tmdbId, season, episode, type, originalLanguage, initialAudio])

  const handleIframeLoad = () => {
    loadedRef.current = true
    setLoaded(true)
    setError(false)
    if (autoFallbackTimerRef.current) clearTimeout(autoFallbackTimerRef.current)
  }

  const attemptPlay = useCallback(() => {
    const video = videoRef.current
    if (video) {
      if (video.paused) {
        const p = video.play()
        if (p !== undefined) {
          p.then(() => {
            loadedRef.current = true
            setLoaded(true)
            setIsPlaying(true)
            setError(false)
          }).catch(() => {
            // Fallback imediato de autoplay para WebViews que exigem início mudo antes de liberar áudio
            try {
              video.muted = true
              video
                .play()
                .then(() => {
                  video.muted = false
                  loadedRef.current = true
                  setLoaded(true)
                  setIsPlaying(true)
                  setError(false)
                })
                .catch(() => {})
            } catch {}
          })
        }
      } else {
        loadedRef.current = true
        setLoaded(true)
        setIsPlaying(true)
        setError(false)
      }
    }
  }, [])

  const handleDirectMediaReady = () => {
    loadedRef.current = true
    setLoaded(true)
    setError(false)
    if (autoFallbackTimerRef.current) clearTimeout(autoFallbackTimerRef.current)
    attemptPlay()
  }

  // Anexa o HLS (m3u8) ao <video> via hls.js priorizando Hls.isSupported() (no Android TV WebView, canPlayType retorna 'maybe' mas o player nativo falha em URLs .php/redirects).
  useEffect(() => {
    const video = videoRef.current
    if (!video || !directSrc || directKind !== 'hls') return

    let cancelled = false
    let hlsInstance: Hls | null = null

    if (Hls.isSupported()) {
      let networkRetries = 0
      let mediaRetries = 0
      const hls = new Hls({
        enableWorker: false, // Evita travamento de Web Worker com Blob em Android TV / TV Box
        maxBufferLength: 25,
        maxMaxBufferLength: 50,
        maxBufferSize: 35 * 1000 * 1000,
        lowLatencyMode: false,
        manifestLoadingTimeOut: 10000,
        manifestLoadingMaxRetry: 2,
        levelLoadingTimeOut: 10000,
        levelLoadingMaxRetry: 2,
        fragLoadingTimeOut: 15000,
        fragLoadingMaxRetry: 2,
      })
      hlsInstance = hls
      hlsRef.current = hls
      hls.subtitleDisplay = true
      hls.loadSource(directSrc)
      hls.attachMedia(video)

      const selectPreferredAudioTrack = () => {
        if (!hls.audioTracks || hls.audioTracks.length <= 1) return
        const isPtOriginal = (originalLanguage || '').toLowerCase() === 'pt'
        const wantsPortuguese = activeAudio === 'dub' || isPtOriginal
        if (wantsPortuguese) {
          const ptIdx = hls.audioTracks.findIndex((t) => {
            const l = (t.lang || '').toLowerCase()
            const n = (t.name || '').toLowerCase()
            return l.startsWith('por') || l.startsWith('pt') || n.includes('por') || n.includes('dub') || n.includes('bra')
          })
          if (ptIdx !== -1 && hls.audioTrack !== ptIdx) {
            hls.audioTrack = ptIdx
          }
        } else {
          const origIdx = hls.audioTracks.findIndex((t) => {
            const l = (t.lang || '').toLowerCase()
            const n = (t.name || '').toLowerCase()
            return !l.startsWith('por') && !l.startsWith('pt') && !n.includes('por') && !n.includes('dub')
          })
          if (origIdx !== -1 && hls.audioTrack !== origIdx) {
            hls.audioTrack = origIdx
          }
        }
      }

      const syncHlsSubtitles = () => {
        if (!hls.subtitleTracks || hls.subtitleTracks.length === 0) return
        if (subLang === 'off') {
          hls.subtitleTrack = -1
        } else {
          const targetIdx = hls.subtitleTracks.findIndex((t) => {
            const l = (t.lang || '').toLowerCase()
            const n = (t.name || '').toLowerCase()
            return subLang === 'pt'
              ? l.startsWith('por') || l.startsWith('pt') || n.includes('por') || n.includes('pob') || n.includes('bra')
              : l.startsWith('eng') || l.startsWith('en') || n.includes('eng')
          })
          hls.subtitleTrack = targetIdx !== -1 ? targetIdx : 0
        }
      }

      hls.on(Hls.Events.AUDIO_TRACKS_UPDATED, selectPreferredAudioTrack)
      hls.on(Hls.Events.SUBTITLE_TRACKS_UPDATED, () => {
        syncHlsSubtitles()
        refreshTextTracksRef.current?.()
      })
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        selectPreferredAudioTrack()
        syncHlsSubtitles()
        window.setTimeout(() => refreshTextTracksRef.current?.(), 300)
        attemptPlay()
      })
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (cancelled) return

        // Intercepta erros HTTP definitivos imediatamente para não prender o usuário em tela preta
        const httpStatus = (data as { response?: { code?: number } }).response?.code
        if (httpStatus && [401, 403, 404, 410, 500, 502, 503].includes(httpStatus)) {
          console.warn(`[StreamPlayer] Erro HTTP ${httpStatus} na fonte direta. Alternando imediatamente para próxima opção...`)
          try {
            hls.destroy()
          } catch {}
          handleDirectMediaError()
          return
        }

        if (data.fatal) {
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR && networkRetries < 1) {
            networkRetries += 1
            console.warn('[StreamPlayer] Fatal network error, tentando 1 recuperação automática...', data)
            hls.startLoad()
            return
          }
          if (data.type === Hls.ErrorTypes.MEDIA_ERROR && mediaRetries < 1) {
            mediaRetries += 1
            console.warn('[StreamPlayer] Fatal media error, tentando 1 recuperação automática...', data)
            hls.recoverMediaError()
            return
          }
          hls.destroy()
          handleDirectMediaError()
        }
      })
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Fallback para Safari/iOS sem suporte a MSE
      video.src = directSrc
    } else {
      handleDirectMediaError()
    }

    return () => {
      cancelled = true
      if (hlsInstance) {
        try {
          hlsInstance.destroy()
        } catch {}
        if (hlsRef.current === hlsInstance) {
          hlsRef.current = null
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [directSrc, directKind, handleDirectMediaError])

  // Autoplay ativo ao conectar directSrc
  useEffect(() => {
    if (!directSrc) return
    const video = videoRef.current
    if (!video) return
    try {
      if (directKind === 'mp4') {
        video.load()
      }
    } catch {}
    const timer = setTimeout(() => {
      attemptPlay()
    }, 150)
    return () => clearTimeout(timer)
  }, [directSrc, directKind, attemptPlay])

  // Aplica a velocidade escolhida (inclusive ao trocar de fonte).
  useEffect(() => {
    const video = videoRef.current
    if (video) video.playbackRate = speed
  }, [speed, directSrc])

  // Reseta o estado quando a fonte ou episódio muda.
  useEffect(() => {
    activeTrackRef.current = -1
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
        setTimeout(() => refreshTextTracksRef.current?.(), 400)
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

  const handleLockTap = useCallback(() => {
    if (!isLocked || isTv) return
    setShowLockPrompt(true)
    if (lockPromptTimerRef.current) clearTimeout(lockPromptTimerRef.current)
    lockPromptTimerRef.current = setTimeout(() => setShowLockPrompt(false), 2500)
  }, [isLocked, isTv])

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

  const seekBy = useCallback((delta: number, showDefaultFeedback = true) => {
    const video = videoRef.current
    if (!video) return
    resetHudTimer()
    const max = Number.isFinite(video.duration) ? video.duration : Infinity
    const target = Math.max(0, Math.min(max, video.currentTime + delta))
    video.currentTime = target
    setCurrentTime(target)
    if (showDefaultFeedback) {
      showFeedback(delta > 0 ? `+${delta}s ⏩` : `${delta}s ⏪`)
    }
  }, [resetHudTimer, showFeedback])

  const handleRewind10 = useCallback(() => {
    seekBy(-10)
  }, [seekBy])

  const handleForward10 = useCallback(() => {
    seekBy(10)
  }, [seekBy])

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
            await (screen.orientation as unknown as ScreenOrientationWithLock).lock?.('landscape').catch(() => {})
          } catch {}
        }
      }
    }
    // Ao alternar tela cheia, esconde os controles rapidamente após 800ms
    setTimeout(() => {
      setShowHud(false)
    }, 800)
  }

  const toggleFitMode = useCallback(() => {
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
  }, [showFeedback])

  const togglePlay = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    resetHudTimer()
    if (video.paused) {
      video.play().then(() => {
        setIsPlaying(true)
        showFeedback('▶ Reproduzindo')
      }).catch(() => {
        try {
          video.muted = true
          video.play().then(() => {
            video.muted = false
            setIsPlaying(true)
            showFeedback('▶ Reproduzindo')
          }).catch(() => {})
        } catch {}
      })
    } else {
      video.pause()
      setIsPlaying(false)
      showFeedback('⏸ Pausado')
    }
  }, [resetHudTimer, showFeedback])

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
    const hls = hlsRef.current

    // Sincroniza faixas de legendas internas em transmissões HLS
    if (hls && hls.subtitleTracks && hls.subtitleTracks.length > 0) {
      if (lang === 'off') {
        hls.subtitleTrack = -1
      } else {
        const targetHlsSub = hls.subtitleTracks.findIndex((t) => {
          const l = (t.lang || '').toLowerCase()
          const n = (t.name || '').toLowerCase()
          return lang === 'pt'
            ? l.startsWith('por') || l.startsWith('pt') || n.includes('por') || n.includes('pob') || n.includes('bra')
            : l.startsWith('eng') || l.startsWith('en') || n.includes('eng')
        })
        hls.subtitleTrack = targetHlsSub !== -1 ? targetHlsSub : 0
      }
    }

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
  }, [setSubtitleOption, showFeedback])

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
  refreshTextTracksRef.current = refreshTextTracks

  const _handlePip = async () => {
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

  // Ao carregar os metadados: lÃª legendas e retoma da posi§�o salva.
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
    attemptPlay()
  }

  // Salva a posição a cada ~5s de reprodução e gerencia o botão Pular Abertura.
  const handleTimeUpdate = () => {
    const video = videoRef.current
    if (!video) return
    const current = video.currentTime
    if (!isScrubbingRef.current) {
      setCurrentTime(current)
    }
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

  // Listener Global Unificado de Teclas do Controle Remoto (Android TV / TV Box / D-Pad)
  // Zero interferência de volume nas setas Cima/Baixo e zero avanço acidental ao navegar entre botões do HUD.
  useEffect(() => {
    const handleGlobalRemoteKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (target?.tagName === 'INPUT' && target.id !== 'hud-scrubber') return
      if (target?.tagName === 'TEXTAREA' || target?.isContentEditable) return

      const key = e.key
      const code = e.keyCode || e.which

      // Se estiver bloqueado no celular, qualquer tecla (exceto 'L') mostra aviso
      if (isLocked && key.toLowerCase() !== 'l') {
        handleLockTap()
        return
      }

      // Teclas especiais de Back no Android TV (keycode 4, Escape, GoBack)
      // Volta imediatamente para a tela de Sinopse/Detalhes sem disparo duplo e sem pular para a Tela Inicial
      if (
        key === 'Escape' ||
        key === 'GoBack' ||
        key === 'Backspace' ||
        code === 4 ||
        code === 10009 ||
        code === 461 ||
        code === 283
      ) {
        markBackHandled()
        e.preventDefault()
        e.stopPropagation()
        if (settingsModalOpen) {
          setSettingsModalOpen(false)
          setTimeout(() => {
            const btn = document.getElementById('hud-btn-settings')
            btn?.focus()
          }, 50)
          return
        }
        if (episodesDrawerOpen) {
          setEpisodesDrawerOpen(false)
          setTimeout(() => {
            const btn = document.getElementById('hud-btn-episodes')
            btn?.focus()
          }, 50)
          return
        }
        if (onBack) {
          onBack()
          return
        }
      }

      // Se um modal ou gaveta de episódios estiver aberto, permite navegação pelos botões do modal
      if (settingsModalOpen || episodesDrawerOpen) {
        return
      }

      // Qualquer tecla no controle remoto reativa e exibe o HUD
      resetHudTimer()

      // Lista de botões inferiores do HUD (exclui player controls e voltar)
      const getBottomHudButtons = (): HTMLElement[] => {
        if (!containerRef.current) return []
        return Array.from(
          containerRef.current.querySelectorAll<HTMLElement>(
            'button[data-hud-btn="true"]:not([disabled])'
          )
        ).filter(
          (btn) =>
            btn.id !== 'hud-btn-back' &&
            btn.id !== 'hud-btn-rewind' &&
            btn.id !== 'hud-btn-play' &&
            btn.id !== 'hud-btn-forward'
        )
      }

      const currentFocused = document.activeElement as HTMLElement | null
      const isFocusedOnBottomBtn =
        !!currentFocused &&
        currentFocused.matches('button[data-hud-btn="true"]') &&
        btnMatchesBottom(currentFocused)

      function btnMatchesBottom(el: HTMLElement): boolean {
        return (
          el.id !== 'hud-btn-back' &&
          el.id !== 'hud-btn-rewind' &&
          el.id !== 'hud-btn-play' &&
          el.id !== 'hud-btn-forward'
        )
      }

      const isFocusedOnPlayerRow =
        !!currentFocused &&
        (currentFocused.id === 'hud-btn-rewind' ||
          currentFocused.id === 'hud-btn-play' ||
          currentFocused.id === 'hud-btn-forward' ||
          currentFocused.id === 'hud-scrubber')

      // Tecla D-Pad Para Baixo (Navega verticalmente: Voltar -> Player Controls -> Botões de Ação)
      if (key === 'ArrowDown' || code === 40 || code === 20) {
        e.preventDefault()
        e.stopPropagation()
        const defaultBottomBtn =
          document.getElementById('hud-btn-audio') ||
          document.getElementById('hud-btn-subtitles') ||
          getBottomHudButtons()[0]

        if (!showHud) {
          setShowHud(true)
          setTimeout(() => {
            document.getElementById('hud-btn-play')?.focus()
          }, 40)
          return
        }

        if (currentFocused?.id === 'hud-btn-back') {
          const playOrBtn =
            document.getElementById('hud-btn-play') ||
            document.getElementById('hud-btn-rewind') ||
            defaultBottomBtn
          playOrBtn?.focus()
          return
        }

        if (isFocusedOnPlayerRow) {
          defaultBottomBtn?.focus()
          return
        }

        if (!isFocusedOnBottomBtn) {
          defaultBottomBtn?.focus()
        }
        return
      }

      // Tecla D-Pad Para Cima (Navega verticalmente: Botões de Ação -> Player Controls -> Voltar)
      if (key === 'ArrowUp' || code === 38 || code === 19) {
        e.preventDefault()
        e.stopPropagation()

        if (!showHud) {
          setShowHud(true)
          setTimeout(() => {
            document.getElementById('hud-btn-play')?.focus()
          }, 40)
          return
        }

        if (isFocusedOnBottomBtn) {
          const playOrBtn =
            document.getElementById('hud-btn-play') ||
            document.getElementById('hud-btn-rewind') ||
            document.getElementById('hud-scrubber') ||
            document.getElementById('hud-btn-back')
          playOrBtn?.focus()
          return
        }

        if (isFocusedOnPlayerRow) {
          document.getElementById('hud-btn-back')?.focus()
          return
        }

        document.getElementById('hud-btn-back')?.focus()
        return
      }

      // Tecla D-Pad Para a Esquerda (Navega horizontalmente no player: scrubber -> forward -> play -> rewind)
      if (key === 'ArrowLeft' || code === 37 || code === 21) {
        e.preventDefault()
        e.stopPropagation()

        // Se o HUD estiver fechado, volta -10s
        if (!showHud) {
          seekBy(-10)
          return
        }

        // Se o foco estiver na barra de tempo (#hud-scrubber), ajusta -10s
        if (currentFocused?.id === 'hud-scrubber') {
          seekBy(-10)
          return
        }

        if (currentFocused?.id === 'hud-btn-forward') {
          document.getElementById('hud-btn-play')?.focus()
          return
        }

        if (currentFocused?.id === 'hud-btn-play') {
          document.getElementById('hud-btn-rewind')?.focus()
          return
        }

        if (currentFocused?.id === 'hud-btn-rewind') {
          seekBy(-10)
          return
        }

        const bottomBtns = getBottomHudButtons()
        const activeIndex = bottomBtns.indexOf(currentFocused as HTMLElement)
        if (activeIndex > 0) {
          bottomBtns[activeIndex - 1].focus()
          return
        }
        if (activeIndex === 0) {
          bottomBtns[0].focus()
          return
        }
        if (bottomBtns.length > 0) {
          bottomBtns[0].focus()
        }
        return
      }

      // Tecla D-Pad Para a Direita (Navega horizontalmente no player: rewind -> play -> forward -> scrubber)
      if (key === 'ArrowRight' || code === 39 || code === 22) {
        e.preventDefault()
        e.stopPropagation()

        // Se o HUD estiver fechado, avança +10s
        if (!showHud) {
          seekBy(10)
          return
        }

        // Se o foco estiver na barra de tempo (#hud-scrubber), ajusta +10s
        if (currentFocused?.id === 'hud-scrubber') {
          seekBy(10)
          return
        }

        if (currentFocused?.id === 'hud-btn-rewind') {
          document.getElementById('hud-btn-play')?.focus()
          return
        }

        if (currentFocused?.id === 'hud-btn-play') {
          document.getElementById('hud-btn-forward')?.focus()
          return
        }

        if (currentFocused?.id === 'hud-btn-forward') {
          const scrubber = document.getElementById('hud-scrubber')
          if (scrubber) {
            scrubber.focus()
            return
          }
        }

        const bottomBtns = getBottomHudButtons()
        const activeIndex = bottomBtns.indexOf(currentFocused as HTMLElement)
        if (activeIndex >= 0 && activeIndex < bottomBtns.length - 1) {
          bottomBtns[activeIndex + 1].focus()
          return
        }
        if (activeIndex === bottomBtns.length - 1 && bottomBtns.length > 0) {
          bottomBtns[bottomBtns.length - 1].focus()
          return
        }
        if (bottomBtns.length > 0) {
          bottomBtns[0].focus()
        }
        return
      }

      // Tecla Enter / OK / D-Pad Center
      if (key === 'Enter' || code === 13 || code === 23 || code === 66) {
        if (currentFocused && currentFocused.tagName === 'BUTTON') {
          e.preventDefault()
          e.stopPropagation()
          currentFocused.click()
          return
        }

        if (currentFocused?.id === 'hud-scrubber') {
          e.preventDefault()
          e.stopPropagation()
          togglePlay()
          return
        }

        if (!showHud) {
          e.preventDefault()
          e.stopPropagation()
          setShowHud(true)
          setTimeout(() => {
            const defaultBtn =
              document.getElementById('hud-btn-play') ||
              document.getElementById('hud-btn-audio') ||
              document.getElementById('hud-btn-subtitles')
            defaultBtn?.focus()
          }, 40)
          return
        }

        e.preventDefault()
        e.stopPropagation()
        togglePlay()
        return
      }

      // Teclas de atalho dedicadas (Teclado & Controles Remotos de TV):
      if (
        key === ' ' ||
        key === 'k' ||
        key === 'K' ||
        key === 'MediaPlay' ||
        key === 'MediaPause' ||
        key === 'MediaPlayPause' ||
        code === 179
      ) {
        if (currentFocused?.tagName !== 'BUTTON') {
          e.preventDefault()
          togglePlay()
        }
      } else if (
        key === 'MediaRewind' ||
        code === 227 ||
        code === 89 ||
        key === 'j' ||
        key === 'J'
      ) {
        e.preventDefault()
        handleRewind10()
      } else if (
        key === 'MediaFastForward' ||
        code === 228 ||
        code === 90 ||
        key === 'l' ||
        key === 'L'
      ) {
        e.preventDefault()
        handleForward10()
      } else if (key === 'f' || key === 'F') {
        e.preventDefault()
        handleFullscreen()
      } else if (key === 'm' || key === 'M') {
        e.preventDefault()
        toggleMute()
      } else if (key === 'a' || key === 'A') {
        e.preventDefault()
        const nextOpt = activeAudio === 'dub' ? 'orig' : 'dub'
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
      } else if (key === 'z' || key === 'Z') {
        e.preventDefault()
        toggleFitMode()
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

    window.addEventListener('keydown', handleGlobalRemoteKey, { capture: true })
    return () => {
      window.removeEventListener('keydown', handleGlobalRemoteKey, { capture: true })
    }
  }, [
    settingsModalOpen,
    episodesDrawerOpen,
    onBack,
    audioOption,
    type,
    onNextEpisode,
    cycleSubtitles,
    showHud,
    isLocked,
    handleLockTap,
    resetHudTimer,
    seekBy,
    switchAudio,
    toggleFitMode,
    showFeedback,
    togglePlay,
    handleRewind10,
    handleForward10,
  ])

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
            {activeAudio === 'dub' ? '🇧🇷 Dublado' : '🇺🇸 Legendado'}
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
        {!isTv && isMobileDevice() && isPortrait && (
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
        {directSrc && !isTv && isMobileDevice() && (
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
        {isLocked && !isTv && isMobileDevice() && (
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
        {/* Loading Overlay YouCine: Minimalista, Silencioso, Foco no Conteúdo */}
        {!loaded && !error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/95 z-20 gap-4 p-4 select-none">
            <div className="w-12 h-12 border-3 border-white/10 border-t-accent-red rounded-full animate-spin" />
            {title && (
              <p className="text-white/80 font-medium text-sm tracking-wide line-clamp-1 max-w-md text-center">
                {title}
              </p>
            )}
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
            poster="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
            {...(directKind === 'mp4' ? { src: directSrc } : {})}
            title={title}
            autoPlay
            playsInline
            preload="auto"
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
            onPlaying={() => {
              loadedRef.current = true
              setLoaded(true)
              setIsPlaying(true)
              setError(false)
            }}
            onTimeUpdate={() => {
              const v = videoRef.current
              if (v && v.currentTime > 0 && !loadedRef.current) {
                loadedRef.current = true
                setLoaded(true)
              }
              handleTimeUpdate()
            }}
            onWaiting={handleStall}
            onStalled={handleStall}
            onError={handleDirectMediaError}
            onEnded={handleEnded}
            onPlay={() => {
              loadedRef.current = true
              setLoaded(true)
              setIsPlaying(true)
              setError(false)
              if (isMobileDevice() && typeof screen !== 'undefined' && screen.orientation && 'lock' in screen.orientation) {
                try {
                  (screen.orientation as unknown as ScreenOrientationWithLock).lock?.('landscape').catch(() => {})
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

        {/* Card YouCine de Continuidade Automática entre Episódios */}
        {autoNextCountdown !== null && autoNextCountdown > 0 && (
          <div className="absolute bottom-20 right-8 z-40 bg-black/90 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-2xl flex flex-col gap-2 min-w-[260px] animate-in fade-in slide-in-from-bottom-4 duration-300">
            <span className="text-white/60 text-xs font-medium">Próximo episódio</span>
            <p className="text-white font-bold text-sm">
              Iniciando em {autoNextCountdown}s...
            </p>
            <div className="flex items-center gap-2 mt-1">
              <button
                type="button"
                onClick={() => {
                  cancelAutoNext()
                  onNextEpisode?.()
                }}
                className="flex-1 py-2 px-3 bg-accent-red hover:bg-red-600 text-white text-xs font-bold rounded-xl transition-colors shadow-lg shadow-red-900/40"
              >
                Assistir Agora
              </button>
              <button
                type="button"
                onClick={cancelAutoNext}
                className="py-2 px-3 bg-white/10 hover:bg-white/20 text-white/80 text-xs font-medium rounded-xl transition-colors"
              >
                Cancelar
              </button>
            </div>
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
          {/* Linha do Tempo / Scrubber & Controles Principais */}
          {directSrc && (
            <div className="flex items-center gap-2 sm:gap-4 mb-4">
              {/* Botão Retroceder 10s */}
              <button
                type="button"
                id="hud-btn-rewind"
                data-hud-btn="true"
                onClick={handleRewind10}
                className="p-2 sm:p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-full font-bold transition-all hover:scale-105 active:scale-95 focus:outline-none focus:ring-4 focus:ring-yellow-400 focus:bg-yellow-400 focus:text-black flex items-center justify-center"
                title="Voltar 10 segundos (-10s)"
                aria-label="Voltar 10 segundos"
              >
                <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

              {/* Botão Reproduzir / Pausar */}
              <button
                type="button"
                id="hud-btn-play"
                data-hud-btn="true"
                onClick={togglePlay}
                className="p-2 sm:p-2.5 bg-yellow-400 hover:bg-yellow-300 text-black rounded-full font-bold transition-all hover:scale-105 active:scale-95 focus:outline-none focus:ring-4 focus:ring-yellow-400 flex items-center justify-center shadow-lg shadow-yellow-500/30"
                title={isPlaying ? 'Pausar' : 'Reproduzir'}
                aria-label={isPlaying ? 'Pausar' : 'Reproduzir'}
              >
                {isPlaying ? <Pause className="w-5 h-5 fill-black" /> : <Play className="w-5 h-5 fill-black ml-0.5" />}
              </button>

              {/* Botão Avançar 10s */}
              <button
                type="button"
                id="hud-btn-forward"
                data-hud-btn="true"
                onClick={handleForward10}
                className="p-2 sm:p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-full font-bold transition-all hover:scale-105 active:scale-95 focus:outline-none focus:ring-4 focus:ring-yellow-400 focus:bg-yellow-400 focus:text-black flex items-center justify-center"
                title="Avançar 10 segundos (+10s)"
                aria-label="Avançar 10 segundos"
              >
                <FastForward className="w-4 h-4 sm:w-5 sm:h-5" />
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
                  onPointerDown={handleScrubberStart}
                  onTouchStart={handleScrubberStart}
                  onMouseDown={handleScrubberStart}
                  onPointerUp={(e) => handleScrubberCommit(Number(e.currentTarget.value))}
                  onTouchEnd={(e) => handleScrubberCommit(Number(e.currentTarget.value))}
                  onMouseUp={(e) => handleScrubberCommit(Number(e.currentTarget.value))}
                  onChange={handleSeekChange}
                  className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-yellow-400 focus:outline-none focus:ring-4 focus:ring-yellow-400"
                  aria-label="Barra de progresso do vídeo"
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
              {/* 1. Tela cheia (Apenas para celular/tablet; Oculto em Smart TV que já opera em tela cheia) */}
              {!isTv && isMobileDevice() && (
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
              )}

              {/* Botão de Orientação / Girar Tela (exclusivo para celular) */}
              {!isTv && isMobileDevice() && (
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
                  const nextOpt = activeAudio === 'dub' ? 'orig' : 'dub'
                  switchAudio(nextOpt)
                  showFeedback(nextOpt === 'dub' ? 'Áudio: Dublado 🇧🇷' : 'Áudio: Legendado / Original 🇺🇸')
                }}
                className="flex items-center justify-center gap-1.5 bg-[#171824]/90 hover:bg-[#232538] text-white px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold border border-white/10 transition-all focus:outline-none focus:ring-4 focus:ring-yellow-400 focus:border-yellow-400 focus:bg-yellow-400 focus:text-black focus:scale-105 shadow-md"
                title="Clique ou pressione A no controle para alternar áudio"
              >
                <Volume2 className="w-4 h-4 text-yellow-400 group-focus:text-black" />
                <span>{activeAudio === 'dub' ? '🇧🇷 Dublado' : '🇺🇸 Legendado'}</span>
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
                onClick={handleCycleServerOption}
                className="flex items-center justify-center gap-2 bg-[#171824]/90 hover:bg-[#232538] text-white px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold border border-white/10 transition-all focus:outline-none focus:ring-4 focus:ring-yellow-400 focus:border-yellow-400 focus:bg-yellow-400 focus:text-black focus:scale-105 shadow-md"
                title="Alternar servidor ou resolução"
              >
                <Server className="w-4 h-4 text-yellow-400" />
                <span>{candidates.length > 0 && !allowIframe ? `Opção ${candidateIndex + 1}/${candidates.length}` : `Servidor ${fallbackAttempt + 1}`}</span>
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

              {/* 6. Baixar (Apenas para celular; Oculto em TV) */}
              {!isTv && isMobileDevice() && (
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
              )}
            </div>

            {/* Ações Secundárias (Ajuste de Tela, Recarregar, Próximo Ep) */}
            <div className="flex items-center gap-2">
              {/* Ajustar / Preencher tela (Apenas para celular; Oculto em TV) */}
              {directSrc && !isTv && isMobileDevice() && (
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

              {/* Recarregar Stream (Apenas para celular; Na TV é acessível pelo menu Ajustes) */}
              {!isTv && isMobileDevice() && (
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
              )}

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
        audioOption={activeAudio}
        onChangeAudio={(opt) => {
          switchAudio(opt)
        }}
        originalLanguage={originalLanguage}
        hasDubbedAvailable={isPtOriginal || candidates.some((c) => c.isDubbedHint)}
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



