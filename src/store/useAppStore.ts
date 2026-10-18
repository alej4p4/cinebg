import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { DownloadItem, FavoriteItem, WatchHistoryItem } from '@/types'

export type Language = 'pt' | 'en'
export type AudioOption = 'dub' | 'sub' | 'orig'
export type SubtitleOption = 'off' | 'pt' | 'en'

export interface UserProfile {
  id: string
  name: string
  emoji: string
  color: string
  kids: boolean
}

interface ProfileData {
  favorites: FavoriteItem[]
  history: WatchHistoryItem[]
  language: Language
  audioOption: AudioOption
  subtitleOption: SubtitleOption
}

interface PersistedState {
  profiles: UserProfile[]
  activeProfileId: string
  dataByProfile: Record<string, ProfileData>
  notificationsEnabled: boolean
  tvMode: boolean
  downloads: DownloadItem[]
}

const DEFAULT_PROFILE_ID = 'default'

export const DEFAULT_PROFILE: UserProfile = {
  id: DEFAULT_PROFILE_ID,
  name: 'Principal',
  emoji: '🍿',
  color: '#ef4444',
  kids: false,
}

const emptyData = (language: Language = 'pt', audioOption: AudioOption = 'dub'): ProfileData => ({
  favorites: [],
  history: [],
  language,
  audioOption,
  subtitleOption: 'off',
})

interface AppState {
  profiles: UserProfile[]
  activeProfileId: string
  dataByProfile: Record<string, ProfileData>

  // Espelhos do perfil ativo (mantidos em sincronia para as telas existentes)
  favorites: FavoriteItem[]
  history: WatchHistoryItem[]
  language: Language
  audioOption: AudioOption
  subtitleOption: SubtitleOption

  notificationsEnabled: boolean
  tvMode: boolean
  virtualCursor: boolean

  // Perfis
  setActiveProfile: (id: string) => void
  addProfile: (profile: Omit<UserProfile, 'id'>) => void
  updateProfile: (id: string, patch: Partial<Omit<UserProfile, 'id'>>) => void
  removeProfile: (id: string) => void

  // Favoritos
  addFavorite: (item: FavoriteItem) => void
  removeFavorite: (id: number) => void
  isFavorite: (id: number) => boolean

  // Histórico
  addToHistory: (item: WatchHistoryItem) => void
  removeFromHistory: (id: number) => void
  clearHistory: () => void
  getLastWatched: (id: number) => WatchHistoryItem | undefined
  updateHistoryProgress: (id: number, progress: number) => void

  // Idioma & Áudio (por perfil)
  setLanguage: (lang: Language) => void
  setAudioOption: (option: AudioOption) => void
  setSubtitleOption: (option: SubtitleOption) => void

  // Notificações
  setNotificationsEnabled: (enabled: boolean) => void

  // TV / leanback
  setTvMode: (enabled: boolean) => void
  setVirtualCursor: (enabled: boolean) => void

  // Downloads
  downloads: DownloadItem[]
  addDownload: (item: DownloadItem) => void
  removeDownload: (id: number, season?: number, episode?: number) => void
  isDownloaded: (id: number, season?: number, episode?: number) => boolean

  // VIP / Assinatura
  vipModalOpen: boolean
  setVipModalOpen: (open: boolean) => void

  // Atualização do App
  updateModalOpen: boolean
  setUpdateModalOpen: (open: boolean) => void
  updateInfo: AppUpdateInfo
  isCheckingUpdate: boolean
  checkForUpdates: (manual?: boolean) => Promise<void>
}

export interface AppUpdateInfo {
  currentVersion: string
  latestVersion: string
  hasUpdate: boolean
  downloadUrl: string
  mandatory: boolean
  lastChecked?: number
}

const dataFor = (state: Pick<AppState, 'dataByProfile' | 'activeProfileId'>): ProfileData =>
  state.dataByProfile[state.activeProfileId] ?? emptyData()

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      profiles: [DEFAULT_PROFILE],
      activeProfileId: DEFAULT_PROFILE_ID,
      dataByProfile: { [DEFAULT_PROFILE_ID]: emptyData() },
      favorites: [],
      history: [],
      language: 'pt',
      audioOption: 'dub', // YuCine logic: Default to Dublado (PT-BR)
      subtitleOption: 'off',
      notificationsEnabled: false,
      tvMode: false,
      virtualCursor:
        typeof window !== 'undefined'
          ? localStorage.getItem('cinebg_virtual_cursor') === 'true'
          : false,
      downloads: [],
      vipModalOpen: false,

      // Atualização do App
      updateModalOpen: false,
      setUpdateModalOpen: (open) => set({ updateModalOpen: open }),
      isCheckingUpdate: false,
      updateInfo: {
        currentVersion: '1.2.22',
        latestVersion: '1.2.22',
        hasUpdate: false,
        downloadUrl: 'https://github.com/alej4p4/cinebg/releases/latest/download/CineBG-release.apk',
        mandatory: false,
      },
      checkForUpdates: async (manual = false) => {
        if (manual) {
          set({ isCheckingUpdate: true, updateModalOpen: true })
        }
        try {
          const currentVersion = '1.2.22'
          const candidateUrls = [
            `https://raw.githubusercontent.com/alej4p4/cinebg/main/public/update.json?t=${Date.now()}`,
            `/update.json?t=${Date.now()}`,
          ]

          let data: { version?: string; downloadUrl?: string; mandatory?: boolean } | null = null

          for (const url of candidateUrls) {
            try {
              const controller = new AbortController()
              const timeoutId = setTimeout(() => controller.abort(), 4000)
              const res = await fetch(url, { signal: controller.signal })
              clearTimeout(timeoutId)
              if (res.ok) {
                const parsed = await res.json()
                if (parsed && parsed.version) {
                  data = parsed
                  break
                }
              }
            } catch {}
          }

          if (data) {
            const remoteVersion = data.version || currentVersion
            const downloadUrl =
              data.downloadUrl ||
              'https://github.com/alej4p4/cinebg/releases/latest/download/CineBG-release.apk'
            const hasUpdate = remoteVersion !== currentVersion
            set({
              updateInfo: {
                currentVersion,
                latestVersion: remoteVersion,
                hasUpdate,
                downloadUrl,
                mandatory: !!data.mandatory,
                lastChecked: Date.now(),
              },
              isCheckingUpdate: false,
              updateModalOpen: manual ? true : hasUpdate,
            })
            return
          }
        } catch {
          // ignore network error
        }
        set((state) => ({
          isCheckingUpdate: false,
          updateModalOpen: manual ? true : state.updateModalOpen,
          updateInfo: {
            ...state.updateInfo,
            lastChecked: Date.now(),
          },
        }))
      },

      setVipModalOpen: (open) => set({ vipModalOpen: open }),

      setActiveProfile: (id) => {
        const state = get()
        if (!state.profiles.some((p) => p.id === id)) return
        const data = state.dataByProfile[id] ?? emptyData()
        set({
          activeProfileId: id,
          favorites: data.favorites,
          history: data.history,
          language: data.language,
          audioOption: data.audioOption,
          subtitleOption: data.subtitleOption,
        })
      },

      addProfile: (profile) => {
        const id = `p_${Date.now().toString(36)}`
        set((state) => ({
          profiles: [...state.profiles, { id, ...profile }],
          dataByProfile: { ...state.dataByProfile, [id]: emptyData() },
        }))
      },

      updateProfile: (id, patch) =>
        set((state) => ({
          profiles: state.profiles.map((p) => (p.id === id ? { ...p, ...patch } : p)),
        })),

      removeProfile: (id) =>
        set((state) => {
          if (state.profiles.length <= 1) return {}
          const profiles = state.profiles.filter((p) => p.id !== id)
          const dataByProfile = { ...state.dataByProfile }
          delete dataByProfile[id]
          const activeProfileId =
            state.activeProfileId === id ? profiles[0].id : state.activeProfileId
          const active = dataByProfile[activeProfileId] ?? emptyData()
          return {
            profiles,
            dataByProfile,
            activeProfileId,
            favorites: active.favorites,
            history: active.history,
            language: active.language,
            audioOption: active.audioOption,
          }
        }),

      addFavorite: (item) =>
        set((state) => {
          const data = dataFor(state)
          if (data.favorites.some((f) => f.id === item.id)) return {}
          const favorites = [item, ...data.favorites]
          return {
            dataByProfile: {
              ...state.dataByProfile,
              [state.activeProfileId]: { ...data, favorites },
            },
            favorites,
          }
        }),

      removeFavorite: (id) =>
        set((state) => {
          const data = dataFor(state)
          const favorites = data.favorites.filter((f) => f.id !== id)
          return {
            dataByProfile: {
              ...state.dataByProfile,
              [state.activeProfileId]: { ...data, favorites },
            },
            favorites,
          }
        }),

      isFavorite: (id) => dataFor(get()).favorites.some((f) => f.id === id),

      addToHistory: (item) =>
        set((state) => {
          const data = dataFor(state)
          const history = [item, ...data.history.filter((h) => h.id !== item.id)].slice(0, 50)
          return {
            dataByProfile: {
              ...state.dataByProfile,
              [state.activeProfileId]: { ...data, history },
            },
            history,
          }
        }),

      getLastWatched: (id) => dataFor(get()).history.find((h) => h.id === id),

      updateHistoryProgress: (id, progress) =>
        set((state) => {
          const data = dataFor(state)
          if (!data.history.some((h) => h.id === id)) return {}
          const history = data.history.map((h) => (h.id === id ? { ...h, progress } : h))
          return {
            dataByProfile: {
              ...state.dataByProfile,
              [state.activeProfileId]: { ...data, history },
            },
            history,
          }
        }),

      removeFromHistory: (id) =>
        set((state) => {
          const data = dataFor(state)
          const history = data.history.filter((h) => h.id !== id)
          return {
            dataByProfile: {
              ...state.dataByProfile,
              [state.activeProfileId]: { ...data, history },
            },
            history,
          }
        }),

      clearHistory: () =>
        set((state) => {
          const data = dataFor(state)
          return {
            dataByProfile: {
              ...state.dataByProfile,
              [state.activeProfileId]: { ...data, history: [] },
            },
            history: [],
          }
        }),

      setLanguage: (lang) =>
        set((state) => {
          const data = dataFor(state)
          const audioOption: AudioOption = lang === 'pt' ? 'dub' : 'orig'
          return {
            language: lang,
            audioOption,
            dataByProfile: {
              ...state.dataByProfile,
              [state.activeProfileId]: { ...data, language: lang, audioOption },
            },
          }
        }),

      setAudioOption: (option) =>
        set((state) => {
          const data = dataFor(state)
          const language: Language = option === 'orig' ? 'en' : 'pt'
          return {
            language,
            audioOption: option,
            dataByProfile: {
              ...state.dataByProfile,
              [state.activeProfileId]: { ...data, language, audioOption: option },
            },
          }
        }),

      setSubtitleOption: (option) =>
        set((state) => {
          const data = dataFor(state)
          return {
            subtitleOption: option,
            dataByProfile: {
              ...state.dataByProfile,
              [state.activeProfileId]: { ...data, subtitleOption: option },
            },
          }
        }),

      setNotificationsEnabled: (enabled) => set({ notificationsEnabled: enabled }),

      setTvMode: (enabled) => {
        try {
          if (typeof window !== 'undefined') {
            localStorage.setItem('cinebg_tv_mode', enabled ? 'true' : 'false')
            if (enabled) {
              document.body.classList.add('tv-mode', 'tv-remote-active')
            } else {
              document.body.classList.remove('tv-mode')
            }
          }
        } catch {}
        set({ tvMode: enabled })
      },

      setVirtualCursor: (enabled) => {
        try {
          if (typeof window !== 'undefined') {
            localStorage.setItem('cinebg_virtual_cursor', enabled ? 'true' : 'false')
            if (enabled) {
              document.body.classList.add('tv-mode', 'tv-remote-active')
            }
          }
        } catch {}
        set({ virtualCursor: enabled })
      },

      addDownload: (item) =>
        set((state) => {
          const exists = state.downloads.some(
            (d) => d.id === item.id && d.season === item.season && d.episode === item.episode,
          )
          if (exists) return {}
          return { downloads: [item, ...state.downloads] }
        }),

      removeDownload: (id, season, episode) =>
        set((state) => ({
          downloads: state.downloads.filter(
            (d) => !(d.id === id && d.season === season && d.episode === episode),
          ),
        })),

      isDownloaded: (id, season, episode) =>
        get().downloads.some(
          (d) => d.id === id && d.season === season && d.episode === episode,
        ),
    }),
    {
      name: 'cinebg-storage',
      version: 3,
      migrate: (persisted, version) => {
        const state = (persisted ?? {}) as Partial<PersistedState> & {
          favorites?: FavoriteItem[]
          history?: WatchHistoryItem[]
          language?: Language
          audioOption?: AudioOption
        }

        const fallbackLang: Language = state.language ?? 'pt'
        const fallbackAudio: AudioOption = state.audioOption ?? 'dub'

        if (version < 2 || !state.profiles) {
          const favorites = state.favorites ?? []
          const history = state.history ?? []
          return {
            profiles: [DEFAULT_PROFILE],
            activeProfileId: DEFAULT_PROFILE_ID,
            dataByProfile: {
              [DEFAULT_PROFILE_ID]: {
                favorites,
                history,
                language: fallbackLang,
                audioOption: fallbackAudio,
              },
            },
            notificationsEnabled: state.notificationsEnabled ?? false,
            tvMode: state.tvMode ?? false,
            downloads: state.downloads ?? [],
          }
        }

        const profiles = state.profiles ?? [DEFAULT_PROFILE]
        const dataByProfile: Record<string, ProfileData> = {}
        for (const profile of profiles) {
          const raw = state.dataByProfile?.[profile.id]
          dataByProfile[profile.id] = {
            favorites: raw?.favorites ?? [],
            history: raw?.history ?? [],
            language: raw?.language ?? fallbackLang,
            audioOption: raw?.audioOption ?? fallbackAudio,
            subtitleOption: raw?.subtitleOption ?? 'off',
          }
        }

        return {
          profiles,
          activeProfileId: state.activeProfileId ?? profiles[0].id,
          dataByProfile,
          notificationsEnabled: state.notificationsEnabled ?? false,
          tvMode: state.tvMode ?? false,
          downloads: state.downloads ?? [],
        }
      },
      // Recalcula os espelhos após reidratar (não persistem sozinhos).
      merge: (persisted, current) => {
        const merged = { ...current, ...(persisted as object) } as AppState
        const data = dataFor(merged)
        return {
          ...merged,
          favorites: data.favorites,
          history: data.history,
          language: data.language,
          audioOption: data.audioOption,
          subtitleOption: data.subtitleOption,
        }
      },
      partialize: (state) => ({
        profiles: state.profiles,
        activeProfileId: state.activeProfileId,
        dataByProfile: state.dataByProfile,
        notificationsEnabled: state.notificationsEnabled,
        tvMode: state.tvMode,
        virtualCursor: state.virtualCursor,
        downloads: state.downloads,
      }),
    }
  )
)