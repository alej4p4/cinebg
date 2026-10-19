import { useState, useEffect, useMemo } from 'react'
import { setFocus, doesFocusableExist, SpatialNavigation } from '@noriginmedia/norigin-spatial-navigation'
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

  const { history, favorites, updateHistoryRating } = useAppStore()

  // Enriquecimento de avaliações (estrelas) para itens históricos antigos
  useEffect(() => {
    const unrated = history.filter((h) => !h.rating)
    if (unrated.length === 0 || !updateHistoryRating) return
    let active = true
    unrated.slice(0, 10).forEach(async (h) => {
      try {
        if (h.type === 'movie') {
          const data = await getMovieDetails(h.id)
          if (active && data?.vote_average && updateHistoryRating) {
            updateHistoryRating(h.id, data.vote_average)
          }
        } else {
          const data = await getShowDetails(h.id)
          if (active && data?.vote_average && updateHistoryRating) {
            updateHistoryRating(h.id, data.vote_average)
          }
        }
      } catch {}
    })
    return () => {
      active = false
    }
  }, [history, updateHistoryRating])

  useEffect(() => {
    const load = async () => {
      try {
        const [
          t,
          pm, tom, np, up, cm, cs, ps, ts, a, anime,
          actionM, comedyM, scifiM,
          actionS, comedyS, turkish,
        ] = await Promise.all([
          getTrending('all', 'week'),
          getPopularMovies(),
          getTopRatedMovies(),
          getNowPlayingMovies(),
          getUpcomingMovies(),
          getClassicMovies(),
          getClassicShows(),
          getPopularShows(),
          getTopRatedShows(),
          getAiringToday(),
          discoverShows({ isAnime: true }),
          discoverMovies({ genre: 28, sort: 'popularity.desc' }),
          discoverMovies({ genre: 35, sort: 'popularity.desc' }),
          discoverMovies({ genre: 878, sort: 'popularity.desc' }),
          discoverShows({ genre: 10759, sort: 'popularity.desc' }),
          discoverShows({ genre: 35, sort: 'popularity.desc' }),
          getTurkishShows(),
        ])

        setTrending(t)
        setPopularMovies(pm.items)
        setTopMovies(tom.items)
        setNowPlaying(np.items)
        setUpcoming(up.items)
        setClassicMovies(cm.items)
        setClassicShows(cs.items)
        setPopularShows(ps.items)
        setTopShows(ts.items)
        setAiringNow(a.items)
        setAnimeItems(anime.items)
        setActionMovies(actionM.items)
        setComedyMovies(comedyM.items)
        setScifiMovies(scifiM.items)
        setActionShows(actionS.items)
        setComedyShows(comedyS.items)
        setTurkishShows(turkish.items)
      } catch (err) {
        console.error('Failed to load home data:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // Quando a tela inicial monta ou o catálogo finaliza o carregamento, posiciona o foco/cursor na tela inicial
  useEffect(() => {
    const focusHomeTarget = () => {
      try {
        SpatialNavigation.updateAllLayouts().catch(() => {})
        if (doesFocusableExist('hero-watch-btn')) {
          setFocus('hero-watch-btn')
        } else if (doesFocusableExist('card-0-0')) {
          setFocus('card-0-0')
        } else if (doesFocusableExist('card-1-0')) {
          setFocus('card-1-0')
        }
      } catch {}
    }

    focusHomeTarget()
    const t1 = setTimeout(focusHomeTarget, 100)
    const t2 = setTimeout(focusHomeTarget, 500)
    const t3 = setTimeout(focusHomeTarget, 1200)
    const t4 = setTimeout(focusHomeTarget, 2400)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
      clearTimeout(t4)
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

  const favoriteItems: MediaItem[] = favorites.map((f) => ({
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
  }))

  // Slides do Início: Mescla harmônica de Filmes e Séries priorizando Lançamentos Recentes (2025/2026) e Em Alta
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

    // Ordena priorizando lançamentos mais novos (data de estreia mais recente)
    const sorted = unique.sort((a, b) => {
      const timeA = a.releaseDate ? new Date(a.releaseDate).getTime() : 0
      const timeB = b.releaseDate ? new Date(b.releaseDate).getTime() : 0
      return timeB - timeA
    })

    // Alterna dinamicamente entre filmes e séries
    const movies = sorted.filter((i) => i.type === 'movie')
    const series = sorted.filter((i) => i.type === 'tv')
    const mixed: MediaItem[] = []
    const limit = Math.max(movies.length, series.length)

    for (let i = 0; i < limit; i++) {
      if (movies[i]) mixed.push(movies[i])
      if (series[i]) mixed.push(series[i])
    }

    return mixed.length > 0 ? mixed.slice(0, 10) : trending
  }, [nowPlaying, airingNow, trending, popularMovies, popularShows])

  const top10 = trending.slice(0, 10)

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

                    <Carousel rowIndex={rowIdx++} title="Em Cartaz nos Cinemas" emoji="🎬" items={nowPlaying} />
                    <Carousel rowIndex={rowIdx++} title="Novidades em Filmes" emoji="🆕" items={popularMovies} />
                    <Carousel rowIndex={rowIdx++} title="🏛️ Clássicos Inesquecíveis do Cinema" emoji="👑" items={classicMovies} />
                    <Carousel rowIndex={rowIdx++} title="Filmes Populares" emoji="🔥" items={popularMovies.slice(6)} />
                    <Carousel rowIndex={rowIdx++} title="Filmes de Ação" emoji="💥" items={actionMovies} />
                    <Carousel rowIndex={rowIdx++} title="Comédias" emoji="😂" items={comedyMovies} />
                    <Carousel rowIndex={rowIdx++} title="Ficção Científica" emoji="👽" items={scifiMovies} />
                    <Carousel rowIndex={rowIdx++} title="Mais Bem Avaliados" emoji="⭐" items={topMovies} />
                    <Carousel rowIndex={rowIdx++} title="Em Breve" emoji="🎥" items={upcoming} />
                    <Carousel rowIndex={rowIdx++} title="Séries Populares" emoji="📺" items={popularShows} />
                    {turkishShows.length > 0 && (
                      <Carousel rowIndex={rowIdx++} title="Novelas & Séries Turcas" emoji="🇹🇷" items={turkishShows} />
                    )}
                    <Carousel rowIndex={rowIdx++} title="🏛️ Séries Clássicas & Nostalgia" emoji="👑" items={classicShows} />
                    <Carousel rowIndex={rowIdx++} title="Ação e Aventura em Séries" emoji="⚔️" items={actionShows} />
                    <Carousel rowIndex={rowIdx++} title="Comédia em Séries" emoji="😄" items={comedyShows} />
                    <Carousel rowIndex={rowIdx++} title="Em Exibição Hoje" emoji="🔴" items={airingNow} />
                    <Carousel rowIndex={rowIdx++} title="Top Séries" emoji="⭐" items={topShows} />
                    <Carousel rowIndex={rowIdx++} title="Anime em Destaque" emoji="🃏" items={animeItems} />
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
