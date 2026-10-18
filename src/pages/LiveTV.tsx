import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
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

const LiveTV = () => {
  const [channels, setChannels] = useState<LiveChannel[]>([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState<string>('todos')
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<LiveChannel | null>(null)
  const [showSchedule, setShowSchedule] = useState(false)
  const [favorites, setFavorites] = useState<Set<string>>(() => loadLiveFavorites())
  const [lastChannelId, setLastChannelId] = useState<string | null>(() => loadLastLiveChannelId())

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

  useEffect(() => {
    if (selected) {
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

        {/* Player do Canal Selecionado */}
        {selected && (
          <div className="mb-8 bg-[#0a0a10] border border-white/10 rounded-2xl overflow-hidden p-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-white font-bold text-base md:text-lg">
                  {selected.name}
                </span>
                <span className="px-2 py-0.5 rounded bg-white/10 text-white/70 text-xs font-semibold">
                  {categoryLabel(selected.category)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Focusable onEnterPress={() => setFavorites(toggleLiveFavorite(favorites, selected.id))}>
                  <button
                    onClick={() => setFavorites(toggleLiveFavorite(favorites, selected.id))}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white text-xs font-bold transition-colors outline-none"
                  >
                    {favorites.has(selected.id) ? '❤️ Favorito' : '🤍 Favoritar'}
                  </button>
                </Focusable>
                <Focusable onEnterPress={() => setSelected(null)}>
                  <button
                    onClick={() => setSelected(null)}
                    className="p-1.5 text-white/50 hover:text-white rounded-lg hover:bg-white/10 transition-colors outline-none"
                    title="Fechar player"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </Focusable>
              </div>
            </div>

            <LivePlayer
              channel={selected}
              onNextChannel={handleNextChannel}
              onPrevChannel={handlePrevChannel}
            />

            {/* Informações EPG e Programação no Ar */}
            {(() => {
              const epg = getLiveChannelEPG(selected.id, selected.category, selected.name)
              const schedule = getChannelDailySchedule(selected.id, selected.category, selected.name)

              return (
                <div className="mt-4 pt-4 border-t border-white/10 space-y-3">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-600/30 text-red-400 border border-red-500/40 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                          No Ar Agora
                        </span>
                        <span className="text-white/60 text-xs font-semibold font-mono">
                          {epg.start} - {epg.end}
                        </span>
                        {epg.category && (
                          <span className="px-2 py-0.5 rounded bg-white/5 text-white/60 text-[10px] font-medium">
                            {epg.category}
                          </span>
                        )}
                      </div>
                      <h2 className="text-white font-extrabold text-base md:text-lg tracking-tight">
                        {epg.title}
                      </h2>
                    </div>

                    <div className="flex items-center gap-3 self-stretch sm:self-auto justify-between sm:justify-end">
                      <div className="text-right hidden sm:block">
                        <span className="text-[10px] uppercase font-bold text-white/40 block">
                          A Seguir
                        </span>
                        <span className="text-xs text-white/80 font-semibold truncate max-w-[220px] block">
                          {epg.nextTitle}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => setShowSchedule((s) => !s)}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/90 text-xs font-bold transition-all border border-white/10 hover:border-amber-400/40"
                      >
                        <Calendar className="w-3.5 h-3.5 text-amber-400" />
                        <span>{showSchedule ? 'Ocultar Grade' : 'Grade do Dia'}</span>
                        {showSchedule ? (
                          <ChevronUp className="w-3.5 h-3.5 text-white/60" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 text-white/60" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Barra de Progresso do Programa */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-white/40 font-mono">
                      <span>Início: {epg.start}</span>
                      <span className="text-amber-300 font-bold">{epg.progress}% concluído</span>
                      <span>Término: {epg.end}</span>
                    </div>
                    <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-400 via-orange-500 to-accent-red transition-all duration-300 rounded-full shadow-[0_0_10px_rgba(251,191,36,0.6)]"
                        style={{ width: `${epg.progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Grade Completa do Dia Expansível */}
                  {showSchedule && (
                    <div className="mt-3 p-3.5 rounded-xl bg-black/50 border border-white/10 max-h-64 overflow-y-auto space-y-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-amber-300 mb-2">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Programação Completa do Dia — Horário de Brasília</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {schedule.map((slot, idx) => (
                          <div
                            key={idx}
                            className={`flex items-center justify-between p-2.5 rounded-lg text-xs transition-colors ${
                              slot.isCurrent
                                ? 'bg-amber-500/20 border border-amber-400/50 text-white font-bold'
                                : 'bg-white/5 text-white/70 hover:bg-white/10'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 truncate">
                              <span className="font-mono text-amber-400 text-xs font-bold flex-shrink-0">
                                {slot.time}
                              </span>
                              <span className="truncate">{slot.title}</span>
                            </div>
                            {slot.isCurrent ? (
                              <span className="px-1.5 py-0.5 rounded text-[9px] bg-red-600 text-white font-black uppercase flex-shrink-0">
                                No Ar
                              </span>
                            ) : (
                              <span className="text-[10px] text-white/40 flex-shrink-0">
                                {slot.category}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })()}
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
