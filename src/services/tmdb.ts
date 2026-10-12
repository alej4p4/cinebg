import axios from 'axios'
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

// ===== TMDB Configuration =====
// Using a public/demo key - user should replace with their own from themoviedb.org
const API_KEY = import.meta.env.VITE_TMDB_API_KEY || '4e44d9029b1270a757cddc766a1bcb63'
const BASE_URL = 'https://api.themoviedb.org/3'

export const IMAGE_BASE = 'https://image.tmdb.org/t/p'

export const tmdb = axios.create({
  baseURL: BASE_URL,
  params: {
    api_key: API_KEY,
    language: 'pt-BR',
  },
})

// ===== Image URLs =====
export const getPosterUrl = (path: string | null | undefined, size: 'w185' | 'w342' | 'w500' | 'w780' | 'original' = 'w500'): string => {
  if (!path) return '/placeholder-poster.jpg'
  return `${IMAGE_BASE}/${size}${path}`
}

export const getBackdropUrl = (path: string | null | undefined, size: 'w300' | 'w780' | 'w1280' | 'original' = 'w1280'): string => {
  if (!path) return '/placeholder-backdrop.jpg'
  return `${IMAGE_BASE}/${size}${path}`
}

export const getProfileUrl = (path: string | null | undefined): string => {
  if (!path) return '/placeholder-avatar.jpg'
  return `${IMAGE_BASE}/w185${path}`
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
  const { data } = await tmdb.get<TMDBPaginatedResponse<TMDBMovie & TMDBShow>>(
    `/trending/${mediaType}/${timeWindow}`
  )
  return data.results.map((item) => {
    if ('title' in item) return movieToMediaItem(item as TMDBMovie)
    return showToMediaItem(item as TMDBShow)
  })
}

// Movies
export const getPopularMovies = async (page = 1): Promise<{ items: MediaItem[]; totalPages: number }> => {
  const { data } = await tmdb.get<TMDBPaginatedResponse<TMDBMovie>>('/movie/popular', { params: { page } })
  return { items: data.results.map(movieToMediaItem), totalPages: data.total_pages }
}

export const getTopRatedMovies = async (page = 1): Promise<{ items: MediaItem[]; totalPages: number }> => {
  const { data } = await tmdb.get<TMDBPaginatedResponse<TMDBMovie>>('/movie/top_rated', { params: { page } })
  return { items: data.results.map(movieToMediaItem), totalPages: data.total_pages }
}

export const getNowPlayingMovies = async (page = 1): Promise<{ items: MediaItem[]; totalPages: number }> => {
  const { data } = await tmdb.get<TMDBPaginatedResponse<TMDBMovie>>('/movie/now_playing', { params: { page } })
  return { items: data.results.map(movieToMediaItem), totalPages: data.total_pages }
}

export const getUpcomingMovies = async (page = 1): Promise<{ items: MediaItem[]; totalPages: number }> => {
  const { data } = await tmdb.get<TMDBPaginatedResponse<TMDBMovie>>('/movie/upcoming', { params: { page } })
  return { items: data.results.map(movieToMediaItem), totalPages: data.total_pages }
}

export const discoverMovies = async (params: {
  page?: number
  genre?: number
  year?: number
  sort?: string
  minRating?: number
}): Promise<{ items: MediaItem[]; totalPages: number }> => {
  const { data } = await tmdb.get<TMDBPaginatedResponse<TMDBMovie>>('/discover/movie', {
    params: {
      page: params.page || 1,
      with_genres: params.genre,
      primary_release_year: params.year,
      sort_by: params.sort || 'popularity.desc',
      'vote_average.gte': params.minRating,
    },
  })
  return { items: data.results.map(movieToMediaItem), totalPages: data.total_pages }
}

// TV Shows
export const getPopularShows = async (page = 1): Promise<{ items: MediaItem[]; totalPages: number }> => {
  const { data } = await tmdb.get<TMDBPaginatedResponse<TMDBShow>>('/tv/popular', { params: { page } })
  return { items: data.results.map((s) => showToMediaItem(s, 'tv')), totalPages: data.total_pages }
}

export const getTopRatedShows = async (page = 1): Promise<{ items: MediaItem[]; totalPages: number }> => {
  const { data } = await tmdb.get<TMDBPaginatedResponse<TMDBShow>>('/tv/top_rated', { params: { page } })
  return { items: data.results.map((s) => showToMediaItem(s, 'tv')), totalPages: data.total_pages }
}

export const getAiringToday = async (page = 1): Promise<{ items: MediaItem[]; totalPages: number }> => {
  const { data } = await tmdb.get<TMDBPaginatedResponse<TMDBShow>>('/tv/airing_today', { params: { page } })
  return { items: data.results.map((s) => showToMediaItem(s, 'tv')), totalPages: data.total_pages }
}

export const discoverShows = async (params: {
  page?: number
  genre?: number
  year?: number
  sort?: string
  minRating?: number
  isAnime?: boolean
}): Promise<{ items: MediaItem[]; totalPages: number }> => {
  const { data } = await tmdb.get<TMDBPaginatedResponse<TMDBShow>>('/discover/tv', {
    params: {
      page: params.page || 1,
      with_genres: params.isAnime ? 16 : params.genre,
      first_air_date_year: params.year,
      sort_by: params.sort || 'popularity.desc',
      'vote_average.gte': params.minRating,
      with_keywords: params.isAnime ? '210024|287501' : undefined,
      with_original_language: params.isAnime ? 'ja' : undefined,
    },
  })
  const type: MediaType = params.isAnime ? 'anime' : 'tv'
  return { items: data.results.map((s) => showToMediaItem(s, type)), totalPages: data.total_pages }
}

// Details
export const getMovieDetails = async (id: number): Promise<TMDBMovieDetails> => {
  const { data } = await tmdb.get<TMDBMovieDetails>(`/movie/${id}`, {
    params: { append_to_response: 'videos,credits,similar,recommendations' },
  })
  return data
}

export const getShowDetails = async (id: number): Promise<TMDBShowDetails> => {
  const { data } = await tmdb.get<TMDBShowDetails>(`/tv/${id}`, {
    params: { append_to_response: 'videos,credits,similar,recommendations' },
  })
  return data
}

export const getSeasonDetails = async (showId: number, seasonNumber: number): Promise<TMDBSeason> => {
  const { data } = await tmdb.get<TMDBSeason>(`/tv/${showId}/season/${seasonNumber}`)
  return data
}

export const getMovieVideos = async (id: number): Promise<TMDBVideo[]> => {
  const { data } = await tmdb.get<{ results: TMDBVideo[] }>(`/movie/${id}/videos`)
  return data.results.filter((v) => v.site === 'YouTube')
}

export const getMovieCredits = async (id: number): Promise<TMDBCredits> => {
  const { data } = await tmdb.get<TMDBCredits>(`/movie/${id}/credits`)
  return data
}

export const getShowCredits = async (id: number): Promise<TMDBCredits> => {
  const { data } = await tmdb.get<TMDBCredits>(`/tv/${id}/credits`)
  return data
}

// Search
export const searchMulti = async (query: string, page = 1): Promise<{ items: MediaItem[]; totalPages: number }> => {
  const { data } = await tmdb.get<TMDBPaginatedResponse<TMDBMovie & TMDBShow & { media_type: string }>>('/search/multi', {
    params: { query, page, include_adult: false },
  })
  const items = data.results
    .filter((r) => r.media_type === 'movie' || r.media_type === 'tv')
    .map((r) => {
      if (r.media_type === 'movie') return movieToMediaItem(r as TMDBMovie)
      return showToMediaItem(r as TMDBShow)
    })
  return { items, totalPages: data.total_pages }
}

export const searchMovies = async (query: string, page = 1): Promise<{ items: MediaItem[]; totalPages: number }> => {
  const { data } = await tmdb.get<TMDBPaginatedResponse<TMDBMovie>>('/search/movie', {
    params: { query, page },
  })
  return { items: data.results.map(movieToMediaItem), totalPages: data.total_pages }
}

export const searchShows = async (query: string, page = 1): Promise<{ items: MediaItem[]; totalPages: number }> => {
  const { data } = await tmdb.get<TMDBPaginatedResponse<TMDBShow>>('/search/tv', {
    params: { query, page },
  })
  return { items: data.results.map((s) => showToMediaItem(s, 'tv')), totalPages: data.total_pages }
}
