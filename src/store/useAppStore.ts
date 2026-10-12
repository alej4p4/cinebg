import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { FavoriteItem, WatchHistoryItem } from '@/types'

export type Language = 'pt' | 'en'
export type AudioOption = 'dub' | 'sub' | 'orig'

interface AppState {
  favorites: FavoriteItem[]
  history: WatchHistoryItem[]
  selectedSource: string
  language: Language
  audioOption: AudioOption

  // Favorites
  addFavorite: (item: FavoriteItem) => void
  removeFavorite: (id: number) => void
  isFavorite: (id: number) => boolean

  // History
  addToHistory: (item: WatchHistoryItem) => void
  removeFromHistory: (id: number) => void
  clearHistory: () => void
  getLastWatched: (id: number) => WatchHistoryItem | undefined

  // Source
  setSelectedSource: (sourceId: string) => void

  // Language & Audio
  setLanguage: (lang: Language) => void
  setAudioOption: (option: AudioOption) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      favorites: [],
      history: [],
      selectedSource: 'vidsrc-me',
      language: 'pt',
      audioOption: 'dub', // YuCine logic: Default to Dublado (PT-BR)

      addFavorite: (item) => {
        const existing = get().favorites.find((f) => f.id === item.id)
        if (!existing) {
          set((state) => ({ favorites: [item, ...state.favorites] }))
        }
      },

      removeFavorite: (id) => {
        set((state) => ({ favorites: state.favorites.filter((f) => f.id !== id) }))
      },

      isFavorite: (id) => {
        return get().favorites.some((f) => f.id === id)
      },

      addToHistory: (item) => {
        set((state) => ({
          history: [item, ...state.history.filter((h) => h.id !== item.id)].slice(0, 50),
        }))
      },

      getLastWatched: (id) => {
        return get().history.find((h) => h.id === id)
      },

      removeFromHistory: (id) => {
        set((state) => ({ history: state.history.filter((h) => h.id !== id) }))
      },

      clearHistory: () => {
        set({ history: [] })
      },

      setSelectedSource: (sourceId) => {
        set({ selectedSource: sourceId })
      },

      setLanguage: (lang) => {
        set({ language: lang, audioOption: lang === 'pt' ? 'dub' : 'orig' })
      },

      setAudioOption: (option) => {
        set({
          audioOption: option,
          language: option === 'orig' ? 'en' : 'pt',
        })
      },
    }),
    {
      name: 'cinebg-storage',
      partialize: (state) => ({
        favorites: state.favorites,
        history: state.history,
        selectedSource: state.selectedSource,
        language: state.language,
        audioOption: state.audioOption,
      }),
    }
  )
)
