import { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  setFocus,
  doesFocusableExist,
  ROOT_FOCUS_KEY,
  SpatialNavigation,
} from '@noriginmedia/norigin-spatial-navigation'
import { Tv, Search as SearchIcon, X, Loader2, Calendar, Clock, ChevronDown, ChevronUp, Sparkles, Radio } from 'lucide-react'
import LivePlayer from '@/components/player/LivePlayer'
import YuCineChannelCard from '@/components/tv/YuCineChannelCard'
import Focusable from '@/components/tv/Focusable'
import { getLiveChannelEPG, getChannelDailySchedule } from '@/services/epg'
import {
  LIVE_CATEGORIES,
  categoryLabel,
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

const LiveTV = () => {
  const navigate = useNavigate()
  const [channels, setChannels] = useState<LiveChannel[]>([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState<string>('todos')
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<LiveChannel | null>(null)
  const [showSchedule, setShowSchedule] = useState(false)
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
          // Se tiver um canal salvo anteriormente, pode preparar
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

    // Executa em múltiplos estágios para cobrir a saída assíncrona do Fullscreen no Android TV
    setTimeout(restoreCardFocus, 60)
    setTimeout(restoreCardFocus, 200)
    setTimeout(restoreCardFocus, 500)
  }, [selected, filtered, lastChannelId])

  // Fallback de segurança: quando o player fechar ou ao navegar na grade da TV,
  // se o foco for perdido, qualquer seta do controle remoto restaura o foco no canal imediatamente
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

  // Tratamento da tecla Voltar do controle remoto quando está na grade de canais (sem player ativo)
  useEffect(() => {
    if (selected) return // Quando o player está aberto, o LivePlayer intercepta o voltar

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
          setQuery('')
          return
        }
        e.preventDefault()
        e.stopPropagation()
        navigate('/')
      }
    }

    window.addEventListener('keydown', handleGridBackKey)
    return () => window.removeEventListener('keydown', handleGridBackKey)
  }, [selected, query, navigate])

  // Foco automático inicial nos cards de canais ao carregar
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
    <motion.div
      className="min-h-screen bg-bg-primary pt-20 page-enter select-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
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
          <div className="relative w-full sm:w-72">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar canal..."
              className="w-full bg-[#13131c] border border-white/10 text-white placeholder-white/30 rounded-xl pl-10 pr-4 py-2 text-sm focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all outline-none"
            />
          </div>
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

        {/* Categorias Estilo YuCine (Pilulas arredondadas com destaque em dourado/vermelho) */}
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

        {/* Grade de Canais no Formato Exato da Imagem 2 do YuCine */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Loader2 className="h-8 w-8 text-amber-400 animate-spin" />
            <p className="text-white/50 text-sm">Carregando canais YuCine...</p>
          </div>
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
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 pb-20">
            {filtered.map((channel) => (
              <YuCineChannelCard
                key={channel.id}
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
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default LiveTV
