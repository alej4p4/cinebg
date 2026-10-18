import { useState, useEffect, useMemo } from 'react'
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
  getClassicMovies,
  getClassicShows,
  discoverMovies,
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
  const [classicMovies, setClassicMovies] = useState<MediaItem[]>([])
  const [classicShows, setClassicShows] = useState<MediaItem[]>([])
  const [popularShows, setPopularShows] = useState<MediaItem[]>([])
  const [topShows, setTopShows] = useState<MediaItem[]>([])
  const [airingNow, setAiringNow] = useState<MediaItem[]>([])
  const [animeItems, setAnimeItems] = useState<MediaItem[]>([])
  const [actionMovies, setActionMovies] = useState<MediaItem[]>([])
  const [comedyMovies, setComedyMovies] = useState<MediaItem[]>([])
  const [scifiMovies, setScifiMovies] = useState<MediaItem[]>([])
  const [actionShows, setActionShows] = useState<MediaItem[]>([])
  const [comedyShows, setComedyShows] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(true)

  const { history, favorites } = useAppStore()

  useEffect(() => {
    const load = async () => {
      try {
        const [
          t,
          pm, tom, np, up, cm, cs, ps, ts, a, anime,
          actionM, comedyM, scifiM,
          actionS, comedyS,
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
      } catch (err) {
        console.error('Failed to load home data:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const historyItems: MediaItem[] = history
    .slice(0, 12)
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

  const top10 = trending.slice(0, 10)

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

        <div className="space-y-8 md:space-y-10 py-8 md:py-10">
          {(() => {
            let rowIdx = 0
            return (
              <>
                <AnimatePresence>
                  {historyItems.length > 0 && (
                    <Carousel
                      rowIndex={rowIdx++}
                      title="Continuar Assistindo"
                      emoji="▶️"
                      items={historyItems}
                      getProgress={(item) => progressMap.get(`${item.type}-${item.id}`) ?? 0}
                    />
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
                    {favoriteItems.length > 0 && (
                      <Carousel rowIndex={rowIdx++} title="Lista" emoji="❤️" items={favoriteItems} />
                    )}

                    {top10.length > 0 && (
                      <Carousel rowIndex={rowIdx++} title="Top 10 da Semana" emoji="🏆" items={top10} showRanking />
                    )}

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
      </motion.div>
    </>
  )
}

export default Home
