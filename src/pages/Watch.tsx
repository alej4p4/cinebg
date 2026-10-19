import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { Capacitor } from '@capacitor/core'
import StreamPlayer from '@/components/player/StreamPlayer'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { getMovieDetails, getShowDetails } from '@/services/tmdb'
import { resolveMegaEmbed } from '@/services/streams'
import { buildFileName, downloadVideo, downloadsSupported } from '@/services/downloads'
import { useAppStore } from '@/store/useAppStore'
import type { DownloadItem, MediaType, TMDBMovieDetails, TMDBShowDetails } from '@/types'

const Watch = () => {
  const { type, id } = useParams<{ type: 'movie' | 'tv' | 'anime'; id: string }>()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { addToHistory, getLastWatched, updateHistoryProgress, addDownload, isDownloaded } = useAppStore()

  const querySeason = Number(searchParams.get('season')) || null
  const queryEpisode = Number(searchParams.get('episode')) || null
  
  const [movieData, setMovieData] = useState<TMDBMovieDetails | null>(null)
  const [showData, setShowData] = useState<TMDBShowDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [season, setSeason] = useState(1)
  const [episode, setEpisode] = useState(1)
  const [resumeAt, setResumeAt] = useState<number | undefined>(undefined)
  const [downloading, setDownloading] = useState(false)
  const [_downloadProgress, setDownloadProgress] = useState(0)

  // Ao dar o Play e entrar na rota /watch, entra em tela cheia imediata (estilo YuCine)
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

    return () => {
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
    
    const loadDetails = async () => {
      setLoading(true)
      try {
        if (type === 'movie') {
          const data = await getMovieDetails(Number(id))
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
          })
        } else {
          const data = await getShowDetails(Number(id))
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
          })
        }
      } catch (err) {
        console.error('Failed to load media details:', err)
      } finally {
        setLoading(false)
      }
    }
    
    loadDetails()
  }, [id, type, querySeason, queryEpisode, addToHistory, getLastWatched])

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
      })
    }
  }

  const handleNextEpisode = () => {
    const nextEp = episode + 1
    handleEpisodeSelect(season, nextEp)
  }

  const handleProgress = (seconds: number) => {
    updateHistoryProgress(Number(id), Math.floor(seconds))
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
        Number(id),
        type === 'movie' ? 'movie' : 'tv',
        season,
        episode,
      )
      if (!resolved.dubbedMp4) {
        alert('Esta fonte não está disponível para download. Tente novamente mais tarde.')
        return
      }
      const base: DownloadItem = {
        id: Number(id),
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

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!movieData && !showData) {
    return (
      <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center text-white p-4">
        <h2 className="text-2xl font-bold mb-2">Mídia não encontrada</h2>
        <button onClick={() => navigate(-1)} className="text-accent-red hover:underline mt-4">
          Voltar
        </button>
      </div>
    )
  }

  const isMovie = type === 'movie'
  const title = isMovie ? movieData?.title : showData?.name
  const overview = isMovie ? movieData?.overview : showData?.overview
  const rating = isMovie ? movieData?.vote_average : showData?.vote_average
  const releaseDate = isMovie ? movieData?.release_date : showData?.first_air_date
  const year = releaseDate ? new Date(releaseDate).getFullYear() : ''
  const genres = isMovie ? movieData?.genres : showData?.genres
  const runtime = isMovie ? movieData?.runtime : null
  const posterPath = isMovie ? movieData?.poster_path : showData?.poster_path
  const alreadyDownloaded = isDownloaded(
    Number(id),
    isMovie ? undefined : season,
    isMovie ? undefined : episode,
  )

  const currentSeasonEpisodeCount = Math.max(
    1,
    showData?.seasons?.find((s) => s.season_number === season)?.episode_count || 12
  )

  return (
    <div className="fixed inset-0 z-50 w-screen h-screen bg-black overflow-hidden select-none">
      <StreamPlayer
        tmdbId={Number(id)}
        type={type as 'movie' | 'tv' | 'anime'}
        season={season}
        episode={episode}
        title={title || ''}
        onNextEpisode={type !== 'movie' ? handleNextEpisode : undefined}
        startAt={resumeAt}
        onProgress={handleProgress}
        seasons={showData?.seasons}
        onSelectEpisode={handleEpisodeSelect}
        onBack={() => navigate(-1)}
        onDownload={handleDownload}
      />
    </div>
  )
}

export default Watch
