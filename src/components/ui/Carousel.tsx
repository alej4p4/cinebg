import { useRef } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import MovieCard from './MovieCard'
import SkeletonCard from './SkeletonCard'
import type { MediaItem } from '@/types'
import { FLUID_EASE, SPRING_SNAPPY, STAGGER_CONTAINER, STAGGER_ITEM } from '@/utils/motion'

interface CarouselProps {
  title: string
  items: MediaItem[]
  loading?: boolean
  emoji?: string
}

const Carousel = ({ title, items, loading, emoji }: CarouselProps) => {
  const scrollRef = useRef<HTMLDivElement>(null)

  const scroll = (dir: 'left' | 'right') => {
    if (scrollRef.current) {
      const amount = scrollRef.current.clientWidth * 0.75
      scrollRef.current.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' })
    }
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.38, ease: FLUID_EASE }}
      className="relative group/carousel"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4 px-4 md:px-8">
        <h2 className="text-base md:text-lg font-display font-bold text-white flex items-center gap-2">
          {emoji && <span className="text-lg">{emoji}</span>}
          {title}
        </h2>
        <div className="flex gap-1.5">
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            transition={SPRING_SNAPPY}
            onClick={() => scroll('left')}
            className="p-1.5 rounded-full bg-white/8 hover:bg-white/15 text-white transition-colors opacity-0 group-hover/carousel:opacity-100"
          >
            <ChevronLeft className="h-4 w-4" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            transition={SPRING_SNAPPY}
            onClick={() => scroll('right')}
            className="p-1.5 rounded-full bg-white/8 hover:bg-white/15 text-white transition-colors opacity-0 group-hover/carousel:opacity-100"
          >
            <ChevronRight className="h-4 w-4" />
          </motion.button>
        </div>
      </div>

      {/* Scroll area */}
      <div
        ref={scrollRef}
        className="carousel-container scroll-hide px-4 md:px-8"
      >
        {loading ? (
          Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <motion.div
            variants={STAGGER_CONTAINER}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-40px' }}
            className="flex gap-3"
          >
            {items.map((item, i) => (
              <motion.div
                key={item.id}
                variants={STAGGER_ITEM}
                className="w-40 md:w-44 flex-shrink-0"
              >
                <MovieCard item={item} index={i} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </motion.section>
  )
}

export default Carousel
