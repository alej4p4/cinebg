import { useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import MovieCard from './MovieCard'
import SkeletonCard from './SkeletonCard'
import type { MediaItem } from '@/types'

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
    <section className="relative group/carousel">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 px-4 md:px-8">
        <h2 className="text-lg md:text-xl font-display font-bold text-white flex items-center gap-2">
          {emoji && <span>{emoji}</span>}
          {title}
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => scroll('left')}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors opacity-0 group-hover/carousel:opacity-100"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors opacity-0 group-hover/carousel:opacity-100"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Scroll area */}
      <div
        ref={scrollRef}
        className="carousel-container scroll-hide px-4 md:px-8"
      >
        {loading
          ? Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
          : items.map((item, i) => (
              <div key={item.id} className="w-40 md:w-44">
                <MovieCard item={item} index={i} />
              </div>
            ))}
      </div>
    </section>
  )
}

export default Carousel
