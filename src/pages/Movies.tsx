import { useState, useEffect, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import { SlidersHorizontal, ChevronDown, X } from 'lucide-react'
import MovieCard from '@/components/ui/MovieCard'
import { SkeletonGrid } from '@/components/ui/SkeletonCard'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { discoverMovies, getPopularMovies } from '@/services/tmdb'
import { MOVIE_GENRES } from '@/types'
import type { MediaItem } from '@/types'

const SORT_OPTIONS = [
  { value: 'popularity.desc', label: 'Mais Populares' },
  { value: 'vote_average.desc', label: 'Melhor Avaliação' },
  { value: 'release_date.desc', label: 'Mais Recentes' },
  { value: 'revenue.desc', label: 'Maior Bilheteria' },
]

const YEARS = Array.from({ length: 30 }, (_, i) => new Date().getFullYear() - i)

const Movies = () => {
  const [items, setItems] = useState<MediaItem[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [genre, setGenre] = useState<number | undefined>()
  const [year, setYear] = useState<number | undefined>()
  const [sort, setSort] = useState('popularity.desc')
  const observerRef = useRef<IntersectionObserver>()
  const loaderRef = useRef<HTMLDivElement>(null)

  const fetchMovies = useCallback(async (pageNum: number, reset = false) => {
    if (reset) {
      setLoading(true)
      setItems([])
    } else {
      setLoadingMore(true)
    }
    try {
      const result =
        genre || year || sort !== 'popularity.desc'
          ? await discoverMovies({ page: pageNum, genre, year, sort })
          : await getPopularMovies(pageNum)
      setItems((prev) => (reset ? result.items : [...prev, ...result.items]))
      setTotalPages(result.totalPages)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [genre, year, sort])

  useEffect(() => {
    setPage(1)
    fetchMovies(1, true)
  }, [genre, year, sort])

  // Infinite scroll
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect()
    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && page < totalPages && !loadingMore && !loading) {
        setPage((p) => {
          const next = p + 1
          fetchMovies(next)
          return next
        })
      }
    })
    if (loaderRef.current) observerRef.current.observe(loaderRef.current)
    return () => observerRef.current?.disconnect()
  }, [page, totalPages, loading, loadingMore, fetchMovies])

  const clearFilters = () => {
    setGenre(undefined)
    setYear(undefined)
    setSort('popularity.desc')
  }

  const hasActiveFilters = genre || year || sort !== 'popularity.desc'

  return (
    <motion.div
      className="min-h-screen bg-bg-primary pt-20 page-enter"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="max-w-screen-2xl mx-auto px-4 md:px-8">
        {/* Header */}
        <div className="flex items-center justify-between py-6">
          <div>
            <h1 className="font-display font-black text-3xl text-white flex items-center gap-2">
              🎬 Filmes
            </h1>
            <p className="text-text-secondary text-sm mt-1">
              {loading ? 'Carregando...' : `Explore nossa coleção de filmes`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 transition-colors"
              >
                <X className="h-3 w-3" />
                Limpar filtros
              </button>
            )}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors border ${
                showFilters || hasActiveFilters
                  ? 'bg-accent-red border-accent-red text-white'
                  : 'bg-white/5 border-white/10 text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filtros
            </button>
          </div>
        </div>

        {/* Filters panel */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="glass rounded-xl p-4 mb-6 grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            {/* Genre */}
            <div>
              <label className="text-xs text-white/50 mb-1.5 block">Gênero</label>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(MOVIE_GENRES).map(([id, name]) => (
                  <button
                    key={id}
                    onClick={() => setGenre(genre === Number(id) ? undefined : Number(id))}
                    className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
                      genre === Number(id)
                        ? 'bg-accent-red border-accent-red text-white'
                        : 'bg-white/5 border-white/10 text-white/60 hover:text-white hover:border-white/30'
                    }`}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>

            {/* Year */}
            <div>
              <label className="text-xs text-white/50 mb-1.5 block">Ano</label>
              <select
                value={year || ''}
                onChange={(e) => setYear(e.target.value ? Number(e.target.value) : undefined)}
                className="w-full bg-bg-card border border-white/10 rounded-lg px-3 py-2 text-sm text-white appearance-none focus:border-accent-red"
              >
                <option value="">Todos</option>
                {YEARS.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            {/* Sort */}
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

        {/* Grid */}
        {loading ? (
          <SkeletonGrid count={20} />
        ) : (
          <>
            <div className="content-grid">
              {items.map((item, i) => (
                <MovieCard key={`${item.id}-${i}`} item={item} index={i % 20} />
              ))}
            </div>

            {/* Infinite scroll loader */}
            <div ref={loaderRef} className="flex justify-center py-8">
              {loadingMore && <LoadingSpinner />}
            </div>
          </>
        )}
      </div>
    </motion.div>
  )
}

export default Movies
