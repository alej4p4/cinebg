import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Heart } from 'lucide-react'
import MovieCard from '@/components/ui/MovieCard'
import { useAppStore } from '@/store/useAppStore'
import type { MediaItem } from '@/types'
import { PAGE_VARIANTS, STAGGER_CONTAINER, STAGGER_ITEM } from '@/utils/motion'

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
        </div>

        {items.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="text-center py-24 text-white/40"
          >
            <Heart className="h-16 w-16 mx-auto mb-4 opacity-20" />
            <p className="text-lg font-medium">Você ainda não tem favoritos</p>
            <p className="text-sm mt-1 opacity-60">
              Toque no coração de um título para salvá-lo aqui.
            </p>
            <Link
              to="/"
              className="inline-block mt-6 bg-accent-red hover:bg-red-600 text-white font-bold px-6 py-3 rounded-xl transition-colors"
            >
              Explorar catálogo
            </Link>
          </motion.div>
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
