import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import HeroBanner from '@/components/ui/HeroBanner'
import Carousel from '@/components/ui/Carousel'
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
  discoverShows,
} from '@/services/tmdb'
import { useAppStore } from '@/store/useAppStore'
import type { MediaItem } from '@/types'
import { PAGE_VARIANTS } from '@/utils/motion'

const Home = () => {
  const [trending, setTrending] = useState<MediaItem[]>([])
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
        const [t, pm, tom, np, up, ps, ts, a, anime] = await Promise.all([
          getTrending('all', 'week'),
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
    <>
      <ProgressBar isLoading={loading} />
      <motion.div
        className="min-h-screen bg-bg-primary"
        variants={PAGE_VARIANTS}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        <HeroBanner items={trending} loading={loading} />

        <div className="space-y-10 py-10">
          <AnimatePresence>
            {historyItems.length > 0 && (
              <Carousel title="Continuar Assistindo" emoji="▶️" items={historyItems} />
            )}
          </AnimatePresence>

          {loading ? (
            <>
              <SkeletonCarousel />
              <SkeletonCarousel />
              <SkeletonCarousel />
            </>
          ) : (
            <>
              <Carousel title="Em Alta esta Semana" emoji="🔥" items={trending} />
              <Carousel title="Em Cartaz nos Cinemas" emoji="🎭" items={nowPlaying} />
              <Carousel title="Filmes Populares" emoji="🎬" items={popularMovies} />
              <Carousel title="Mais Bem Avaliados" emoji="🏆" items={topMovies} />
              <Carousel title="Em Breve nos Cinemas" emoji="📅" items={upcoming} />
              <Carousel title="Séries Populares" emoji="📺" items={popularShows} />
              <Carousel title="Em Exibição Hoje" emoji="🔴" items={airingNow} />
              <Carousel title="Top Séries de Todos os Tempos" emoji="⭐" items={topShows} />
              <Carousel title="Anime em Destaque" emoji="⛩️" items={animeItems} />
            </>
          )}
        </div>
      </motion.div>
    </>
  )
}

export default Home
