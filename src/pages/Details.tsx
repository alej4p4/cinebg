import { useState, useEffect, useRef, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Play, Star, Heart,
  Tv, X, Check, Maximize2, MessageSquare, Sliders, Download,
  ChevronLeft, ChevronRight,
} from 'lucide-react'
import { SkeletonDetailPage } from '@/components/ui/SkeletonCard'
import ProgressBar from '@/components/ui/ProgressBar'
import { PAGE_VARIANTS } from '@/utils/motion'
import Focusable from '@/components/tv/Focusable'
import { setFocus, doesFocusableExist } from '@noriginmedia/norigin-spatial-navigation'
import {
  getMovieDetails, getShowDetails,
  getBackdropUrl,
  getCachedMediaDetails,
} from '@/services/tmdb'
import { useAppStore } from '@/store/useAppStore'
import { downloadsSupported, buildFileName, downloadVideo } from '@/services/downloads'
import { resolveMegaEmbed } from '@/services/streams'
import type { TMDBMovieDetails, TMDBShowDetails, TMDBVideo, DownloadItem, MediaType } from '@/types'

const Details = () => {
  const { type, id } = useParams<{ type: 'movie' | 'tv' | 'anime'; id: string }>()
  const navigate = useNavigate()
  const {
    addFavorite,
    removeFavorite,
    isFavorite,
    audioOption,
    setAudioOption,
    addDownload,
  } = useAppStore()

  const isMovie = type === 'movie'
  const mediaId = Number(id)

  // Cache instantâneo pré-carregado em 0ms
  const cachedInitialMovie = isMovie ? getCachedMediaDetails<TMDBMovieDetails>(mediaId, 'movie') : null
  const cachedInitialShow = !isMovie ? getCachedMediaDetails<TMDBShowDetails>(mediaId, type || 'tv') : null

  const [movieData, setMovieData] = useState<TMDBMovieDetails | null>(cachedInitialMovie)
  const [showData, setShowData] = useState<TMDBShowDetails | null>(cachedInitialShow)
  const [loading, setLoading] = useState(!cachedInitialMovie && !cachedInitialShow)
  const [imgError, setImgError] = useState(false)

  // Estado YouCine
  const [selectedSeason, setSelectedSeason] = useState(1)
  const [selectedEpisode, setSelectedEpisode] = useState(1)
  const [isOverviewExpanded, setIsOverviewExpanded] = useState(false)
  const [idiomaModalOpen, setIdiomaModalOpen] = useState(false)
  const [resolucaoModalOpen, setResolucaoModalOpen] = useState(false)
  const [selectedResolution, setSelectedResolution] = useState('1080p')
  const [isDownloading, setIsDownloading] = useState(false)

  const fullscreenBtnRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    if (!id || !type) return
    let isCancelled = false

    if (!cachedInitialMovie && !cachedInitialShow) {
      setLoading(true)
    }

    const fetchDetails = async () => {
      try {
        if (isMovie) {
          const data = await getMovieDetails(mediaId)
          if (!isCancelled) setMovieData(data)
        } else {
          const data = await getShowDetails(mediaId)
          if (!isCancelled) setShowData(data)
        }
      } catch (err) {
        console.error('Failed to load details:', err)
      } finally {
        if (!isCancelled) setLoading(false)
      }
    }
    fetchDetails()

    return () => {
      isCancelled = true
    }
  }, [id, type, isMovie, mediaId, cachedInitialMovie, cachedInitialShow])

  // Foco automático inicial no botão "Tela cheia" estilo YouCine
  useEffect(() => {
    if (!loading && (movieData || showData)) {
      const focusFullscreen = () => {
        if (doesFocusableExist('details-fullscreen')) {
          setFocus('details-fullscreen')
        }
        fullscreenBtnRef.current?.focus()
      }
      const t1 = setTimeout(focusFullscreen, 50)
      const t2 = setTimeout(focusFullscreen, 200)
      return () => {
        clearTimeout(t1)
        clearTimeout(t2)
      }
    }
  }, [loading, movieData, showData, id])

  // Foco automático e captura de teclas Voltar / Escape para Modais YouCine
  useEffect(() => {
    if (idiomaModalOpen) {
      const t = setTimeout(() => {
        setFocus(audioOption === 'dub' ? 'modal-idioma-dub' : 'modal-idioma-orig')
      }, 60)
      return () => clearTimeout(t)
    }
  }, [idiomaModalOpen, audioOption])

  useEffect(() => {
    if (resolucaoModalOpen) {
      const t = setTimeout(() => {
        setFocus(`modal-res-${selectedResolution}`)
      }, 60)
      return () => clearTimeout(t)
    }
  }, [resolucaoModalOpen, selectedResolution])

  useEffect(() => {
    const handleModalKeyDown = (e: KeyboardEvent) => {
      const code = e.keyCode || e.which
      if (
        e.key === 'Escape' ||
        e.key === 'GoBack' ||
        code === 27 ||
        code === 4 ||
        code === 10009 ||
        code === 461 ||
        code === 283
      ) {
        if (idiomaModalOpen) {
          e.preventDefault()
          e.stopPropagation()
          setIdiomaModalOpen(false)
          setTimeout(() => setFocus('details-idioma'), 50)
        } else if (resolucaoModalOpen) {
          e.preventDefault()
          e.stopPropagation()
          setResolucaoModalOpen(false)
          setTimeout(() => setFocus('details-resolucao'), 50)
        }
      }
    }
    window.addEventListener('keydown', handleModalKeyDown)
    return () => window.removeEventListener('keydown', handleModalKeyDown)
  }, [idiomaModalOpen, resolucaoModalOpen])

  if (loading) {
    return (
      <>
        <ProgressBar isLoading={true} />
        <SkeletonDetailPage />
      </>
    )
  }

  const data = isMovie ? movieData : showData
  if (!data) {
    return (
      <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center text-white">
        <h2 className="text-2xl font-bold mb-4">Conteúdo não encontrado</h2>
        <button onClick={() => navigate(-1)} className="text-accent-red hover:underline">Voltar</button>
      </div>
    )
  }

  const baseTitle = isMovie ? movieData!.title : showData!.name
  const seasons = !isMovie ? showData?.seasons?.filter((s) => s.season_number > 0) || [] : []
  const currentSeasonData = seasons.find((s) => s.season_number === selectedSeason) || seasons[0]
  const episodeCount = currentSeasonData ? Math.max(1, currentSeasonData.episode_count) : 12

  // Título exibido: no YouCine exibe "A Ilha do Tesouro Temp.1"
  const displayTitle = !isMovie && seasons.length > 0
    ? `${baseTitle} Temp.${selectedSeason}`
    : baseTitle

  const country =
    showData?.origin_country?.[0] ||
    movieData?.production_countries?.[0]?.name ||
    'United States of America'

  const releaseDate = isMovie ? movieData!.release_date : showData!.first_air_date
  const originalTitle = isMovie ? movieData!.original_title : showData!.original_name
  const rating = data.vote_average
  const genres = data.genres || []
  const directors =
    data.credits?.crew
      ?.filter((c) => c.job === 'Director')
      .map((c) => c.name)
      .slice(0, 3) || []

  const castNames =
    data.credits?.cast
      ?.slice(0, 5)
      .map((c) => c.name)
      .join(', ') || ''

  const overview = data.overview || 'Sem sinopse disponível no momento.'
  const backdropPath = data.backdrop_path || data.poster_path

  const favorite = isFavorite(mediaId)
  const videos: TMDBVideo[] = data?.videos?.results ?? []
  const trailer = videos.find((v) => v.site === 'YouTube' && v.type === 'Trailer') ?? videos[0]

  const handleToggleFav = () => {
    if (favorite) {
      removeFavorite(mediaId)
    } else {
      addFavorite({
        id: mediaId,
        type: type!,
        title: baseTitle,
        posterPath: data.poster_path,
        rating,
        addedAt: Date.now(),
      })
    }
  }

  const handlePlayFullscreen = (ep = selectedEpisode) => {
    if (isMovie) {
      navigate(`/watch/movie/${mediaId}`)
    } else {
      navigate(`/watch/${type}/${mediaId}?season=${selectedSeason}&episode=${ep}`)
    }
  }

  const handleSelectSeason = (seasonNum: number) => {
    setSelectedSeason(seasonNum)
    setSelectedEpisode(1)
  }

  const handlePrevEpisode = () => {
    if (selectedEpisode > 1) {
      setSelectedEpisode((prev) => prev - 1)
    }
  }

  const handleNextEpisode = () => {
    if (selectedEpisode < episodeCount) {
      setSelectedEpisode((prev) => prev + 1)
    }
  }

  const handleDownload = async () => {
    if (!downloadsSupported()) {
      alert('Downloads estão disponíveis no aplicativo Android.')
      return
    }
    setIsDownloading(true)
    try {
      const resolved = await resolveMegaEmbed(
        mediaId,
        isMovie ? 'movie' : 'tv',
        selectedSeason,
        selectedEpisode
      )
      if (!resolved.dubbedMp4) {
        alert('Fonte direta não disponível para download no momento.')
        return
      }
      const base: DownloadItem = {
        id: mediaId,
        type: type as MediaType,
        title: displayTitle,
        posterPath: data.poster_path,
        season: isMovie ? undefined : selectedSeason,
        episode: isMovie ? undefined : selectedEpisode,
        url: resolved.dubbedMp4,
        path: '',
        createdAt: Date.now(),
      }
      const path = await downloadVideo(resolved.dubbedMp4, buildFileName(base))
      addDownload({ ...base, path })
      alert('Download iniciado com sucesso!')
    } catch {
      alert('Não foi possível iniciar o download.')
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <motion.div variants={PAGE_VARIANTS} initial="initial" animate="animate" exit="exit" className="relative min-h-screen w-full bg-[#0a0a12] text-white overflow-x-hidden select-none font-sans">
      <ProgressBar isLoading={isDownloading} />
      {/* Imagem de Fundo (Backdrop) com Gradientes Cinematográficos Estilo YouCine */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        {backdropPath && !imgError ? (
          <img
            src={getBackdropUrl(backdropPath, 'w1280')}
            alt={displayTitle}
            className="w-full h-full object-cover object-center opacity-30"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full bg-[#0a0a14]" />
        )}
        {/* Camadas de gradiente escuro fiéis ao YouCine */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a14] via-[#0a0a14]/80 to-[#0a0a14]/50" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a14] via-[#0a0a14]/90 to-transparent" />
      </div>

      {/* Conteúdo Principal */}
      <div className="relative z-10 flex flex-col min-h-screen px-4 sm:px-8 md:px-12 pt-6 pb-12">
        {/* Botão Superior Voltar */}
        <div className="flex items-center justify-between mb-4">
          <Focusable
            focusKey="details-back"
            onEnterPress={() => navigate(-1)}
            onArrowPress={(direction) => {
              if (direction === 'down') {
                setFocus('details-fullscreen')
                return false
              }
            }}
            className="rounded-xl"
          >
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 px-3.5 py-2 bg-white/10 hover:bg-white/20 active:bg-white/30 text-white/90 rounded-xl backdrop-blur-md transition-all text-sm font-semibold outline-none focus:ring-2 focus:ring-amber-400"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar</span>
            </button>
          </Focusable>
        </div>

        {/* Linha Superior: Coluna Esquerda (Informações) e Coluna Direita (Mini-Player de Preview) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* Coluna Esquerda: Informações fiéis à foto do YouCine */}
          <div className="lg:col-span-7 flex flex-col space-y-2.5">
            {/* Título Principal */}
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight drop-shadow-md">
              {displayTitle}
            </h1>

            {/* Linha de Metadados: País | Data | Título Original */}
            <p className="text-xs sm:text-sm text-white/70 font-medium">
              <span>{country}</span>
              {releaseDate && <span> | {releaseDate}</span>}
              {originalTitle && <span> | Título original : {originalTitle}</span>}
            </p>

            {/* Avaliação em Destaque Dourado e Upado por */}
            <div className="flex items-center gap-3 text-xs sm:text-sm">
              <span className="text-amber-400 font-extrabold text-base sm:text-lg flex items-center gap-1 drop-shadow-sm">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400 inline" />
                {rating > 0 ? rating.toFixed(1) : '5.0'}
              </span>
              <span className="text-white/80 flex items-center gap-1.5 font-medium">
                <span>Upado por :</span>
                <span className="inline-flex items-center gap-1 text-red-400 font-semibold bg-red-950/40 px-2 py-0.5 rounded border border-red-500/20">
                  📁 CineBG Stream
                </span>
              </span>
            </div>

            {/* Gêneros com Chips Arredondados estilo YouCine */}
            {genres.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 pt-0.5">
                <span className="text-xs sm:text-sm text-white/80 font-semibold">Gênero :</span>
                {genres.map((g) => (
                  <span
                    key={g.id}
                    className="px-3 py-0.5 rounded-full border border-white/20 bg-white/5 text-white/90 text-xs font-semibold backdrop-blur-sm shadow-sm"
                  >
                    {g.name}
                  </span>
                ))}
              </div>
            )}

            {/* Direção */}
            {directors.length > 0 && (
              <p className="text-xs sm:text-sm text-white/80 line-clamp-1">
                <span className="font-semibold text-white/90">Direção : </span>
                <span className="text-white/70">{directors.join(', ')}</span>
              </p>
            )}

            {/* Elenco */}
            {castNames && (
              <p className="text-xs sm:text-sm text-white/80 line-clamp-1">
                <span className="font-semibold text-white/90">Elenco : </span>
                <span className="text-white/70">{castNames}</span>
              </p>
            )}

            {/* Sinopse com botão Mais expansível */}
            <div className="text-xs sm:text-sm text-white/70 leading-relaxed pt-1">
              <span className="font-semibold text-white/90">Sinopse : </span>
              <span>
                {isOverviewExpanded
                  ? overview
                  : overview.length > 180
                  ? `${overview.slice(0, 180)}...`
                  : overview}
              </span>
              {overview.length > 180 && (
                <button
                  type="button"
                  onClick={() => setIsOverviewExpanded(!isOverviewExpanded)}
                  className="ml-1 text-amber-400 font-bold hover:underline outline-none"
                >
                  {isOverviewExpanded ? ' Menos' : ' Mais'}
                </button>
              )}
            </div>
          </div>

          {/* Coluna Direita: Mini-player de Preview 16:9 Estilo YouCine */}
          <div className="lg:col-span-5 flex flex-col items-center lg:items-end justify-center">
            <div className="relative w-full max-w-[460px] aspect-video rounded-2xl overflow-hidden border border-white/20 shadow-2xl bg-black/80 group">
              {trailer ? (
                <iframe
                  src={`https://www.youtube.com/embed/${trailer.key}?autoplay=1&mute=1&controls=0&loop=1&playlist=${trailer.key}&playsinline=1`}
                  title={`Preview de ${displayTitle}`}
                  allow="autoplay; encrypted-media"
                  className="w-full h-full object-cover border-0 pointer-events-none"
                />
              ) : (
                <div className="w-full h-full relative">
                  <img
                    src={getBackdropUrl(backdropPath, 'w780')}
                    alt={displayTitle}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <div className="w-14 h-14 rounded-full bg-accent-red/90 text-white flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                      <Play className="w-7 h-7 fill-white ml-1" />
                    </div>
                  </div>
                </div>
              )}

              {/* Botões laterais < e > sobre o preview */}
              <button
                type="button"
                onClick={handlePrevEpisode}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center transition-all z-20 backdrop-blur-sm"
                aria-label="Episódio anterior"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={handleNextEpisode}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center transition-all z-20 backdrop-blur-sm"
                aria-label="Próximo episódio"
              >
                <ChevronRight className="w-5 h-5" />
              </button>

              {/* Clique no preview abre em tela cheia */}
              <button
                type="button"
                onClick={() => handlePlayFullscreen()}
                className="absolute inset-0 w-full h-full z-10 cursor-pointer focus:outline-none"
                aria-label="Assistir em tela cheia"
              />
            </div>
          </div>
        </div>

        {/* Barra Horizontal de Botões de Ação do YouCine */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-6 md:mt-8 z-20">
          {/* Botão: Tela cheia */}
          <Focusable
            focusKey="details-fullscreen"
            onEnterPress={() => handlePlayFullscreen()}
            onArrowPress={(direction) => {
              if (direction === 'up') {
                setFocus('details-back')
                return false
              }
              if (direction === 'right') {
                setFocus('details-idioma')
                return false
              }
              if (direction === 'down') {
                if (!isMovie && seasons.length > 1) {
                  setFocus(`season-pill-${selectedSeason}`)
                } else if (!isMovie && episodeCount > 0) {
                  setFocus(`ep-${selectedSeason}-${selectedEpisode}`)
                }
                return false
              }
              if (direction === 'left') return false
            }}
            className="rounded-xl"
          >
            <motion.button
              ref={fullscreenBtnRef}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => handlePlayFullscreen()}
              className="flex items-center gap-2.5 px-6 py-3.5 rounded-xl font-black text-sm sm:text-base bg-amber-400 hover:bg-amber-300 text-black shadow-lg shadow-amber-400/25 transition-all outline-none focus:ring-4 focus:ring-white focus:scale-105 active:scale-95"
            >
              <Play className="w-5 h-5 fill-black" />
              <span>Assistir</span>
            </motion.button>
          </Focusable>

          {/* Botão: Idioma */}
          <Focusable
            focusKey="details-idioma"
            onEnterPress={() => setIdiomaModalOpen(true)}
            onArrowPress={(direction) => {
              if (direction === 'up') {
                setFocus('details-back')
                return false
              }
              if (direction === 'left') {
                setFocus('details-fullscreen')
                return false
              }
              if (direction === 'right') {
                setFocus('details-resolucao')
                return false
              }
              if (direction === 'down') {
                if (!isMovie && seasons.length > 1) {
                  setFocus(`season-pill-${selectedSeason}`)
                } else if (!isMovie && episodeCount > 0) {
                  setFocus(`ep-${selectedSeason}-${selectedEpisode}`)
                }
                return false
              }
            }}
            className="rounded-xl"
          >
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setIdiomaModalOpen(true)}
              className="flex items-center gap-2.5 px-6 py-3.5 rounded-xl font-extrabold text-sm sm:text-base border border-white/15 bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-all outline-none focus:bg-amber-400 focus:text-black focus:border-amber-400 focus:shadow-xl focus:shadow-amber-500/30"
            >
              <MessageSquare className="w-5 h-5" />
              <span>Idioma ({audioOption === 'dub' ? 'Dublado' : 'Legendado'})</span>
            </motion.button>
          </Focusable>

          {/* Botão: Resolução */}
          <Focusable
            focusKey="details-resolucao"
            onEnterPress={() => setResolucaoModalOpen(true)}
            onArrowPress={(direction) => {
              if (direction === 'up') {
                setFocus('details-back')
                return false
              }
              if (direction === 'left') {
                setFocus('details-idioma')
                return false
              }
              if (direction === 'right') {
                setFocus('details-fav')
                return false
              }
              if (direction === 'down') {
                if (!isMovie && seasons.length > 1) {
                  setFocus(`season-pill-${selectedSeason}`)
                } else if (!isMovie && episodeCount > 0) {
                  setFocus(`ep-${selectedSeason}-${selectedEpisode}`)
                }
                return false
              }
            }}
            className="rounded-xl"
          >
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setResolucaoModalOpen(true)}
              className="flex items-center gap-2.5 px-6 py-3.5 rounded-xl font-extrabold text-sm sm:text-base border border-white/15 bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-all outline-none focus:bg-amber-400 focus:text-black focus:border-amber-400 focus:shadow-xl focus:shadow-amber-500/30"
            >
              <Sliders className="w-5 h-5" />
              <span>Resolução ({selectedResolution})</span>
            </motion.button>
          </Focusable>

          {/* Botão: Favorito */}
          <Focusable
            focusKey="details-fav"
            onEnterPress={handleToggleFav}
            onArrowPress={(direction) => {
              if (direction === 'up') {
                setFocus('details-back')
                return false
              }
              if (direction === 'left') {
                setFocus('details-resolucao')
                return false
              }
              if (direction === 'right') {
                setFocus('details-download')
                return false
              }
              if (direction === 'down') {
                if (!isMovie && seasons.length > 1) {
                  setFocus(`season-pill-${selectedSeason}`)
                } else if (!isMovie && episodeCount > 0) {
                  setFocus(`ep-${selectedSeason}-${selectedEpisode}`)
                }
                return false
              }
            }}
            className="rounded-xl"
          >
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleToggleFav}
              className={`flex items-center gap-2.5 px-6 py-3.5 rounded-xl font-extrabold text-sm sm:text-base border transition-all outline-none backdrop-blur-md focus:bg-amber-400 focus:text-black focus:border-amber-400 focus:shadow-xl focus:shadow-amber-500/30 ${
                favorite
                  ? 'bg-red-500/25 border-red-500 text-red-400'
                  : 'bg-white/10 border-white/15 text-white hover:bg-white/20'
              }`}
            >
              <Heart className={`w-5 h-5 ${favorite ? 'fill-current' : ''}`} />
              <span>{favorite ? 'Favoritado' : 'Favorito'}</span>
            </motion.button>
          </Focusable>

          {/* Botão: Download */}
          <Focusable
            focusKey="details-download"
            onEnterPress={handleDownload}
            onArrowPress={(direction) => {
              if (direction === 'up') {
                setFocus('details-back')
                return false
              }
              if (direction === 'left') {
                setFocus('details-fav')
                return false
              }
              if (direction === 'down') {
                if (!isMovie && seasons.length > 1) {
                  setFocus(`season-pill-${selectedSeason}`)
                } else if (!isMovie && episodeCount > 0) {
                  setFocus(`ep-${selectedSeason}-${selectedEpisode}`)
                }
                return false
              }
              if (direction === 'right') return false
            }}
            className="rounded-xl"
          >
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleDownload}
              disabled={isDownloading}
              className="flex items-center gap-2.5 px-6 py-3.5 rounded-xl font-extrabold text-sm sm:text-base border border-white/15 bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-all outline-none focus:bg-amber-400 focus:text-black focus:border-amber-400 focus:shadow-xl focus:shadow-amber-500/30 disabled:opacity-50"
            >
              <Download className="w-5 h-5" />
              <span>{isDownloading ? 'Baixando...' : 'Download'}</span>
            </motion.button>
          </Focusable>
        </div>

        {/* Seção Inferior: Temporadas e Lista Horizontal de Episódios (Para Séries/Anime) */}
        {!isMovie && seasons.length > 0 && (
          <div className="mt-8 md:mt-10 space-y-4">
            {/* Cabeçalho da Temporada estilo YouCine */}
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-extrabold text-lg sm:text-xl text-white">
                Temporada {selectedSeason}
              </span>
              <span className="text-xs text-amber-400 font-bold bg-amber-400/10 px-2.5 py-0.5 rounded border border-amber-400/30">
                {selectedSeason}-{seasons.length}
              </span>
              <span className="text-xs text-white/50 font-medium">
                Disponível até {seasons.length}
              </span>
            </div>

            {/* Seletor de Temporadas (quando há mais de uma) */}
            {seasons.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                {seasons.map((s, sIdx) => (
                  <Focusable
                    key={`season-pill-${s.season_number}`}
                    focusKey={`season-pill-${s.season_number}`}
                    onEnterPress={() => handleSelectSeason(s.season_number)}
                    onArrowPress={(direction) => {
                      if (direction === 'up') {
                        setFocus('details-fullscreen')
                        return false
                      }
                      if (direction === 'down') {
                        setFocus(`ep-${selectedSeason}-${selectedEpisode}`)
                        return false
                      }
                      if (direction === 'left') {
                        if (sIdx > 0) {
                          setFocus(`season-pill-${seasons[sIdx - 1].season_number}`)
                          return false
                        }
                        return false
                      }
                      if (direction === 'right') {
                        if (sIdx < seasons.length - 1) {
                          setFocus(`season-pill-${seasons[sIdx + 1].season_number}`)
                          return false
                        }
                        return false
                      }
                    }}
                    className="rounded-xl flex-shrink-0"
                  >
                    <button
                      onClick={() => handleSelectSeason(s.season_number)}
                      className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold border transition-all outline-none focus:bg-amber-400 focus:text-black focus:border-amber-400 ${
                        selectedSeason === s.season_number
                          ? 'bg-accent-red text-white border-accent-red shadow-lg shadow-red-950/40'
                          : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/15'
                      }`}
                    >
                      {s.name || `Temporada ${s.season_number}`}
                    </button>
                  </Focusable>
                ))}
              </div>
            )}

            {/* Grade Horizontal de Episódios Numerados do YouCine [ ▶ 1 ] [ ▶ 2 ] ... */}
            <div className="flex items-center gap-3 overflow-x-auto py-2 px-0.5 scrollbar-thin scrollbar-thumb-white/20">
              {Array.from({ length: episodeCount }, (_, i) => i + 1).map((epNum) => {
                const isSelected = selectedEpisode === epNum
                return (
                  <Focusable
                    key={`ep-${selectedSeason}-${epNum}`}
                    focusKey={`ep-${selectedSeason}-${epNum}`}
                    onFocus={() => setSelectedEpisode(epNum)}
                    onEnterPress={() => handlePlayFullscreen(epNum)}
                    onArrowPress={(direction) => {
                      if (direction === 'up') {
                        if (seasons.length > 1) {
                          setFocus(`season-pill-${selectedSeason}`)
                        } else {
                          setFocus('details-fullscreen')
                        }
                        return false
                      }
                      if (direction === 'left') {
                        if (epNum > 1) {
                          setFocus(`ep-${selectedSeason}-${epNum - 1}`)
                          return false
                        }
                        return false
                      }
                      if (direction === 'right') {
                        if (epNum < episodeCount) {
                          setFocus(`ep-${selectedSeason}-${epNum + 1}`)
                          return false
                        }
                        return false
                      }
                      if (direction === 'down') {
                        return false
                      }
                    }}
                    className="rounded-xl flex-shrink-0"
                  >
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handlePlayFullscreen(epNum)}
                      className={`w-16 sm:w-20 h-14 sm:h-16 rounded-xl flex items-center justify-center gap-1.5 font-black text-base sm:text-lg border transition-all outline-none focus:bg-amber-400 focus:text-black focus:border-amber-400 focus:shadow-xl focus:shadow-amber-500/40 focus:scale-110 ${
                        isSelected
                          ? 'bg-amber-400 text-black border-amber-400 shadow-lg shadow-amber-500/20'
                          : 'bg-white/10 text-white/90 border-white/10 hover:bg-white/20'
                      }`}
                    >
                      <Play className="w-4 h-4 fill-current" />
                      <span>{epNum}</span>
                    </motion.button>
                  </Focusable>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Modal de Idioma (YouCine) */}
      <AnimatePresence>
        {idiomaModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-[#13141f] border border-white/15 rounded-2xl p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-amber-400" />
                  <span>Selecione o Idioma</span>
                </h3>
                <Focusable
                  focusKey="modal-idioma-close"
                  onEnterPress={() => {
                    setIdiomaModalOpen(false)
                    setTimeout(() => setFocus('details-idioma'), 50)
                  }}
                  onArrowPress={(direction) => {
                    if (direction === 'down') {
                      setFocus('modal-idioma-dub')
                      return false
                    }
                  }}
                  className="rounded-lg"
                >
                  <button
                    onClick={() => {
                      setIdiomaModalOpen(false)
                      setTimeout(() => setFocus('details-idioma'), 50)
                    }}
                    className="p-1 rounded-lg text-white/60 hover:text-white outline-none focus:ring-2 focus:ring-amber-400"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </Focusable>
              </div>

              <div className="space-y-2.5">
                <Focusable
                  focusKey="modal-idioma-dub"
                  onEnterPress={() => {
                    setAudioOption('dub')
                    setIdiomaModalOpen(false)
                    setTimeout(() => setFocus('details-idioma'), 50)
                  }}
                  onArrowPress={(direction) => {
                    if (direction === 'down') {
                      setFocus('modal-idioma-orig')
                      return false
                    }
                    if (direction === 'up') {
                      setFocus('modal-idioma-close')
                      return false
                    }
                  }}
                  className="rounded-xl"
                >
                  <button
                    type="button"
                    onClick={() => {
                      setAudioOption('dub')
                      setIdiomaModalOpen(false)
                      setTimeout(() => setFocus('details-idioma'), 50)
                    }}
                    className={`w-full flex items-center justify-between p-4 rounded-xl border text-sm font-bold transition-all outline-none focus:bg-amber-400 focus:text-black focus:border-amber-400 ${
                      audioOption === 'dub'
                        ? 'bg-amber-400 text-black border-amber-400 shadow-lg shadow-amber-500/20'
                        : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                    }`}
                  >
                    <span>Áudio Dublado (Português)</span>
                    {audioOption === 'dub' && <Check className="w-5 h-5 stroke-[3]" />}
                  </button>
                </Focusable>

                <Focusable
                  focusKey="modal-idioma-orig"
                  onEnterPress={() => {
                    setAudioOption('orig')
                    setIdiomaModalOpen(false)
                    setTimeout(() => setFocus('details-idioma'), 50)
                  }}
                  onArrowPress={(direction) => {
                    if (direction === 'up') {
                      setFocus('modal-idioma-dub')
                      return false
                    }
                  }}
                  className="rounded-xl"
                >
                  <button
                    type="button"
                    onClick={() => {
                      setAudioOption('orig')
                      setIdiomaModalOpen(false)
                      setTimeout(() => setFocus('details-idioma'), 50)
                    }}
                    className={`w-full flex items-center justify-between p-4 rounded-xl border text-sm font-bold transition-all outline-none focus:bg-amber-400 focus:text-black focus:border-amber-400 ${
                      audioOption === 'orig'
                        ? 'bg-amber-400 text-black border-amber-400 shadow-lg shadow-amber-500/20'
                        : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                    }`}
                  >
                    <span>Áudio Original (com Legenda PT-BR)</span>
                    {audioOption === 'orig' && <Check className="w-5 h-5 stroke-[3]" />}
                  </button>
                </Focusable>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal de Resolução (YouCine) */}
      <AnimatePresence>
        {resolucaoModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-[#13141f] border border-white/15 rounded-2xl p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-amber-400" />
                  <span>Qualidade de Transmissão</span>
                </h3>
                <Focusable
                  focusKey="modal-res-close"
                  onEnterPress={() => {
                    setResolucaoModalOpen(false)
                    setTimeout(() => setFocus('details-resolucao'), 50)
                  }}
                  onArrowPress={(direction) => {
                    if (direction === 'down') {
                      setFocus('modal-res-1080p')
                      return false
                    }
                  }}
                  className="rounded-lg"
                >
                  <button
                    onClick={() => {
                      setResolucaoModalOpen(false)
                      setTimeout(() => setFocus('details-resolucao'), 50)
                    }}
                    className="p-1 rounded-lg text-white/60 hover:text-white outline-none focus:ring-2 focus:ring-amber-400"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </Focusable>
              </div>

              <div className="space-y-2.5">
                {[
                  { id: '1080p', label: 'Full HD (1080p) — Alta Qualidade' },
                  { id: '720p', label: 'HD (720p) — Conexão Padrão' },
                  { id: 'auto', label: 'Automático — Ajuste Dinâmico' },
                ].map((res, rIdx, arr) => (
                  <Focusable
                    key={`modal-res-${res.id}`}
                    focusKey={`modal-res-${res.id}`}
                    onEnterPress={() => {
                      setSelectedResolution(res.id)
                      setResolucaoModalOpen(false)
                      setTimeout(() => setFocus('details-resolucao'), 50)
                    }}
                    onArrowPress={(direction) => {
                      if (direction === 'up') {
                        if (rIdx === 0) {
                          setFocus('modal-res-close')
                        } else {
                          setFocus(`modal-res-${arr[rIdx - 1].id}`)
                        }
                        return false
                      }
                      if (direction === 'down') {
                        if (rIdx < arr.length - 1) {
                          setFocus(`modal-res-${arr[rIdx + 1].id}`)
                          return false
                        }
                      }
                    }}
                    className="rounded-xl"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedResolution(res.id)
                        setResolucaoModalOpen(false)
                        setTimeout(() => setFocus('details-resolucao'), 50)
                      }}
                      className={`w-full flex items-center justify-between p-4 rounded-xl border text-sm font-bold transition-all outline-none focus:bg-amber-400 focus:text-black focus:border-amber-400 ${
                        selectedResolution === res.id
                          ? 'bg-amber-400 text-black border-amber-400 shadow-lg shadow-amber-500/20'
                          : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                      }`}
                    >
                      <span>{res.label}</span>
                      {selectedResolution === res.id && <Check className="w-5 h-5 stroke-[3]" />}
                    </button>
                  </Focusable>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default Details
