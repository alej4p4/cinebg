import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { SkeletonGrid } from '@/components/ui/SkeletonCard'
import ErrorState from '@/components/ui/ErrorState'
import MovieCard from '@/components/ui/MovieCard'
import ProgressBar from '@/components/ui/ProgressBar'
import Focusable from '@/components/tv/Focusable'
import { discoverShows } from '@/services/tmdb'
import type { MediaItem } from '@/types'
import { PAGE_VARIANTS, STAGGER_CONTAINER, STAGGER_ITEM } from '@/utils/motion'
import { setFocus, doesFocusableExist, SpatialNavigation } from '@noriginmedia/norigin-spatial-navigation'

const Anime = () => {
  const [items, setItems] = useState<MediaItem[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)

  const fetchPage = useCallback(async (pageNum: number, reset = false) => {
    if (reset) setLoading(true)
    else setLoadingMore(true)
    setError(false)
    try {
      const r = await discoverShows({ isAnime: true, page: pageNum })
      setItems((prev) => (reset ? r.items : [...prev, ...r.items]))
      setTotalPages(Math.min(r.totalPages, 20))
    } catch {
      if (reset) setError(true)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [])

  useEffect(() => {
    setPage(1)
    fetchPage(1, true)
  }, [reloadKey, fetchPage])

  useEffect(() => {
    if (!loading && items.length > 0) {
      const t = setTimeout(() => {
        try {
          SpatialNavigation.updateAllLayouts().catch(() => {})
          if (doesFocusableExist('anime-card-0')) {
            setFocus('anime-card-0')
          }
        } catch {}
      }, 100)
      return () => clearTimeout(t)
    }
  }, [loading, items.length])

  const loadMore = () => {
    const next = page + 1
    setPage(next)
    fetchPage(next)
  }

  return (
    <>
      <ProgressBar isLoading={loading || loadingMore} />
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
            <>
              <motion.div
                className="content-grid"
                variants={STAGGER_CONTAINER}
                initial="hidden"
                animate="visible"
              >
                {items.map((item, i) => (
                  <motion.div key={`${item.id}-${i}`} variants={STAGGER_ITEM}>
                    <MovieCard item={item} index={i} focusKey={`anime-card-${i}`} />
                  </motion.div>
                ))}
              </motion.div>

              {page < totalPages && (
                <div className="flex justify-center mt-10">
                  <Focusable
                    focusKey="anime-load-more"
                    onEnterPress={loadMore}
                    className="rounded-xl"
                  >
                    <button
                      onClick={loadMore}
                      disabled={loadingMore}
                      className="bg-bg-card hover:bg-bg-elevated border border-white/10 text-white font-semibold text-sm px-8 py-3 rounded-xl transition-all hover:border-white/20 disabled:opacity-50"
                    >
                      {loadingMore ? 'Carregando...' : 'Carregar mais'}
                    </button>
                  </Focusable>
                </div>
              )}
            </>
          )}
        </div>
      </motion.div>
    </>
  )
}

export default Anime
