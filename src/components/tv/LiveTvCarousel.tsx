import { useEffect, useState, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react'
import { useFocusable, FocusContext } from '@noriginmedia/norigin-spatial-navigation'
import YuCineChannelCard from './YuCineChannelCard'
import { loadLiveChannels, type LiveChannel } from '@/services/liveChannels'
import { SPRING_SNAPPY } from '@/utils/motion'

interface LiveTvCarouselProps {
  title?: string
  emoji?: string
  rowIndex?: number
}

const FEATURED_CHANNEL_IDS = [
  'sbt-hd',
  'globo-sp',
  'record-hd',
  'band-hd',
  'redetv-hd',
  'cultura',
  'record-news',
  'avatar-24h',
  'adrenalina-24h',
  'masterchef-24h',
  'south-park-24h',
  'anime-24h',
]

const LiveTvCarousel = ({
  title = 'Canais de TV Mais Assistidos',
  emoji = '📡',
  rowIndex = 99,
}: LiveTvCarouselProps) => {
  const [channels, setChannels] = useState<LiveChannel[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const scrollRef = useRef<HTMLDivElement>(null)

  const { ref, focusKey } = useFocusable({
    focusKey: `carousel-live-tv-${rowIndex}`,
    trackChildren: true,
    autoRestoreFocus: true,
    saveLastFocusedChild: true,
    isFocusBoundary: false,
  })

  useEffect(() => {
    let alive = true
    loadLiveChannels()
      .then((all) => {
        if (!alive) return
        // Ordena priorizando os canais em destaque e depois os demais canais abertos/24h
        const featured = FEATURED_CHANNEL_IDS.map((id) => all.find((c) => c.id === id)).filter(
          (c): c is LiveChannel => Boolean(c)
        )
        const rest = all.filter(
          (c) =>
            !FEATURED_CHANNEL_IDS.includes(c.id) &&
            (c.category === 'abertos' || c.category === 'canais24h')
        )
        setChannels([...featured, ...rest].slice(0, 16))
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [])

  const scroll = (dir: 'left' | 'right') => {
    if (scrollRef.current) {
      const amount = scrollRef.current.clientWidth * 0.75
      scrollRef.current.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' })
    }
  }

  if (!loading && channels.length === 0) return null

  return (
    <FocusContext.Provider value={focusKey}>
      <section
        ref={ref}
        className="relative group/live-carousel opacity-100"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4 px-4 md:px-8">
          <div className="flex items-center gap-3">
            <h2 className="text-base md:text-lg font-display font-bold text-white flex items-center gap-2">
              {emoji && <span className="text-lg">{emoji}</span>}
              <span>{title}</span>
            </h2>
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-500/20 border border-red-500/30 text-red-400 text-[11px] font-bold tracking-wide uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              Ao Vivo
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/live"
              className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors"
            >
              <span>Ver Todos os Canais</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>

            <div className="hidden sm:flex gap-1.5">
              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                transition={SPRING_SNAPPY}
                onClick={() => scroll('left')}
                className="p-1.5 rounded-full bg-white/8 hover:bg-white/15 text-white transition-colors opacity-0 group-hover/live-carousel:opacity-100"
                aria-label="Rolar para esquerda"
              >
                <ChevronLeft className="h-4 w-4" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                transition={SPRING_SNAPPY}
                onClick={() => scroll('right')}
                className="p-1.5 rounded-full bg-white/8 hover:bg-white/15 text-white transition-colors opacity-0 group-hover/live-carousel:opacity-100"
                aria-label="Rolar para direita"
              >
                <ChevronRight className="h-4 w-4" />
              </motion.button>
            </div>
          </div>
        </div>

        {/* Scroll area */}
        <div
          ref={scrollRef}
          className="carousel-container scroll-hide px-4 md:px-8"
        >
          {loading ? (
            <div className="flex gap-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="w-56 md:w-64 aspect-video rounded-xl bg-white/5 animate-pulse flex-shrink-0"
                />
              ))}
            </div>
          ) : (
            <div className="flex gap-4" style={{ transform: 'translateZ(0)' }}>
              {channels.map((channel) => (
                <div
                  key={channel.id}
                  className="w-56 md:w-64 flex-shrink-0"
                >
                  <YuCineChannelCard
                    channel={channel}
                    onClick={() => navigate(`/live?channel=${channel.id}`)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </FocusContext.Provider>
  )
}

export default LiveTvCarousel
