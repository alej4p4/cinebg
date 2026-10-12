import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import HeroBanner from '@/components/ui/HeroBanner'
import Carousel from '@/components/ui/Carousel'
import {
  getTrending,
  getTopRatedMovies,
  getTopRatedShows,
  getAiringToday,
  getPopularMovies,
  getPopularShows,
  getNowPlayingMovies,
  getUpcomingMovies,
  discoverShows,
} from '@/services/tmdb'
import { useAppStore } from '@/store/useAppStore'
import type { MediaItem } from '@/types'

const Home = () => {
  const [trending, setTrending] = useState<MediaItem[]>([])
  const [trendingMovies, setTrendingMovies] = useState<MediaItem[]>([])
  const [popularMovies, setPopularMovies] = useState<MediaItem[]>([])
  const [topMovies, setTopMovies] = useState<MediaItem[]>([])
  const [nowPlaying, setNowPlaying] = useState<MediaItem[]>([])
  const [upcoming, setUpcoming] = useState<MediaItem[]>([])
  const [popularShows, setPopularShows] = useState<MediaItem[]>([])
  const [topShows, setTopShows] = useState<MediaItem[]>([])
  const [airingNow, setAiringNow] = useState<MediaItem[]>([])
  const [animeItems, setAnimeItems] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(true)

  const { history } = useAppStore()

  useEffect(() => {
    const load = async () => {
      try {
        const [
          t,
          tm,
          pm,
          tom,
          np,
          up,
          ps,
          ts,
          a,
          anime,
        ] = await Promise.all([
          getTrending('all', 'week'),
          getTrending('movie', 'week'),
          getPopularMovies(),
          getTopRatedMovies(),
          getNowPlayingMovies(),
          getUpcomingMovies(),
          getPopularShows(),
          getTopRatedShows(),
          getAiringToday(),
          discoverShows({ isAnime: true }),
        ])
        setTrending(t)
        setTrendingMovies(tm)
        setPopularMovies(pm.items)
        setTopMovies(tom.items)
        setNowPlaying(np.items)
        setUpcoming(up.items)
        setPopularShows(ps.items)
        setTopShows(ts.items)
        setAiringNow(a.items)
        setAnimeItems(anime.items)
      } catch (err) {
        console.error('Failed to load home data:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const historyItems: MediaItem[] = history
    .slice()
    .reverse()
    .slice(0, 10)
    .map((h) => ({
      id: h.id,
      title: h.season ? `${h.title} (S${h.season}E${h.episode})` : h.title,
      overview: '',
      posterPath: h.posterPath,
      backdropPath: null,
      releaseDate: '',
      rating: 0,
      voteCount: 0,
      type: h.type,
      genreIds: [],
    }))

  return (
    <motion.div
      className="min-h-screen bg-bg-primary page-enter"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Hero Banner */}
      <HeroBanner items={trending} loading={loading} />

      {/* Content sections */}
      <div className="space-y-10 py-10">
        {/* Continue watching */}
        {historyItems.length > 0 && (
          <Carousel
            title="Continuar Assistindo"
            emoji="▶️"
            items={historyItems}
          />
        )}

        {/* Trending all */}
        <Carousel
          title="Em Alta esta Semana"
          emoji="🔥"
          items={trending}
          loading={loading}
        />

        {/* Now playing */}
        <Carousel
          title="Em Cartaz nos Cinemas"
          emoji="🎭"
          items={nowPlaying}
          loading={loading}
        />

        {/* Popular movies */}
        <Carousel
          title="Filmes Populares"
          emoji="🎬"
          items={popularMovies}
          loading={loading}
        />

        {/* Top rated movies */}
        <Carousel
          title="Filmes Mais Bem Avaliados"
          emoji="🏆"
          items={topMovies}
          loading={loading}
        />

        {/* Upcoming movies */}
        <Carousel
          title="Em Breve nos Cinemas"
          emoji="📅"
          items={upcoming}
          loading={loading}
        />

        {/* Popular shows */}
        <Carousel
          title="Séries Populares"
          emoji="📺"
          items={popularShows}
          loading={loading}
        />

        {/* Airing today */}
        <Carousel
          title="Séries em Exibição Hoje"
          emoji="🔴"
          items={airingNow}
          loading={loading}
        />

        {/* Top rated shows */}
        <Carousel
          title="Top Séries de Todos os Tempos"
          emoji="⭐"
          items={topShows}
          loading={loading}
        />

        {/* Anime */}
        <Carousel
          title="Anime em Destaque"
          emoji="⛩️"
          items={animeItems}
          loading={loading}
        />
      </div>
    </motion.div>
  )
}

export default Home
