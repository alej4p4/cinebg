import { motion } from 'framer-motion'
import { useNavigate, Link } from 'react-router-dom'
import { Clock, Trash2, Play, X } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { getPosterUrl } from '@/services/tmdb'
import LazyImage from '@/components/ui/LazyImage'
import type { WatchHistoryItem } from '@/types'
import { PAGE_VARIANTS, STAGGER_CONTAINER, STAGGER_ITEM, SPRING_SNAPPY } from '@/utils/motion'

const History = () => {
  const navigate = useNavigate()
  const { history, removeFromHistory, clearHistory } = useAppStore()

  const handlePlay = (item: WatchHistoryItem) => {
    const query = item.season ? `?season=${item.season}&episode=${item.episode ?? 1}` : ''
    navigate(`/watch/${item.type}/${item.id}${query}`)
  }

  const typeLabel = (type: WatchHistoryItem['type']) =>
    type === 'movie' ? 'FILME' : type === 'anime' ? 'ANIME' : 'SÉRIE'

  return (
    <motion.div
      className="min-h-screen bg-bg-primary pt-24 pb-12"
      variants={PAGE_VARIANTS}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <div className="max-w-screen-2xl mx-auto px-4 md:px-8">
        <div className="flex items-center justify-between mb-8 gap-3">
          <div className="flex items-center gap-3">
            <Clock className="h-7 w-7 text-accent-red" />
            <h1 className="font-display font-black text-2xl md:text-3xl text-white">Histórico</h1>
          </div>
          {history.length > 0 && (
            <button
              onClick={clearHistory}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-400/40 text-white/70 hover:text-red-300 text-sm font-semibold transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              Limpar histórico
            </button>
          )}
        </div>

        {history.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="text-center py-24 text-white/40"
          >
            <Clock className="h-16 w-16 mx-auto mb-4 opacity-20" />
            <p className="text-lg font-medium">Nada por aqui ainda</p>
            <p className="text-sm mt-1 opacity-60">
              Os títulos que você assistir aparecerão neste histórico.
            </p>
            <Link
              to="/"
              className="inline-block mt-6 bg-accent-red hover:bg-red-600 text-white font-bold px-6 py-3 rounded-xl transition-colors"
            >
              Começar a assistir
            </Link>
          </motion.div>
        ) : (
          <motion.div
            className="space-y-3 max-w-4xl"
            variants={STAGGER_CONTAINER}
            initial="hidden"
            animate="visible"
          >
            {history.map((item) => (
              <motion.div
                key={`${item.type}-${item.id}`}
                variants={STAGGER_ITEM}
                className="group flex items-center gap-4 glass rounded-xl p-3 hover:border-white/20 transition-colors"
              >
                <button
                  onClick={() => handlePlay(item)}
                  className="flex-shrink-0 w-16 sm:w-20 rounded-lg overflow-hidden"
                >
                  <LazyImage
                    src={getPosterUrl(item.posterPath, 'w185')}
                    alt={item.title}
                    fallbackTitle={item.title}
                    aspectRatio="aspect-[2/3]"
                  />
                </button>

                <button onClick={() => handlePlay(item)} className="flex-1 min-w-0 text-left">
                  <h3 className="text-white font-semibold line-clamp-1 group-hover:text-red-400 transition-colors">
                    {item.title}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs">
                    <span className="bg-white/10 text-white/70 px-2 py-0.5 rounded font-semibold">
                      {typeLabel(item.type)}
                    </span>
                    {item.season && (
                      <span className="text-accent-red font-bold">
                        T{item.season} · E{item.episode ?? 1}
                      </span>
                    )}
                    <span className="text-white/40">
                      {new Date(item.watchedAt).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </button>

                <motion.button
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.92 }}
                  transition={SPRING_SNAPPY}
                  onClick={() => handlePlay(item)}
                  className="flex-shrink-0 bg-accent-red hover:bg-red-600 text-white rounded-full p-3 shadow-lg glow-red"
                  aria-label="Continuar assistindo"
                >
                  <Play className="h-4 w-4 fill-white" />
                </motion.button>

                <button
                  onClick={() => removeFromHistory(item.id)}
                  className="flex-shrink-0 p-2 text-white/30 hover:text-red-400 transition-colors"
                  aria-label="Remover do histórico"
                >
                  <X className="h-4 w-4" />
                </button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}

export default History
