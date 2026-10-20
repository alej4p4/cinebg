import { useRef, useState, useCallback, memo } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useFocusable, FocusContext, setFocus, doesFocusableExist } from '@noriginmedia/norigin-spatial-navigation'
import MovieCard from './MovieCard'
import SkeletonCard from './SkeletonCard'
import type { MediaItem } from '@/types'
import { isTVDevice } from '@/utils/tv'

interface CarouselProps {
  title: string
  items: MediaItem[]
  loading?: boolean
  emoji?: string
  showRanking?: boolean
  getProgress?: (item: MediaItem) => number
  rowIndex?: number
}

const INITIAL_TV_CARDS_PER_ROW = 10

const Carousel = memo(({
  title,
  items,
  loading,
  emoji,
  showRanking,
  getProgress,
  rowIndex = 0,
}: CarouselProps) => {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [visibleCount, setVisibleCount] = useState(() =>
    isTVDevice() ? INITIAL_TV_CARDS_PER_ROW : 16
  )

  const { ref, focusKey } = useFocusable({
    focusKey: `carousel-${rowIndex}`,
    trackChildren: true,
    autoRestoreFocus: true,
    saveLastFocusedChild: true,
    isFocusBoundary: false,
  })

  // Reciclagem/Paginação sob demanda: quando o usuário navega no D-Pad até perto do fim da linha, libera o restante dos cards
  const handleCardFocus = useCallback(
    (index: number) => {
      if (index >= visibleCount - 3 && visibleCount < items.length) {
        setVisibleCount((prev) => Math.min(items.length, prev + 10))
      }
    },
    [visibleCount, items.length]
  )

  const scroll = (dir: 'left' | 'right') => {
    if (dir === 'right' && visibleCount < items.length) {
      setVisibleCount(items.length)
    }
    if (scrollRef.current) {
      const amount = scrollRef.current.clientWidth * 0.75
      scrollRef.current.scrollBy({
        left: dir === 'left' ? -amount : amount,
        behavior: isTVDevice() ? 'auto' : 'smooth',
      })
    }
  }

  const displayedItems = items.slice(0, visibleCount)

  return (
    <FocusContext.Provider value={focusKey}>
      <section
        ref={ref}
        className="carousel-section relative group/carousel opacity-100"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4 px-4 md:px-8">
          <h2 className="text-base md:text-lg font-display font-bold text-white flex items-center gap-2">
            {emoji && <span className="text-lg">{emoji}</span>}
            {title}
          </h2>
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => scroll('left')}
              className="p-1.5 rounded-full bg-white/8 hover:bg-white/15 text-white transition-colors opacity-0 group-hover/carousel:opacity-100"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => scroll('right')}
              className="p-1.5 rounded-full bg-white/8 hover:bg-white/15 text-white transition-colors opacity-0 group-hover/carousel:opacity-100"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Scroll area */}
        <div
          ref={scrollRef}
          onScroll={() => {
            if (visibleCount < items.length) {
              setVisibleCount(items.length)
            }
          }}
          className="carousel-container scroll-hide px-4 md:px-8"
        >
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
          ) : (
            <div className="flex gap-3" style={{ transform: 'translateZ(0)' }}>
              {displayedItems.map((item, i) => (
                <div
                  key={item.id}
                  className="w-32 sm:w-36 md:w-44 flex-shrink-0"
                >
                  <MovieCard
                    item={item}
                    index={i}
                    focusKey={`card-${rowIndex}-${i}`}
                    progress={getProgress?.(item)}
                    rank={showRanking ? i + 1 : undefined}
                    onCardFocus={handleCardFocus}
                    onArrowPress={(dir) => {
                      if (dir === 'up' && rowIndex === 0) {
                        if (doesFocusableExist('hero-watch-btn')) {
                          setFocus('hero-watch-btn')
                          return false
                        }
                        if (doesFocusableExist('yucine-hero-banner')) {
                          setFocus('yucine-hero-banner')
                          return false
                        }
                      }
                      return true
                    }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </FocusContext.Provider>
  )
})

Carousel.displayName = 'Carousel'

export default Carousel
