import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useFocusable } from '@noriginmedia/norigin-spatial-navigation'
import { Play, Star, Heart, Info } from 'lucide-react'
import { getPosterUrl } from '@/services/tmdb'
import { useAppStore } from '@/store/useAppStore'
import type { MediaItem } from '@/types'
import LazyImage from './LazyImage'
import { FLUID_EASE, SPRING_SNAPPY } from '@/utils/motion'

interface MovieCardProps {
  item: MediaItem
  index?: number
  progress?: number
  rank?: number
}

const MovieCard = ({ item, index = 0, progress, rank }: MovieCardProps) => {
  const navigate = useNavigate()
  const { addFavorite, removeFavorite, isFavorite } = useAppStore()
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
    // Estilo YuCine: Se o item está em "Continuar Assistindo" com progresso salvo, vai direto ao player
    if (typeof progress === 'number' && progress > 0) {
      navigate(`/watch/${item.type}/${item.id}`)
      return
    }
    navigate(`/details/${item.type}/${item.id}`)
  }

  const { ref, focused } = useFocusable({
    onEnterPress: handleClick,
    onFocus: () => {
      ref.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      })
    },
  })

  useEffect(() => {
    if (focused && ref.current) {
      ref.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      })
    }
  }, [focused])

  const year = item.releaseDate ? new Date(item.releaseDate).getFullYear() : ''
  const posterUrl = getPosterUrl(item.posterPath)

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.32,
        delay: Math.min(index * 0.035, 0.4),
        ease: FLUID_EASE,
      }}
      whileHover={{
        y: -6,
        scale: 1.035,
        transition: SPRING_SNAPPY,
      }}
      whileTap={{
        scale: 0.97,
        transition: { duration: 0.1 },
      }}
      ref={ref}
      className={`group cursor-pointer relative select-none ${
        focused ? 'tv-focused' : ''
      }`}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Container de Imagem com Lazy Loading & Blur-up */}
      <div className="relative rounded-xl overflow-hidden aspect-[2/3] bg-bg-card border border-white/5 shadow-md group-hover:shadow-2xl group-hover:shadow-red-950/20 transition-shadow duration-300">
        <LazyImage
          src={posterUrl}
          alt={item.title}
          fallbackTitle={item.title}
          aspectRatio="aspect-[2/3]"
          className="transition-transform duration-500 ease-out group-hover:scale-105"
        />

        {typeof rank === 'number' && (
          <div className="absolute -left-1 bottom-0 z-20 font-display font-black text-6xl md:text-7xl leading-none text-white drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)]" style={{ WebkitTextStroke: '2px rgba(0,0,0,0.8)' }}>
            {rank}
          </div>
        )}

        {typeof progress === 'number' && progress > 0 && (
          <div className="absolute bottom-0 left-0 right-0 z-20 h-1 bg-white/20">
            <div className="h-full bg-accent-red" style={{ width: `${Math.min(progress, 100)}%` }} />
          </div>
        )}

        {/* Gradiente sutil escuro ao passar o mouse */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-250 pointer-events-none" />

        {/* Ações com Micro-interações táteis */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ duration: 0.18, ease: FLUID_EASE }}
              className="absolute inset-0 flex items-center justify-center gap-2 z-10"
            >
              <motion.button
                whileHover={{ scale: 1.12 }}
                whileTap={{ scale: 0.9 }}
                transition={SPRING_SNAPPY}
                onClick={handlePlay}
                className="bg-accent-red hover:bg-red-600 text-white rounded-full p-3 shadow-xl glow-red tv-focusable"
                aria-label="Assistir agora"
              >
                <Play className="h-5 w-5 fill-white" />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.12 }}
                whileTap={{ scale: 0.9 }}
                transition={SPRING_SNAPPY}
                onClick={handleToggleFav}
                className={`rounded-full p-2.5 shadow-xl tv-focusable transition-colors ${
                  favorite ? 'bg-red-500 text-white' : 'bg-black/60 text-white hover:bg-black/80'
                }`}
                aria-label={favorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
              >
                <Heart className={`h-4 w-4 ${favorite ? 'fill-white' : ''}`} />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.12 }}
                whileTap={{ scale: 0.9 }}
                transition={SPRING_SNAPPY}
                onClick={(e) => {
                  e.stopPropagation()
                  handleClick()
                }}
                className="bg-black/60 hover:bg-black/80 text-white rounded-full p-2.5 shadow-xl tv-focusable"
                aria-label="Ver detalhes"
              >
                <Info className="h-4 w-4" />
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Rating badge */}
        <div className="absolute top-2 left-2 z-10">
          <span className="rating-badge shadow-md">
            <Star className="h-2.5 w-2.5 fill-black" />
            {item.rating.toFixed(1)}
          </span>
        </div>

        {/* Type badge */}
        <div className="absolute top-2 right-2 z-10">
          <span className="quality-badge bg-black/75 backdrop-blur-sm text-white/90 border border-white/10 shadow-sm">
            {item.type === 'movie' ? 'FILME' : item.type === 'anime' ? 'ANIME' : 'SÉRIE'}
          </span>
        </div>
      </div>

      {/* Título & Metadados */}
      <div className="mt-2.5 px-0.5">
        <h3 className="text-xs md:text-sm font-semibold text-white/90 line-clamp-1 group-hover:text-red-400 transition-colors duration-200">
          {item.title}
        </h3>
        {year && <p className="text-[11px] text-white/40 mt-0.5 font-medium">{year}</p>}
      </div>
    </motion.div>
  )
}

export default MovieCard
