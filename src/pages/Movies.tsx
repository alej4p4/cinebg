import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Film } from 'lucide-react'
import HeroBanner from '@/components/ui/HeroBanner'
import Carousel from '@/components/ui/Carousel'
import { SkeletonCarousel } from '@/components/ui/SkeletonCard'
import ProgressBar from '@/components/ui/ProgressBar'
import ErrorState from '@/components/ui/ErrorState'
import {
  getPopularMovies,
  getTopRatedMovies,
  getNowPlayingMovies,
  getUpcomingMovies,
} from '@/services/tmdb'
import type { MediaItem } from '@/types'
import { PAGE_VARIANTS } from '@/utils/motion'

const Movies = () => {
  const [popular, setPopular] = useState<MediaItem[]>([])
  const [topRated, setTopRated] = useState<MediaItem[]>([])
  const [nowPlaying, setNowPlaying] = useState<MediaItem[]>([])
  const [upcoming, setUpcoming] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    setLoading(true)
    setError(false)
    const load = async () => {
      try {
        const [popularResult, topResult, nowResult, upcomingResult] = await Promise.all([
          getPopularMovies(),
          getTopRatedMovies(),
          getNowPlayingMovies(),
          getUpcomingMovies(),
        ])
        setPopular(popularResult.items)
        setTopRated(topResult.items)
        setNowPlaying(nowResult.items)
        setUpcoming(upcomingResult.items)
      } catch {
        setError(true)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [reloadKey])

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
        <HeroBanner items={popular} loading={loading} />

        <div className="space-y-6 md:space-y-8 py-8 md:py-10">
          <div className="max-w-screen-2xl mx-auto px-4 md:px-8 flex items-center gap-3 -mt-2">
            <Film className="h-6 w-6 text-accent-red" />
            <h1 className="font-display font-black text-xl md:text-2xl text-white">Filmes</h1>
          </div>

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
              <Carousel title="Mais Bem Avaliados" emoji="⭐" items={topRated} />
              <Carousel title="Em Breve nos Cinemas" emoji="🎥" items={upcoming} />
            </>
          )}
        </div>
      </motion.div>
    </>
  )
}

export default Movies
