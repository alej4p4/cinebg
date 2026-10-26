import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { Capacitor } from '@capacitor/core'
import StreamPlayer from '@/components/player/StreamPlayer'
import ProgressBar from '@/components/ui/ProgressBar'
import { getMovieDetails, getShowDetails, getCachedMediaDetails } from '@/services/tmdb'
import { resolveMegaEmbed } from '@/services/streams'
import { buildFileName, downloadVideo, downloadsSupported } from '@/services/downloads'
import { useAppStore } from '@/store/useAppStore'
import PremiumContentGate from '@/components/PremiumContentGate'
import { markBackHandled, setNativePlayerLandscape } from '@/utils/tv'
import type { DownloadItem, MediaType, TMDBMovieDetails, TMDBShowDetails } from '@/types'

const Watch = () => {
  const { type, id } = useParams<{ type: 'movie' | 'tv' | 'anime'; id: string }>()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { addToHistory, getLastWatched, updateHistoryProgress, addDownload } = useAppStore()

  const mediaId = Number(id)
  const isMovie = type === 'movie'
  const querySeason = Number(searchParams.get('season')) || null
  const queryEpisode = Number(searchParams.get('episode')) || null
  const queryAudio = (searchParams.get('audio') as 'dub' | 'orig' | null) || undefined

  // Hidratação instantânea via cache em 0ms (sem bloquear a abertura do vídeo)
  const cachedMovie = isMovie ? getCachedMediaDetails<TMDBMovieDetails>(mediaId, 'movie') : null
  const cachedShow = !isMovie ? getCachedMediaDetails<TMDBShowDetails>(mediaId, type || 'tv') : null
  const initialLastWatched = getLastWatched(mediaId)

  const initialSeason = !isMovie ? (querySeason || initialLastWatched?.season || 1) : 1
  const initialEpisode = !isMovie ? (queryEpisode || initialLastWatched?.episode || 1) : 1
  const initialSameEpisode =
    initialLastWatched?.season === initialSeason && initialLastWatched?.episode === initialEpisode

  const [movieData, setMovieData] = useState<TMDBMovieDetails | null>(cachedMovie)
  const [showData, setShowData] = useState<TMDBShowDetails | null>(cachedShow)
  const [loading, setLoading] = useState(!cachedMovie && !cachedShow)
  const [season, setSeason] = useState(initialSeason)
  const [episode, setEpisode] = useState(initialEpisode)
  const [resumeAt, setResumeAt] = useState<number | undefined>(
    isMovie ? initialLastWatched?.progress : initialSameEpisode ? initialLastWatched?.progress : undefined
  )
  const [downloading, setDownloading] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState(0)

  // Ao dar o Play e entrar na rota /watch, entra em tela cheia imediata e trava em paisagem (estilo YuCine)
  useEffect(() => {
    setNativePlayerLandscape(true)
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

    return () => {
      setNativePlayerLandscape(false)
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
  }, [])

  useEffect(() => {
    if (!id || !type) return
    let active = true

    const loadDetails = async () => {
      if (!cachedMovie && !cachedShow) {
        setLoading(true)
      }
      try {
        if (type === 'movie') {
          const data = await getMovieDetails(mediaId)
          if (!active) return
          setMovieData(data)
          const lastWatched = getLastWatched(data.id)
          setResumeAt(lastWatched?.progress)
          addToHistory({
            id: data.id,
            type: 'movie',
            title: data.title,
            posterPath: data.poster_path,
            watchedAt: Date.now(),
            progress: lastWatched?.progress,
            rating: data.vote_average,
          })
        } else {
          const data = await getShowDetails(mediaId)
          if (!active) return
          setShowData(data)

          // Prioriza o episódio vindo da URL (?season=&episode=), senão continua do histórico
          const lastWatched = getLastWatched(data.id)
          const targetSeason = querySeason || lastWatched?.season || 1
          const targetEpisode = queryEpisode || lastWatched?.episode || 1
          const sameEpisode =
            lastWatched?.season === targetSeason && lastWatched?.episode === targetEpisode

          setSeason(targetSeason)
          setEpisode(targetEpisode)
          setResumeAt(sameEpisode ? lastWatched?.progress : undefined)

          addToHistory({
            id: data.id,
            type,
            title: data.name,
            posterPath: data.poster_path,
            watchedAt: Date.now(),
            season: targetSeason,
            episode: targetEpisode,
            progress: sameEpisode ? lastWatched?.progress : undefined,
            rating: data.vote_average,
          })
        }
      } catch (err) {
        console.error('Failed to load media details:', err)
      } finally {
        if (active) setLoading(false)
      }
    }

    loadDetails()
    return () => {
      active = false
    }
  }, [id, type, mediaId, querySeason, queryEpisode, addToHistory, getLastWatched, cachedMovie, cachedShow])

  const handleEpisodeSelect = (s: number, e: number) => {
    setSeason(s)
    setEpisode(e)
    setResumeAt(undefined)
    if (showData) {
      addToHistory({
        id: showData.id,
        type: type as 'tv' | 'anime',
        title: showData.name,
        posterPath: showData.poster_path,
        watchedAt: Date.now(),
        season: s,
        episode: e,
        progress: 0,
        rating: showData.vote_average,
      })
    }
  }

  const title = isMovie ? movieData?.title : showData?.name
  const posterPath = isMovie ? movieData?.poster_path : showData?.poster_path
  const originalLanguage = isMovie ? movieData?.original_language : showData?.original_language

  // Pré-resolve o próximo episódio em background para troca instantânea em 0ms
  useEffect(() => {
    if (!isMovie && mediaId) {
      resolveMegaEmbed(mediaId, 'tv', season, episode + 1, originalLanguage).catch(() => {})
    }
  }, [isMovie, mediaId, season, episode, originalLanguage])

  const handleNextEpisode = () => {
    const realSeasons = showData?.seasons?.filter((s) => s.season_number > 0) || []
    const currentSeasonMeta = realSeasons.find((s) => s.season_number === season)
    if (
      currentSeasonMeta &&
      currentSeasonMeta.episode_count > 0 &&
      episode >= currentSeasonMeta.episode_count
    ) {
      const nextSeasonMeta = realSeasons.find(
        (s) => s.season_number === season + 1 && s.episode_count > 0
      )
      if (nextSeasonMeta) {
        handleEpisodeSelect(season + 1, 1)
        return
      }
    }
    handleEpisodeSelect(season, episode + 1)
  }

  const handleProgress = (seconds: number) => {
    updateHistoryProgress(mediaId, Math.floor(seconds))
  }

  const handleDownload = async () => {
    if (!downloadsSupported()) {
      alert('Downloads estão disponíveis apenas no aplicativo Android.')
      return
    }
    setDownloading(true)
    setDownloadProgress(0)
    try {
      const resolved = await resolveMegaEmbed(
        mediaId,
        type === 'movie' ? 'movie' : 'tv',
        season,
        episode,
        originalLanguage,
      )
      if (!resolved.dubbedMp4) {
        alert('Esta fonte não está disponível para download. Tente novamente mais tarde.')
        return
      }
      const base: DownloadItem = {
        id: mediaId,
        type: type as MediaType,
        title: title || '',
        posterPath: posterPath ?? null,
        season: type === 'movie' ? undefined : season,
        episode: type === 'movie' ? undefined : episode,
        url: resolved.dubbedMp4,
        path: '',
        createdAt: Date.now(),
      }
      const path = await downloadVideo(resolved.dubbedMp4, buildFileName(base), (r) =>
        setDownloadProgress(r),
      )
      addDownload({ ...base, path })
    } catch (err) {
      console.error('Download failed:', err)
      alert('Não foi possível baixar. Verifique sua conexão e tente novamente.')
    } finally {
      setDownloading(false)
      setDownloadProgress(0)
    }
  }

  if (!id || !type || Number.isNaN(mediaId)) {
    return (
      <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center text-white p-4">
        <h2 className="text-2xl font-bold mb-2">Mídia não encontrada</h2>
        <button onClick={() => navigate(-1)} className="text-accent-red hover:underline mt-4">
          Voltar
        </button>
      </div>
    )
  }

  // Renderiza o StreamPlayer imediatamente em 0ms ao clicar em Play (sem bloquear no fetch do TMDB)
  return (
    <PremiumContentGate contentType={type === 'tv' ? 'tv' : type === 'anime' ? 'anime' : 'movie'} variant="fullscreen">
      <div className="fixed inset-0 z-50 w-screen h-screen bg-black overflow-hidden select-none">
        <ProgressBar
          isLoading={loading || downloading}
          progress={downloading ? downloadProgress * 100 : undefined}
        />
        <StreamPlayer
          tmdbId={mediaId}
          type={type as 'movie' | 'tv' | 'anime'}
          season={season}
          episode={episode}
          title={title || initialLastWatched?.title || 'Carregando...'}
          originalLanguage={originalLanguage}
          initialAudio={queryAudio}
          onNextEpisode={type !== 'movie' ? handleNextEpisode : undefined}
          startAt={resumeAt}
          onProgress={handleProgress}
          seasons={showData?.seasons}
          onSelectEpisode={handleEpisodeSelect}
          onBack={() => {
            markBackHandled()
            const historyIdx = window.history.state?.idx ?? 0
            if (historyIdx > 0) {
              navigate(-1)
            } else {
              navigate(`/details/${type}/${mediaId}`, { replace: true })
            }
          }}
          onDownload={handleDownload}
        />
      </div>
    </PremiumContentGate>
  )
}

export default Watch
