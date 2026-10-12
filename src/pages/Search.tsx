import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Search as SearchIcon } from 'lucide-react'
import MovieCard from '@/components/ui/MovieCard'
import { SkeletonGrid } from '@/components/ui/SkeletonCard'
import { searchMulti } from '@/services/tmdb'
import type { MediaItem } from '@/types'

const Search = () => {
  const [searchParams] = useSearchParams()
  const query = searchParams.get('q') || ''
  
  const [items, setItems] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  useEffect(() => {
    const doSearch = async () => {
      if (!query.trim()) {
        setItems([])
        setHasSearched(false)
        return
      }
      
      setLoading(true)
      setHasSearched(true)
      try {
        const result = await searchMulti(query, 1)
        setItems(result.items)
      } catch (err) {
        console.error('Search failed:', err)
      } finally {
        setLoading(false)
      }
    }
    
    doSearch()
  }, [query])

  return (
    <motion.div
      className="min-h-screen bg-bg-primary pt-20 page-enter"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="max-w-screen-2xl mx-auto px-4 md:px-8 py-6">
        <div className="mb-8">
          <h1 className="font-display font-black text-2xl md:text-3xl text-white flex items-center gap-2">
            <SearchIcon className="h-6 w-6 text-accent-red" />
            Resultados da busca
          </h1>
          {query && (
            <p className="text-text-secondary text-sm mt-1">
              Buscando por: <span className="text-white font-medium">"{query}"</span>
            </p>
          )}
        </div>

        {!hasSearched ? (
          <div className="flex flex-col items-center justify-center py-20 text-white/50">
            <SearchIcon className="h-16 w-16 mb-4 opacity-20" />
            <p>Digite algo na barra de pesquisa para começar</p>
          </div>
        ) : loading ? (
          <SkeletonGrid count={12} />
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-white/50">
            <p className="text-lg">Nenhum resultado encontrado para "{query}"</p>
            <p className="text-sm mt-2">Tente buscar por termos diferentes ou verifique a ortografia.</p>
          </div>
        ) : (
          <div className="content-grid">
            {items.map((item, i) => (
              <MovieCard key={`${item.id}-${i}`} item={item} index={i} />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default Search
