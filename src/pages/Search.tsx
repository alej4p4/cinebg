import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search as SearchIcon, X, SlidersHorizontal } from 'lucide-react'
import MovieCard from '@/components/ui/MovieCard'
import { SkeletonGrid } from '@/components/ui/SkeletonCard'
import ErrorState from '@/components/ui/ErrorState'
import { searchMulti } from '@/services/tmdb'
import { MOVIE_GENRES, TV_GENRES, type MediaItem } from '@/types'
import { PAGE_VARIANTS, STAGGER_CONTAINER, STAGGER_ITEM } from '@/utils/motion'

const ALL_GENRES = { ...MOVIE_GENRES, ...TV_GENRES }

const Search = () => {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [error, setError] = useState(false)
  const [selectedGenre, setSelectedGenre] = useState<number | null>(null)
  const [selectedYear, setSelectedYear] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      setSearched(false)
      setError(false)
      return
    }
    const timeout = setTimeout(async () => {
      setLoading(true)
      setSearched(true)
      setError(false)
      try {
        const data = await searchMulti(query)
        let items = data.items
        if (selectedGenre) items = items.filter((i) => i.genreIds.includes(selectedGenre))
        if (selectedYear) items = items.filter((i) => i.releaseDate?.startsWith(selectedYear))
        setResults(items)
      } catch {
        setError(true)
      }
      finally { setLoading(false) }
    }, 420)
    return () => clearTimeout(timeout)
  }, [query, selectedGenre, selectedYear])

  return (
    <motion.div
      className="min-h-screen bg-bg-primary pt-24 pb-12"
      variants={PAGE_VARIANTS}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <div className="max-w-screen-2xl mx-auto px-4 md:px-8">
        {/* Search bar */}
        <div className="relative mb-8 max-w-2xl mx-auto">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/30 pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar filmes, séries, anime..."
            className="w-full bg-[#13131c] border border-white/8 text-white placeholder-white/30 rounded-2xl pl-12 pr-12 py-4 text-base focus:border-accent-red/50 focus:ring-2 focus:ring-accent-red/20 transition-all outline-none"
          />
          <AnimatePresence>
            {query && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.15 }}
                onClick={() => setQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* Filters */}
        <div className="mb-6">
          <button
            onClick={() => setFiltersOpen(!filtersOpen)}
            className={`flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl border transition-all ${
              filtersOpen || selectedGenre || selectedYear
                ? 'bg-accent-red/20 border-accent-red/40 text-accent-red'
                : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
            }`}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filtros
            {(selectedGenre || selectedYear) && (
              <span className="w-2 h-2 rounded-full bg-accent-red" />
            )}
          </button>

          <AnimatePresence>
            {filtersOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="flex flex-wrap gap-3 mt-3 p-4 glass rounded-xl">
                  <select
                    value={selectedGenre ?? ''}
                    onChange={(e) => setSelectedGenre(e.target.value ? Number(e.target.value) : null)}
                    className="bg-[#1c1c28] border border-white/10 text-white text-sm rounded-lg px-3 py-2 outline-none focus:border-accent-red/50"
                  >
                    <option value="">Todos os gêneros</option>
                    {Object.entries(ALL_GENRES).map(([id, name]) => (
                      <option key={id} value={id}>{name}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    placeholder="Ano (ex: 2024)"
                    min="1900"
                    max="2030"
                    className="bg-[#1c1c28] border border-white/10 text-white text-sm rounded-lg px-3 py-2 w-36 outline-none focus:border-accent-red/50"
                  />
                  {(selectedGenre || selectedYear) && (
                    <button
                      onClick={() => { setSelectedGenre(null); setSelectedYear('') }}
                      className="text-sm text-white/50 hover:text-white transition-colors px-2"
                    >
                      Limpar
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Results */}
        {loading ? (
          <SkeletonGrid count={12} />
        ) : error ? (
          <ErrorState message="Não foi possível buscar resultados. Tente novamente." />
        ) : results.length > 0 ? (
          <motion.div
            className="content-grid"
            variants={STAGGER_CONTAINER}
            initial="hidden"
            animate="visible"
          >
            {results.map((item, i) => (
              <motion.div key={item.id} variants={STAGGER_ITEM}>
                <MovieCard item={item} index={i} />
              </motion.div>
            ))}
          </motion.div>
        ) : searched ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="text-center py-24 text-white/40"
          >
            <SearchIcon className="h-16 w-16 mx-auto mb-4 opacity-20" />
            <p className="text-lg font-medium">Nenhum resultado para &ldquo;{query}&rdquo;</p>
            <p className="text-sm mt-1 opacity-60">Tente outro termo de busca</p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="text-center py-24 text-white/30"
          >
            <SearchIcon className="h-16 w-16 mx-auto mb-4 opacity-15" />
            <p className="text-base font-medium">Digite para buscar conteúdo</p>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}

export default Search
