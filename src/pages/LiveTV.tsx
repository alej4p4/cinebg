import { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  setFocus,
  doesFocusableExist,
  ROOT_FOCUS_KEY,
  SpatialNavigation,
} from '@noriginmedia/norigin-spatial-navigation'
import { Tv, Search as SearchIcon } from 'lucide-react'
import LivePlayer from '@/components/player/LivePlayer'
import YuCineChannelCard from '@/components/tv/YuCineChannelCard'
import Focusable from '@/components/tv/Focusable'
import { SkeletonLiveTVGrid } from '@/components/ui/SkeletonCard'
import ProgressBar from '@/components/ui/ProgressBar'
import {
  LIVE_CATEGORIES,
  loadLiveChannels,
  type LiveChannel,
} from '@/services/liveChannels'
import {
  loadLastLiveChannelId,
  loadLiveFavorites,
  saveLastLiveChannelId,
  toggleLiveFavorite,
} from '@/services/liveFavorites'
import { useLicense } from '@/hooks/useLicense'
import { useAppStore } from '@/store/useAppStore'
import { PAGE_VARIANTS, STAGGER_CONTAINER, STAGGER_ITEM } from '@/utils/motion'
import { markBackHandled } from '@/utils/tv'
import { startEPGBackgroundSync, getEPGProgramCached } from '@/services/epgCache'
import { type EPGProgram } from '@/services/epg'

const LiveTV = () => {
  const navigate = useNavigate()
  const [channels, setChannels] = useState<LiveChannel[]>([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState<string>('todos')
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<LiveChannel | null>(null)
  const [favorites, setFavorites] = useState<Set<string>>(() => loadLiveFavorites())
  const [lastChannelId, setLastChannelId] = useState<string | null>(() => loadLastLiveChannelId())
  const { isLicensed, isTrial } = useLicense()
  const { setVipModalOpen } = useAppStore()
  const [searchParams] = useSearchParams()
  const channelParam = searchParams.get('channel')

  useEffect(() => {
    if (channelParam && channels.length > 0) {
      const found = channels.find((c) => c.id === channelParam)
      if (found) {
        setSelected(found)
      }
    }
  }, [channelParam, channels])

  useEffect(() => {
    let alive = true
    loadLiveChannels()
      .then((list) => {
        if (alive) {
          setChannels(list)
          if (lastChannelId) {
            const found = list.find((c) => c.id === lastChannelId)
            if (found && !selected) {
              // não seleciona automaticamente para não tocar áudio sem interação
            }
          }
        }
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [lastChannelId, selected])

  const lastSelectedChannelIdRef = useRef<string | null>(null)

  // EPG Program cache state
  const [epgProgram, setEpgProgram] = useState<EPGProgram | undefined>(undefined)
  const epgLoadingRef = useRef<Set<string>>(new Set())

  // Initialize EPG background sync when channels load
  useEffect(() => {
    if (channels.length > 0) {
      const cleanup = startEPGBackgroundSync(channels)
      return cleanup
    }
  }, [channels])

  // Update EPG program for selected channel (cached first, then live)
  useEffect(() => {
    if (!selected) {
      setEpgProgram(undefined)
      return
    }

    const channelId = selected.id
    if (epgLoadingRef.current.has(channelId)) return
    epgLoadingRef.current.add(channelId)

    // 1. Instant cache hit
    getEPGProgramCached(selected).then((program) => {
      setEpgProgram(program)
      epgLoadingRef.current.delete(channelId)
    }).catch(() => {
      epgLoadingRef.current.delete(channelId)
    })
  }, [selected])

  useEffect(() => {
    if (selected) {
      lastSelectedChannelIdRef.current = selected.id
      saveLastLiveChannelId(selected.id)
      setLastChannelId(selected.id)
    }
  }, [selected])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return channels.filter((c) => {
      if (category === 'favorites' && !favorites.has(c.id)) return false
      if (category !== 'todos' && category !== 'favorites' && c.category !== category) return false
      if (q !== '' && !c.name.toLowerCase().includes(q)) return false
      return true
    })
  }, [channels, category, query, favorites])

  const currentIndex = selected ? filtered.findIndex((c) => c.id === selected.id) : -1
  const handleNextChannel = () => {
    if (filtered.length === 0) return
    const nextIdx = (currentIndex + 1) % filtered.length
    setSelected(filtered[nextIdx])
  }
  const handlePrevChannel = () => {
    if (filtered.length === 0) return
    const prevIdx = (currentIndex - 1 + filtered.length) % filtered.length
    setSelected(filtered[prevIdx])
  }

  // Restaura o foco D-Pad no card do canal quando o player fecha
  const handleClosePlayer = useCallback(() => {
    const targetId = selected?.id || lastSelectedChannelIdRef.current || lastChannelId
    setSelected(null)

    const restoreCardFocus = () => {
      try {
        SpatialNavigation.resume()
        SpatialNavigation.updateAllLayouts().catch(() => {})
        const focusKey = targetId && doesFocusableExist(`channel-${targetId}`)
          ? `channel-${targetId}`
          : filtered.length > 0 && doesFocusableExist(`channel-${filtered[0].id}`)
          ? `channel-${filtered[0].id}`
          : ROOT_FOCUS_KEY

        setFocus(focusKey)
        const domEl = document.querySelector(`[data-focus-key="${focusKey}"]`) as HTMLElement | null
        if (domEl) {
          domEl.focus()
          domEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
        }
      } catch {}
    }

    setTimeout(restoreCardFocus, 60)
    setTimeout(restoreCardFocus, 200)
    setTimeout(restoreCardFocus, 500)
  }, [selected, filtered, lastChannelId])

  useEffect(() => {
    if (selected) return

    const handleEnsureFocus = (e: KeyboardEvent) => {
      const isArrow = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)
      if (!isArrow) return

      const activeEl = document.activeElement
      const isInput = ['INPUT', 'TEXTAREA'].includes(activeEl?.tagName || '')
      if (isInput) return

      if (!activeEl || activeEl === document.body || activeEl === document.documentElement) {
        e.preventDefault()
        const targetId = lastSelectedChannelIdRef.current || lastChannelId || channels[0]?.id
        if (targetId && doesFocusableExist(`channel-${targetId}`)) {
          setFocus(`channel-${targetId}`)
          const domEl = document.querySelector(`[data-focus-key="channel-${targetId}"]`) as HTMLElement | null
          if (domEl) {
            domEl.focus()
            domEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
          }
        }
      }
    }

    window.addEventListener('keydown', handleEnsureFocus)
    return () => window.removeEventListener('keydown', handleEnsureFocus)
  }, [selected, channels, lastChannelId])

  useEffect(() => {
    if (selected) return

    const handleGridBackKey = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        if (e.key === 'Escape') {
          ;(e.target as HTMLElement).blur()
          return
        }
      }

      const code = e.keyCode || e.which
      if (
        e.key === 'Escape' ||
        e.key === 'GoBack' ||
        e.key === 'Backspace' ||
        code === 27 ||
        code === 8 ||
        code === 4 ||
        code === 10009 ||
        code === 461 ||
        code === 283
      ) {
        if (query) {
          e.preventDefault()
          e.stopPropagation()
          markBackHandled()
          setQuery('')
          return
        }
        e.preventDefault()
        e.stopPropagation()
        markBackHandled()
        navigate('/')
      }
    }

    window.addEventListener('keydown', handleGridBackKey)
    return () => window.removeEventListener('keydown', handleGridBackKey)
  }, [selected, query, navigate])

  useEffect(() => {
    if (!loading && channels.length > 0 && !selected) {
      const timer = setTimeout(() => {
        try {
          SpatialNavigation.updateAllLayouts().catch(() => {})
          const targetId = lastChannelId || channels[0]?.id
          if (targetId && doesFocusableExist(`channel-${targetId}`)) {
            setFocus(`channel-${targetId}`)
          } else {
            setFocus(ROOT_FOCUS_KEY).catch(() => {})
          }
        } catch {}
      }, 120)
      return () => clearTimeout(timer)
    }
  }, [loading, channels, selected, lastChannelId])

  return (
    <>
      <ProgressBar isLoading={loading} />
      <motion.div
        className="min-h-screen bg-bg-primary pt-20 select-none"
        variants={PAGE_VARIANTS}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        <div className="max-w-screen-2xl mx-auto px-4 md:px-8">
          {/* Cabeçalho da TV Estilo YuCine */}
          <div className="py-6 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent-red/20 border border-accent-red/30 flex items-center justify-center">
                <Tv className="h-6 w-6 text-accent-red" />
              </div>
              <div>
                <h1 className="font-display font-black text-2xl md:text-3xl text-white tracking-tight">
                  TV
                </h1>
                <p className="text-white/40 text-xs">
                  Canais oficiais em alta definição estilo YuCine
                </p>
              </div>
            </div>

            {/* Busca Rápida de Canais */}
            <Focusable
              focusKey="live-search-input"
              onEnterPress={() => {
                const el = document.getElementById('live-channel-search') as HTMLInputElement | null
                el?.focus()
              }}
              className="relative w-full sm:w-72 rounded-xl"
            >
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30 pointer-events-none" />
              <input
                id="live-channel-search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar canal..."
                className="w-full bg-[#13131c] border border-white/10 text-white placeholder-white/30 rounded-xl pl-10 pr-4 py-2 text-sm focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all outline-none"
              />
            </Focusable>
          </div>

          {/* Player do Canal em Tela Cheia Imediata (Estilo YuCine) */}
          {selected && (
            <LivePlayer
              channel={selected}
              onClose={handleClosePlayer}
              onNextChannel={handleNextChannel}
              onPrevChannel={handlePrevChannel}
              isFavorite={favorites.has(selected.id)}
              onToggleFavorite={() =>
                setFavorites(toggleLiveFavorite(favorites, selected.id))
              }
              epgProgram={epgProgram}
            />
          )}

          {/* Banner Informativo quando o teste encerrou: Canais Abertos Liberados */}
          {!isLicensed && !isTrial && (
            <div className="mb-4 p-3 sm:p-4 bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-transparent border border-amber-400/30 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
              <div className="flex items-center gap-2.5 text-xs sm:text-sm text-amber-200">
                <span className="text-xl flex-shrink-0">📺</span>
                <div>
                  <p className="font-bold text-white">Modo TV Aberta Gratuita Ativo</p>
                  <p className="text-amber-200/70 text-xs">Os canais de TV aberta (SBT, Record, Band, Cultura, etc.) continuam 100% liberados e gratuitos para você!</p>
                </div>
              </div>
              <Focusable onEnterPress={() => setVipModalOpen(true)}>
                <button
                  type="button"
                  onClick={() => setVipModalOpen(true)}
                  className="bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-extrabold px-4 py-2 rounded-xl text-xs transition-all shadow-md active:scale-95 flex-shrink-0"
                >
                  👑 Liberar Filmes e Séries VIP
                </button>
              </Focusable>
            </div>
          )}

          {/* Categorias Estilo YuCine */}
          {!loading && (
            <div className="flex gap-2 overflow-x-auto pb-4 mb-4 -mx-1 px-1 no-scrollbar">
              {LIVE_CATEGORIES.map((cat) => {
                const active = category === cat.id
                return (
                  <Focusable
                    key={cat.id}
                    focusKey={`cat-${cat.id}`}
                    onEnterPress={() => setCategory(cat.id)}
                    className="rounded-full flex-shrink-0"
                  >
                    <button
                      onClick={() => setCategory(cat.id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs md:text-sm font-bold whitespace-nowrap transition-all duration-200 outline-none ${
                        active
                          ? 'bg-amber-400 text-black shadow-lg shadow-amber-400/30 scale-105'
                          : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white border border-white/5'
                      }`}
                    >
                      <span>{cat.emoji}</span>
                      <span>{cat.label}</span>
                      {cat.id === 'favorites' && favorites.size > 0 && (
                        <span className="text-xs bg-black/30 px-1.5 py-0.5 rounded-full font-mono">
                          {favorites.size}
                        </span>
                      )}
                    </button>
                  </Focusable>
                )
              })}
            </div>
          )}

          {/* Grade de Canais com Skeleton Shimmer durante o Carregamento */}
          {loading ? (
            <SkeletonLiveTVGrid count={12} />
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center gap-2">
              <Tv className="h-12 w-12 text-white/20" />
              <p className="text-white font-bold">
                {category === 'favorites' ? 'Nenhum canal favoritado ainda' : 'Nenhum canal encontrado'}
              </p>
              <p className="text-white/40 text-sm">
                {category === 'favorites'
                  ? 'Toque no coração de qualquer canal para fixar seus canais preferidos aqui.'
                  : 'Tente outra categoria ou ajuste o termo de busca.'}
              </p>
            </div>
          ) : (
            <motion.div
              variants={STAGGER_CONTAINER}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-4 md:gap-6 pb-20"
            >
              {filtered.map((channel) => (
                <motion.div key={channel.id} variants={STAGGER_ITEM}>
                  <YuCineChannelCard
                    channel={channel}
                    isSelected={selected?.id === channel.id}
                    isFavorite={favorites.has(channel.id)}
                    onToggleFavorite={() =>
                      setFavorites(toggleLiveFavorite(favorites, channel.id))
                    }
                    onClick={() => {
                      setSelected(channel)
                      window.scrollTo({ top: 0, behavior: 'smooth' })
                    }}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </motion.div>
    </>
  )
}

export default LiveTV
