import { useState, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'
import { getSeasonDetails } from '@/services/tmdb'
import type { TMDBEpisode, TMDBSeason } from '@/types'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

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
  const [open, setOpen] = useState(false)

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
      {/* Season selector */}
      <div className="flex flex-wrap gap-2">
        {realSeasons.map((s) => (
          <button
            key={s.season_number}
            onClick={() => setSelectedSeason(s.season_number)}
            className={`px-3 py-1 text-xs font-medium rounded-full transition-colors border ${
              selectedSeason === s.season_number
                ? 'bg-accent-red border-accent-red text-white'
                : 'bg-white/5 border-white/10 text-white/60 hover:text-white hover:bg-white/10'
            }`}
          >
            T{s.season_number}
          </button>
        ))}
      </div>

      {/* Episodes grid */}
      {loading ? (
        <div className="py-4">
          <LoadingSpinner size="sm" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-1 max-h-60 overflow-y-auto pr-1">
          {episodes.map((ep) => {
            const isCurrent = selectedSeason === currentSeason && ep.episode_number === currentEpisode
            return (
              <button
                key={ep.episode_number}
                onClick={() => onSelect(selectedSeason, ep.episode_number)}
                className={`flex items-start gap-3 p-2 rounded-lg text-left transition-colors ${
                  isCurrent
                    ? 'bg-accent-red/20 border border-accent-red/40 text-white'
                    : 'hover:bg-white/5 text-white/70 hover:text-white border border-transparent'
                }`}
              >
                <span className="text-xs font-bold w-6 flex-shrink-0 mt-0.5 text-white/40">
                  E{ep.episode_number}
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-medium line-clamp-1">{ep.name}</p>
                  {ep.overview && (
                    <p className="text-xs text-white/40 line-clamp-2 mt-0.5">{ep.overview}</p>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default EpisodeSelector
