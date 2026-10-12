import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Star, Calendar, Clock, Film, Tv } from 'lucide-react'
import StreamPlayer from '@/components/player/StreamPlayer'
import EpisodeSelector from '@/components/player/EpisodeSelector'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import GenreBadge from '@/components/ui/GenreBadge'
import { getMovieDetails, getShowDetails, getPosterUrl } from '@/services/tmdb'
import { useAppStore } from '@/store/useAppStore'
import type { TMDBMovieDetails, TMDBShowDetails } from '@/types'

const Watch = () => {
  const { type, id } = useParams<{ type: 'movie' | 'tv' | 'anime'; id: string }>()
  const navigate = useNavigate()
  const { addToHistory, getLastWatched } = useAppStore()
  
  const [movieData, setMovieData] = useState<TMDBMovieDetails | null>(null)
  const [showData, setShowData] = useState<TMDBShowDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [season, setSeason] = useState(1)
  const [episode, setEpisode] = useState(1)

  useEffect(() => {
    if (!id || !type) return
    
    const loadDetails = async () => {
      setLoading(true)
      try {
        if (type === 'movie') {
          const data = await getMovieDetails(Number(id))
          setMovieData(data)
          addToHistory({
            id: data.id,
            type: 'movie',
            title: data.title,
            posterPath: data.poster_path,
            watchedAt: Date.now()
          })
        } else {
          const data = await getShowDetails(Number(id))
          setShowData(data)
          
          // Recupera histórico para continuar de onde parou
          const lastWatched = getLastWatched(data.id)
          const targetSeason = lastWatched?.season || 1
          const targetEpisode = lastWatched?.episode || 1

          setSeason(targetSeason)
          setEpisode(targetEpisode)

          addToHistory({
            id: data.id,
            type,
            title: data.name,
            posterPath: data.poster_path,
            watchedAt: Date.now(),
            season: targetSeason,
            episode: targetEpisode
          })
        }
      } catch (err) {
        console.error('Failed to load media details:', err)
      } finally {
        setLoading(false)
      }
    }
    
    loadDetails()
  }, [id, type])

  const handleEpisodeSelect = (s: number, e: number) => {
    setSeason(s)
    setEpisode(e)
    if (showData) {
      addToHistory({
        id: showData.id,
        type: type as 'tv' | 'anime',
        title: showData.name,
        posterPath: showData.poster_path,
        watchedAt: Date.now(),
        season: s,
        episode: e
      })
    }
  }

  const handleNextEpisode = () => {
    const nextEp = episode + 1
    handleEpisodeSelect(season, nextEp)
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

  return (
    <motion.div
      className="min-h-screen bg-bg-primary pt-20 pb-10 page-enter"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="max-w-screen-2xl mx-auto px-4 md:px-8">
        {/* Top Nav */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-white/70 hover:text-white mb-4 transition-colors w-fit"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </button>

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* Main Content (Player) */}
          <div className="flex-1 space-y-6">
            <StreamPlayer
              tmdbId={Number(id)}
              type={type as 'movie' | 'tv' | 'anime'}
              season={season}
              episode={episode}
              title={title || ''}
              onNextEpisode={type !== 'movie' ? handleNextEpisode : undefined}
            />

            {/* Details below player on mobile, hide on desktop if space is tight */}
            <div className="glass rounded-xl p-6">
              <h1 className="font-display font-black text-2xl md:text-3xl text-white mb-3">
                {title} {type !== 'movie' && <span className="text-accent-red text-xl ml-2">S{season}E{episode}</span>}
              </h1>
              
              <div className="flex flex-wrap items-center gap-4 text-sm text-white/70 mb-4">
                {rating && (
                  <span className="flex items-center gap-1 text-accent-gold font-bold">
                    <Star className="h-4 w-4 fill-current" />
                    {rating.toFixed(1)}
                  </span>
                )}
                {year && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {year}
                  </span>
                )}
                {runtime && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {runtime} min
                  </span>
                )}
                <span className="flex items-center gap-1 bg-white/10 px-2 py-0.5 rounded text-white">
                  <Film className="h-3 w-3" />
                  {type === 'movie' ? 'FILME' : type === 'anime' ? 'ANIME' : 'SÉRIE'}
                </span>
              </div>

              {genres && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {genres.map(g => (
                    <GenreBadge key={g.id} name={g.name} />
                  ))}
                </div>
              )}

              <p className="text-white/80 leading-relaxed text-sm md:text-base">
                {overview || 'Sem descrição disponível para este título.'}
              </p>
            </div>
          </div>

          {/* Sidebar */}
          <div className="w-full lg:w-80 xl:w-96 flex-shrink-0 space-y-6">
            {/* Poster (Desktop) */}
            <div className="hidden lg:block glass rounded-xl p-4">
              <img
                src={getPosterUrl(posterPath)}
                alt={title}
                className="w-full rounded-lg shadow-lg"
              />
            </div>

            {/* Episode Selector (TV/Anime) */}
            {!isMovie && showData && (
              <div className="glass rounded-xl p-5 sticky top-24">
                <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                  <Tv className="h-5 w-5 text-accent-red" />
                  Temporadas e Episódios
                </h3>
                <EpisodeSelector
                  showId={showData.id}
                  seasons={showData.seasons}
                  currentSeason={season}
                  currentEpisode={episode}
                  onSelect={handleEpisodeSelect}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default Watch
