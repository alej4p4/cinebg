import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Info, ChevronLeft, ChevronRight, Star } from 'lucide-react'
import { getBackdropUrl, getPosterUrl } from '@/services/tmdb'
import type { MediaItem } from '@/types'

interface HeroBannerProps {
  items: MediaItem[]
  loading?: boolean
}

const HeroBanner = ({ items, loading }: HeroBannerProps) => {
  const navigate = useNavigate()
  const [current, setCurrent] = useState(0)
  const [direction, setDirection] = useState(0)

  const featured = items.slice(0, 6)

  useEffect(() => {
    if (featured.length === 0) return
    const timer = setInterval(() => {
      setDirection(1)
      setCurrent((c) => (c + 1) % featured.length)
    }, 7000)
    return () => clearInterval(timer)
  }, [featured.length])

  const goTo = (idx: number) => {
    setDirection(idx > current ? 1 : -1)
    setCurrent(idx)
  }

  const prev = () => {
    setDirection(-1)
    setCurrent((c) => (c - 1 + featured.length) % featured.length)
  }

  const next = () => {
    setDirection(1)
    setCurrent((c) => (c + 1) % featured.length)
  }

  if (loading || featured.length === 0) {
    return (
      <div className="relative h-[70vh] min-h-[500px] bg-bg-secondary">
        <div className="skeleton absolute inset-0" />
      </div>
    )
  }

  const item = featured[current]
  const year = item.releaseDate ? new Date(item.releaseDate).getFullYear() : ''

  return (
    <div className="relative h-[75vh] min-h-[520px] overflow-hidden">
      {/* Backdrop */}
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={item.id}
          custom={direction}
          initial={{ opacity: 0, x: direction * 60 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: direction * -60 }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
          className="absolute inset-0"
        >
          <img
            src={getBackdropUrl(item.backdropPath, 'original')}
            alt={item.title}
            className="hero-backdrop w-full h-full object-cover object-top"
          />
          {/* Gradients */}
          <div className="absolute inset-0 hero-overlay" />
          <div className="absolute bottom-0 left-0 right-0 h-48 hero-overlay-bottom" />
          <div className="absolute inset-0 bg-gradient-to-t from-bg-primary via-transparent to-black/20" />
        </motion.div>
      </AnimatePresence>

      {/* Content */}
      <div className="absolute inset-0 flex items-end pb-20 md:pb-24">
        <div className="max-w-screen-2xl mx-auto px-4 md:px-8 w-full">
          <div className="max-w-xl">
            <AnimatePresence mode="wait">
              <motion.div
                key={item.id + '-content'}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="space-y-3"
              >
                {/* Type tag */}
                <span className="inline-block quality-badge bg-accent-red text-white text-xs px-2 py-1">
                  {item.type === 'movie' ? 'FILME' : item.type === 'anime' ? 'ANIME' : 'SÉRIE'}
                </span>

                {/* Title */}
                <h1 className="font-display font-black text-3xl md:text-5xl text-white leading-tight drop-shadow-2xl">
                  {item.title}
                </h1>

                {/* Meta */}
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="rating-badge">
                    <Star className="h-3 w-3" />
                    {item.rating.toFixed(1)}
                  </span>
                  {year && <span className="text-sm text-white/60">{year}</span>}
                  <span className="text-sm text-white/60">
                    {item.voteCount.toLocaleString()} votos
                  </span>
                </div>

                {/* Overview */}
                <p className="text-sm md:text-base text-white/75 line-clamp-3 leading-relaxed">
                  {item.overview || 'Sem descrição disponível.'}
                </p>

                {/* Buttons */}
                <div className="flex gap-3 pt-1">
                  <motion.button
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => navigate(`/watch/${item.type}/${item.id}`)}
                    className="flex items-center gap-2 bg-accent-red hover:bg-red-600 text-white font-semibold px-6 py-3 rounded-xl transition-colors shadow-lg glow-red tv-focusable"
                  >
                    <Play className="h-5 w-5 fill-white" />
                    Assistir
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => navigate(`/details/${item.type}/${item.id}`)}
                    className="flex items-center gap-2 glass hover:bg-white/10 text-white font-medium px-5 py-3 rounded-xl transition-all tv-focusable"
                  >
                    <Info className="h-4 w-4" />
                    Detalhes
                  </motion.button>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Navigation arrows */}
      <button
        onClick={prev}
        className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-black/40 hover:bg-black/70 rounded-full text-white transition-all glass tv-focusable"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        onClick={next}
        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-black/40 hover:bg-black/70 rounded-full text-white transition-all glass tv-focusable"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-1.5">
        {featured.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className={`transition-all rounded-full ${
              i === current ? 'w-6 h-2 bg-accent-red' : 'w-2 h-2 bg-white/30 hover:bg-white/50'
            }`}
          />
        ))}
      </div>

      {/* Thumbnail strip */}
      <div className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 hidden lg:flex flex-col gap-2">
        {featured.map((f, i) => (
          <button
            key={f.id}
            onClick={() => goTo(i)}
            className={`relative rounded-lg overflow-hidden transition-all ${
              i === current
                ? 'ring-2 ring-accent-red opacity-100 w-16 h-10'
                : 'opacity-40 hover:opacity-70 w-14 h-9'
            }`}
          >
            <img
              src={getPosterUrl(f.posterPath, 'w185')}
              alt={f.title}
              className="w-full h-full object-cover"
            />
          </button>
        ))}
      </div>
    </div>
  )
}

export default HeroBanner
