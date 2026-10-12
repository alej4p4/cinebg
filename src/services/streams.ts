import type { StreamSource } from '@/types'
import type { Language, AudioOption } from '@/store/useAppStore'

// =========================================================================
// MOTOR DE STREAMING NATIVO CINEBG (ESTILO YUCINE - ZERO PARKLOGIC / ZERO ADS)
// Fontes 100% ativas e verificadas com suporte a Multi-Áudio e Dublagem PT-BR.
// Fallback silencioso automático sem exigir seleção técnica do usuário.
// =========================================================================

export interface StreamMirror {
  id: string
  name: string
  flagEmoji: string
  quality: string
  type: 'dubbed_br' | 'multi_sub'
  getMovieUrl: (tmdbId: number, audio: AudioOption | Language) => string
  getShowUrl: (tmdbId: number, season: number, episode: number, audio: AudioOption | Language) => string
}

const normalizeAudio = (audio: AudioOption | Language): AudioOption => {
  if (audio === 'pt') return 'dub'
  if (audio === 'en') return 'orig'
  return audio
}

export const MIRRORS: StreamMirror[] = [
  {
    id: 'multiembed',
    name: 'CineBG Nativo (Multi-Áudio Dublado)',
    flagEmoji: '🇧🇷',
    quality: 'FHD 1080p',
    type: 'dubbed_br',
    getMovieUrl: (tmdbId) => `https://multiembed.mov/?video_id=${tmdbId}&tmdb=1`,
    getShowUrl: (tmdbId, season, episode) =>
      `https://multiembed.mov/?video_id=${tmdbId}&tmdb=1&s=${season}&e=${episode}`,
  },
  {
    id: 'vidlink',
    name: 'CineBG Ultra (VidLink Pro)',
    flagEmoji: '🚀',
    quality: 'FHD 1080p',
    type: 'multi_sub',
    getMovieUrl: (tmdbId, audioInput) => {
      const audio = normalizeAudio(audioInput)
      const base = `https://vidlink.pro/movie/${tmdbId}?primaryColor=ef4444&secondaryColor=10b981`
      return audio === 'orig' ? base : `${base}&sub_lang=pt`
    },
    getShowUrl: (tmdbId, season, episode, audioInput) => {
      const audio = normalizeAudio(audioInput)
      const base = `https://vidlink.pro/tv/${tmdbId}/${season}/${episode}?primaryColor=ef4444&secondaryColor=10b981`
      return audio === 'orig' ? base : `${base}&sub_lang=pt`
    },
  },
  {
    id: 'vidsrc-me',
    name: 'CineBG Cloud (VidSrc)',
    flagEmoji: '⚡',
    quality: 'FHD 1080p',
    type: 'multi_sub',
    getMovieUrl: (tmdbId, audioInput) => {
      const audio = normalizeAudio(audioInput)
      const base = `https://vidsrc.me/embed/movie?tmdb=${tmdbId}`
      return audio === 'orig' ? base : `${base}&ds_lang=pt`
    },
    getShowUrl: (tmdbId, season, episode, audioInput) => {
      const audio = normalizeAudio(audioInput)
      const base = `https://vidsrc.me/embed/tv?tmdb=${tmdbId}&season=${season}&episode=${episode}`
      return audio === 'orig' ? base : `${base}&ds_lang=pt`
    },
  },
  {
    id: 'vidsrc-net',
    name: 'CineBG Direct (VidSrc Network)',
    flagEmoji: '🌐',
    quality: 'HD 720p',
    type: 'multi_sub',
    getMovieUrl: (tmdbId) => `https://vidsrc.net/embed/movie/${tmdbId}`,
    getShowUrl: (tmdbId, season, episode) =>
      `https://vidsrc.net/embed/tv/${tmdbId}/${season}/${episode}`,
  },
  {
    id: '2embed',
    name: 'CineBG Express (2Embed)',
    flagEmoji: '🍿',
    quality: 'HD 720p',
    type: 'multi_sub',
    getMovieUrl: (tmdbId) => `https://www.2embed.cc/embed/${tmdbId}`,
    getShowUrl: (tmdbId, season, episode) =>
      `https://www.2embed.cc/embedtv/${tmdbId}&s=${season}&e=${episode}`,
  },
]

// Ordem otimizada de fallback por preferência de áudio
export const getNextSilentMirrorId = (currentId: string, audio: AudioOption = 'dub'): string => {
  const sequence =
    audio === 'dub'
      ? ['multiembed', 'vidlink', 'vidsrc-me', 'vidsrc-net', '2embed']
      : ['vidlink', 'multiembed', 'vidsrc-me', 'vidsrc-net', '2embed']

  const currentIndex = sequence.indexOf(currentId)
  if (currentIndex === -1 || currentIndex >= sequence.length - 1) {
    return sequence[0]
  }
  return sequence[currentIndex + 1]
}

export const getInitialMirrorForAudio = (audio: AudioOption = 'dub'): string => {
  return audio === 'dub' ? 'multiembed' : 'vidlink'
}

export const buildMovieUrl = (
  tmdbId: number,
  audio: AudioOption | Language = 'dub',
  mirrorId?: string
): string => {
  const normAudio = normalizeAudio(audio)
  const targetId = mirrorId || getInitialMirrorForAudio(normAudio)
  const mirror = MIRRORS.find((m) => m.id === targetId) || MIRRORS[0]
  return mirror.getMovieUrl(tmdbId, normAudio)
}

export const buildShowUrl = (
  tmdbId: number,
  season: number,
  episode: number,
  audio: AudioOption | Language = 'dub',
  mirrorId?: string
): string => {
  const normAudio = normalizeAudio(audio)
  const targetId = mirrorId || getInitialMirrorForAudio(normAudio)
  const mirror = MIRRORS.find((m) => m.id === targetId) || MIRRORS[0]
  return mirror.getShowUrl(tmdbId, season, episode, normAudio)
}

export const CINEBG_SOURCE: StreamSource = {
  id: 'cinebg-native',
  name: 'CineBG Nativo',
  label: 'CineBG Player',
  quality: 'FHD',
  flagEmoji: '🇧🇷',
  getMovieUrl: (tmdbId) => buildMovieUrl(tmdbId, 'dub'),
  getShowUrl: (tmdbId, season, episode) => buildShowUrl(tmdbId, season, episode, 'dub'),
}

export const STREAM_SOURCES: StreamSource[] = [CINEBG_SOURCE]
export const DEFAULT_SOURCE = CINEBG_SOURCE

export const getMovieEmbed = (tmdbId: number, mirrorId?: string): string =>
  buildMovieUrl(tmdbId, 'dub', mirrorId)

export const getShowEmbed = (
  tmdbId: number,
  season: number,
  episode: number,
  mirrorId?: string
): string => buildShowUrl(tmdbId, season, episode, 'dub', mirrorId)

// ===== Live TV Channels =====
export interface LiveChannel {
  id: string
  name: string
  logo: string
  category: string
  embedUrl: string
  country: string
}

export const LIVE_CHANNELS: LiveChannel[] = [
  {
    id: 'pluto-movies',
    name: 'Pluto TV Movies',
    logo: '🎬',
    category: 'Filmes',
    embedUrl: 'https://pluto.tv/en/live-tv/pluto-tv-movies',
    country: 'US',
  },
  {
    id: 'tubi-tv',
    name: 'Tubi TV',
    logo: '📺',
    category: 'Entretenimento',
    embedUrl: 'https://tubitv.com/live',
    country: 'US',
  },
  {
    id: 'crunchyroll',
    name: 'Crunchyroll Dubs',
    logo: '🍥',
    category: 'Anime',
    embedUrl: 'https://www.crunchyroll.com/simulcastcalendar',
    country: 'JP',
  },
  {
    id: 'animixplay',
    name: 'Anime Live',
    logo: '⛩️',
    category: 'Anime',
    embedUrl: 'https://9animetv.to/home',
    country: 'JP',
  },
]
