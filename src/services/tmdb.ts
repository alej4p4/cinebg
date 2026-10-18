import axios from 'axios'
import { useAppStore } from '@/store/useAppStore'
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

// ===== Filtro infantil =====
// Gêneros considerados apropriados para o perfil infantil (perfil com `kids`).
const KIDS_GENRES = new Set([16, 10751, 10762, 12, 14, 35, 10402, 10765])

export const isKidsMode = (): boolean => {
  const { profiles, activeProfileId } = useAppStore.getState()
  return profiles.find((p) => p.id === activeProfileId)?.kids ?? false
}

const forKids = (items: MediaItem[]): MediaItem[] =>
  isKidsMode() ? items.filter((item) => item.genreIds.some((g) => KIDS_GENRES.has(g))) : items

// ===== Image URLs =====
export const getPosterUrl = (path: string | null | undefined, size: 'w185' | 'w342' | 'w500' | 'w780' | 'original' = 'w500'): string => {
  if (!path) return '/placeholder-poster.svg'
  return `${IMAGE_BASE}/${size}${path}`
}

export const getBackdropUrl = (path: string | null | undefined, size: 'w300' | 'w780' | 'w1280' | 'original' = 'w1280'): string => {
  if (!path) return '/placeholder-backdrop.svg'
  return `${IMAGE_BASE}/${size}${path}`
}

export const getProfileUrl = (path: string | null | undefined): string => {
  if (!path) return '/placeholder-avatar.svg'
  return `${IMAGE_BASE}/w185${path}`
}

// ===== Cache & Deduplication =====
const requestCache = new Map<string, { data: unknown; expiresAt: number }>()
const inflightMap = new Map<string, Promise<unknown>>()

const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutos

const buildCacheKey = (method: string, url: string, params?: Record<string, unknown>) => {
  const p = params ? JSON.stringify(params) : ''
  return `${method.toUpperCase()}:${url}:${p}`
}

const cachedGet = async <T>(url: string, params?: Record<string, unknown>): Promise<T> => {
  const key = buildCacheKey('GET', url, { ...params, __kids: isKidsMode() })
  const now = Date.now()
  const cached = requestCache.get(key)
  if (cached && cached.expiresAt > now) {
    return cached.data as T
  }
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
    requestCache.set(key, { data, expiresAt: now + CACHE_TTL_MS })
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

// ===== API Functions =====

// Trending
export const getTrending = async (
  mediaType: 'movie' | 'tv' | 'all',
  timeWindow: 'day' | 'week' = 'week',
): Promise<MediaItem[]> => {
  const data = await cachedGet<TMDBPaginatedResponse<TMDBMovie & TMDBShow>>(
    `/trending/${mediaType}/${timeWindow}`
  )
  return forKids(
    data.results.map((item) => {
      if ('title' in item) return movieToMediaItem(item as TMDBMovie)
      return showToMediaItem(item as TMDBShow)
    })
  )
}

// Movies
export const getPopularMovies = async (page = 1): Promise<{ items: MediaItem[]; totalPages: number }> => {
  const data = await cachedGet<TMDBPaginatedResponse<TMDBMovie>>('/movie/popular', { page })
  return { items: forKids(data.results.map(movieToMediaItem)), totalPages: data.total_pages }
}

export const getTopRatedMovies = async (page = 1): Promise<{ items: MediaItem[]; totalPages: number }> => {
  const data = await cachedGet<TMDBPaginatedResponse<TMDBMovie>>('/movie/top_rated', { page })
  return { items: forKids(data.results.map(movieToMediaItem)), totalPages: data.total_pages }
}

export const getNowPlayingMovies = async (page = 1): Promise<{ items: MediaItem[]; totalPages: number }> => {
  const data = await cachedGet<TMDBPaginatedResponse<TMDBMovie>>('/movie/now_playing', { page })
  return { items: forKids(data.results.map(movieToMediaItem)), totalPages: data.total_pages }
}

export const getUpcomingMovies = async (page = 1): Promise<{ items: MediaItem[]; totalPages: number }> => {
  const data = await cachedGet<TMDBPaginatedResponse<TMDBMovie>>('/movie/upcoming', { page })
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
    with_watch_providers: params.withWatchProviders,
    watch_region: params.withWatchProviders ? 'BR' : undefined,
  })
  return { items: forKids(data.results.map(movieToMediaItem)), totalPages: data.total_pages }
}

// Filmes Clássicos Inesquecíveis (Obras-primas consagradas pré-2002)
export const getClassicMovies = async (page = 1): Promise<{ items: MediaItem[]; totalPages: number }> => {
  const data = await cachedGet<TMDBPaginatedResponse<TMDBMovie>>('/discover/movie', {
    page,
    sort_by: 'vote_average.desc',
    'vote_count.gte': 2500,
    'primary_release_date.lte': '2002-12-31',
  })
  return { items: forKids(data.results.map(movieToMediaItem)), totalPages: data.total_pages }
}

// TV Shows
export const getPopularShows = async (page = 1): Promise<{ items: MediaItem[]; totalPages: number }> => {
  const data = await cachedGet<TMDBPaginatedResponse<TMDBShow>>('/tv/popular', { page })
  return { items: forKids(data.results.map((s) => showToMediaItem(s, 'tv'))), totalPages: data.total_pages }
}

export const getTopRatedShows = async (page = 1): Promise<{ items: MediaItem[]; totalPages: number }> => {
  const data = await cachedGet<TMDBPaginatedResponse<TMDBShow>>('/tv/top_rated', { page })
  return { items: forKids(data.results.map((s) => showToMediaItem(s, 'tv'))), totalPages: data.total_pages }
}

// Séries Clássicas e Nostalgia (Séries lendárias consagradas pré-2010)
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
    with_original_language: params.isAnime ? 'ja' : undefined,
  })
  const type: MediaType = params.isAnime ? 'anime' : 'tv'
  return { items: forKids(data.results.map((s) => showToMediaItem(s, type))), totalPages: data.total_pages }
}

// Details
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

// Search
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
