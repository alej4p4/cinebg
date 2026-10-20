import { useState, useEffect, useMemo, useRef } from 'react'
import {
  setFocus,
  doesFocusableExist,
  getCurrentFocusKey,
  ROOT_FOCUS_KEY,
  SpatialNavigation,
} from '@noriginmedia/norigin-spatial-navigation'
import HeroBanner from '@/components/ui/HeroBanner'
import Carousel from '@/components/ui/Carousel'
import LiveTvCarousel from '@/components/tv/LiveTvCarousel'
import { SkeletonCarousel } from '@/components/ui/SkeletonCard'
import ProgressBar from '@/components/ui/ProgressBar'
import {
  getTrending,
  getTopRatedMovies,
  getTopRatedShows,
  getAiringToday,
  getPopularMovies,
  getPopularShows,
  getNowPlayingMovies,
  getUpcomingMovies,
  getClassicMovies,
  getClassicShows,
  discoverMovies,
  discoverShows,
  getTurkishShows,
  getCachedCatalogItems,
  getMovieDetails,
  getShowDetails,
  getCachedMediaDetails,
} from '@/services/tmdb'
import { useAppStore } from '@/store/useAppStore'
import type { MediaItem, TMDBMovieDetails, TMDBShowDetails } from '@/types'

const Home = () => {
  const [trending, setTrending] = useState<MediaItem[]>(() => getCachedCatalogItems('/trending/all/week', {}, 'movie'))
  const [popularMovies, setPopularMovies] = useState<MediaItem[]>(() => getCachedCatalogItems('/movie/popular', { page: 1 }, 'movie'))
  const [topMovies, setTopMovies] = useState<MediaItem[]>(() => getCachedCatalogItems('/movie/top_rated', { page: 1 }, 'movie'))
  const [nowPlaying, setNowPlaying] = useState<MediaItem[]>(() => getCachedCatalogItems('/movie/now_playing', { page: 1 }, 'movie'))
  const [upcoming, setUpcoming] = useState<MediaItem[]>(() => getCachedCatalogItems('/movie/upcoming', { page: 1 }, 'movie'))
  const [classicMovies, setClassicMovies] = useState<MediaItem[]>([])
  const [classicShows, setClassicShows] = useState<MediaItem[]>([])
  const [popularShows, setPopularShows] = useState<MediaItem[]>(() => getCachedCatalogItems('/tv/popular', { page: 1 }, 'tv'))
  const [topShows, setTopShows] = useState<MediaItem[]>(() => getCachedCatalogItems('/tv/top_rated', { page: 1 }, 'tv'))
  const [airingNow, setAiringNow] = useState<MediaItem[]>(() => getCachedCatalogItems('/tv/airing_today', { page: 1 }, 'tv'))
  const [animeItems, setAnimeItems] = useState<MediaItem[]>([])
  const [actionMovies, setActionMovies] = useState<MediaItem[]>([])
  const [comedyMovies, setComedyMovies] = useState<MediaItem[]>([])
  const [scifiMovies, setScifiMovies] = useState<MediaItem[]>([])
  const [actionShows, setActionShows] = useState<MediaItem[]>([])
  const [comedyShows, setComedyShows] = useState<MediaItem[]>([])
  const [turkishShows, setTurkishShows] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(() => trending.length === 0)
  const userNavigatedRef = useRef(false)

  const { history, favorites, updateHistoryRating } = useAppStore()

  // Enriquecimento de avaliações em background ocioso (limitado e sequencial para não travar a Main Thread da TV)
  useEffect(() => {
    const unrated = history.filter((h) => !h.rating).slice(0, 4)
    if (unrated.length === 0 || !updateHistoryRating) return
    let active = true

    const timer = setTimeout(async () => {
      for (const h of unrated) {
        if (!active) break
        try {
          if (h.type === 'movie') {
            const data = await getMovieDetails(h.id)
            if (active && data?.vote_average) {
              updateHistoryRating(h.id, data.vote_average)
            }
          } else {
            const data = await getShowDetails(h.id)
            if (active && data?.vote_average) {
              updateHistoryRating(h.id, data.vote_average)
            }
          }
        } catch {}
      }
    }, 1800)

    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [history, updateHistoryRating])

  // Carregamento escalonado em 2 Estágios (Evita pico de CPU/ANR na Main Thread da Android TV / Fire TV)
  useEffect(() => {
    let active = true
    let secondaryTimer: ReturnType<typeof setTimeout> | null = null

    const loadStage1And2 = async () => {
      try {
        // Estágio 1: Apenas conteúdo visível no topo (Above the Fold) para liberação instantânea da UI
        const [t, pm, np, ps, a] = await Promise.all([
          getTrending('all', 'week'),
          getPopularMovies(),
          getNowPlayingMovies(),
          getPopularShows(),
          getAiringToday(),
        ])

        if (!active) return
        setTrending(t)
        setPopularMovies(pm.items)
        setNowPlaying(np.items)
        setPopularShows(ps.items)
        setAiringNow(a.items)
        setLoading(false)

        // Estágio 2: Categorias secundárias carregadas em background sem bloquear a navegação D-Pad
        secondaryTimer = setTimeout(async () => {
          if (!active) return
          try {
            const [tom, up, ts, turkish, actionM, comedyM] = await Promise.all([
              getTopRatedMovies(),
              getUpcomingMovies(),
              getTopRatedShows(),
              getTurkishShows(),
              discoverMovies({ genre: 28, sort: 'popularity.desc' }),
              discoverMovies({ genre: 35, sort: 'popularity.desc' }),
            ])
            if (!active) return
            setTopMovies(tom.items)
            setUpcoming(up.items)
            setTopShows(ts.items)
            setTurkishShows(turkish.items)
            setActionMovies(actionM.items)
            setComedyMovies(comedyM.items)

            const [cm, cs, anime, scifiM, actionS, comedyS] = await Promise.all([
              getClassicMovies(),
              getClassicShows(),
              discoverShows({ isAnime: true }),
              discoverMovies({ genre: 878, sort: 'popularity.desc' }),
              discoverShows({ genre: 10759, sort: 'popularity.desc' }),
              discoverShows({ genre: 35, sort: 'popularity.desc' }),
            ])
            if (!active) return
            setClassicMovies(cm.items)
            setClassicShows(cs.items)
            setAnimeItems(anime.items)
            setScifiMovies(scifiM.items)
            setActionShows(actionS.items)
            setComedyShows(comedyS.items)
          } catch {}
        }, 280)
      } catch (err) {
        console.error('Failed to load home data:', err)
      } finally {
        if (active) setLoading(false)
      }
    }

    loadStage1And2()
    return () => {
      active = false
      if (secondaryTimer) clearTimeout(secondaryTimer)
    }
  }, [])

  // Posiciona o foco inicial APENAS se o usuário ainda não tiver navegado pelo controle remoto (Zero Focus Stealing)
  useEffect(() => {
    const onUserKey = () => {
      userNavigatedRef.current = true
    }
    window.addEventListener('keydown', onUserKey, { once: true, passive: true })

    const focusHomeTarget = () => {
      if (userNavigatedRef.current) return
      try {
        const currentKey = getCurrentFocusKey()
        if (currentKey && currentKey !== ROOT_FOCUS_KEY && doesFocusableExist(currentKey)) {
          return
        }
        SpatialNavigation.updateAllLayouts().catch(() => {})
        if (doesFocusableExist('hero-watch-btn')) {
          setFocus('hero-watch-btn')
        } else if (doesFocusableExist('card-0-0')) {
          setFocus('card-0-0')
        }
      } catch {}
    }

    focusHomeTarget()
    const t1 = setTimeout(focusHomeTarget, 120)
    const t2 = setTimeout(focusHomeTarget, 450)
    return () => {
      window.removeEventListener('keydown', onUserKey)
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [loading])

  const historyItems: MediaItem[] = useMemo(() => {
    return history
      .slice(0, 12)
      .map((h) => {
        let rating = h.rating || 0
        if (!rating) {
          const cached = getCachedMediaDetails<TMDBMovieDetails | TMDBShowDetails>(h.id, h.type)
          if (cached?.vote_average) {
            rating = cached.vote_average
          }
        }
        return {
          id: h.id,
          title: h.season ? `${h.title} (S${h.season}E${h.episode})` : h.title,
          overview: '',
          posterPath: h.posterPath,
          backdropPath: null,
          releaseDate: '',
          rating,
          voteCount: 0,
          type: h.type,
          genreIds: [],
        }
      })
  }, [history])

  const progressMap = useMemo(() => {
    const map = new Map<string, number>()
    history.slice(0, 12).forEach((h) => {
      if (typeof h.progress === 'number') map.set(`${h.type}-${h.id}`, h.progress)
    })
    return map
  }, [history])

  const favoriteItems: MediaItem[] = useMemo(
    () =>
      favorites.slice(0, 16).map((f) => ({
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
      })),
    [favorites]
  )

  const homeHeroItems = useMemo(() => {
    const pool = [...nowPlaying, ...airingNow, ...trending, ...popularMovies, ...popularShows]
    const seen = new Set<string>()
    const unique: MediaItem[] = []

    for (const item of pool) {
      if (!item || !item.id || !item.backdropPath) continue
      const key = `${item.type}-${item.id}`
      if (seen.has(key)) continue
      seen.add(key)
      unique.push(item)
    }

    const sorted = unique.sort((a, b) => {
      const timeA = a.releaseDate ? new Date(a.releaseDate).getTime() : 0
      const timeB = b.releaseDate ? new Date(b.releaseDate).getTime() : 0
      return timeB - timeA
    })

    const movies = sorted.filter((i) => i.type === 'movie')
    const series = sorted.filter((i) => i.type === 'tv')
    const mixed: MediaItem[] = []
    const limit = Math.max(movies.length, series.length)

    for (let i = 0; i < limit; i++) {
      if (movies[i]) mixed.push(movies[i])
      if (series[i]) mixed.push(series[i])
    }

    return mixed.length > 0 ? mixed.slice(0, 8) : trending.slice(0, 8)
  }, [nowPlaying, airingNow, trending, popularMovies, popularShows])

  const top10 = useMemo(() => trending.slice(0, 10), [trending])

  return (
    <>
      <ProgressBar isLoading={loading} />
      <div className="min-h-screen bg-bg-primary">
        <HeroBanner items={homeHeroItems} loading={loading} />

        <div className="space-y-8 md:space-y-10 py-8 md:py-10">
          {(() => {
            let rowIdx = 0
            return (
              <>
                {historyItems.length > 0 && (
                  <Carousel
                    rowIndex={rowIdx++}
                    title="Continuar Assistindo"
                    emoji="▶️"
                    items={historyItems}
                    getProgress={(item) => progressMap.get(`${item.type}-${item.id}`) ?? 0}
                  />
                )}

                {loading ? (
                  <>
                    <SkeletonCarousel />
                    <SkeletonCarousel />
                    <SkeletonCarousel />
                  </>
                ) : (
                  <>
                    {favoriteItems.length > 0 && (
                      <Carousel rowIndex={rowIdx++} title="Lista" emoji="❤️" items={favoriteItems} />
                    )}

                    {top10.length > 0 && (
                      <Carousel rowIndex={rowIdx++} title="Top 10 da Semana" emoji="🏆" items={top10} showRanking />
                    )}

                    <LiveTvCarousel rowIndex={rowIdx++} />

                    {nowPlaying.length > 0 && (
                      <Carousel rowIndex={rowIdx++} title="Em Cartaz nos Cinemas" emoji="🎬" items={nowPlaying} />
                    )}
                    {popularMovies.length > 0 && (
                      <Carousel rowIndex={rowIdx++} title="Novidades em Filmes" emoji="🆕" items={popularMovies} />
                    )}
                    {popularShows.length > 0 && (
                      <Carousel rowIndex={rowIdx++} title="Séries Populares" emoji="📺" items={popularShows} />
                    )}
                    {turkishShows.length > 0 && (
                      <Carousel rowIndex={rowIdx++} title="Novelas & Séries Turcas" emoji="🇹🇷" items={turkishShows} />
                    )}
                    {airingNow.length > 0 && (
                      <Carousel rowIndex={rowIdx++} title="Em Exibição Hoje" emoji="🔴" items={airingNow} />
                    )}
                    {actionMovies.length > 0 && (
                      <Carousel rowIndex={rowIdx++} title="Filmes de Ação" emoji="💥" items={actionMovies} />
                    )}
                    {comedyMovies.length > 0 && (
                      <Carousel rowIndex={rowIdx++} title="Comédias" emoji="😂" items={comedyMovies} />
                    )}
                    {topMovies.length > 0 && (
                      <Carousel rowIndex={rowIdx++} title="Mais Bem Avaliados" emoji="⭐" items={topMovies} />
                    )}
                    {upcoming.length > 0 && (
                      <Carousel rowIndex={rowIdx++} title="Em Breve" emoji="🎥" items={upcoming} />
                    )}
                    {classicMovies.length > 0 && (
                      <Carousel rowIndex={rowIdx++} title="🏛️ Clássicos Inesquecíveis do Cinema" emoji="👑" items={classicMovies} />
                    )}
                    {classicShows.length > 0 && (
                      <Carousel rowIndex={rowIdx++} title="🏛️ Séries Clássicas & Nostalgia" emoji="👑" items={classicShows} />
                    )}
                    {actionShows.length > 0 && (
                      <Carousel rowIndex={rowIdx++} title="Ação e Aventura em Séries" emoji="⚔️" items={actionShows} />
                    )}
                    {comedyShows.length > 0 && (
                      <Carousel rowIndex={rowIdx++} title="Comédia em Séries" emoji="😄" items={comedyShows} />
                    )}
                    {scifiMovies.length > 0 && (
                      <Carousel rowIndex={rowIdx++} title="Ficção Científica" emoji="👽" items={scifiMovies} />
                    )}
                    {topShows.length > 0 && (
                      <Carousel rowIndex={rowIdx++} title="Top Séries" emoji="⭐" items={topShows} />
                    )}
                    {animeItems.length > 0 && (
                      <Carousel rowIndex={rowIdx++} title="Anime em Destaque" emoji="🃏" items={animeItems} />
                    )}
                  </>
                )}
              </>
            )
          })()}
        </div>
      </div>
    </>
  )
}

export default Home
