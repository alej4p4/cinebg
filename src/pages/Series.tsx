import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Tv } from 'lucide-react'
import { SkeletonGrid } from '@/components/ui/SkeletonCard'
import ErrorState from '@/components/ui/ErrorState'
import MovieCard from '@/components/ui/MovieCard'
import ProgressBar from '@/components/ui/ProgressBar'
import { getPopularShows, getTopRatedShows, getAiringToday } from '@/services/tmdb'
import type { MediaItem } from '@/types'
import { PAGE_VARIANTS, STAGGER_CONTAINER, STAGGER_ITEM } from '@/utils/motion'

const TABS = [
  { label: 'Populares', id: 'popular' },
  { label: 'Mais Avaliadas', id: 'toprated' },
  { label: 'No Ar Hoje', id: 'airing' },
]

const Series = () => {
  const [items, setItems] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [activeTab, setActiveTab] = useState('popular')
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    setLoading(true)
    setError(false)
    const fetch = async () => {
      try {
        const result =
          activeTab === 'popular'
            ? await getPopularShows()
            : activeTab === 'toprated'
            ? await getTopRatedShows()
            : await getAiringToday()
        setItems(result.items)
      } catch {
        setError(true)
      }
      finally { setLoading(false) }
    }
    fetch()
  }, [activeTab, reloadKey])

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
            <Tv className="h-7 w-7 text-accent-red" />
            <h1 className="font-display font-black text-2xl md:text-3xl text-white">Séries</h1>
          </div>

          <div className="flex gap-2 mb-8 border-b border-white/8 pb-0">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative px-4 py-2.5 text-sm font-semibold transition-colors ${
                  activeTab === tab.id ? 'text-white' : 'text-white/40 hover:text-white/70'
                }`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="series-tab-indicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-red rounded-full"
                    transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                  />
                )}
              </button>
            ))}
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

export default Series
