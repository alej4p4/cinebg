import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Info, ChevronLeft, ChevronRight, Star } from 'lucide-react'
import { getBackdropUrl, getPosterUrl } from '@/services/tmdb'
import type { MediaItem } from '@/types'
import { SkeletonHero } from '@/components/ui/SkeletonCard'
import { FLUID_EASE, SPRING_SNAPPY } from '@/utils/motion'
import Focusable from '@/components/tv/Focusable'
import { setFocus, doesFocusableExist } from '@noriginmedia/norigin-spatial-navigation'

interface HeroBannerProps {
  items: MediaItem[]
  loading?: boolean
}

const HeroBanner = ({ items, loading }: HeroBannerProps) => {
  const navigate = useNavigate()
  const [current, setCurrent] = useState(0)
  const [direction, setDirection] = useState(0)
  const [touchStartX, setTouchStartX] = useState<number | null>(null)

  const featured = items.slice(0, 8)

  // Transição automática suave de slides a cada 7 segundos ("fica passando lançamentos")
  useEffect(() => {
    if (loading || featured.length <= 1) return
    const timer = setInterval(() => {
      setDirection(1)
      setCurrent((c) => (c + 1) % featured.length)
    }, 7000)
    return () => clearInterval(timer)
  }, [loading, featured.length])

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

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX)
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return
    const diffX = e.changedTouches[0].clientX - touchStartX
    if (Math.abs(diffX) > 40) {
      if (diffX > 0) {
        prev()
      } else {
        next()
      }
    }
    setTouchStartX(null)
  }

  if (loading || featured.length === 0) {
    return <SkeletonHero />
  }

  const item = featured[current]
  const year = item.releaseDate ? new Date(item.releaseDate).getFullYear() : ''

  const backdropVariants = {
    enter: (dir: number) => ({ opacity: dir === 0 ? 1 : 0, x: dir * 30, scale: 1 }),
    center: { opacity: 1, x: 0, scale: 1, transition: { duration: direction === 0 ? 0.05 : 0.25 } },
    exit: (dir: number) => ({ opacity: 0, x: dir * -30, scale: 1, transition: { duration: 0.15 } }),
  }

  const contentVariants = {
    enter: { opacity: direction === 0 ? 1 : 0, y: direction === 0 ? 0 : 12 },
    center: { opacity: 1, y: 0, transition: { duration: direction === 0 ? 0.05 : 0.2 } },
    exit: { opacity: 0, y: -8, transition: { duration: 0.15 } },
  }

  return (
    <div
      className="relative h-[65vh] sm:h-[70vh] md:h-[75vh] min-h-[440px] sm:min-h-[480px] md:min-h-[520px] overflow-hidden select-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Backdrop */}
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={item.id + '-bg'}
          custom={direction}
          variants={backdropVariants}
          initial="enter"
          animate="center"
          exit="exit"
          className="absolute inset-0"
        >
          <img
            src={getBackdropUrl(item.backdropPath, 'original')}
            alt={item.title}
            className="hero-backdrop w-full h-full object-cover object-top"
            decoding="async"
          />
          <div className="absolute inset-0 hero-overlay" />
          <div className="absolute bottom-0 left-0 right-0 h-56 hero-overlay-bottom" />
          <div className="absolute inset-0 bg-gradient-to-t from-bg-primary via-transparent to-black/30" />
        </motion.div>
      </AnimatePresence>

      {/* Content */}
      <div className="absolute inset-0 flex items-end pb-16 sm:pb-20 md:pb-24">
        <div className="max-w-screen-2xl mx-auto px-4 md:px-8 w-full">
          <div className="max-w-xl">
            <AnimatePresence mode="wait">
              <motion.div
                key={item.id + '-content'}
                variants={contentVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="space-y-2.5 sm:space-y-3"
              >
                <motion.span
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.28, delay: 0.15, ease: FLUID_EASE }}
                  className="inline-block quality-badge bg-accent-red text-white text-xs px-2.5 py-1 rounded-md"
                >
                  {item.type === 'movie' ? 'FILME' : item.type === 'anime' ? 'ANIME' : 'SÉRIE'}
                </motion.span>

                <h1 className="font-display font-black text-2xl sm:text-4xl md:text-5xl text-white leading-tight drop-shadow-2xl line-clamp-2">
                  {item.title}
                </h1>

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

                <p className="text-xs sm:text-sm md:text-base text-white/75 line-clamp-2 sm:line-clamp-3 leading-relaxed">
                  {item.overview || 'Sem descrição disponível.'}
                </p>

                <div className="flex gap-3 pt-1">
                  <Focusable
                    focusKey="hero-watch-btn"
                    onFocus={() => {
                      window.scrollTo({ top: 0, behavior: 'smooth' })
                    }}
                    onEnterPress={() => navigate(`/watch/${item.type}/${item.id}`)}
                    onArrowPress={(dir) => {
                      if (dir === 'up') {
                        setFocus('nav-item-0')
                        return false
                      }
                      if (dir === 'left') {
                        prev()
                        return false
                      }
                      if (dir === 'right') {
                        setFocus('hero-details-btn')
                        return false
                      }
                      if (dir === 'down') {
                        if (doesFocusableExist('card-0-0')) {
                          setFocus('card-0-0')
                          return false
                        }
                      }
                      return true
                    }}
                  >
                    <motion.button
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.96 }}
                      transition={SPRING_SNAPPY}
                      onClick={() => navigate(`/watch/${item.type}/${item.id}`)}
                      className="flex items-center gap-2 bg-accent-red hover:bg-red-600 text-white font-semibold px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl text-sm sm:text-base shadow-xl glow-red"
                    >
                      <Play className="h-5 w-5 fill-white" />
                      Assistir
                    </motion.button>
                  </Focusable>

                  <Focusable
                    focusKey="hero-details-btn"
                    onFocus={() => {
                      window.scrollTo({ top: 0, behavior: 'smooth' })
                    }}
                    onEnterPress={() => navigate(`/details/${item.type}/${item.id}`)}
                    onArrowPress={(dir) => {
                      if (dir === 'up') {
                        setFocus('nav-item-0')
                        return false
                      }
                      if (dir === 'left') {
                        setFocus('hero-watch-btn')
                        return false
                      }
                      if (dir === 'right') {
                        next()
                        return false
                      }
                      if (dir === 'down') {
                        if (doesFocusableExist('card-0-0')) {
                          setFocus('card-0-0')
                          return false
                        }
                      }
                      return true
                    }}
                  >
                    <motion.button
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.96 }}
                      transition={SPRING_SNAPPY}
                      onClick={() => navigate(`/details/${item.type}/${item.id}`)}
                      className="flex items-center gap-2 glass hover:bg-white/10 text-white font-medium px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl text-sm sm:text-base transition-all"
                    >
                      <Info className="h-4 w-4" />
                      Detalhes
                    </motion.button>
                  </Focusable>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Nav arrows visíveis no mobile e TV para controle total */}
      <Focusable
        focusKey="hero-prev-btn"
        onEnterPress={prev}
        className="absolute left-3 top-1/2 -translate-y-1/2 z-30"
      >
        <motion.button
          whileHover={{ scale: 1.1, x: -2 }}
          whileTap={{ scale: 0.92 }}
          transition={SPRING_SNAPPY}
          onClick={prev}
          aria-label="Anterior"
          className="p-2.5 sm:p-3 bg-black/50 hover:bg-black/80 rounded-full text-white glass border border-white/10"
        >
          <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
        </motion.button>
      </Focusable>

      <Focusable
        focusKey="hero-next-btn"
        onEnterPress={next}
        className="absolute right-3 top-1/2 -translate-y-1/2 z-30"
      >
        <motion.button
          whileHover={{ scale: 1.1, x: 2 }}
          whileTap={{ scale: 0.92 }}
          transition={SPRING_SNAPPY}
          onClick={next}
          aria-label="Próximo"
          className="p-2.5 sm:p-3 bg-black/50 hover:bg-black/80 rounded-full text-white glass border border-white/10"
        >
          <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
        </motion.button>
      </Focusable>

      {/* Progress dots */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-2">
        {featured.map((_, i) => (
          <motion.button
            key={i}
            onClick={() => goTo(i)}
            animate={{
              width: i === current ? 24 : 8,
              backgroundColor: i === current ? '#e50914' : 'rgba(255,255,255,0.35)',
            }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            className="h-2 rounded-full"
          />
        ))}
      </div>

      {/* Thumbnail strip */}
      <div className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 hidden lg:flex flex-col gap-2">
        {featured.map((f, i) => (
          <motion.button
            key={f.id}
            onClick={() => goTo(i)}
            animate={{
              opacity: i === current ? 1 : 0.4,
              scale: i === current ? 1 : 0.88,
            }}
            whileHover={{ opacity: 0.9, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 24 }}
            className={`relative rounded-lg overflow-hidden ${
              i === current ? 'ring-2 ring-accent-red w-16 h-10' : 'w-14 h-9'
            }`}
          >
            <img
              src={getPosterUrl(f.posterPath, 'w185')}
              alt={f.title}
              className="w-full h-full object-cover"
              decoding="async"
            />
          </motion.button>
        ))}
      </div>
    </div>
  )
}

export default HeroBanner
