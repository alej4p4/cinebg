import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Filter, Sparkles, Clapperboard, Layers, Star, Play, Award, ChevronLeft, ChevronRight } from 'lucide-react'
import type { MediaItem } from '@/types'
import { getBackdropUrl, getPosterUrl } from '@/services/tmdb'
import Focusable from '@/components/tv/Focusable'
import { setFocus } from '@noriginmedia/norigin-spatial-navigation'

interface YuCineHeroProps {
  type: 'movie' | 'tv'
  items: MediaItem[]
  loading?: boolean
  onFilterGenre?: () => void
  onFilterYear?: (year: number) => void
  onFilterSpecial?: () => void
  onFilterClassics?: () => void
  onFilterAll?: () => void
  activeFilter?: string | null
}

const YuCineHero = ({
  type,
  items,
  loading = false,
  onFilterGenre,
  onFilterYear,
  onFilterSpecial,
  onFilterClassics,
  onFilterAll,
  activeFilter,
}: YuCineHeroProps) => {
  const navigate = useNavigate()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [touchStartX, setTouchStartX] = useState<number | null>(null)

  // Itens em destaque (até 5)
  const carouselItems = items.slice(0, 5)
  const currentItem = carouselItems[currentIndex] || items[0]
  // 2 itens laterais verticais (posições 5 e 6)
  const sideItem1 = items[5] || items[1]
  const sideItem2 = items[6] || items[2]

  // Transição automática suave de slides a cada 7 segundos ("fica passando filmes/séries")
  useEffect(() => {
    if (loading || carouselItems.length <= 1) return
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % carouselItems.length)
    }, 7000)
    return () => clearInterval(timer)
  }, [loading, carouselItems.length])
  const prev = () => {
    setCurrentIndex((prev) => (prev - 1 + carouselItems.length) % carouselItems.length)
  }

  const next = () => {
    setCurrentIndex((prev) => (prev + 1) % carouselItems.length)
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX)
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return
    const diffX = e.changedTouches[0].clientX - touchStartX
    if (Math.abs(diffX) > 40) {
      if (diffX > 0) {
        prev()
      } else {
        next()
      }
    }
    setTouchStartX(null)
  }

  // Preload do próximo slide em background para transição instantânea sem engasgos na TV
  useEffect(() => {
    if (carouselItems.length <= 1) return
    const nextIdx = (currentIndex + 1) % carouselItems.length
    const nextItem = carouselItems[nextIdx]
    if (nextItem?.backdropPath) {
      const img = new Image()
      img.src = getBackdropUrl(nextItem.backdropPath, 'w1280')
    }
  }, [currentIndex, carouselItems])

  if (loading || !currentItem) {
    return (
      <div className="max-w-screen-2xl mx-auto px-4 md:px-8 pt-20 pb-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 md:gap-4">
          <div className="lg:col-span-8 aspect-[16/9] md:aspect-[21/10] bg-white/5 rounded-2xl animate-pulse" />
          <div className="hidden lg:grid col-span-4 grid-cols-2 gap-3">
            <div className="aspect-[2/3] bg-white/5 rounded-2xl animate-pulse" />
            <div className="aspect-[2/3] bg-white/5 rounded-2xl animate-pulse" />
          </div>
        </div>
      </div>
    )
  }

  const backdropUrl = getBackdropUrl(currentItem.backdropPath, 'w1280')
  const side1Poster = getPosterUrl(sideItem1?.posterPath, 'w500')
  const side2Poster = getPosterUrl(sideItem2?.posterPath, 'w500')

  return (
    <section className="max-w-screen-2xl mx-auto px-4 md:px-8 pt-20 pb-4 select-none">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 md:gap-4">
        {/* ===== COLUNA ESQUERDA: BANNER PRINCIPAL + 4 BOTÕES COLORIDOS ===== */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-3">
          {/* Banner Grande em Destaque */}
          <Focusable
            focusKey="yucine-hero-banner"
            onEnterPress={() => navigate(`/watch/${currentItem.type}/${currentItem.id}`)}
            onArrowPress={(dir) => {
              if (dir === 'left') {
                prev()
                return false
              }
              if (dir === 'right') {
                next()
                return false
              }
              if (dir === 'up') {
                setFocus('nav-item-0')
                return false
              }
              return true
            }}
            className="w-full"
          >
            <div
              onClick={() => navigate(`/details/${currentItem.type}/${currentItem.id}`)}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              className="relative aspect-[16/9] md:aspect-[21/10] rounded-2xl overflow-hidden cursor-pointer group border border-white/10 shadow-2xl transition-all duration-300 hover:border-amber-400"
            >
              <AnimatePresence mode="wait">
                <motion.img
                  key={currentItem.id}
                  src={backdropUrl}
                  alt={currentItem.title}
                  initial={{ opacity: 0.35 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0.35 }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                  className="w-full h-full object-cover"
                  style={{ transform: 'translateZ(0)' }}
                />
              </AnimatePresence>

              {/* Vinhetas e Gradientes de Contraste estilo YuCine */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-black/40 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0f]/80 via-transparent to-transparent" />

              {/* Botões manuais de navegação Anterior / Próximo (Controle e Toque) */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  prev()
                }}
                className="absolute left-3 top-1/2 -translate-y-1/2 z-20 p-2 sm:p-2.5 bg-black/60 hover:bg-black/90 rounded-full text-white border border-white/20 transition-all hover:scale-110 active:scale-95 shadow-lg flex items-center justify-center"
                title="Banner Anterior"
                aria-label="Anterior"
              >
                <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  next()
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 z-20 p-2 sm:p-2.5 bg-black/60 hover:bg-black/90 rounded-full text-white border border-white/20 transition-all hover:scale-110 active:scale-95 shadow-lg flex items-center justify-center"
                title="Próximo Banner"
                aria-label="Próximo"
              >
                <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>

              {/* Informações do Filme/Série */}
              <div className="absolute bottom-4 left-4 right-16 sm:bottom-5 sm:left-5 sm:right-24 z-10 space-y-1.5 sm:space-y-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-accent-red text-white text-[11px] font-black uppercase tracking-wider">
                    {type === 'movie' ? 'Filme' : 'Série'}
                  </span>
                  {currentItem.rating > 0 && (
                    <span className="flex items-center gap-1 text-amber-400 text-xs font-bold">
                      <Star className="h-3 w-3 fill-amber-400" />
                      {currentItem.rating.toFixed(1)}
                    </span>
                  )}
                  {currentItem.releaseDate && (
                    <span className="text-white/60 text-xs">
                      {new Date(currentItem.releaseDate).getFullYear()}
                    </span>
                  )}
                </div>

                <h2 className="font-display font-black text-xl sm:text-3xl md:text-4xl text-white drop-shadow-md leading-tight max-w-xl line-clamp-1 sm:line-clamp-2">
                  {currentItem.title}
                </h2>

                {currentItem.overview && (
                  <p className="text-white/70 text-xs sm:text-sm line-clamp-2 max-w-lg hidden sm:block">
                    {currentItem.overview}
                  </p>
                )}
              </div>

              {/* Botão Assistir Flutuante ao Hover */}
              <div className="absolute bottom-4 right-4 sm:bottom-5 sm:right-5 z-20 flex items-center gap-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    navigate(`/watch/${currentItem.type}/${currentItem.id}`)
                  }}
                  className="p-2.5 sm:p-3 bg-accent-red hover:bg-red-600 text-white rounded-full shadow-xl shadow-red-950/50 hover:scale-110 active:scale-95 transition-all"
                  title="Assistir Agora"
                >
                  <Play className="h-5 w-5 fill-current" />
                </button>
              </div>

              {/* Indicadores de Paginação estilo YuCine (Pílula Amarela + Pontos) */}
              <div className="absolute bottom-3 right-16 sm:right-20 z-10 flex items-center gap-1.5 bg-black/40 backdrop-blur-sm px-2.5 py-1 rounded-full border border-white/10">
                {carouselItems.map((item, idx) => (
                  <button
                    key={item.id}
                    onClick={(e) => {
                      e.stopPropagation()
                      setCurrentIndex(idx)
                    }}
                    className={`transition-all duration-300 rounded-full ${
                      currentIndex === idx
                        ? 'w-5 sm:w-6 h-1.5 sm:h-2 bg-amber-400'
                        : 'w-1.5 sm:w-2 h-1.5 sm:h-2 bg-white/40 hover:bg-white/70'
                    }`}
                  />
                ))}
              </div>
            </div>
          </Focusable>

          {/* 5 Botões Coloridos de Filtro Rápido (Estilo YuCine + Clássicos) */}
          <div className="flex gap-2 overflow-x-auto scroll-hide pb-1 sm:grid sm:grid-cols-5 md:gap-3">
            {/* 1. Rosa: Gênero */}
            <Focusable onEnterPress={() => onFilterGenre && onFilterGenre()} className="flex-shrink-0 sm:flex-shrink">
              <button
                onClick={onFilterGenre}
                className={`w-full min-w-[92px] sm:min-w-0 py-2.5 sm:py-3 px-2 rounded-xl flex items-center justify-center gap-1.5 md:gap-2 text-white font-bold text-xs sm:text-sm transition-all duration-200 shadow-md ${
                  activeFilter === 'genre'
                    ? 'ring-2 ring-white scale-[1.03]'
                    : 'hover:scale-[1.02] active:scale-[0.98]'
                } bg-gradient-to-r from-[#e91e63] to-[#ff4081]`}
              >
                <Filter className="h-4 w-4" />
                <span className="truncate">Gênero</span>
              </button>
            </Focusable>

            {/* 2. Ciano: 2026 */}
            <Focusable onEnterPress={() => onFilterYear && onFilterYear(2026)} className="flex-shrink-0 sm:flex-shrink">
              <button
                onClick={() => onFilterYear && onFilterYear(2026)}
                className={`w-full min-w-[92px] sm:min-w-0 py-2.5 sm:py-3 px-2 rounded-xl flex items-center justify-center gap-1.5 md:gap-2 text-white font-bold text-xs sm:text-sm transition-all duration-200 shadow-md ${
                  activeFilter === '2026'
                    ? 'ring-2 ring-white scale-[1.03]'
                    : 'hover:scale-[1.02] active:scale-[0.98]'
                } bg-gradient-to-r from-[#00b0ff] to-[#00e5ff]`}
              >
                <Sparkles className="h-4 w-4" />
                <span>2026</span>
              </button>
            </Focusable>

            {/* 3. Âmbar/Dourado: Clássicos */}
            <Focusable onEnterPress={() => onFilterClassics && onFilterClassics()} className="flex-shrink-0 sm:flex-shrink">
              <button
                onClick={onFilterClassics}
                className={`w-full min-w-[92px] sm:min-w-0 py-2.5 sm:py-3 px-2 rounded-xl flex items-center justify-center gap-1.5 md:gap-2 text-white font-bold text-xs sm:text-sm transition-all duration-200 shadow-md ${
                  activeFilter === 'classics'
                    ? 'ring-2 ring-white scale-[1.03]'
                    : 'hover:scale-[1.02] active:scale-[0.98]'
                } bg-gradient-to-r from-[#ff9800] to-[#f57c00]`}
              >
                <Award className="h-4 w-4" />
                <span className="truncate">Clássicos</span>
              </button>
            </Focusable>

            {/* 4. Verde: No Cinema / Em Alta */}
            <Focusable onEnterPress={() => onFilterSpecial && onFilterSpecial()} className="flex-shrink-0 sm:flex-shrink">
              <button
                onClick={onFilterSpecial}
                className={`w-full min-w-[92px] sm:min-w-0 py-2.5 sm:py-3 px-2 rounded-xl flex items-center justify-center gap-1.5 md:gap-2 text-white font-bold text-xs sm:text-sm transition-all duration-200 shadow-md ${
                  activeFilter === 'special'
                    ? 'ring-2 ring-white scale-[1.03]'
                    : 'hover:scale-[1.02] active:scale-[0.98]'
                } bg-gradient-to-r from-[#00c853] to-[#64dd17]`}
              >
                <Clapperboard className="h-4 w-4" />
                <span className="truncate">{type === 'movie' ? 'No Cinema' : 'Em Alta'}</span>
              </button>
            </Focusable>

            {/* 5. Amarelo: Todos / Todas */}
            <Focusable onEnterPress={() => onFilterAll && onFilterAll()} className="flex-shrink-0 sm:flex-shrink sm:col-span-1">
              <button
                onClick={onFilterAll}
                className={`w-full min-w-[92px] sm:min-w-0 py-2.5 sm:py-3 px-2 rounded-xl flex items-center justify-center gap-1.5 md:gap-2 text-black font-extrabold text-xs sm:text-sm transition-all duration-200 shadow-md ${
                  activeFilter === 'all' || !activeFilter
                    ? 'ring-2 ring-white scale-[1.03]'
                    : 'hover:scale-[1.02] active:scale-[0.98]'
                } bg-gradient-to-r from-[#ffd600] to-[#ffea00]`}
              >
                <Layers className="h-4 w-4" />
                <span className="truncate">{type === 'movie' ? 'Todos' : 'Todas'}</span>
              </button>
            </Focusable>
          </div>
        </div>

        {/* ===== COLUNA DIREITA: 2 CARDS VERTICAIS ESTILO YUCINE ===== */}
        <div className="hidden lg:grid col-span-5 xl:col-span-4 grid-cols-2 gap-3 md:gap-4">
          {/* Card Vertical 1 */}
          {sideItem1 && (
            <Focusable
              onEnterPress={() => navigate(`/watch/${sideItem1.type}/${sideItem1.id}`)}
              className="h-full"
            >
              <div
                onClick={() => navigate(`/details/${sideItem1.type}/${sideItem1.id}`)}
                className="relative h-full rounded-2xl overflow-hidden cursor-pointer group border border-white/10 shadow-2xl transition-all duration-300 hover:scale-[1.02] hover:border-amber-400"
              >
                <img
                  src={side1Poster}
                  alt={sideItem1.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
                <div className="absolute bottom-4 left-3 right-3 z-10">
                  <h3 className="font-display font-black text-sm md:text-base text-white uppercase tracking-tight leading-tight line-clamp-2 drop-shadow-md">
                    {sideItem1.title}
                  </h3>
                  {sideItem1.rating > 0 && (
                    <span className="flex items-center gap-1 text-amber-400 text-xs font-bold mt-1">
                      <Star className="h-3 w-3 fill-amber-400" />
                      {sideItem1.rating.toFixed(1)}
                    </span>
                  )}
                </div>
              </div>
            </Focusable>
          )}

          {/* Card Vertical 2 */}
          {sideItem2 && (
            <Focusable
              onEnterPress={() => navigate(`/watch/${sideItem2.type}/${sideItem2.id}`)}
              className="h-full"
            >
              <div
                onClick={() => navigate(`/details/${sideItem2.type}/${sideItem2.id}`)}
                className="relative h-full rounded-2xl overflow-hidden cursor-pointer group border border-white/10 shadow-2xl transition-all duration-300 hover:scale-[1.02] hover:border-amber-400"
              >
                <img
                  src={side2Poster}
                  alt={sideItem2.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
                <div className="absolute bottom-4 left-3 right-3 z-10">
                  <h3 className="font-display font-black text-sm md:text-base text-white uppercase tracking-tight leading-tight line-clamp-2 drop-shadow-md">
                    {sideItem2.title}
                  </h3>
                  {sideItem2.rating > 0 && (
                    <span className="flex items-center gap-1 text-amber-400 text-xs font-bold mt-1">
                      <Star className="h-3 w-3 fill-amber-400" />
                      {sideItem2.rating.toFixed(1)}
                    </span>
                  )}
                </div>
              </div>
            </Focusable>
          )}
        </div>
      </div>
    </section>
  )
}

export default YuCineHero
