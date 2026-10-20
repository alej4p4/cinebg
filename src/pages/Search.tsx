import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search as SearchIcon, X, SlidersHorizontal, Sparkles, Mic, Keyboard, Delete } from 'lucide-react'
import useSpeechRecognition from '@/hooks/useSpeechRecognition'
import MovieCard from '@/components/ui/MovieCard'
import Focusable from '@/components/tv/Focusable'
import { SkeletonGrid } from '@/components/ui/SkeletonCard'
import ProgressBar from '@/components/ui/ProgressBar'
import ErrorState from '@/components/ui/ErrorState'
import { EmptySearch } from '@/components/ui/EmptyState'
import { searchMulti } from '@/services/tmdb'
import { MOVIE_GENRES, TV_GENRES, type MediaItem } from '@/types'
import { PAGE_VARIANTS, STAGGER_CONTAINER, STAGGER_ITEM } from '@/utils/motion'
import { isTVDevice, isMobileDevice } from '@/utils/tv'
import { useAppStore } from '@/store/useAppStore'
import { setFocus, doesFocusableExist } from '@noriginmedia/norigin-spatial-navigation'

const ALL_GENRES = { ...MOVIE_GENRES, ...TV_GENRES }

const POPULAR_SEARCH_TAGS = [
  { label: '🔥 Em Alta Hoje', query: '2026' },
  { label: '🎬 Ação & Aventura', query: 'Ação' },
  { label: '🍿 Comédias', query: 'Comédia' },
  { label: '👻 Terror', query: 'Terror' },
  { label: '🦸 Heróis', query: 'Vingadores' },
  { label: '🚀 Ficção Científica', query: 'Ficção' },
  { label: '🃏 Animes', query: 'Anime' },
  { label: '⭐ Clássicos', query: 'Clássico' },
]

const KEYBOARD_LAYOUT = [
  ['A', 'B', 'C', 'D', 'E', 'F'],
  ['G', 'H', 'I', 'J', 'K', 'L'],
  ['M', 'N', 'O', 'P', 'Q', 'R'],
  ['S', 'T', 'U', 'V', 'W', 'X'],
  ['Y', 'Z', '1', '2', '3', '4'],
  ['5', '6', '7', '8', '9', '0'],
]

const Search = () => {
  const { tvMode } = useAppStore()
  const isMobile = isMobileDevice() || (typeof window !== 'undefined' && window.innerWidth < 850)
  const isTv = !isMobile && (isTVDevice() || tvMode)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [error, setError] = useState(false)
  const [selectedGenre, setSelectedGenre] = useState<number | null>(null)
  const [selectedYear, setSelectedYear] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [voiceToast, setVoiceToast] = useState<string | null>(null)
  const [showTvKeyboard, setShowTvKeyboard] = useState(() => isTv)
  const inputRef = useRef<HTMLInputElement>(null)
  const lastInputTimeRef = useRef(0)

  // Inserção suave com debounce para evitar caracteres duplicados em D-Pad/Enter + Click simultâneo
  const handleKeyInput = (char: string) => {
    const now = Date.now()
    if (now - lastInputTimeRef.current < 75) return
    lastInputTimeRef.current = now
    setQuery((prev) => prev + char)
  }

  const handleSpace = () => {
    const now = Date.now()
    if (now - lastInputTimeRef.current < 75) return
    lastInputTimeRef.current = now
    setQuery((prev) => prev + ' ')
  }

  const handleBackspace = () => {
    const now = Date.now()
    if (now - lastInputTimeRef.current < 75) return
    lastInputTimeRef.current = now
    setQuery((prev) => prev.slice(0, -1))
  }

  const handleClear = () => {
    setQuery('')
  }

  const handleVoiceResult = (spokenText: string) => {
    setQuery(spokenText)
    setVoiceToast(`🎙️ "${spokenText}"`)
    setTimeout(() => setVoiceToast(null), 4000)
  }

  const {
    isListening,
    transcript: liveTranscript,
    isSupported: voiceSupported,
    error: voiceError,
    startListening,
    stopListening,
  } = useSpeechRecognition(handleVoiceResult)

  // Posicionamento de foco inicial inteligente (TV = Tecla 'A' do teclado virtual; Desktop = input; Mobile = foco ao tocar)
  useEffect(() => {
    if (isTv) {
      setShowTvKeyboard(true)
      const timer = setTimeout(() => {
        try {
          if (doesFocusableExist('tvkey-A')) {
            setFocus('tvkey-A')
          }
        } catch {}
      }, 150)
      return () => clearTimeout(timer)
    } else {
      setShowTvKeyboard(false)
      if (!isMobile) {
        inputRef.current?.focus()
      }
    }
  }, [isTv, isMobile])

  // Suporte global a digitação direta via controle remoto com teclado físico ou mini-teclado USB na TV
  useEffect(() => {
    if (!isTv) return

    const handlePhysicalKeyDown = (e: KeyboardEvent) => {
      // Se estiver focado no input de texto nativo, deixa o navegador processar
      if (document.activeElement === inputRef.current) return

      // Teclas reservadas para navegação direcional espacial D-Pad
      if (
        [
          'ArrowUp',
          'ArrowDown',
          'ArrowLeft',
          'ArrowRight',
          'Enter',
          'Tab',
          'Escape',
        ].includes(e.key) ||
        [19, 20, 21, 22, 23, 13, 27].includes(e.keyCode || e.which)
      ) {
        return
      }

      // Backspace
      if (e.key === 'Backspace' || e.keyCode === 8) {
        e.preventDefault()
        handleBackspace()
        return
      }

      // Espaço
      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault()
        handleSpace()
        return
      }

      // Caracteres imprimíveis gerais (letras A-Z, números 0-9, pontuação)
      if (e.key && e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
        e.preventDefault()
        handleKeyInput(e.key.toUpperCase())
      }
    }

    window.addEventListener('keydown', handlePhysicalKeyDown)
    return () => window.removeEventListener('keydown', handlePhysicalKeyDown)
  }, [])

  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      setSearched(false)
      setError(false)
      return
    }
    const timeout = setTimeout(async () => {
      setLoading(true)
      setSearched(true)
      setError(false)
      try {
        const data = await searchMulti(query)
        let items = data.items
        if (selectedGenre) items = items.filter((i) => i.genreIds.includes(selectedGenre))
        if (selectedYear) items = items.filter((i) => i.releaseDate?.startsWith(selectedYear))
        setResults(items)
      } catch {
        setError(true)
      }
      finally { setLoading(false) }
    }, 420)
    return () => clearTimeout(timeout)
  }, [query, selectedGenre, selectedYear])

  return (
    <motion.div
      className="min-h-screen bg-bg-primary pt-[calc(5rem+env(safe-area-inset-top,0px))] pb-12 pl-[env(safe-area-inset-left,0px)] pr-[env(safe-area-inset-right,0px)]"
      variants={PAGE_VARIANTS}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <ProgressBar isLoading={loading} />
      <div className="max-w-screen-2xl mx-auto px-4 md:px-8">
        {/* Search bar */}
        <div className="relative mb-6 max-w-2xl mx-auto">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/30 pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                inputRef.current?.blur()
              }
            }}
            enterKeyHint="search"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck="false"
            placeholder="Buscar filmes, séries, anime..."
            className={`w-full bg-[#13131c] border border-white/8 text-white placeholder-white/30 rounded-2xl pl-12 ${
              query ? (isTv ? 'pr-32' : 'pr-24') : (isTv ? 'pr-24' : 'pr-16')
            } py-3.5 sm:py-4 text-sm sm:text-base focus:border-accent-red/50 focus:ring-2 focus:ring-accent-red/20 transition-all outline-none ${
              isTv ? 'tv-focusable' : ''
            }`}
          />

          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
            {/* Botão de Limpar Busca */}
            <AnimatePresence>
              {query && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.15 }}
                  onClick={() => setQuery('')}
                  className="p-1.5 text-white/40 hover:text-white transition-colors tv-focusable rounded-lg"
                  title="Limpar pesquisa"
                >
                  <X className="h-4 w-4" />
                </motion.button>
              )}
            </AnimatePresence>

            {/* Alternador Teclado Virtual TV (Exclusivo para TV) */}
            {isTv && (
              <button
                type="button"
                onClick={() => setShowTvKeyboard(!showTvKeyboard)}
                className={`p-2 rounded-xl transition-all tv-focusable ${
                  showTvKeyboard
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                    : 'text-white/50 hover:text-white hover:bg-white/10'
                }`}
                title="Teclado Virtual de TV"
              >
                <Keyboard className="h-4 w-4" />
              </button>
            )}

            {/* Botão de Busca por Voz */}
            <Focusable
              focusKey="search-voice-btn"
              onEnterPress={isListening ? stopListening : startListening}
              className="rounded-xl"
            >
              <button
                type="button"
                onClick={isListening ? stopListening : startListening}
                className={`p-2 rounded-xl transition-all relative tv-focusable ${
                  isListening
                    ? 'bg-accent-red text-white shadow-lg shadow-red-900/50 scale-110 animate-pulse'
                    : 'text-white/50 hover:text-white hover:bg-white/10'
                }`}
                title={
                  voiceSupported
                    ? isListening
                      ? 'Ouvindo... Clique para cancelar'
                      : 'Pesquisar por Voz (Microfone)'
                    : 'Reconhecimento de voz não suportado neste aparelho'
                }
              >
                <Mic className={`h-4 w-4 ${isListening ? 'animate-bounce' : ''}`} />
                {isListening && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full animate-ping" />
                )}
              </button>
            </Focusable>
          </div>
        </div>

        {/* Teclado Virtual On-Screen para Controle Remoto de TV (Apenas em TV) */}
        <AnimatePresence>
          {isTv && showTvKeyboard && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-md mx-auto mb-6 p-3.5 bg-[#14141e] border border-white/10 rounded-2xl shadow-2xl"
            >
              <div className="grid grid-cols-6 gap-2 mb-2">
                {KEYBOARD_LAYOUT.flat().map((char) => (
                  <Focusable
                    key={char}
                    focusKey={`tvkey-${char}`}
                    onEnterPress={() => handleKeyInput(char)}
                    autoScroll={false}
                  >
                    <button
                      type="button"
                      tabIndex={-1}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => handleKeyInput(char)}
                      className="w-full h-11 rounded-xl bg-white/5 hover:bg-white/15 text-white font-bold text-base border border-white/10 transition-transform active:scale-95 flex items-center justify-center outline-none select-none"
                    >
                      {char}
                    </button>
                  </Focusable>
                ))}
              </div>
              <div className="grid grid-cols-5 gap-2">
                <Focusable
                  focusKey="tvkey-space"
                  onEnterPress={handleSpace}
                  autoScroll={false}
                  className="col-span-2"
                  onArrowPress={(dir) => {
                    if (dir === 'down') {
                      if (doesFocusableExist('search-card-0')) {
                        setFocus('search-card-0')
                        return false
                      }
                      if (doesFocusableExist('search-tag-0')) {
                        setFocus('search-tag-0')
                        return false
                      }
                    }
                    return true
                  }}
                >
                  <button
                    type="button"
                    tabIndex={-1}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={handleSpace}
                    className="w-full h-11 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/10 flex items-center justify-center gap-1.5 outline-none transition-transform active:scale-95 select-none"
                  >
                    ESPAÇO
                  </button>
                </Focusable>
                <Focusable
                  focusKey="tvkey-ç"
                  onEnterPress={() => handleKeyInput('Ç')}
                  autoScroll={false}
                  onArrowPress={(dir) => {
                    if (dir === 'down') {
                      if (doesFocusableExist('search-card-0')) {
                        setFocus('search-card-0')
                        return false
                      }
                      if (doesFocusableExist('search-tag-0')) {
                        setFocus('search-tag-0')
                        return false
                      }
                    }
                    return true
                  }}
                >
                  <button
                    type="button"
                    tabIndex={-1}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleKeyInput('Ç')}
                    className="w-full h-11 rounded-xl bg-white/5 hover:bg-white/15 text-white font-bold text-base border border-white/10 flex items-center justify-center outline-none transition-transform active:scale-95 select-none"
                  >
                    Ç
                  </button>
                </Focusable>
                <Focusable
                  focusKey="tvkey-backspace"
                  onEnterPress={handleBackspace}
                  autoScroll={false}
                  onArrowPress={(dir) => {
                    if (dir === 'down') {
                      if (doesFocusableExist('search-card-0')) {
                        setFocus('search-card-0')
                        return false
                      }
                      if (doesFocusableExist('search-tag-0')) {
                        setFocus('search-tag-0')
                        return false
                      }
                    }
                    return true
                  }}
                >
                  <button
                    type="button"
                    tabIndex={-1}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={handleBackspace}
                    className="w-full h-11 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/10 flex items-center justify-center gap-1.5 outline-none transition-transform active:scale-95 select-none"
                  >
                    <Delete className="h-4 w-4" />
                    APAGAR
                  </button>
                </Focusable>
                <Focusable
                  focusKey="tvkey-clear"
                  onEnterPress={handleClear}
                  autoScroll={false}
                  onArrowPress={(dir) => {
                    if (dir === 'down') {
                      if (doesFocusableExist('search-card-0')) {
                        setFocus('search-card-0')
                        return false
                      }
                      if (doesFocusableExist('search-tag-0')) {
                        setFocus('search-tag-0')
                        return false
                      }
                    }
                    return true
                  }}
                >
                  <button
                    type="button"
                    tabIndex={-1}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={handleClear}
                    className="w-full h-11 rounded-xl bg-accent-red/20 hover:bg-accent-red/30 text-red-400 border border-accent-red/30 font-semibold text-xs flex items-center justify-center gap-1.5 outline-none transition-transform active:scale-95 select-none"
                  >
                    <X className="h-4 w-4" />
                    LIMPAR
                  </button>
                </Focusable>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Modal / Overlay Flutuante de Escuta por Voz */}
        <AnimatePresence>
          {isListening && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              className="max-w-2xl mx-auto mb-6 p-4 rounded-2xl bg-gradient-to-r from-red-950/80 via-[#18101a] to-amber-950/60 border border-accent-red/40 backdrop-blur-md shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-accent-red flex items-center justify-center text-white shadow-lg shadow-red-900/60 relative">
                  <Mic className="h-6 w-6 animate-pulse" />
                  <span className="absolute -inset-1 rounded-xl border border-accent-red/60 animate-ping pointer-events-none" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">Ouvindo sua voz...</span>
                    <span className="flex gap-1 items-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent-red animate-bounce" />
                      <span className="w-1.5 h-1.5 rounded-full bg-accent-red animate-bounce [animation-delay:0.15s]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-accent-red animate-bounce [animation-delay:0.3s]" />
                    </span>
                  </div>
                  <p className="text-white/70 text-xs mt-0.5">
                    {liveTranscript ? (
                      <span className="text-amber-300 font-semibold italic">"{liveTranscript}"</span>
                    ) : (
                      'Fale o nome do filme, série ou anime (ex: "Avatar", "Stranger Things")...'
                    )}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={stopListening}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-colors self-stretch sm:self-auto text-center"
              >
                Cancelar
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Feedback de Voz Transcrito ou Erro */}
        <AnimatePresence>
          {voiceToast && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="max-w-2xl mx-auto mb-6 px-4 py-2 rounded-xl bg-accent-red/20 border border-accent-red/40 text-white text-xs font-semibold flex items-center justify-between"
            >
              <span>{voiceToast}</span>
              <button onClick={() => setVoiceToast(null)} className="text-white/50 hover:text-white">
                <X className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          )}

          {voiceError && !isListening && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="max-w-2xl mx-auto mb-6 px-4 py-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-medium"
            >
              {voiceError}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filters */}
        <div className="mb-6">
          <Focusable
            focusKey="search-filters-toggle"
            onEnterPress={() => setFiltersOpen(!filtersOpen)}
            className="inline-block rounded-xl"
          >
            <button
              onClick={() => setFiltersOpen(!filtersOpen)}
              className={`flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl border transition-all ${
                filtersOpen || selectedGenre || selectedYear
                  ? 'bg-accent-red/20 border-accent-red/40 text-accent-red'
                  : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
              }`}
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filtros
              {(selectedGenre || selectedYear) && (
                <span className="w-2 h-2 rounded-full bg-accent-red" />
              )}
            </button>
          </Focusable>

          <AnimatePresence>
            {filtersOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="flex flex-wrap gap-3 mt-3 p-4 glass rounded-xl">
                  <select
                    value={selectedGenre ?? ''}
                    onChange={(e) => setSelectedGenre(e.target.value ? Number(e.target.value) : null)}
                    className="bg-[#1c1c28] border border-white/10 text-white text-sm rounded-lg px-3 py-2 outline-none focus:border-accent-red/50"
                  >
                    <option value="">Todos os gêneros</option>
                    {Object.entries(ALL_GENRES).map(([id, name]) => (
                      <option key={id} value={id}>{name}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    placeholder="Ano (ex: 2024)"
                    min="1900"
                    max="2030"
                    className="bg-[#1c1c28] border border-white/10 text-white text-sm rounded-lg px-3 py-2 w-36 outline-none focus:border-accent-red/50"
                  />
                  {(selectedGenre || selectedYear) && (
                    <button
                      onClick={() => { setSelectedGenre(null); setSelectedYear('') }}
                      className="text-sm text-white/50 hover:text-white transition-colors px-2"
                    >
                      Limpar
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Results */}
        {loading ? (
          <SkeletonGrid count={12} />
        ) : error ? (
          <ErrorState message="Não foi possível buscar resultados. Tente novamente." />
        ) : results.length > 0 ? (
          <motion.div
            className="content-grid"
            variants={STAGGER_CONTAINER}
            initial="hidden"
            animate="visible"
          >
            {results.map((item, i) => (
              <motion.div key={item.id} variants={STAGGER_ITEM}>
                <MovieCard
                  item={item}
                  index={i}
                  focusKey={`search-card-${i}`}
                  onArrowPress={(dir) => {
                    if (dir === 'up' && i < 6) {
                      if (doesFocusableExist('tvkey-space')) {
                        setFocus('tvkey-space')
                        return false
                      }
                    }
                    return true
                  }}
                />
              </motion.div>
            ))}
          </motion.div>
        ) : searched ? (
          <EmptySearch
            query={query}
            onAction={() => {
              setQuery('')
              setSelectedGenre(null)
              setSelectedYear('')
            }}
            actionLabel="Limpar busca"
            onSecondaryAction={() => {
              setSelectedGenre(null)
              setSelectedYear('')
            }}
          />
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="py-10 max-w-2xl mx-auto"
          >
            <div className="flex items-center gap-2 mb-4 text-white/80 font-bold text-sm">
              <Sparkles className="h-4 w-4 text-amber-400" />
              <span>Buscas Populares no CineBG</span>
            </div>

            <div className="flex flex-wrap gap-2.5">
              {POPULAR_SEARCH_TAGS.map((tag, idx) => (
                <Focusable
                  key={tag.label}
                  focusKey={`search-tag-${idx}`}
                  onEnterPress={() => setQuery(tag.query)}
                  autoScroll={false}
                  onArrowPress={(dir) => {
                    if (dir === 'up') {
                      if (doesFocusableExist('tvkey-space')) {
                        setFocus('tvkey-space')
                        return false
                      }
                    }
                    return true
                  }}
                >
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setQuery(tag.query)}
                    className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-white/80 hover:text-white text-xs sm:text-sm font-semibold transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5 outline-none select-none"
                  >
                    <span>{tag.label}</span>
                  </button>
                </Focusable>
              ))}
            </div>

            <div className="mt-12 text-center text-white/20">
              <SearchIcon className="h-12 w-12 mx-auto mb-2 opacity-20" />
              <p className="text-xs">Digite o nome de qualquer filme, série, ator ou gênero</p>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}

export default Search
