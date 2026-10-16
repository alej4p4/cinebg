import { motion } from 'framer-motion'
import { Heart } from 'lucide-react'
import MovieCard from '@/components/ui/MovieCard'
import { useAppStore } from '@/store/useAppStore'
import type { MediaItem } from '@/types'
import { PAGE_VARIANTS, STAGGER_CONTAINER, STAGGER_ITEM } from '@/utils/motion'
import { EmptyFavorites } from '@/components/ui/EmptyState'

const Favorites = () => {
  const { favorites } = useAppStore()

  const items: MediaItem[] = favorites.map((f) => ({
    id: f.id,
    title: f.title,
    overview: '',
    posterPath: f.posterPath,
    backdropPath: null,
    releaseDate: '',
    rating: f.rating,
    voteCount: 0,
    type: f.type,
    genreIds: [],
  }))

  return (
    <motion.div
      className="min-h-screen bg-bg-primary pt-24 pb-12"
      variants={PAGE_VARIANTS}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <div className="max-w-screen-2xl mx-auto px-4 md:px-8">
        <div className="flex items-center gap-3 mb-8">
          <Heart className="h-7 w-7 text-accent-red fill-current" />
          <h1 className="font-display font-black text-2xl md:text-3xl text-white">Favoritos</h1>
          {items.length > 0 && (
            <span className="ml-1 text-sm text-white/40 font-medium">
              {items.length} {items.length === 1 ? 'título' : 'títulos'}
            </span>
          )}
        </div>        {items.length === 0 ? (
          <EmptyFavorites
            onAction={() => {}}
            actionLabel="Explorar catálogo"
          />
        ) : (
          <motion.div
            className="content-grid"
            variants={STAGGER_CONTAINER}
            initial="hidden"
            animate="visible"
          >
            {items.map((item, i) => (
              <motion.div key={`${item.type}-${item.id}`} variants={STAGGER_ITEM}>
                <MovieCard item={item} index={i} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}

export default Favorites

