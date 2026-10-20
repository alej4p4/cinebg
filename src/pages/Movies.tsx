import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Sparkles, Filter } from 'lucide-react'
import YuCineHero from '@/components/ui/YuCineHero'
import Carousel from '@/components/ui/Carousel'
import MovieCard from '@/components/ui/MovieCard'
import { SkeletonCarousel, SkeletonGrid } from '@/components/ui/SkeletonCard'
import ProgressBar from '@/components/ui/ProgressBar'
import ErrorState from '@/components/ui/ErrorState'
import {
  getPopularMovies,
  getTopRatedMovies,
  getNowPlayingMovies,
  getUpcomingMovies,
  getClassicMovies,
  discoverMovies,
  getCachedCatalogItems,
} from '@/services/tmdb'
import type { MediaItem } from '@/types'
import { PAGE_VARIANTS } from '@/utils/motion'

const MOVIE_GENRES = [
  { id: 28, name: 'Ação' },
  { id: 12, name: 'Aventura' },
  { id: 16, name: 'Animação' },
  { id: 35, name: 'Comédia' },
  { id: 80, name: 'Crime' },
  { id: 99, name: 'Documentário' },
  { id: 18, name: 'Drama' },
  { id: 14, name: 'Fantasia' },
  { id: 27, name: 'Terror' },
  { id: 878, name: 'Ficção Científica' },
  { id: 53, name: 'Suspense' },
  { id: 10752, name: 'Guerra' },
]

const STREAMING_PLATFORMS = [
  { id: 'netflix', name: 'Netflix', providerId: 8, emoji: '🔴' },
  { id: 'hbo', name: 'Max (HBO)', providerId: 384, emoji: '🟣' },
  { id: 'disney', name: 'Disney+', providerId: 337, emoji: '🔵' },
  { id: 'prime', name: 'Prime Video', providerId: 119, emoji: '🟡' },
  { id: 'apple', name: 'Apple TV+', providerId: 350, emoji: '🍏' },
]

const Movies = () => {
  const [popular, setPopular] = useState<MediaItem[]>(() => getCachedCatalogItems('/movie/popular', { page: 1 }, 'movie'))
  const [topRated, setTopRated] = useState<MediaItem[]>(() => getCachedCatalogItems('/movie/top_rated', { page: 1 }, 'movie'))
  const [nowPlaying, setNowPlaying] = useState<MediaItem[]>(() => getCachedCatalogItems('/movie/now_playing', { page: 1 }, 'movie'))
  const [upcoming, setUpcoming] = useState<MediaItem[]>(() => getCachedCatalogItems('/movie/upcoming', { page: 1 }, 'movie'))
  const [classics, setClassics] = useState<MediaItem[]>([])
  const [filteredList, setFilteredList] = useState<MediaItem[]>([])
  const [activeFilter, setActiveFilter] = useState<string | null>(null)
  const [filterTitle, setFilterTitle] = useState<string>('')
  const [showGenreBar, setShowGenreBar] = useState(false)
  const [selectedGenreId, setSelectedGenreId] = useState<number | null>(null)

  const [loading, setLoading] = useState(() => popular.length === 0)
  const [filterLoading, setFilterLoading] = useState(false)
  const [error, setError] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let isMounted = true
    const load = async () => {
      try {
        const [popularResult, topResult, nowResult, upcomingResult, classicsResult] = await Promise.all([
          getPopularMovies(),
          getTopRatedMovies(),
          getNowPlayingMovies(),
          getUpcomingMovies(),
          getClassicMovies(),
        ])
        if (!isMounted) return
        setPopular(popularResult.items)
        setTopRated(topResult.items)
        setNowPlaying(nowResult.items)
        setUpcoming(upcomingResult.items)
        setClassics(classicsResult.items)
      } catch {
        if (isMounted && popular.length === 0) {
          setError(true)
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }
    load()
    return () => {
      isMounted = false
    }
  }, [reloadKey])

  // Filtro por Plataforma (Netflix, HBO, Disney, Prime, Apple)
  const handleFilterPlatform = async (platform: typeof STREAMING_PLATFORMS[0]) => {
    const filterKey = `platform-${platform.id}`
    if (activeFilter === filterKey) {
      handleFilterAll()
      return
    }
    setActiveFilter(filterKey)
    setFilterTitle(`Catálogo ${platform.name}`)
    setShowGenreBar(false)
    setSelectedGenreId(null)
    setFilterLoading(true)
    try {
      const res = await discoverMovies({ withWatchProviders: platform.providerId })
      setFilteredList(res.items)
    } catch {
      setFilteredList([])
    } finally {
      setFilterLoading(false)
    }
  }

  // Filtro por Ano (2026)
  const handleFilterYear = async (year: number) => {
    setActiveFilter(String(year))
    setFilterTitle(`Lançamentos de ${year}`)
    setShowGenreBar(false)
    setSelectedGenreId(null)
    setFilterLoading(true)
    try {
      const res = await discoverMovies({ year })
      setFilteredList(res.items)
    } catch {
      setFilteredList([])
    } finally {
      setFilterLoading(false)
    }
  }

  // Filtro "No Cinema"
  const handleFilterSpecial = () => {
    setActiveFilter('special')
    setFilterTitle('Em Cartaz nos Cinemas')
    setShowGenreBar(false)
    setSelectedGenreId(null)
    setFilteredList(nowPlaying)
  }

  const [selectedDecade, setSelectedDecade] = useState<string>('all')

  // Filtro "Clássicos" com suporte a décadas
  const handleFilterClassics = (decade = 'all') => {
    setActiveFilter('classics')
    setSelectedDecade(decade)
    setShowGenreBar(false)
    setSelectedGenreId(null)
    if (decade === 'all') {
      setFilterTitle('Obras-Primas e Clássicos do Cinema')
      setFilteredList(classics)
      return
    }
    const [start, end] =
      decade === '70s'
        ? [1970, 1979]
        : decade === '80s'
        ? [1980, 1989]
        : decade === '90s'
        ? [1990, 1999]
        : [2000, 2009]
    const label =
      decade === '70s' ? 'Anos 70' : decade === '80s' ? 'Anos 80' : decade === '90s' ? 'Anos 90' : 'Anos 2000'
    setFilterTitle(`Clássicos do Cinema — ${label}`)
    setFilteredList(
      classics.filter((c) => {
        if (!c.releaseDate) return false
        const y = parseInt(c.releaseDate.slice(0, 4), 10)
        return y >= start && y <= end
      }),
    )
  }

  // Filtro "Gênero"
  const handleToggleGenreBar = () => {
    setShowGenreBar((prev) => !prev)
    setActiveFilter('genre')
    setFilterTitle('Filtrar por Gênero')
  }

  const handleSelectGenre = async (genreId: number, genreName: string) => {
    setSelectedGenreId(genreId)
    setFilterTitle(`Filmes de ${genreName}`)
    setFilterLoading(true)
    try {
      const res = await discoverMovies({ genre: genreId })
      setFilteredList(res.items)
    } catch {
      setFilteredList([])
    } finally {
      setFilterLoading(false)
    }
  }

  // Limpar filtros e mostrar todos
  const handleFilterAll = () => {
    setActiveFilter(null)
    setFilteredList([])
    setShowGenreBar(false)
    setSelectedGenreId(null)
  }

  // Slides da aba Filmes: Estritamente FILMES, priorizando lançamentos em cartaz e populares
  const moviesHeroItems = useMemo(() => {
    const pool = [...nowPlaying, ...popular, ...upcoming, ...topRated]
    const seen = new Set<string>()
    const unique: MediaItem[] = []

    for (const item of pool) {
      if (!item || !item.id || !item.backdropPath || item.type !== 'movie') continue
      const key = `movie-${item.id}`
      if (seen.has(key)) continue
      seen.add(key)
      unique.push(item)
    }

    return unique.length > 0 ? unique.slice(0, 10) : popular
  }, [nowPlaying, popular, upcoming, topRated])

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
          type="movie"
          items={moviesHeroItems}
          loading={loading}
          activeFilter={activeFilter}
          onFilterGenre={handleToggleGenreBar}
          onFilterYear={handleFilterYear}
          onFilterClassics={handleFilterClassics}
          onFilterSpecial={handleFilterSpecial}
          onFilterAll={handleFilterAll}
        />

        {/* Barra de Plataformas Populares (Netflix, Max, Disney+, Prime, Apple) */}
        <div className="max-w-screen-2xl mx-auto px-4 md:px-8 mt-2 mb-4">
          <div className="flex items-center gap-2 overflow-x-auto scroll-hide pb-2">
            <span className="text-white/40 text-xs font-bold uppercase tracking-wider flex-shrink-0 flex items-center gap-1.5 mr-1">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" /> Plataformas:
            </span>
            {STREAMING_PLATFORMS.map((platform) => {
              const active = activeFilter === `platform-${platform.id}`
              return (
                <button
                  key={platform.id}
                  onClick={() => handleFilterPlatform(platform)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex-shrink-0 border ${
                    active
                      ? 'bg-white text-black border-white shadow-lg shadow-white/20 scale-105'
                      : 'bg-white/5 text-white/80 hover:bg-white/10 border-white/10 hover:border-white/20'
                  }`}
                >
                  <span>{platform.emoji}</span>
                  <span>{platform.name}</span>
                </button>
              )
            })}
          </div>
        </div>

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
                    <span>Selecione um Gênero de Filme</span>
                  </div>
                  <button
                    onClick={() => setShowGenreBar(false)}
                    className="p-1 text-white/50 hover:text-white rounded-lg hover:bg-white/10"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {MOVIE_GENRES.map((g) => (
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

              {/* Filtro por Década para Clássicos */}
              {activeFilter === 'classics' && (
                <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-4 no-scrollbar">
                  <span className="text-xs text-white/50 font-bold uppercase tracking-wider flex-shrink-0">
                    Década:
                  </span>
                  {[
                    { id: 'all', label: 'Todas as Épocas' },
                    { id: '70s', label: 'Anos 70' },
                    { id: '80s', label: 'Anos 80' },
                    { id: '90s', label: 'Anos 90' },
                    { id: '00s', label: 'Anos 2000' },
                  ].map((d) => (
                    <button
                      key={d.id}
                      onClick={() => handleFilterClassics(d.id)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex-shrink-0 ${
                        selectedDecade === d.id
                          ? 'bg-amber-400 text-black shadow-lg shadow-amber-400/30 font-black scale-105'
                          : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white border border-white/5'
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              )}

              {filterLoading ? (
                <SkeletonGrid count={12} />
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
                  <Carousel title="Em Cartaz nos Cinemas" emoji="🎬" items={nowPlaying} />
                  <Carousel title="Filmes Populares" emoji="🔥" items={popular} />
                  <Carousel title="🏛️ Clássicos Inesquecíveis do Cinema" emoji="👑" items={classics} />
                  <Carousel title="Mais Bem Avaliados" emoji="⭐" items={topRated} />
                  <Carousel title="Em Breve nos Cinemas" emoji="🎥" items={upcoming} />
                </>
              )}
            </>
          )}
        </div>
      </motion.div>
    </>
  )
}

export default Movies
