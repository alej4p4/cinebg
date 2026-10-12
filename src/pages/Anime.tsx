import { useState, useEffect, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import { SlidersHorizontal, X } from 'lucide-react'
import MovieCard from '@/components/ui/MovieCard'
import { SkeletonGrid } from '@/components/ui/SkeletonCard'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { discoverShows } from '@/services/tmdb'
import type { MediaItem } from '@/types'

const SORT_OPTIONS = [
  { value: 'popularity.desc', label: 'Mais Populares' },
  { value: 'vote_average.desc', label: 'Melhor Avaliação' },
  { value: 'first_air_date.desc', label: 'Mais Recentes' },
]

const YEARS = Array.from({ length: 30 }, (_, i) => new Date().getFullYear() - i)

const Anime = () => {
  const [items, setItems] = useState<MediaItem[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [year, setYear] = useState<number | undefined>()
  const [sort, setSort] = useState('popularity.desc')
  const observerRef = useRef<IntersectionObserver>()
  const loaderRef = useRef<HTMLDivElement>(null)

  const fetchAnimes = useCallback(async (pageNum: number, reset = false) => {
    if (reset) {
      setLoading(true)
      setItems([])
    } else {
      setLoadingMore(true)
    }
    try {
      const result = await discoverShows({ page: pageNum, year, sort, isAnime: true })
      setItems((prev) => (reset ? result.items : [...prev, ...result.items]))
      setTotalPages(result.totalPages)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [year, sort])

  useEffect(() => {
    setPage(1)
    fetchAnimes(1, true)
  }, [year, sort])

  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect()
    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && page < totalPages && !loadingMore && !loading) {
        setPage((p) => {
          const next = p + 1
          fetchAnimes(next)
          return next
        })
      }
    })
    if (loaderRef.current) observerRef.current.observe(loaderRef.current)
    return () => observerRef.current?.disconnect()
  }, [page, totalPages, loading, loadingMore, fetchAnimes])

  const clearFilters = () => {
    setYear(undefined)
    setSort('popularity.desc')
  }

  const hasActiveFilters = year || sort !== 'popularity.desc'

  return (
    <motion.div
      className="min-h-screen bg-bg-primary pt-20 page-enter"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="max-w-screen-2xl mx-auto px-4 md:px-8">
        <div className="flex items-center justify-between py-6">
          <div>
            <h1 className="font-display font-black text-3xl text-white flex items-center gap-2">
              ⭐ Animes
            </h1>
            <p className="text-text-secondary text-sm mt-1">
              Os melhores animes japoneses
            </p>
          </div>
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300"
              >
                <X className="h-3 w-3" />
                Limpar
              </button>
            )}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors border ${
                showFilters || hasActiveFilters
                  ? 'bg-accent-red border-accent-red text-white'
                  : 'bg-white/5 border-white/10 text-white/70 hover:text-white'
              }`}
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filtros
            </button>
          </div>
        </div>

        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="glass rounded-xl p-4 mb-6 grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl"
          >
            <div>
              <label className="text-xs text-white/50 mb-1.5 block">Ano</label>
              <select
                value={year || ''}
                onChange={(e) => setYear(e.target.value ? Number(e.target.value) : undefined)}
                className="w-full bg-bg-card border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
              >
                <option value="">Todos</option>
                {YEARS.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-white/50 mb-1.5 block">Ordenar por</label>
              <div className="flex flex-col gap-1">
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setSort(opt.value)}
                    className={`text-left px-3 py-2 text-sm rounded-lg transition-colors border ${
                      sort === opt.value
                        ? 'bg-accent-red/20 border-accent-red/40 text-white'
                        : 'border-transparent text-white/60 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {loading ? (
          <SkeletonGrid count={20} />
        ) : (
          <>
            <div className="content-grid">
              {items.map((item, i) => (
                <MovieCard key={`${item.id}-${i}`} item={item} index={i % 20} />
              ))}
            </div>
            <div ref={loaderRef} className="flex justify-center py-8">
              {loadingMore && <LoadingSpinner />}
            </div>
          </>
        )}
      </div>
    </motion.div>
  )
}

export default Anime
