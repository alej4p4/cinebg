import { useState, useRef, useEffect } from 'react'
import { Maximize2, RefreshCw, AlertCircle, Volume2, SkipForward } from 'lucide-react'
import {
  buildMovieUrl,
  buildShowUrl,
  getNextSilentMirrorId,
  getInitialMirrorForAudio,
} from '@/services/streams'
import { useAppStore } from '@/store/useAppStore'
import type { AudioOption } from '@/store/useAppStore'
import { initAntiRedirectShield } from '@/utils/antiRedirect'

interface StreamPlayerProps {
  tmdbId: number
  type: 'movie' | 'tv' | 'anime'
  season?: number
  episode?: number
  title: string
  onNextEpisode?: () => void
}

const StreamPlayer = ({
  tmdbId,
  type,
  season = 1,
  episode = 1,
  title,
  onNextEpisode,
}: StreamPlayerProps) => {
  const { audioOption, setAudioOption } = useAppStore()
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)

  // O espelho inicial se ajusta automaticamente ao áudio preferido
  const [activeMirror, setActiveMirror] = useState(() => getInitialMirrorForAudio(audioOption))
  const [key, setKey] = useState(0)
  const [retryCount, setRetryCount] = useState(0)

  const loadedRef = useRef(false)
  const autoFallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const embedUrl =
    type === 'movie'
      ? buildMovieUrl(tmdbId, audioOption, activeMirror)
      : buildShowUrl(tmdbId, season, episode, audioOption, activeMirror)

  const switchAudio = (opt: AudioOption) => {
    setAudioOption(opt)
    setActiveMirror(getInitialMirrorForAudio(opt))
    setRetryCount(0)
    setLoaded(false)
    setError(false)
    setKey((k) => k + 1)
  }

  // Cascata Silenciosa de Servidores (Estilo YuCine - Zero Interrupção do Usuário)
  const handleAutoSilentFallback = () => {
    if (retryCount >= 4) {
      setError(true)
      return
    }
    const nextMirror = getNextSilentMirrorId(activeMirror, audioOption)
    console.log(`[CineBG Engine] Fallback silencioso: ${activeMirror} -> ${nextMirror}`)
    setActiveMirror(nextMirror)
    setRetryCount((r) => r + 1)
    setLoaded(false)
    setError(false)
    setKey((k) => k + 1)
  }

  const handleManualRefresh = () => {
    loadedRef.current = false
    setLoaded(false)
    setError(false)
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

    // Se o espelho atual demorar mais que 7 segundos sem responder, ativa fallback silencioso
    autoFallbackTimerRef.current = setTimeout(() => {
      if (!loadedRef.current) {
        handleAutoSilentFallback()
      }
    }, 7000)

    return () => {
      if (autoFallbackTimerRef.current) clearTimeout(autoFallbackTimerRef.current)
    }
  }, [key, tmdbId, season, episode, audioOption, activeMirror])

  const handleIframeLoad = () => {
    loadedRef.current = true
    setLoaded(true)
    setError(false)
    if (autoFallbackTimerRef.current) clearTimeout(autoFallbackTimerRef.current)
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

  const audioLabels = {
    dub: '🇧🇷 Áudio Dublado (PT-BR)',
    sub: '📝 Legendado (PT-BR)',
    orig: '🇺🇸 Áudio Original',
  }

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
        className="relative bg-black overflow-hidden rounded-b-xl aspect-video"
      >
        {/* Loading Overlay */}
        {!loaded && !error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0a0a10] z-10 gap-3">
            <div className="w-12 h-12 border-2 border-white/5 border-t-accent-red rounded-full animate-spin" />
            <div className="text-center">
              <p className="text-white/80 text-sm font-semibold">Carregando transmissão...</p>
              <p className="text-white/40 text-xs mt-0.5">{audioLabels[audioOption]}</p>
            </div>
          </div>
        )}

        {/* Error Overlay */}
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0a0a10] z-10 gap-4 p-6">
            <AlertCircle className="h-12 w-12 text-red-400" />
            <div className="text-center">
              <p className="text-white font-bold text-lg">Transmissão indisponível</p>
              <p className="text-white/40 text-sm mt-1">
                Não foi possível conectar a esta fonte no momento. Tente recarregar.
              </p>
            </div>
            <button
              onClick={() => {
                setRetryCount(0)
                handleManualRefresh()
              }}
              className="flex items-center gap-2 bg-accent-red text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-red-600 transition-colors shadow-lg shadow-red-900/40"
            >
              <RefreshCw className="h-4 w-4" />
              Tentar Novamente
            </button>
          </div>
        )}

        {/* 
          ESCUDO DE SANDBOX BLINDADO:
          allow-scripts, allow-same-origin, allow-forms, allow-presentation, allow-encrypted-media
          SEM allow-top-navigation e SEM allow-popups:
          Impede fisicamente qualquer redirecionamento da janela principal e bloqueia novas abas de anúncios/ParkLogic!
        */}
        <iframe
          key={`stream-${key}-${tmdbId}-${season}-${episode}-${audioOption}-${activeMirror}`}
          ref={iframeRef}
          src={embedUrl}
          title={title}
          allowFullScreen
          allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
          className="w-full h-full border-0"
          sandbox="allow-scripts allow-same-origin allow-forms allow-presentation allow-encrypted-media"
          onLoad={handleIframeLoad}
          onError={handleAutoSilentFallback}
        />

        {/* Controles Flutuantes Nativos CineBG */}
        <div className="absolute bottom-3 right-3 flex gap-2 z-20">
          {onNextEpisode && type !== 'movie' && (
            <button
              onClick={onNextEpisode}
              className="flex items-center gap-1.5 px-3 py-2 bg-accent-red hover:bg-red-600 rounded-lg text-white font-bold text-xs transition-colors backdrop-blur-sm shadow-lg shadow-red-900/40"
              title="Próximo Episódio"
            >
              <SkipForward className="h-3.5 w-3.5" />
              <span>Próximo Ep</span>
            </button>
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
