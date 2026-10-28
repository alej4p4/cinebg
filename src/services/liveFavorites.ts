// Preferências locais da TV ao Vivo: canais favoritos, recentes e último canal assistido.
// Persistidas em localStorage para sobreviver a recarregamentos da página.

const FAVORITES_KEY = 'cinebg:liveFavorites'
const LAST_CHANNEL_KEY = 'cinebg:lastLiveChannel'
const RECENT_CHANNELS_KEY = 'cinebg:recentLiveChannels'

export const loadLiveFavorites = (): Set<string> => {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY)
    if (!raw) return new Set()
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return new Set()
    return new Set(parsed.filter((value): value is string => typeof value === 'string'))
  } catch {
    return new Set()
  }
}

export const saveLiveFavorites = (favorites: Set<string>): void => {
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify([...favorites]))
  } catch {
    /* ignore */
  }
}

export const toggleLiveFavorite = (current: Set<string>, id: string): Set<string> => {
  const next = new Set(current)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  saveLiveFavorites(next)
  return next
}

export const isLiveFavorite = (favorites: Set<string>, id: string): boolean => favorites.has(id)

export const loadLastLiveChannelId = (): string | null => {
  try {
    return localStorage.getItem(LAST_CHANNEL_KEY)
  } catch {
    return null
  }
}

export const saveLastLiveChannelId = (id: string): void => {
  try {
    localStorage.setItem(LAST_CHANNEL_KEY, id)
  } catch {
    /* ignore */
  }
}

export const loadRecentLiveChannels = (): string[] => {
  try {
    const raw = localStorage.getItem(RECENT_CHANNELS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter((v): v is string => typeof v === 'string')
  } catch {
    return []
  }
}

export const saveRecentLiveChannel = (id: string): void => {
  try {
    const current = loadRecentLiveChannels().filter((chId) => chId !== id)
    const updated = [id, ...current].slice(0, 20)
    localStorage.setItem(RECENT_CHANNELS_KEY, JSON.stringify(updated))
  } catch {
    /* ignore */
  }
}
