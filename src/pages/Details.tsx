import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Play, Star, Calendar, Clock, Film, Heart,
  ChevronRight, Tv
} from 'lucide-react'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import GenreBadge from '@/components/ui/GenreBadge'
import {
  getMovieDetails, getShowDetails,
  getPosterUrl, getBackdropUrl, getProfileUrl
} from '@/services/tmdb'
import { useAppStore } from '@/store/useAppStore'
import type { TMDBMovieDetails, TMDBShowDetails, TMDBCast } from '@/types'

const Details = () => {
  const { type, id } = useParams<{ type: 'movie' | 'tv' | 'anime'; id: string }>()
  const navigate = useNavigate()
  const { addFavorite, removeFavorite, isFavorite } = useAppStore()

  const [movieData, setMovieData] = useState<TMDBMovieDetails | null>(null)
  const [showData, setShowData] = useState<TMDBShowDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'cast' | 'seasons'>('overview')
  const [imgError, setImgError] = useState(false)

  const isMovie = type === 'movie'
  const mediaId = Number(id)

  useEffect(() => {
    if (!id || !type) return
    setLoading(true)
    const fetch = async () => {
      try {
        if (isMovie) {
          const data = await getMovieDetails(mediaId)
          setMovieData(data)
        } else {
          const data = await getShowDetails(mediaId)
          setShowData(data)
        }
      } catch (err) {
        console.error('Failed to load details:', err)
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [id, type, isMovie, mediaId])

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const data = isMovie ? movieData : showData
  if (!data) {
    return (
      <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center text-white">
        <h2 className="text-2xl font-bold mb-4">Conteúdo não encontrado</h2>
        <button onClick={() => navigate(-1)} className="text-accent-red hover:underline">Voltar</button>
      </div>
    )
  }

  const title = isMovie ? movieData!.title : showData!.name
  const overview = data.overview
  const rating = data.vote_average
  const releaseDate = isMovie ? movieData!.release_date : showData!.first_air_date
  const year = releaseDate ? new Date(releaseDate).getFullYear() : ''
  const genres = data.genres
  const posterPath = data.poster_path
  const backdropPath = data.backdrop_path
  const runtime = isMovie ? movieData!.runtime : null
  const tagline = isMovie ? movieData!.tagline : showData!.tagline
  const cast: TMDBCast[] = (data.credits?.cast || []).slice(0, 20)
  const numSeasons = !isMovie ? showData!.number_of_seasons : null
  const numEpisodes = !isMovie ? showData!.number_of_episodes : null

  const favorite = isFavorite(mediaId)

  const handleToggleFav = () => {
    if (favorite) {
      removeFavorite(mediaId)
    } else {
      addFavorite({
        id: mediaId,
        type: type!,
        title,
        posterPath,
        rating,
        addedAt: Date.now(),
      })
    }
  }

  const handlePlay = () => {
    navigate(`/watch/${type}/${id}`)
  }

  return (
    <motion.div
      className="min-h-screen bg-bg-primary page-enter"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Hero backdrop */}
      <div className="relative h-[55vh] md:h-[65vh] overflow-hidden">
        {backdropPath && !imgError ? (
          <img
            src={getBackdropUrl(backdropPath, 'original')}
            alt={title}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full bg-bg-card" />
        )}
        {/* Multiple gradient layers for cinematic effect */}
        <div className="absolute inset-0 bg-gradient-to-t from-bg-primary via-bg-primary/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-bg-primary/80 via-transparent to-transparent" />

        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-24 left-4 md:left-8 flex items-center gap-2 text-white/80 hover:text-white transition-colors z-10 bg-black/30 backdrop-blur-sm px-3 py-2 rounded-lg"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </button>
      </div>

      {/* Main content */}
      <div className="max-w-screen-xl mx-auto px-4 md:px-8 -mt-48 relative z-10 pb-20">
        <div className="flex flex-col md:flex-row gap-6 md:gap-10">

          {/* Poster */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
            className="flex-shrink-0 w-40 md:w-60 lg:w-72 mx-auto md:mx-0"
          >
            <div className="rounded-2xl overflow-hidden shadow-2xl border border-white/10 aspect-[2/3]">
              <img
                src={getPosterUrl(posterPath, 'w500')}
                alt={title}
                className="w-full h-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder-poster.svg' }}
              />
            </div>
          </motion.div>

          {/* Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex-1 space-y-4"
          >
            {tagline && (
              <p className="text-accent-gold text-sm italic opacity-80">{tagline}</p>
            )}
            <h1 className="font-display font-black text-3xl md:text-4xl lg:text-5xl text-white leading-tight">
              {title}
            </h1>

            {/* Meta info */}
            <div className="flex flex-wrap items-center gap-3 text-sm text-white/70">
              {rating > 0 && (
                <span className="flex items-center gap-1.5 bg-accent-gold/20 text-accent-gold border border-accent-gold/30 px-3 py-1 rounded-full font-bold">
                  <Star className="h-3.5 w-3.5 fill-current" />
                  {rating.toFixed(1)}
                </span>
              )}
              {year && (
                <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full">
                  <Calendar className="h-3.5 w-3.5" />
                  {year}
                </span>
              )}
              {runtime && (
                <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full">
                  <Clock className="h-3.5 w-3.5" />
                  {runtime} min
                </span>
              )}
              {numSeasons && (
                <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full">
                  <Tv className="h-3.5 w-3.5" />
                  {numSeasons} temporada{numSeasons > 1 ? 's' : ''}
                </span>
              )}
              {numEpisodes && (
                <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full">
                  <Film className="h-3.5 w-3.5" />
                  {numEpisodes} episódios
                </span>
              )}
              <span className="flex items-center gap-1.5 bg-accent-red/20 text-accent-red border border-accent-red/30 px-3 py-1 rounded-full text-xs font-bold uppercase">
                {type === 'movie' ? 'Filme' : type === 'anime' ? 'Anime' : 'Série'}
              </span>
            </div>

            {/* Genres */}
            {genres && genres.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {genres.map(g => <GenreBadge key={g.id} name={g.name} />)}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-wrap gap-3 pt-2">
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={handlePlay}
                className="flex items-center gap-3 bg-accent-red hover:bg-red-600 text-white font-bold px-8 py-3.5 rounded-xl shadow-lg glow-red transition-colors text-base"
              >
                <Play className="h-5 w-5 fill-white" />
                {isMovie ? 'Assistir Agora' : 'Assistir Episódio'}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={handleToggleFav}
                className={`flex items-center gap-2 font-semibold px-5 py-3.5 rounded-xl border transition-all ${
                  favorite
                    ? 'bg-red-500/20 border-red-400/40 text-red-400'
                    : 'bg-white/5 border-white/20 text-white/80 hover:bg-white/10'
                }`}
              >
                <Heart className={`h-5 w-5 ${favorite ? 'fill-current' : ''}`} />
                {favorite ? 'Nos Favoritos' : 'Favoritar'}
              </motion.button>
            </div>
          </motion.div>
        </div>

        {/* Tabs */}
        <div className="mt-10 border-b border-white/10">
          <div className="flex gap-1">
            {(['overview', 'cast', ...(isMovie ? [] : ['seasons'])] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as typeof activeTab)}
                className={`px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
                  activeTab === tab
                    ? 'border-accent-red text-white'
                    : 'border-transparent text-white/50 hover:text-white/80'
                }`}
              >
                {tab === 'overview' ? 'Sinopse' : tab === 'cast' ? 'Elenco' : 'Temporadas'}
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-6 max-w-3xl"
            >
              <p className="text-white/80 leading-relaxed text-base md:text-lg">
                {overview || 'Sem descrição disponível para este título.'}
              </p>

              {/* Additional info for movies */}
              {isMovie && movieData && (
                <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-4">
                  {movieData.budget > 0 && (
                    <div className="glass rounded-xl p-4">
                      <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Orçamento</p>
                      <p className="text-white font-semibold">${(movieData.budget / 1e6).toFixed(0)}M</p>
                    </div>
                  )}
                  {movieData.revenue > 0 && (
                    <div className="glass rounded-xl p-4">
                      <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Bilheteira</p>
                      <p className="text-white font-semibold">${(movieData.revenue / 1e6).toFixed(0)}M</p>
                    </div>
                  )}
                  {movieData.status && (
                    <div className="glass rounded-xl p-4">
                      <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Status</p>
                      <p className="text-white font-semibold">{movieData.status}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Show info */}
              {!isMovie && showData && (
                <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-4">
                  {showData.status && (
                    <div className="glass rounded-xl p-4">
                      <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Status</p>
                      <p className="text-white font-semibold">{showData.status}</p>
                    </div>
                  )}
                  {showData.networks?.length > 0 && (
                    <div className="glass rounded-xl p-4">
                      <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Rede</p>
                      <p className="text-white font-semibold">{showData.networks[0].name}</p>
                    </div>
                  )}
                  {showData.created_by?.length > 0 && (
                    <div className="glass rounded-xl p-4">
                      <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Criado por</p>
                      <p className="text-white font-semibold">{showData.created_by[0].name}</p>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'cast' && (
            <motion.div
              key="cast"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-6"
            >
              {cast.length === 0 ? (
                <p className="text-white/40">Elenco não disponível.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {cast.map((actor) => (
                    <motion.div
                      key={actor.id}
                      whileHover={{ y: -4 }}
                      className="text-center group"
                    >
                      <div className="aspect-[2/3] rounded-xl overflow-hidden bg-bg-card mb-2">
                        <img
                          src={getProfileUrl(actor.profile_path)}
                          alt={actor.name}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/placeholder-avatar.svg'
                          }}
                        />
                      </div>
                      <p className="text-white text-xs font-semibold line-clamp-1">{actor.name}</p>
                      <p className="text-white/40 text-xs line-clamp-1 mt-0.5">{actor.character}</p>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'seasons' && !isMovie && showData && (
            <motion.div
              key="seasons"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-6 space-y-3 max-w-2xl"
            >
              {showData.seasons
                .filter(s => s.season_number > 0)
                .map((season) => (
                  <motion.button
                    key={season.id}
                    whileHover={{ x: 4 }}
                    onClick={() => navigate(`/watch/${type}/${id}?season=${season.season_number}`)}
                    className="w-full flex items-center gap-4 glass rounded-xl p-4 text-left hover:border-accent-red/40 border border-transparent transition-all"
                  >
                    <div className="w-16 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-bg-card">
                      <img
                        src={getPosterUrl(season.poster_path, 'w185')}
                        alt={season.name}
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder-poster.svg' }}
                      />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-white font-semibold">{season.name}</h4>
                      <p className="text-white/50 text-sm mt-0.5">{season.episode_count} episódios</p>
                      {season.air_date && (
                        <p className="text-white/40 text-xs mt-1">{new Date(season.air_date).getFullYear()}</p>
                      )}
                    </div>
                    <ChevronRight className="h-5 w-5 text-white/30 flex-shrink-0" />
                  </motion.button>
                ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

export default Details
