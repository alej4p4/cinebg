import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Sparkles, Filter } from 'lucide-react'
import YuCineHero from '@/components/ui/YuCineHero'
import Carousel from '@/components/ui/Carousel'
import MovieCard from '@/components/ui/MovieCard'
import Focusable from '@/components/tv/Focusable'
import { setFocus, doesFocusableExist } from '@noriginmedia/norigin-spatial-navigation'
import { SkeletonCarousel, SkeletonGrid } from '@/components/ui/SkeletonCard'
import ProgressBar from '@/components/ui/ProgressBar'
import ErrorState from '@/components/ui/ErrorState'
import {
  getPopularShows,
  getTopRatedShows,
  getAiringToday,
  getClassicShows,
  getTurkishShows,
  discoverShows,
  getCachedCatalogItems,
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

interface StreamingPlatform {
  id: string
  name: string
  providerId: number
  networkId: number
  emoji: string
  isTurkish?: boolean
}

const STREAMING_PLATFORMS: StreamingPlatform[] = [
  { id: 'turkish', name: 'Novelas Turcas', providerId: 0, networkId: 0, emoji: '🇹🇷', isTurkish: true },
  { id: 'netflix', name: 'Netflix', providerId: 8, networkId: 213, emoji: '🔴' },
  { id: 'hbo', name: 'Max (HBO)', providerId: 384, networkId: 49, emoji: '🟣' },
  { id: 'disney', name: 'Disney+', providerId: 337, networkId: 2739, emoji: '🔵' },
  { id: 'prime', name: 'Prime Video', providerId: 119, networkId: 1024, emoji: '🟡' },
  { id: 'apple', name: 'Apple TV+', providerId: 350, networkId: 2552, emoji: '🍏' },
]

const Series = () => {
  const [popular, setPopular] = useState<MediaItem[]>(() => getCachedCatalogItems('/tv/popular', { page: 1 }, 'tv'))
  const [topRated, setTopRated] = useState<MediaItem[]>(() => getCachedCatalogItems('/tv/top_rated', { page: 1 }, 'tv'))
  const [airingToday, setAiringToday] = useState<MediaItem[]>(() => getCachedCatalogItems('/tv/airing_today', { page: 1 }, 'tv'))
  const [classics, setClassics] = useState<MediaItem[]>([])
  const [turkish, setTurkish] = useState<MediaItem[]>([])
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
        const [popularResult, topResult, airingResult, classicsResult, turkishResult] = await Promise.all([
          getPopularShows(),
          getTopRatedShows(),
          getAiringToday(),
          getClassicShows(),
          getTurkishShows(),
        ])
        if (!isMounted) return
        setPopular(popularResult.items)
        setTopRated(topResult.items)
        setAiringToday(airingResult.items)
        setClassics(classicsResult.items)
        setTurkish(turkishResult.items)
      } catch {
        if (isMounted) {
          setPopular((current) => {
            if (current.length === 0) {
              setError(true)
            }
            return current
          })
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

  // Filtro por Plataforma (Netflix, HBO, Disney, Prime, Apple, Novelas Turcas)
  const handleFilterPlatform = async (platform: StreamingPlatform) => {
    const filterKey = `platform-${platform.id}`
    if (activeFilter === filterKey) {
      handleFilterAll()
      return
    }
    setActiveFilter(filterKey)
    setFilterTitle(platform.id === 'turkish' ? 'Novelas & Séries Turcas' : `Séries ${platform.name}`)
    setShowGenreBar(false)
    setSelectedGenreId(null)
    setFilterLoading(true)
    try {
      if (platform.isTurkish) {
        const res = await getTurkishShows()
        setFilteredList(res.items)
      } else {
        const res = await discoverShows({ withNetworks: platform.networkId, withWatchProviders: platform.providerId })
        setFilteredList(res.items)
      }
    } catch {
      setFilteredList([])
    } finally {
      setFilterLoading(false)
    }
  }

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

  const [selectedDecade, setSelectedDecade] = useState<string>('all')

  // Filtro "Clássicos" com suporte a décadas
  const handleFilterClassics = (decade = 'all') => {
    setActiveFilter('classics')
    setSelectedDecade(decade)
    setShowGenreBar(false)
    setSelectedGenreId(null)
    if (decade === 'all') {
      setFilterTitle('Séries Clássicas & Nostalgia')
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
    setFilterTitle(`Séries Clássicas — ${label}`)
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
    setShowGenreBar((prev) => {
      const next = !prev
      if (next) {
        setTimeout(() => {
          if (doesFocusableExist('series-genre-10759')) setFocus('series-genre-10759')
        }, 80)
      }
      return next
    })
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

  // Slides da aba Séries: Estritamente SÉRIES, priorizando lançamentos em exibição e populares
  const seriesHeroItems = useMemo(() => {
    const pool = [...airingToday, ...popular, ...topRated]
    const seen = new Set<string>()
    const unique: MediaItem[] = []

    for (const item of pool) {
      if (!item || !item.id || !item.backdropPath || item.type !== 'tv') continue
      const key = `tv-${item.id}`
      if (seen.has(key)) continue
      seen.add(key)
      unique.push(item)
    }

    return unique.length > 0 ? unique.slice(0, 10) : popular
  }, [airingToday, popular, topRated])

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
          items={seriesHeroItems}
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
                <Focusable
                  key={platform.id}
                  focusKey={`series-platform-${platform.id}`}
                  onEnterPress={() => handleFilterPlatform(platform)}
                  className="rounded-full flex-shrink-0"
                >
                  <button
                    onClick={() => handleFilterPlatform(platform)}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex-shrink-0 border outline-none focus:ring-2 focus:ring-amber-400 ${
                      active
                        ? 'bg-white text-black border-white shadow-lg shadow-white/20 scale-105'
                        : 'bg-white/5 text-white/80 hover:bg-white/10 border-white/10 hover:border-white/20'
                    }`}
                  >
                    <span>{platform.emoji}</span>
                    <span>{platform.name}</span>
                  </button>
                </Focusable>
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
                    <Focusable
                      key={g.id}
                      focusKey={`series-genre-${g.id}`}
                      onEnterPress={() => handleSelectGenre(g.id, g.name)}
                      className="rounded-full"
                    >
                      <button
                        onClick={() => handleSelectGenre(g.id, g.name)}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all outline-none focus:ring-2 focus:ring-amber-400 ${
                          selectedGenreId === g.id
                            ? 'bg-[#ff4081] text-white shadow-lg shadow-pink-900/50 scale-105'
                            : 'bg-white/5 text-white/70 hover:bg-white/15 hover:text-white border border-white/5'
                        }`}
                      >
                        {g.name}
                      </button>
                    </Focusable>
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
                <Focusable focusKey="series-clear-filter" onEnterPress={handleFilterAll} className="rounded-xl">
                  <button
                    onClick={handleFilterAll}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-colors outline-none focus:ring-2 focus:ring-amber-400"
                  >
                    <X className="h-4 w-4" />
                    Ver todos os carrosséis
                  </button>
                </Focusable>
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
                    <Focusable
                      key={d.id}
                      focusKey={`series-decade-${d.id}`}
                      onEnterPress={() => handleFilterClassics(d.id)}
                      className="rounded-full flex-shrink-0"
                    >
                      <button
                        onClick={() => handleFilterClassics(d.id)}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex-shrink-0 outline-none focus:ring-2 focus:ring-amber-400 ${
                          selectedDecade === d.id
                            ? 'bg-amber-400 text-black shadow-lg shadow-amber-400/30 font-black scale-105'
                            : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white border border-white/5'
                        }`}
                      >
                        {d.label}
                      </button>
                    </Focusable>
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
                  <Carousel title="Séries Populares" emoji="📺" items={popular} />
                  {turkish.length > 0 && (
                    <Carousel title="Novelas & Séries Turcas" emoji="🇹🇷" items={turkish} />
                  )}
                  <Carousel title="🏛️ Séries Clássicas & Nostalgia" emoji="👑" items={classics} />
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
