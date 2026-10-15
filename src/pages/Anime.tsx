import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { SkeletonGrid } from '@/components/ui/SkeletonCard'
import ErrorState from '@/components/ui/ErrorState'
import MovieCard from '@/components/ui/MovieCard'
import ProgressBar from '@/components/ui/ProgressBar'
import { discoverShows } from '@/services/tmdb'
import type { MediaItem } from '@/types'
import { PAGE_VARIANTS, STAGGER_CONTAINER, STAGGER_ITEM } from '@/utils/motion'

const Anime = () => {
  const [items, setItems] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    setLoading(true)
    setError(false)
    discoverShows({ isAnime: true })
      .then((r) => setItems(r.items))
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [reloadKey])

  return (
    <>
      <ProgressBar isLoading={loading} />
      <motion.div
        className="min-h-screen bg-bg-primary pt-24 pb-12"
        variants={PAGE_VARIANTS}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        <div className="max-w-screen-2xl mx-auto px-4 md:px-8">
          <div className="flex items-center gap-3 mb-8">
            <span className="text-2xl">⛩️</span>
            <h1 className="font-display font-black text-2xl md:text-3xl text-white">Anime</h1>
          </div>

          {loading ? (
            <SkeletonGrid count={18} />
          ) : error ? (
            <ErrorState onRetry={() => setReloadKey((k) => k + 1)} />
          ) : (
            <motion.div
              className="content-grid"
              variants={STAGGER_CONTAINER}
              initial="hidden"
              animate="visible"
            >
              {items.map((item, i) => (
                <motion.div key={item.id} variants={STAGGER_ITEM}>
                  <MovieCard item={item} index={i} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </motion.div>
    </>
  )
}

export default Anime
