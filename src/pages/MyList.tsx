import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { List, Star, Trash2 } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { getPosterUrl } from '@/services/tmdb'
import LazyImage from '@/components/ui/LazyImage'
import Focusable from '@/components/tv/Focusable'
import { PAGE_VARIANTS } from '@/utils/motion'

const MyList = () => {
  const navigate = useNavigate()
  const { favorites, removeFavorite } = useAppStore()

  return (
    <motion.div
      className="min-h-screen bg-bg-primary pt-24 pb-12"
      variants={PAGE_VARIANTS}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <div className="max-w-screen-2xl mx-auto px-4 md:px-8">
        <div className="flex items-center gap-3 mb-8">
          <List className="h-7 w-7 text-accent-red" />
          <h1 className="font-display font-black text-2xl md:text-3xl text-white">Lista</h1>
          {favorites.length > 0 && (
            <span className="ml-1 text-sm text-white/40 font-medium">
              {favorites.length} {favorites.length === 1 ? 'título' : 'títulos'}
            </span>
          )}
        </div>

        {favorites.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="text-center py-24 text-white/40"
          >
            <List className="h-16 w-16 mx-auto mb-4 opacity-20" />
            <p className="text-lg font-medium">Sua lista está vazia</p>
            <p className="text-sm mt-1 opacity-60">
              Adicione títulos aos favoritos para vê-los aqui.
            </p>
            <Focusable focusKey="mylist-empty-explore" onEnterPress={() => navigate('/')} className="inline-block mt-6 rounded-xl">
              <Link
                to="/"
                className="inline-block bg-accent-red hover:bg-red-600 text-white font-bold px-6 py-3 rounded-xl transition-colors outline-none focus:ring-2 focus:ring-amber-400"
              >
                Explorar catálogo
              </Link>
            </Focusable>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {favorites.map((item, i) => (
              <motion.div
                key={`${item.type}-${item.id}`}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-4 glass rounded-xl p-3 hover:border-white/20 border border-transparent transition-all"
              >
                <Focusable
                  focusKey={`mylist-item-${i}`}
                  onEnterPress={() => navigate(`/details/${item.type}/${item.id}`)}
                  className="flex-1 min-w-0 rounded-xl"
                >
                  <Link to={`/details/${item.type}/${item.id}`} className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-12 h-16 rounded-lg overflow-hidden flex-shrink-0">
                      <LazyImage
                        src={getPosterUrl(item.posterPath, 'w185')}
                        alt={item.title}
                        fallbackTitle={item.title}
                        aspectRatio="aspect-[2/3]"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-semibold truncate">{item.title}</h3>
                      <div className="flex items-center gap-3 text-xs text-white/50 mt-1">
                        {item.rating > 0 && (
                          <span className="flex items-center gap-1 text-accent-gold">
                            <Star className="h-3 w-3 fill-current" />
                            {item.rating.toFixed(1)}
                          </span>
                        )}
                        <span className="uppercase">{item.type === 'movie' ? 'Filme' : item.type === 'anime' ? 'Anime' : 'Série'}</span>
                      </div>
                    </div>
                  </Link>
                </Focusable>
                <Focusable
                  focusKey={`mylist-del-${i}`}
                  onEnterPress={() => removeFavorite(item.id)}
                  className="rounded-lg flex-shrink-0"
                >
                  <button
                    onClick={() => removeFavorite(item.id)}
                    className="p-2 text-white/40 hover:text-red-400 transition-colors flex-shrink-0 rounded-lg outline-none focus:ring-2 focus:ring-amber-400"
                    title="Remover da lista"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </Focusable>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default MyList
