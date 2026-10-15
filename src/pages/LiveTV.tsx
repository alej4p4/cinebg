import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Loader2, Play, Search as SearchIcon, Tv, X } from 'lucide-react'
import LivePlayer from '@/components/player/LivePlayer'
import {
  LIVE_CATEGORIES,
  categoryEmoji,
  categoryLabel,
  countryFlag,
  loadLiveChannels,
  type LiveChannel,
} from '@/services/liveChannels'

const ChannelLogo = ({ channel }: { channel: LiveChannel }) => {
  const [failed, setFailed] = useState(false)
  if (!channel.logo || failed) {
    return (
      <span className="text-3xl" aria-hidden>
        {categoryEmoji(channel.category)}
      </span>
    )
  }
  return (
    <img
      src={channel.logo}
      alt={channel.name}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      className="max-h-full max-w-full object-contain"
    />
  )
}

const LiveTV = () => {
  const [channels, setChannels] = useState<LiveChannel[]>([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState<string>('all')
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<LiveChannel | null>(null)

  useEffect(() => {
    let alive = true
    loadLiveChannels()
      .then((list) => {
        if (alive) setChannels(list)
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [])

  const availableCategories = useMemo(() => {
    const present = new Set(channels.map((c) => c.category))
    return LIVE_CATEGORIES.filter((c) => present.has(c.id))
  }, [channels])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return channels.filter(
      (c) =>
        (category === 'all' || c.category === category) &&
        (q === '' || c.name.toLowerCase().includes(q)),
    )
  }, [channels, category, query])

  return (
    <motion.div
      className="min-h-screen bg-bg-primary pt-20 page-enter"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="max-w-screen-2xl mx-auto px-4 md:px-8">
        <div className="py-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display font-black text-3xl text-white flex items-center gap-2">
              <Tv className="h-7 w-7 text-accent-red" />
              TV ao Vivo
            </h1>
            <p className="text-text-secondary text-sm mt-1">
              Canais de streaming gratuitos 24/7, direto no player nativo.
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar canal..."
              className="w-full bg-[#13131c] border border-white/8 text-white placeholder-white/30 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:border-accent-red/50 focus:ring-2 focus:ring-accent-red/20 transition-all outline-none"
            />
          </div>
        </div>

        {/* Player do canal selecionado */}
        {selected && (
          <div className="mb-6">
            <div className="flex items-center justify-end mb-2">
              <button
                onClick={() => setSelected(null)}
                className="flex items-center gap-1.5 text-white/50 hover:text-white text-xs font-bold transition-colors"
              >
                <X className="h-3.5 w-3.5" />
                Fechar player
              </button>
            </div>
            <LivePlayer channel={selected} />
          </div>
        )}

        {/* Abas de categoria */}
        {!loading && (
          <div className="flex gap-2 overflow-x-auto pb-3 mb-2 -mx-1 px-1">
            <button
              onClick={() => setCategory('all')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors tv-focusable ${
                category === 'all'
                  ? 'bg-accent-red text-white'
                  : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
              }`}
            >
              📡 Todos
              <span className="text-xs opacity-60">{channels.length}</span>
            </button>
            {availableCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors tv-focusable ${
                  category === cat.id
                    ? 'bg-accent-red text-white'
                    : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                }`}
              >
                {cat.emoji} {cat.label}
              </button>
            ))}
          </div>
        )}

        {/* Conteúdo */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Loader2 className="h-8 w-8 text-accent-red animate-spin" />
            <p className="text-white/50 text-sm">Carregando canais...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center gap-2">
            <Tv className="h-12 w-12 text-white/20" />
            <p className="text-white font-bold">Nenhum canal encontrado</p>
            <p className="text-white/40 text-sm">
              Tente outra categoria ou ajuste o termo de busca.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 pb-16">
            {filtered.map((channel, i) => (
              <motion.button
                key={channel.id}
                type="button"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: Math.min(i * 0.02, 0.4) }}
                onClick={() => {
                  setSelected(channel)
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
                className={`group bg-bg-card border rounded-xl p-4 text-left transition-all tv-focusable ${
                  selected?.id === channel.id
                    ? 'border-accent-red/70 bg-white/5'
                    : 'border-white/5 hover:border-accent-red/50 hover:bg-white/5'
                }`}
              >
                <div className="flex items-center justify-center h-16 mb-3">
                  <ChannelLogo channel={channel} />
                </div>
                <h3 className="text-sm font-bold text-white truncate group-hover:text-red-400 transition-colors">
                  {channel.name}
                </h3>
                <div className="flex items-center justify-between mt-2 gap-2">
                  <span className="text-[11px] text-white/50 bg-white/5 px-2 py-0.5 rounded truncate">
                    {categoryLabel(channel.category)}
                  </span>
                  <span className="text-xs text-white/50 flex-shrink-0">
                    {countryFlag(channel.country)}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-center w-7 h-7 rounded-full bg-accent-red/20 text-accent-red opacity-0 group-hover:opacity-100 transition-opacity">
                  <Play className="h-3.5 w-3.5 fill-current" />
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default LiveTV
