import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Play, Star, Heart, Info } from 'lucide-react'
import { getPosterUrl } from '@/services/tmdb'
import { useAppStore } from '@/store/useAppStore'
import type { MediaItem } from '@/types'

interface MovieCardProps {
  item: MediaItem
  index?: number
}

const MovieCard = ({ item, index = 0 }: MovieCardProps) => {
  const navigate = useNavigate()
  const { addFavorite, removeFavorite, isFavorite } = useAppStore()
  const [imgError, setImgError] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  const favorite = isFavorite(item.id)

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation()
    navigate(`/watch/${item.type}/${item.id}`)
  }

  const handleToggleFav = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (favorite) {
      removeFavorite(item.id)
    } else {
      addFavorite({
        id: item.id,
        type: item.type,
        title: item.title,
        posterPath: item.posterPath,
        rating: item.rating,
        addedAt: Date.now(),
      })
    }
  }

  const handleClick = () => {
    navigate(`/details/${item.type}/${item.id}`)
  }

  const year = item.releaseDate ? new Date(item.releaseDate).getFullYear() : ''

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.03 }}
      className="movie-card group cursor-pointer relative"
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Poster */}
      <div className="relative rounded-xl overflow-hidden aspect-[2/3] bg-bg-card">
        {imgError ? (
          <div className="w-full h-full flex flex-col items-center justify-center bg-bg-card text-text-muted">
            <span className="text-4xl mb-2">🎬</span>
            <span className="text-xs text-center px-2">{item.title}</span>
          </div>
        ) : (
          <img
            src={getPosterUrl(item.posterPath)}
            alt={item.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-card-gradient opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Hover actions */}
        <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={handlePlay}
            className="bg-accent-red hover:bg-red-600 text-white rounded-full p-3 shadow-lg glow-red tv-focusable"
            aria-label="Assistir"
          >
            <Play className="h-5 w-5 fill-white" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleToggleFav}
            className={`rounded-full p-2.5 shadow-lg tv-focusable transition-colors ${
              favorite ? 'bg-red-500 text-white' : 'bg-black/50 text-white hover:bg-black/70'
            }`}
            aria-label={favorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
          >
            <Heart className={`h-4 w-4 ${favorite ? 'fill-white' : ''}`} />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => { e.stopPropagation(); handleClick() }}
            className="bg-black/50 hover:bg-black/70 text-white rounded-full p-2.5 shadow-lg tv-focusable"
            aria-label="Detalhes"
          >
            <Info className="h-4 w-4" />
          </motion.button>
        </div>

        {/* Rating badge */}
        <div className="absolute top-2 left-2">
          <span className="rating-badge">
            <Star className="h-2.5 w-2.5" />
            {item.rating.toFixed(1)}
          </span>
        </div>

        {/* Type badge */}
        <div className="absolute top-2 right-2">
          <span className="quality-badge bg-black/70 text-white/80">
            {item.type === 'movie' ? 'FILME' : item.type === 'anime' ? 'ANIME' : 'SÉRIE'}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="mt-2 px-0.5">
        <h3 className="text-sm font-medium text-white line-clamp-1 group-hover:text-red-400 transition-colors">
          {item.title}
        </h3>
        <p className="text-xs text-text-secondary mt-0.5">{year}</p>
      </div>
    </motion.div>
  )
}

export default MovieCard
