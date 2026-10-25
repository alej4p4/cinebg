import axios from 'axios'
import { useAppStore } from '@/store/useAppStore'
import { isTVDevice } from '@/utils/tv'
import type {
  TMDBPaginatedResponse,
  TMDBMovie,
  TMDBShow,
  TMDBMovieDetails,
  TMDBShowDetails,
  TMDBSeason,
  TMDBVideo,
  TMDBCredits,
  MediaItem,
  MediaType,
} from '@/types'

const API_KEY = import.meta.env.VITE_TMDB_API_KEY

if (!API_KEY) {
  console.error('[CineBG] VITE_TMDB_API_KEY não configurada. Crie o arquivo .env ou defina a variável.')
  throw new Error('VITE_TMDB_API_KEY é obrigatória para o TMDB')
}
const BASE_URL = 'https://api.themoviedb.org/3'

export const IMAGE_BASE = 'https://image.tmdb.org/t/p'

export const tmdb = axios.create({
  baseURL: BASE_URL,
  params: {
    api_key: API_KEY,
    language: 'pt-BR',
  },
})

// ===== Filtro infantil e Filtro Anti-1xBet / Anti-Camrip de Cinema =====
const KIDS_GENRES = new Set([16, 10751, 10762, 12, 14, 35, 10402, 10765])
const BANNED_CATALOG_KEYWORDS = [
  '1xbet',
  '1xbt',
  'xbet',
  'melbet',
  'mostbet',
  'linebet',
  'betwinner',
  'camrip',
  'hdcam',
  'telesync',
  'tsrip',
]

// Janela de segurança contra gravações de cinema (HDCAM / 1xBet / 1xbt):
// Filmes exclusivos de cinema nos primeiros 45 dias antes do lançamento Digital/VOD
// possuem apenas gravações de câmera com propaganda 1xBet embutida nos servidores externos.
const THEATER_CAMRIP_WINDOW_MS = 45 * 24 * 60 * 60 * 1000

const getDigitalCutoffDate = (): string =>
  new Date(Date.now() - THEATER_CAMRIP_WINDOW_MS).toISOString().slice(0, 10)

export const isCleanDigitalCatalogItem = (item: MediaItem): boolean => {
  if (!item || !item.id || !item.title) return false
  const textToCheck = `${item.title} ${item.overview || ''}`.toLowerCase()
  if (BANNED_CATALOG_KEYWORDS.some((kw) => textToCheck.includes(kw))) {
    return false
  }

  if (item.type === 'movie') {
    if (!item.releaseDate) return false
    const releaseTime = new Date(item.releaseDate).getTime()
    if (!Number.isFinite(releaseTime)) return false
    const now = Date.now()
    // Bloqueia filmes futuros ainda não lançados
    if (releaseTime > now) return false
    // Bloqueia filmes exclusivos de cinema dentro da janela de gravação CAMRIP / 1xBet
    const ageMs = now - releaseTime
    if (ageMs < THEATER_CAMRIP_WINDOW_MS && (item.voteCount || 0) < 600) {
      return false
    }
  }

  return true
}

export const isKidsMode = (): boolean => {
  const { profiles, activeProfileId } = useAppStore.getState()
  return profiles.find((p) => p.id === activeProfileId)?.kids ?? false
}

const forKids = (items: MediaItem[]): MediaItem[] => {
  const cleanItems = items.filter(isCleanDigitalCatalogItem)
  return isKidsMode()
    ? cleanItems.filter((item) => item.genreIds.some((g) => KIDS_GENRES.has(g)))
    : cleanItems
}

// ===== Image URLs (Com Otimização de Memória VRAM para Android TV / Fire TV) =====
export const getPosterUrl = (
  path: string | null | undefined,
  size: 'w185' | 'w342' | 'w500' | 'w780' | 'original' = 'w342'
): string => {
  if (!path) return '/placeholder-poster.svg'
  // Em TVs Android / Fire TV, limita posters de grade a w342 para economizar ~55% de memória de textura na GPU
  const effectiveSize = isTVDevice() && (size === 'w500' || size === 'w780' || size === 'original') ? 'w342' : size
  return `${IMAGE_BASE}/${effectiveSize}${path}`
}

export const getBackdropUrl = (
  path: string | null | undefined,
  size: 'w300' | 'w780' | 'w1280' | 'original' = 'w1280'
): string => {
  if (!path) return '/placeholder-backdrop.svg'
  // Evita imagens 'original' (4K 3840x2160 = ~33MB de bitmap RGBA descompactado na RAM da TV),
  // limitando a w1280 (HD 720p = ~3.6MB de bitmap RGBA) para eliminar crashes por Out-Of-Memory
  const effectiveSize = size === 'original' ? 'w1280' : size
  return `${IMAGE_BASE}/${effectiveSize}${path}`
}

export const getProfileUrl = (path: string | null | undefined): string => {
  if (!path) return '/placeholder-avatar.svg'
  return `${IMAGE_BASE}/w185${path}`
}

// ===== Cache LRU em Memória RAM & Fila Assíncrona de Persistência Local (Zero Main-Thread Freeze) =====
const MAX_MEMORY_CACHE_ENTRIES = 200
const MAX_MEMORY_CACHE_TOTAL_SIZE_MB = 50
const requestCache = new Map<string, { data: unknown; expiresAt: number; sizeBytes: number }>()
const inflightMap = new Map<string, Promise<unknown>>()

const STORAGE_PREFIX = 'cinebg_tmdb_v4_'
const DEFAULT_CATALOG_TTL_MS = 24 * 60 * 60 * 1000 // 24 horas para catálogos
const DETAILS_TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 dias para detalhes de filmes/séries

const estimateSizeBytes = (data: unknown): number => {
  try {
    return new TextEncoder().encode(JSON.stringify(data)).length
  } catch {
    return 1024
  }
}

const setMemoryCache = (key: string, entry: { data: unknown; expiresAt: number }) => {
  const sizeBytes = estimateSizeBytes(entry.data)
  if (requestCache.has(key)) {
    requestCache.delete(key)
  } else if (requestCache.size >= MAX_MEMORY_CACHE_ENTRIES) {
    const oldestKey = requestCache.keys().next().value
    if (oldestKey !== undefined) {
      requestCache.delete(oldestKey)
    }
  }
  requestCache.set(key, { ...entry, sizeBytes })
}

export const trimTmdbMemoryCache = (keepEntries = 20) => {
  // Limite por quantidade de entradas
  while (requestCache.size > keepEntries) {
    const oldestKey = requestCache.keys().next().value
    if (oldestKey === undefined) break
    requestCache.delete(oldestKey)
  }
  // Limite por tamanho total (50 MB)
  let totalSize = 0
  for (const entry of requestCache.values()) {
    totalSize += entry.sizeBytes || 0
  }
  while (totalSize > MAX_MEMORY_CACHE_TOTAL_SIZE_MB * 1024 * 1024 && requestCache.size > 0) {
    const oldestKey = requestCache.keys().next().value
    if (oldestKey === undefined) break
    const removed = requestCache.get(oldestKey)
    totalSize -= removed?.sizeBytes || 0
    requestCache.delete(oldestKey)
  }
}

// Purga automática de chaves legadas em background (não bloqueia o boot)
if (typeof window !== 'undefined') {
  setTimeout(() => {
    try {
      const legacyKeys: string[] = []
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i)
        if (
          k &&
          (k.startsWith('cinebg_tmdb_cache_') ||
            k.startsWith('cinebg_tmdb_v2_') ||
            k.startsWith('cinebg_tmdb_v3_'))
        ) {
          legacyKeys.push(k)
        }
      }
      legacyKeys.forEach((k) => localStorage.removeItem(k))
    } catch {}
  }, 2000)
}

const buildCacheKey = (method: string, url: string, params?: Record<string, unknown>) => {
  const p = params ? JSON.stringify(params) : ''
  return `${method.toUpperCase()}:${url}:${p}`
}

const hashString = (str: string): string => {
  let h1 = 0xdeadbeef
  let h2 = 0x41c6ce57
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i)
    h1 = Math.imul(h1 ^ ch, 2654435761)
    h2 = Math.imul(h2 ^ ch, 1597334677)
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909)
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909)
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36)
}

const getStorageKey = (key: string): string => {
  const hash = hashString(key)
  const cleanEndpoint = key.split(':')[1]?.replace(/[^a-zA-Z0-9]/g, '_') || 'tmdb'
  return `${STORAGE_PREFIX}${cleanEndpoint}_${hash}`
}

// Fila assíncrona para escrita no localStorage sem travar a Main Thread (evita ANR na TV)
const pendingStorageQueue = new Map<string, { data: unknown; expiresAt: number }>()
let storageFlushScheduled = false

const flushStorageQueue = () => {
  storageFlushScheduled = false
  if (typeof window === 'undefined' || pendingStorageQueue.size === 0) return

  // Processa apenas 2 itens por fatia de tempo ocioso para nunca bloquear frames de 16.6ms (60fps)
  let processed = 0
  for (const [safeKey, payload] of pendingStorageQueue.entries()) {
    pendingStorageQueue.delete(safeKey)
    try {
      localStorage.setItem(safeKey, JSON.stringify(payload))
    } catch {
      try {
        const keysToRemove: string[] = []
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i)
          if (k && k.startsWith(STORAGE_PREFIX)) {
            keysToRemove.push(k)
          }
        }
        keysToRemove.slice(0, Math.ceil(keysToRemove.length / 2)).forEach((k) => localStorage.removeItem(k))
      } catch {}
    }
    processed++
    if (processed >= 2) break
  }

  if (pendingStorageQueue.size > 0) {
    scheduleStorageFlush()
  }
}

const scheduleStorageFlush = () => {
  if (storageFlushScheduled || typeof window === 'undefined') return
  storageFlushScheduled = true
  const ric = (window as unknown as { requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => void }).requestIdleCallback
  if (typeof ric === 'function') {
    ric(flushStorageQueue, { timeout: 1500 })
  } else {
    setTimeout(flushStorageQueue, 80)
  }
}

const saveToLocalStorage = (key: string, data: unknown, ttlMs: number) => {
  if (typeof window === 'undefined') return
  const safeKey = getStorageKey(key)
  pendingStorageQueue.set(safeKey, {
    data,
    expiresAt: Date.now() + ttlMs,
  })
  scheduleStorageFlush()
}

const loadFromLocalStorage = <T>(key: string): T | null => {
  try {
    if (typeof window === 'undefined') return null
    const safeKey = getStorageKey(key)
    const pending = pendingStorageQueue.get(safeKey)
    if (pending && pending.expiresAt > Date.now()) {
      return pending.data as T
    }
    const raw = localStorage.getItem(safeKey)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed === 'object' && parsed.expiresAt > Date.now()) {
      return parsed.data as T
    }
    localStorage.removeItem(safeKey)
  } catch {}
  return null
}

// Recupera detalhes de filmes/séries de forma síncrona em 0ms se já estiverem em cache
export const getCachedMediaDetails = <T>(id: number, type: 'movie' | 'tv' | 'anime'): T | null => {
  const url = type === 'movie' ? `/movie/${id}` : `/tv/${id}`
  const key = buildCacheKey('GET', url, {
    append_to_response: 'videos,credits,similar,recommendations',
    __kids: isKidsMode(),
  })

  // 1. Memória RAM (instantâneo)
  const inMem = requestCache.get(key)
  if (inMem && inMem.expiresAt > Date.now()) {
    return inMem.data as T
  }

  // 2. Armazenamento Local Persistente (0ms)
  const fromStorage = loadFromLocalStorage<T>(key)
  if (fromStorage) {
    setMemoryCache(key, { data: fromStorage, expiresAt: Date.now() + DETAILS_TTL_MS })
    return fromStorage
  }

  return null
}

const cachedGet = async <T>(url: string, params?: Record<string, unknown>): Promise<T> => {
  const key = buildCacheKey('GET', url, { ...params, __kids: isKidsMode() })
  const now = Date.now()

  // 1. Verifica memória RAM
  const cached = requestCache.get(key)
  if (cached && cached.expiresAt > now) {
    return cached.data as T
  }

  // 2. Verifica armazenamento persistente do dispositivo
  const fromStorage = loadFromLocalStorage<T>(key)
  if (fromStorage) {
    setMemoryCache(key, { data: fromStorage, expiresAt: now + DEFAULT_CATALOG_TTL_MS })
    return fromStorage
  }

  // 3. Deduplicação de requisições em voo (Inflight Map)
  if (inflightMap.has(key)) {
    return inflightMap.get(key) as Promise<T>
  }

  const promise = tmdb
    .get<T>(url, { params })
    .then((res) => res.data)
    .finally(() => {
      inflightMap.delete(key)
    })

  inflightMap.set(key, promise)

  try {
    const data = await promise
    const isDetails = url.startsWith('/movie/') || url.startsWith('/tv/')
    const ttl = isDetails ? DETAILS_TTL_MS : DEFAULT_CATALOG_TTL_MS
    setMemoryCache(key, { data, expiresAt: now + ttl })
    saveToLocalStorage(key, data, ttl)
    return data
  } catch (error) {
    inflightMap.delete(key)
    throw error
  }
}

// ===== Helper: convert to MediaItem =====
export const movieToMediaItem = (movie: TMDBMovie): MediaItem => ({
  id: movie.id,
  title: movie.title || movie.original_title,
  overview: movie.overview,
  posterPath: movie.poster_path,
  backdropPath: movie.backdrop_path,
  releaseDate: movie.release_date,
  rating: movie.vote_average,
  voteCount: movie.vote_count,
  type: 'movie',
  genreIds: movie.genre_ids,
})

export const showToMediaItem = (show: TMDBShow, type: MediaType = 'tv'): MediaItem => ({
  id: show.id,
  title: show.name || show.original_name,
  overview: show.overview,
  posterPath: show.poster_path,
  backdropPath: show.backdrop_path,
  releaseDate: show.first_air_date,
  rating: show.vote_average,
  voteCount: show.vote_count,
  type,
  genreIds: show.genre_ids,
})

type RawCatalogPayload = (TMDBMovie | TMDBShow) & {
  media_type?: string
  name?: string
  title?: string
}

const parseRawCatalogItem = (item: RawCatalogPayload, defaultType: 'movie' | 'tv' = 'movie'): MediaItem => {
  const isTv = item.media_type === 'tv' || (!item.title && !!item.name) || defaultType === 'tv'
  return isTv ? showToMediaItem(item as TMDBShow, 'tv') : movieToMediaItem(item as TMDBMovie)
}

// Recupera lista de filmes ou séries sincronamente em 0ms se já estiverem em cache
export const getCachedCatalogItems = (
  endpoint: string,
  params?: Record<string, unknown>,
  type: 'movie' | 'tv' = 'movie'
): MediaItem[] => {
  try {
    const key = buildCacheKey('GET', endpoint, { ...params, __kids: isKidsMode() })
    const now = Date.now()

    // 1. Memória RAM
    const inMem = requestCache.get(key)
    if (inMem && inMem.expiresAt > now && (inMem.data as TMDBPaginatedResponse<RawCatalogPayload>)?.results) {
      const results = (inMem.data as TMDBPaginatedResponse<RawCatalogPayload>).results
      const mapped = results.map((item) => parseRawCatalogItem(item, type))
      return forKids(mapped)
    }

    // 2. Armazenamento Local Persistente
    const fromStorage = loadFromLocalStorage<TMDBPaginatedResponse<RawCatalogPayload>>(key)
    if (fromStorage && fromStorage.results) {
      setMemoryCache(key, { data: fromStorage, expiresAt: now + DEFAULT_CATALOG_TTL_MS })
      const results = fromStorage.results
      const mapped = results.map((item) => parseRawCatalogItem(item, type))
      return forKids(mapped)
    }
  } catch {}
  return []
}

// ===== API Functions =====

export const getTrending = async (
  mediaType: 'movie' | 'tv' | 'all',
  timeWindow: 'day' | 'week' = 'week',
): Promise<MediaItem[]> => {
  const data = await cachedGet<TMDBPaginatedResponse<TMDBMovie & TMDBShow>>(
    `/trending/${mediaType}/${timeWindow}`
  )
  return forKids(
    data.results.map((item) => parseRawCatalogItem(item, mediaType === 'tv' ? 'tv' : 'movie'))
  )
}

export const getPopularMovies = async (page = 1): Promise<{ items: MediaItem[]; totalPages: number }> => {
  const data = await cachedGet<TMDBPaginatedResponse<TMDBMovie>>('/discover/movie', {
    page,
    sort_by: 'popularity.desc',
    with_release_type: '4|5|6',
    'primary_release_date.lte': getDigitalCutoffDate(),
    'vote_count.gte': 50,
  })
  return { items: forKids(data.results.map(movieToMediaItem)), totalPages: data.total_pages }
}

export const getTopRatedMovies = async (page = 1): Promise<{ items: MediaItem[]; totalPages: number }> => {
  const data = await cachedGet<TMDBPaginatedResponse<TMDBMovie>>('/movie/top_rated', { page })
  return { items: forKids(data.results.map(movieToMediaItem)), totalPages: data.total_pages }
}

export const getNowPlayingMovies = async (page = 1): Promise<{ items: MediaItem[]; totalPages: number }> => {
  // Retorna lançamentos recentes já disponíveis em formato Digital/Streaming (sem gravações de cinema 1xBet/HDCAM)
  const data = await cachedGet<TMDBPaginatedResponse<TMDBMovie>>('/discover/movie', {
    page,
    sort_by: 'popularity.desc',
    with_release_type: '4|5|6',
    'primary_release_date.lte': getDigitalCutoffDate(),
    'vote_count.gte': 80,
  })
  return { items: forKids(data.results.map(movieToMediaItem)), totalPages: data.total_pages }
}

export const getUpcomingMovies = async (page = 1): Promise<{ items: MediaItem[]; totalPages: number }> => {
  // Retorna lançamentos digitais recentes com áudio e vídeo HD limpos (excluindo títulos inéditos com 1xBet camrip)
  const data = await cachedGet<TMDBPaginatedResponse<TMDBMovie>>('/discover/movie', {
    page,
    sort_by: 'primary_release_date.desc',
    with_release_type: '4|5|6',
    'primary_release_date.lte': getDigitalCutoffDate(),
    'vote_count.gte': 100,
  })
  return { items: forKids(data.results.map(movieToMediaItem)), totalPages: data.total_pages }
}

export const discoverMovies = async (params: {
  page?: number
  genre?: number
  year?: number
  sort?: string
  minRating?: number
  withNetworks?: string | number
  withWatchProviders?: string | number
}): Promise<{ items: MediaItem[]; totalPages: number }> => {
  const data = await cachedGet<TMDBPaginatedResponse<TMDBMovie>>('/discover/movie', {
    page: params.page || 1,
    with_genres: params.genre,
    primary_release_year: params.year,
    sort_by: params.sort || 'popularity.desc',
    'vote_average.gte': params.minRating,
    with_release_type: '4|5|6',
    'primary_release_date.lte': getDigitalCutoffDate(),
    'vote_count.gte': 30,
    with_watch_providers: params.withWatchProviders,
    watch_region: params.withWatchProviders ? 'BR' : undefined,
  })
  return { items: forKids(data.results.map(movieToMediaItem)), totalPages: data.total_pages }
}

export const getClassicMovies = async (page = 1): Promise<{ items: MediaItem[]; totalPages: number }> => {
  const data = await cachedGet<TMDBPaginatedResponse<TMDBMovie>>('/discover/movie', {
    page,
    sort_by: 'vote_average.desc',
    'vote_count.gte': 2500,
    'primary_release_date.lte': '2002-12-31',
  })
  return { items: forKids(data.results.map(movieToMediaItem)), totalPages: data.total_pages }
}

export const getPopularShows = async (page = 1): Promise<{ items: MediaItem[]; totalPages: number }> => {
  const data = await cachedGet<TMDBPaginatedResponse<TMDBShow>>('/tv/popular', { page })
  return { items: forKids(data.results.map((s) => showToMediaItem(s, 'tv'))), totalPages: data.total_pages }
}

export const getTopRatedShows = async (page = 1): Promise<{ items: MediaItem[]; totalPages: number }> => {
  const data = await cachedGet<TMDBPaginatedResponse<TMDBShow>>('/tv/top_rated', { page })
  return { items: forKids(data.results.map((s) => showToMediaItem(s, 'tv'))), totalPages: data.total_pages }
}

export const getClassicShows = async (page = 1): Promise<{ items: MediaItem[]; totalPages: number }> => {
  const data = await cachedGet<TMDBPaginatedResponse<TMDBShow>>('/discover/tv', {
    page,
    sort_by: 'vote_count.desc',
    'first_air_date.lte': '2010-12-31',
  })
  return { items: forKids(data.results.map((s) => showToMediaItem(s, 'tv'))), totalPages: data.total_pages }
}

export const getAiringToday = async (page = 1): Promise<{ items: MediaItem[]; totalPages: number }> => {
  const data = await cachedGet<TMDBPaginatedResponse<TMDBShow>>('/tv/airing_today', { page })
  return { items: forKids(data.results.map((s) => showToMediaItem(s, 'tv'))), totalPages: data.total_pages }
}

export const discoverShows = async (params: {
  page?: number
  genre?: number
  year?: number
  sort?: string
  minRating?: number
  isAnime?: boolean
  withNetworks?: string | number
  withWatchProviders?: string | number
  withOriginalLanguage?: string
}): Promise<{ items: MediaItem[]; totalPages: number }> => {
  const data = await cachedGet<TMDBPaginatedResponse<TMDBShow>>('/discover/tv', {
    page: params.page || 1,
    with_genres: params.isAnime ? 16 : params.genre,
    first_air_date_year: params.year,
    sort_by: params.sort || 'popularity.desc',
    'vote_average.gte': params.minRating,
    with_networks: params.withNetworks,
    with_watch_providers: params.withWatchProviders,
    watch_region: params.withWatchProviders ? 'BR' : undefined,
    with_keywords: params.isAnime ? '210024|287501' : undefined,
    with_original_language: params.isAnime ? 'ja' : params.withOriginalLanguage,
  })
  const type: MediaType = params.isAnime ? 'anime' : 'tv'
  return { items: forKids(data.results.map((s) => showToMediaItem(s, type))), totalPages: data.total_pages }
}

export const getTurkishShows = async (page = 1): Promise<{ items: MediaItem[]; totalPages: number }> => {
  const data = await cachedGet<TMDBPaginatedResponse<TMDBShow>>('/discover/tv', {
    page,
    sort_by: 'popularity.desc',
    with_original_language: 'tr',
  })
  return { items: forKids(data.results.map((s) => showToMediaItem(s, 'tv'))), totalPages: data.total_pages }
}

export const getMovieDetails = async (id: number): Promise<TMDBMovieDetails> => {
  const data = await cachedGet<TMDBMovieDetails>(`/movie/${id}`, {
    append_to_response: 'videos,credits,similar,recommendations',
  })
  return data
}

export const getShowDetails = async (id: number): Promise<TMDBShowDetails> => {
  const data = await cachedGet<TMDBShowDetails>(`/tv/${id}`, {
    append_to_response: 'videos,credits,similar,recommendations',
  })
  return data
}

export const getSeasonDetails = async (showId: number, seasonNumber: number): Promise<TMDBSeason> => {
  const data = await cachedGet<TMDBSeason>(`/tv/${showId}/season/${seasonNumber}`)
  return data
}

export const getMovieVideos = async (id: number): Promise<TMDBVideo[]> => {
  const data = await cachedGet<{ results: TMDBVideo[] }>(`/movie/${id}/videos`)
  return data.results.filter((v) => v.site === 'YouTube')
}

export const getMovieCredits = async (id: number): Promise<TMDBCredits> => {
  const data = await cachedGet<TMDBCredits>(`/movie/${id}/credits`)
  return data
}

export const getShowCredits = async (id: number): Promise<TMDBCredits> => {
  const data = await cachedGet<TMDBCredits>(`/tv/${id}/credits`)
  return data
}

export const searchMulti = async (query: string, page = 1): Promise<{ items: MediaItem[]; totalPages: number }> => {
  const data = await cachedGet<TMDBPaginatedResponse<TMDBMovie & TMDBShow & { media_type: string }>>('/search/multi', {
    query,
    page,
    include_adult: false,
  })
  const items = forKids(
    data.results
      .filter((r) => r.media_type === 'movie' || r.media_type === 'tv')
      .map((r) => {
        if (r.media_type === 'movie') return movieToMediaItem(r as TMDBMovie)
        return showToMediaItem(r as TMDBShow)
      })
  )
  return { items, totalPages: data.total_pages }
}

export const searchMovies = async (query: string, page = 1): Promise<{ items: MediaItem[]; totalPages: number }> => {
  const data = await cachedGet<TMDBPaginatedResponse<TMDBMovie>>('/search/movie', {
    query,
    page,
  })
  return { items: forKids(data.results.map(movieToMediaItem)), totalPages: data.total_pages }
}

export const searchShows = async (query: string, page = 1): Promise<{ items: MediaItem[]; totalPages: number }> => {
  const data = await cachedGet<TMDBPaginatedResponse<TMDBShow>>('/search/tv', {
    query,
    page,
  })
  return { items: forKids(data.results.map((s) => showToMediaItem(s, 'tv'))), totalPages: data.total_pages }
}


export const getClassicCartoons = async (page = 1): Promise<{ items: MediaItem[]; totalPages: number }> => {
  const data = await cachedGet<TMDBPaginatedResponse<TMDBShow>>('/discover/tv', {
    page,
    with_genres: 16,
    'first_air_date.lte': '2004-12-31',
    with_original_language: 'en',
    sort_by: 'popularity.desc',
  })
  return { items: forKids(data.results.map((s) => showToMediaItem(s, 'tv'))), totalPages: data.total_pages }
}

export const getHannaBarberaAnd80sCartoons = async (page = 1): Promise<{ items: MediaItem[]; totalPages: number }> => {
  const data = await cachedGet<TMDBPaginatedResponse<TMDBShow>>('/discover/tv', {
    page,
    with_genres: 16,
    'first_air_date.gte': '1960-01-01',
    'first_air_date.lte': '1989-12-31',
    with_original_language: 'en',
    sort_by: 'popularity.desc',
  })
  return { items: forKids(data.results.map((s) => showToMediaItem(s, 'tv'))), totalPages: data.total_pages }
}

export const getGolden90sCartoons = async (page = 1): Promise<{ items: MediaItem[]; totalPages: number }> => {
  const data = await cachedGet<TMDBPaginatedResponse<TMDBShow>>('/discover/tv', {
    page,
    with_genres: 16,
    'first_air_date.gte': '1990-01-01',
    'first_air_date.lte': '1999-12-31',
    with_original_language: 'en',
    sort_by: 'popularity.desc',
  })
  return { items: forKids(data.results.map((s) => showToMediaItem(s, 'tv'))), totalPages: data.total_pages }
}
