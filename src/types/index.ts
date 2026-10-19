// ===== TMDB Types =====

export interface TMDBMovie {
  id: number
  title: string
  original_title: string
  overview: string
  poster_path: string | null
  backdrop_path: string | null
  release_date: string
  vote_average: number
  vote_count: number
  genre_ids: number[]
  popularity: number
  adult: boolean
  original_language: string
  video: boolean
}

export interface TMDBShow {
  id: number
  name: string
  original_name: string
  overview: string
  poster_path: string | null
  backdrop_path: string | null
  first_air_date: string
  vote_average: number
  vote_count: number
  genre_ids: number[]
  popularity: number
  origin_country: string[]
  original_language: string
}

export interface TMDBGenre {
  id: number
  name: string
}

export interface TMDBEpisode {
  id: number
  name: string
  overview: string
  episode_number: number
  season_number: number
  air_date: string
  still_path: string | null
  vote_average: number
  runtime: number | null
}

export interface TMDBSeason {
  id: number
  name: string
  overview: string
  season_number: number
  episode_count: number
  air_date: string
  poster_path: string | null
  episodes?: TMDBEpisode[]
}

export interface TMDBShowDetails extends TMDBShow {
  genres: TMDBGenre[]
  number_of_seasons: number
  number_of_episodes: number
  seasons: TMDBSeason[]
  status: string
  tagline: string
  homepage: string
  last_episode_to_air?: TMDBEpisode | null
  next_episode_to_air?: TMDBEpisode | null
  networks: { id: number; name: string; logo_path: string | null }[]
  created_by: { id: number; name: string; profile_path: string | null }[]
  production_countries?: { iso_3166_1: string; name: string }[]
  credits?: TMDBCredits
  videos?: { results: TMDBVideo[] }
}

export interface TMDBMovieDetails extends TMDBMovie {
  genres: TMDBGenre[]
  runtime: number
  tagline: string
  status: string
  homepage: string
  budget: number
  revenue: number
  production_companies: { id: number; name: string; logo_path: string | null }[]
  production_countries?: { iso_3166_1: string; name: string }[]
  belongs_to_collection: {
    id: number
    name: string
    poster_path: string | null
    backdrop_path: string | null
  } | null
  credits?: TMDBCredits
  videos?: { results: TMDBVideo[] }
}

export interface TMDBVideo {
  id: string
  key: string
  name: string
  site: string
  type: string
  official: boolean
}

export interface TMDBCast {
  id: number
  name: string
  character: string
  profile_path: string | null
  order: number
}

export interface TMDBCredits {
  cast: TMDBCast[]
  crew: { id: number; name: string; job: string; department: string; profile_path: string | null }[]
}

export interface TMDBPaginatedResponse<T> {
  page: number
  results: T[]
  total_pages: number
  total_results: number
}

// ===== App Types =====

export type MediaType = 'movie' | 'tv' | 'anime'

export interface MediaItem {
  id: number
  title: string
  overview: string
  posterPath: string | null
  backdropPath: string | null
  releaseDate: string
  rating: number
  voteCount: number
  type: MediaType
  genreIds: number[]
}

export interface StreamSource {
  id: string
  name: string
  label: string
  getMovieUrl: (tmdbId: number) => string
  getShowUrl: (tmdbId: number, season: number, episode: number) => string
  quality?: string
  flagEmoji?: string
}

export interface WatchHistoryItem {
  id: number
  type: MediaType
  title: string
  posterPath: string | null
  watchedAt: number
  season?: number
  episode?: number
  progress?: number
  rating?: number
}

export interface FavoriteItem {
  id: number
  type: MediaType
  title: string
  posterPath: string | null
  rating: number
  addedAt: number
}

export interface DownloadItem {
  id: number
  type: MediaType
  title: string
  posterPath: string | null
  season?: number
  episode?: number
  url: string
  path: string
  createdAt: number
}

export interface AppStore {
  favorites: FavoriteItem[]
  history: WatchHistoryItem[]
  addFavorite: (item: FavoriteItem) => void
  removeFavorite: (id: number) => void
  isFavorite: (id: number) => boolean
  addToHistory: (item: WatchHistoryItem) => void
  updateHistoryRating?: (id: number, rating: number) => void
  clearHistory: () => void
}

// ===== Genre Map =====
export const MOVIE_GENRES: Record<number, string> = {
  28: 'Ação',
  12: 'Aventura',
  16: 'Animação',
  35: 'Comédia',
  80: 'Crime',
  99: 'Documentário',
  18: 'Drama',
  10751: 'Família',
  14: 'Fantasia',
  36: 'História',
  27: 'Terror',
  10402: 'Música',
  9648: 'Mistério',
  10749: 'Romance',
  878: 'Ficção Científica',
  10770: 'Cinema TV',
  53: 'Thriller',
  10752: 'Guerra',
  37: 'Faroeste',
}

export const TV_GENRES: Record<number, string> = {
  10759: 'Ação & Aventura',
  16: 'Animação',
  35: 'Comédia',
  80: 'Crime',
  99: 'Documentário',
  18: 'Drama',
  10751: 'Família',
  10762: 'Infantil',
  9648: 'Mistério',
  10763: 'Notícias',
  10764: 'Reality',
  10765: 'Ficção Científica & Fantasia',
  10766: 'Novela',
  10767: 'Talk Show',
  10768: 'Guerra & Política',
  37: 'Faroeste',
}
