import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Star, Calendar, Clock, Film, Tv, Download, Check, Loader2 } from 'lucide-react'
import StreamPlayer from '@/components/player/StreamPlayer'
import EpisodeSelector from '@/components/player/EpisodeSelector'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import GenreBadge from '@/components/ui/GenreBadge'
import { getMovieDetails, getShowDetails, getPosterUrl } from '@/services/tmdb'
import { resolveMegaEmbed } from '@/services/streams'
import { buildFileName, downloadVideo, downloadsSupported } from '@/services/downloads'
import { useAppStore } from '@/store/useAppStore'
import type { DownloadItem, MediaType, TMDBMovieDetails, TMDBShowDetails } from '@/types'

const Watch = () => {
  const { type, id } = useParams<{ type: 'movie' | 'tv' | 'anime'; id: string }>()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { addToHistory, getLastWatched, updateHistoryProgress, addDownload, isDownloaded } = useAppStore()

  const querySeason = Number(searchParams.get('season')) || null
  const queryEpisode = Number(searchParams.get('episode')) || null
  
  const [movieData, setMovieData] = useState<TMDBMovieDetails | null>(null)
  const [showData, setShowData] = useState<TMDBShowDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [season, setSeason] = useState(1)
  const [episode, setEpisode] = useState(1)
  const [resumeAt, setResumeAt] = useState<number | undefined>(undefined)
  const [downloading, setDownloading] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState(0)

  useEffect(() => {
    if (!id || !type) return
    
    const loadDetails = async () => {
      setLoading(true)
      try {
        if (type === 'movie') {
          const data = await getMovieDetails(Number(id))
          setMovieData(data)
          const lastWatched = getLastWatched(data.id)
          setResumeAt(lastWatched?.progress)
          addToHistory({
            id: data.id,
            type: 'movie',
            title: data.title,
            posterPath: data.poster_path,
            watchedAt: Date.now(),
            progress: lastWatched?.progress,
          })
        } else {
          const data = await getShowDetails(Number(id))
          setShowData(data)
          
          // Prioriza o episódio vindo da URL (?season=&episode=), senão continua do histórico
          const lastWatched = getLastWatched(data.id)
          const targetSeason = querySeason || lastWatched?.season || 1
          const targetEpisode = queryEpisode || lastWatched?.episode || 1
          const sameEpisode =
            lastWatched?.season === targetSeason && lastWatched?.episode === targetEpisode

          setSeason(targetSeason)
          setEpisode(targetEpisode)
          setResumeAt(sameEpisode ? lastWatched?.progress : undefined)

          addToHistory({
            id: data.id,
            type,
            title: data.name,
            posterPath: data.poster_path,
            watchedAt: Date.now(),
            season: targetSeason,
            episode: targetEpisode,
            progress: sameEpisode ? lastWatched?.progress : undefined,
          })
        }
      } catch (err) {
        console.error('Failed to load media details:', err)
      } finally {
        setLoading(false)
      }
    }
    
    loadDetails()
  }, [id, type, querySeason, queryEpisode, addToHistory, getLastWatched])

  const handleEpisodeSelect = (s: number, e: number) => {
    setSeason(s)
    setEpisode(e)
    setResumeAt(undefined)
    if (showData) {
      addToHistory({
        id: showData.id,
        type: type as 'tv' | 'anime',
        title: showData.name,
        posterPath: showData.poster_path,
        watchedAt: Date.now(),
        season: s,
        episode: e,
        progress: 0,
      })
    }
  }

  const handleNextEpisode = () => {
    const nextEp = episode + 1
    handleEpisodeSelect(season, nextEp)
  }

  const handleProgress = (seconds: number) => {
    updateHistoryProgress(Number(id), Math.floor(seconds))
  }

  const handleDownload = async () => {
    if (!downloadsSupported()) {
      alert('Downloads estão disponíveis apenas no aplicativo Android.')
      return
    }
    setDownloading(true)
    setDownloadProgress(0)
    try {
      const resolved = await resolveMegaEmbed(
        Number(id),
        type === 'movie' ? 'movie' : 'tv',
        season,
        episode,
      )
      if (!resolved.dubbedMp4) {
        alert('Esta fonte não está disponível para download. Tente novamente mais tarde.')
        return
      }
      const base: DownloadItem = {
        id: Number(id),
        type: type as MediaType,
        title: title || '',
        posterPath: posterPath ?? null,
        season: type === 'movie' ? undefined : season,
        episode: type === 'movie' ? undefined : episode,
        url: resolved.dubbedMp4,
        path: '',
        createdAt: Date.now(),
      }
      const path = await downloadVideo(resolved.dubbedMp4, buildFileName(base), (r) =>
        setDownloadProgress(r),
      )
      addDownload({ ...base, path })
    } catch (err) {
      console.error('Download failed:', err)
      alert('Não foi possível baixar. Verifique sua conexão e tente novamente.')
    } finally {
      setDownloading(false)
      setDownloadProgress(0)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!movieData && !showData) {
    return (
      <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center text-white p-4">
        <h2 className="text-2xl font-bold mb-2">Mídia não encontrada</h2>
        <button onClick={() => navigate(-1)} className="text-accent-red hover:underline mt-4">
          Voltar
        </button>
      </div>
    )
  }

  const isMovie = type === 'movie'
  const title = isMovie ? movieData?.title : showData?.name
  const overview = isMovie ? movieData?.overview : showData?.overview
  const rating = isMovie ? movieData?.vote_average : showData?.vote_average
  const releaseDate = isMovie ? movieData?.release_date : showData?.first_air_date
  const year = releaseDate ? new Date(releaseDate).getFullYear() : ''
  const genres = isMovie ? movieData?.genres : showData?.genres
  const runtime = isMovie ? movieData?.runtime : null
  const posterPath = isMovie ? movieData?.poster_path : showData?.poster_path
  const alreadyDownloaded = isDownloaded(
    Number(id),
    isMovie ? undefined : season,
    isMovie ? undefined : episode,
  )

  const currentSeasonEpisodeCount = Math.max(
    1,
    showData?.seasons?.find((s) => s.season_number === season)?.episode_count || 12
  )

  return (
    <motion.div
      className="min-h-screen bg-bg-primary pt-20 pb-10 page-enter"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="max-w-screen-2xl mx-auto px-4 md:px-8">
        {/* Top Nav */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-white/70 hover:text-white mb-4 transition-colors w-fit px-3 py-1.5 rounded-lg focus:outline-none focus:ring-4 focus:ring-yellow-400 focus:border-yellow-400 focus:text-yellow-400 font-bold"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </button>

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* Main Content (Player) */}
          <div className="flex-1 space-y-6">
            <StreamPlayer
              tmdbId={Number(id)}
              type={type as 'movie' | 'tv' | 'anime'}
              season={season}
              episode={episode}
              title={title || ''}
              onNextEpisode={type !== 'movie' ? handleNextEpisode : undefined}
              startAt={resumeAt}
              onProgress={handleProgress}
              seasons={showData?.seasons}
              onSelectEpisode={handleEpisodeSelect}
            />

            {/* Seletor Horizontal de Temporadas e Episódios (Estilo TV YuCine - Imagem 1) */}
            {!isMovie && showData && showData.seasons && (
              <div className="glass rounded-2xl p-4 md:p-5 space-y-3 border border-white/10">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-display font-black text-white text-base sm:text-lg">
                      Temporada {season}
                    </span>
                    <span className="text-xs text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded-full font-bold">
                      1-{currentSeasonEpisodeCount}
                    </span>
                  </div>

                  {/* Abas de Temporada */}
                  {showData.seasons.filter((s) => s.season_number > 0).length > 1 && (
                    <div className="flex items-center gap-1.5 overflow-x-auto scroll-hide">
                      {showData.seasons
                        .filter((s) => s.season_number > 0)
                        .map((s) => (
                          <button
                            key={s.id}
                            onClick={() => handleEpisodeSelect(s.season_number, 1)}
                            className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all ${
                              season === s.season_number
                                ? 'bg-yellow-400 text-black border-yellow-400 shadow-md shadow-yellow-400/30'
                                : 'bg-white/5 text-white/70 border-white/10 hover:text-white'
                            } focus:outline-none focus:ring-4 focus:ring-yellow-400 focus:border-yellow-400 focus:scale-105`}
                          >
                            T{s.season_number}
                          </button>
                        ))}
                    </div>
                  )}
                </div>

                {/* Lista Horizontal de Episódios com Borda Amarela no Foco */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {Array.from({ length: currentSeasonEpisodeCount }, (_, i) => i + 1).map((epNum) => {
                    const isCurrent = episode === epNum
                    return (
                      <button
                        key={epNum}
                        onClick={() => handleEpisodeSelect(season, epNum)}
                        className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-sm font-black border transition-all ${
                          isCurrent
                            ? 'bg-yellow-400 text-black border-yellow-400 shadow-lg shadow-yellow-400/40 scale-105'
                            : 'bg-[#1b1c28] hover:bg-[#25273a] text-white border-white/10'
                        } focus:outline-none focus:ring-4 focus:ring-yellow-400 focus:border-yellow-400 focus:bg-yellow-400 focus:text-black focus:scale-110`}
                      >
                        {epNum}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Download offline */}
            <div className="flex flex-wrap items-center gap-3 glass rounded-xl px-4 py-3">
              {alreadyDownloaded ? (
                <span className="flex items-center gap-2 text-sm font-semibold text-green-400">
                  <Check className="h-4 w-4" />
                  Baixado — disponível em Downloads
                </span>
              ) : (
                <>
                  <span className="text-sm text-white/70 flex-1 min-w-[200px]">
                    Baixe e assista offline, sem precisar de internet.
                  </span>
                  <button
                    id="watch-download-btn"
                    onClick={handleDownload}
                    disabled={downloading}
                    className="flex items-center gap-2 bg-white/10 hover:bg-white/20 disabled:opacity-60 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors focus:outline-none focus:ring-4 focus:ring-yellow-400 focus:border-yellow-400"
                  >
                    {downloading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                    {downloading
                      ? `Baixando ${Math.round(downloadProgress * 100)}%`
                      : 'Baixar'}
                  </button>
                </>
              )}
            </div>

            {/* Details below player on mobile, hide on desktop if space is tight */}
            <div className="glass rounded-xl p-6">
              <h1 className="font-display font-black text-2xl md:text-3xl text-white mb-3">
                {title} {type !== 'movie' && <span className="text-accent-red text-xl ml-2">S{season}E{episode}</span>}
              </h1>
              
              <div className="flex flex-wrap items-center gap-4 text-sm text-white/70 mb-4">
                {rating && (
                  <span className="flex items-center gap-1 text-accent-gold font-bold">
                    <Star className="h-4 w-4 fill-current" />
                    {rating.toFixed(1)}
                  </span>
                )}
                {year && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {year}
                  </span>
                )}
                {runtime && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {runtime} min
                  </span>
                )}
                <span className="flex items-center gap-1 bg-white/10 px-2 py-0.5 rounded text-white">
                  <Film className="h-3 w-3" />
                  {type === 'movie' ? 'FILME' : type === 'anime' ? 'ANIME' : 'SÉRIE'}
                </span>
              </div>

              {genres && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {genres.map(g => (
                    <GenreBadge key={g.id} name={g.name} />
                  ))}
                </div>
              )}

              <p className="text-white/80 leading-relaxed text-sm md:text-base">
                {overview || 'Sem descrição disponível para este título.'}
              </p>
            </div>
          </div>

          {/* Sidebar */}
          <div className="w-full lg:w-80 xl:w-96 flex-shrink-0 space-y-6">
            {/* Poster (Desktop) */}
            <div className="hidden lg:block glass rounded-xl p-4">
              <img
                src={getPosterUrl(posterPath)}
                alt={title}
                className="w-full rounded-lg shadow-lg"
              />
            </div>

            {/* Episode Selector (TV/Anime) */}
            {!isMovie && showData && (
              <div className="glass rounded-xl p-5 sticky top-24">
                <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                  <Tv className="h-5 w-5 text-accent-red" />
                  Temporadas e Episódios
                </h3>
                <EpisodeSelector
                  showId={showData.id}
                  seasons={showData.seasons}
                  currentSeason={season}
                  currentEpisode={episode}
                  onSelect={handleEpisodeSelect}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default Watch
