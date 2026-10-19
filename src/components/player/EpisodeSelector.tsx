import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getSeasonDetails } from '@/services/tmdb'
import type { TMDBEpisode, TMDBSeason } from '@/types'
import { SkeletonEpisodeList } from '@/components/ui/SkeletonCard'
import { SPRING_SNAPPY, FLUID_EASE } from '@/utils/motion'

interface EpisodeSelectorProps {
  showId: number
  seasons: TMDBSeason[]
  currentSeason: number
  currentEpisode: number
  onSelect: (season: number, episode: number) => void
}

const EpisodeSelector = ({
  showId,
  seasons,
  currentSeason,
  currentEpisode,
  onSelect,
}: EpisodeSelectorProps) => {
  const [selectedSeason, setSelectedSeason] = useState(currentSeason)
  const [episodes, setEpisodes] = useState<TMDBEpisode[]>([])
  const [loading, setLoading] = useState(false)

  const realSeasons = seasons.filter((s) => s.season_number > 0)

  useEffect(() => {
    setSelectedSeason(currentSeason)
  }, [currentSeason])

  useEffect(() => {
    setLoading(true)
    getSeasonDetails(showId, selectedSeason)
      .then((data) => setEpisodes(data.episodes || []))
      .finally(() => setLoading(false))
  }, [showId, selectedSeason])

  return (
    <div className="space-y-3">
      {/* Season selector with animated indicator */}
      <div className="flex flex-wrap gap-2">
        {realSeasons.map((s) => (
          <motion.button
            key={s.season_number}
            tabIndex={0}
            onClick={() => setSelectedSeason(s.season_number)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={SPRING_SNAPPY}
            className={`relative px-3 py-1 text-xs font-semibold rounded-full transition-colors border overflow-hidden tv-focusable outline-none ${
              selectedSeason === s.season_number
                ? 'bg-accent-red border-accent-red text-white'
                : 'bg-white/5 border-white/10 text-white/60 hover:text-white hover:bg-white/10'
            }`}
          >
            T{s.season_number}
          </motion.button>
        ))}
      </div>

      {/* Episodes grid with skeleton + stagger */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="skeleton"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
            <SkeletonEpisodeList count={6} />
          </motion.div>
        ) : (
          <motion.div
            key={selectedSeason}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.26, ease: FLUID_EASE }}
            className="grid grid-cols-1 gap-1 max-h-64 overflow-y-auto pr-1 scroll-hide"
          >
            {episodes.map((ep, i) => {
              const isCurrent = selectedSeason === currentSeason && ep.episode_number === currentEpisode
              return (
                <motion.button
                  key={ep.episode_number}
                  tabIndex={0}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.22, delay: i * 0.025, ease: FLUID_EASE }}
                  whileHover={{ x: 3, backgroundColor: 'rgba(255,255,255,0.06)' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onSelect(selectedSeason, ep.episode_number)}
                  className={`flex items-start gap-3 p-2.5 rounded-xl text-left border tv-focusable outline-none ${
                    isCurrent
                      ? 'bg-accent-red/15 border-accent-red/30 text-white'
                      : 'border-transparent text-white/60 hover:text-white'
                  }`}
                >
                  <span className="text-xs font-bold w-6 flex-shrink-0 mt-0.5 text-white/35">
                    E{ep.episode_number}
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold line-clamp-1">{ep.name}</p>
                    {ep.overview && (
                      <p className="text-[11px] text-white/35 line-clamp-2 mt-0.5">{ep.overview}</p>
                    )}
                  </div>
                  {isCurrent && (
                    <span className="ml-auto flex-shrink-0 w-1.5 h-1.5 rounded-full bg-accent-red mt-1" />
                  )}
                </motion.button>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default EpisodeSelector
