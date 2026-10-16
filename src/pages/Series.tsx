import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Sparkles, Filter } from 'lucide-react'
import YuCineHero from '@/components/ui/YuCineHero'
import Carousel from '@/components/ui/Carousel'
import MovieCard from '@/components/ui/MovieCard'
import { SkeletonCarousel } from '@/components/ui/SkeletonCard'
import ProgressBar from '@/components/ui/ProgressBar'
import ErrorState from '@/components/ui/ErrorState'
import {
  getPopularShows,
  getTopRatedShows,
  getAiringToday,
  discoverShows,
} from '@/services/tmdb'
import type { MediaItem } from '@/types'
import { PAGE_VARIANTS } from '@/utils/motion'

const SERIES_GENRES = [
  { id: 10759, name: 'Ação & Aventura' },
  { id: 16, name: 'Animação' },
  { id: 35, name: 'Comédia' },
  { id: 80, name: 'Crime' },
  { id: 99, name: 'Documentário' },
  { id: 18, name: 'Drama' },
  { id: 10751, name: 'Família' },
  { id: 9648, name: 'Mistério' },
  { id: 10765, name: 'Sci-Fi & Fantasia' },
  { id: 10768, name: 'Guerra & Política' },
]

const Series = () => {
  const [popular, setPopular] = useState<MediaItem[]>([])
  const [topRated, setTopRated] = useState<MediaItem[]>([])
  const [airingToday, setAiringToday] = useState<MediaItem[]>([])
  const [filteredList, setFilteredList] = useState<MediaItem[]>([])
  const [activeFilter, setActiveFilter] = useState<string | null>(null)
  const [filterTitle, setFilterTitle] = useState<string>('')
  const [showGenreBar, setShowGenreBar] = useState(false)
  const [selectedGenreId, setSelectedGenreId] = useState<number | null>(null)

  const [loading, setLoading] = useState(true)
  const [filterLoading, setFilterLoading] = useState(false)
  const [error, setError] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    setLoading(true)
    setError(false)
    const load = async () => {
      try {
        const [popularResult, topResult, airingResult] = await Promise.all([
          getPopularShows(),
          getTopRatedShows(),
          getAiringToday(),
        ])
        setPopular(popularResult.items)
        setTopRated(topResult.items)
        setAiringToday(airingResult.items)
      } catch {
        setError(true)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [reloadKey])

  // Filtro por Ano (2026)
  const handleFilterYear = async (year: number) => {
    setActiveFilter(String(year))
    setFilterTitle(`Séries de ${year}`)
    setShowGenreBar(false)
    setSelectedGenreId(null)
    setFilterLoading(true)
    try {
      const res = await discoverShows({ year })
      setFilteredList(res.items)
    } catch {
      setFilteredList([])
    } finally {
      setFilterLoading(false)
    }
  }

  // Filtro "Em Alta"
  const handleFilterSpecial = () => {
    setActiveFilter('special')
    setFilterTitle('Séries em Exibição Hoje')
    setShowGenreBar(false)
    setSelectedGenreId(null)
    setFilteredList(airingToday)
  }

  // Filtro "Gênero"
  const handleToggleGenreBar = () => {
    setShowGenreBar((prev) => !prev)
    setActiveFilter('genre')
    setFilterTitle('Filtrar por Gênero')
  }

  const handleSelectGenre = async (genreId: number, genreName: string) => {
    setSelectedGenreId(genreId)
    setFilterTitle(`Séries de ${genreName}`)
    setFilterLoading(true)
    try {
      const res = await discoverShows({ genre: genreId })
      setFilteredList(res.items)
    } catch {
      setFilteredList([])
    } finally {
      setFilterLoading(false)
    }
  }

  // Limpar filtros e mostrar todas
  const handleFilterAll = () => {
    setActiveFilter(null)
    setFilteredList([])
    setShowGenreBar(false)
    setSelectedGenreId(null)
  }

  return (
    <>
      <ProgressBar isLoading={loading || filterLoading} />
      <motion.div
        className="min-h-screen bg-bg-primary pb-16"
        variants={PAGE_VARIANTS}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        {/* Banner Hero no Estilo YuCine (Imagem 1) */}
        <YuCineHero
          type="tv"
          items={popular}
          loading={loading}
          activeFilter={activeFilter}
          onFilterGenre={handleToggleGenreBar}
          onFilterYear={handleFilterYear}
          onFilterSpecial={handleFilterSpecial}
          onFilterAll={handleFilterAll}
        />

        {/* Barra de Gêneros Desdobrável quando "Gênero" é clicado */}
        <AnimatePresence>
          {showGenreBar && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="max-w-screen-2xl mx-auto px-4 md:px-8 mb-6 overflow-hidden"
            >
              <div className="bg-[#12131e] p-4 rounded-2xl border border-white/10 shadow-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-white font-bold text-sm">
                    <Filter className="h-4 w-4 text-[#ff4081]" />
                    <span>Selecione um Gênero de Série</span>
                  </div>
                  <button
                    onClick={() => setShowGenreBar(false)}
                    className="p-1 text-white/50 hover:text-white rounded-lg hover:bg-white/10"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {SERIES_GENRES.map((g) => (
                    <button
                      key={g.id}
                      onClick={() => handleSelectGenre(g.id, g.name)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                        selectedGenreId === g.id
                          ? 'bg-[#ff4081] text-white shadow-lg shadow-pink-900/50 scale-105'
                          : 'bg-white/5 text-white/70 hover:bg-white/15 hover:text-white border border-white/5'
                      }`}
                    >
                      {g.name}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Visualização Filtrada ou Carrosséis Originais */}
        <div className="space-y-6 md:space-y-8 py-4">
          {activeFilter && (
            <div className="max-w-screen-2xl mx-auto px-4 md:px-8">
              <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-2xl px-5 py-3 mb-6">
                <div className="flex items-center gap-2.5">
                  <Sparkles className="h-5 w-5 text-amber-400" />
                  <span className="text-white font-black text-lg">{filterTitle}</span>
                  <span className="text-white/40 text-xs">({filteredList.length} títulos)</span>
                </div>
                <button
                  onClick={handleFilterAll}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-colors"
                >
                  <X className="h-4 w-4" />
                  Ver todos os carrosséis
                </button>
              </div>

              {filterLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div key={i} className="aspect-[2/3] bg-white/5 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {filteredList.map((item, index) => (
                    <MovieCard key={item.id} item={item} index={index} />
                  ))}
                </div>
              )}
            </div>
          )}

          {!activeFilter && (
            <>
              {loading ? (
                <>
                  <SkeletonCarousel />
                  <SkeletonCarousel />
                  <SkeletonCarousel />
                </>
              ) : error ? (
                <div className="max-w-screen-2xl mx-auto px-4 md:px-8">
                  <ErrorState onRetry={() => setReloadKey((k) => k + 1)} />
                </div>
              ) : (
                <>
                  <Carousel title="Séries Populares" emoji="📺" items={popular} />
                  <Carousel title="Em Exibição Hoje" emoji="🔴" items={airingToday} />
                  <Carousel title="Top Séries de Todos os Tempos" emoji="⭐" items={topRated} />
                </>
              )}
            </>
          )}
        </div>
      </motion.div>
    </>
  )
}

export default Series
