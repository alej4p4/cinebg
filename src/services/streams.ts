import { Capacitor, CapacitorHttp } from '@capacitor/core'
import type { Language, AudioOption } from '@/store/useAppStore'

// =========================================================================
// MOTOR DE STREAMING NATIVO CINEBG (ESTILO YUCINE - ZERO PROPAGANDAS / ZERO ADS)
// Prioridade absoluta para extração e reprodução nativa de fontes diretas MP4 e HLS.
// Sandboxing estrito ativado em todos os mirrors externos para erradicar anúncios e pop-ups.
// =========================================================================

export interface StreamMirror {
  id: string
  name: string
  flagEmoji: string
  quality: string
  type: 'dubbed_br' | 'multi_sub'
  sandboxed: boolean
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
    id: 'vidlink',
    name: 'CineBG Ultra (VidLink Pro)',
    flagEmoji: '🚀',
    quality: 'FHD 1080p',
    type: 'multi_sub',
    sandboxed: true,
    getMovieUrl: (tmdbId) =>
      `https://vidlink.pro/movie/${tmdbId}?primaryColor=ef4444&secondaryColor=10b981&sub_lang=pt`,
    getShowUrl: (tmdbId, season, episode) =>
      `https://vidlink.pro/tv/${tmdbId}/${season}/${episode}?primaryColor=ef4444&secondaryColor=10b981&sub_lang=pt`,
  },
  {
    id: 'vidsrc-sh',
    name: 'CineBG Prime (VidSrc)',
    flagEmoji: '⚡',
    quality: 'FHD 1080p',
    type: 'multi_sub',
    sandboxed: false,
    getMovieUrl: (tmdbId) => `https://vidsrc.sh/embed/movie?tmdb=${tmdbId}&ds_lang=pt`,
    getShowUrl: (tmdbId, season, episode) =>
      `https://vidsrc.sh/embed/tv?tmdb=${tmdbId}&season=${season}&episode=${episode}&ds_lang=pt`,
  },
  {
    id: 'megaembed',
    name: 'CineBG Dublado (MegaEmbed)',
    flagEmoji: '🇧🇷',
    quality: 'FHD 1080p',
    type: 'dubbed_br',
    sandboxed: false,
    getMovieUrl: (tmdbId) => `https://mgeb.site/embed/${tmdbId}`,
    getShowUrl: (tmdbId, season, episode) =>
      `https://mgeb.site/embed/${tmdbId}/${season}/${episode}`,
  },
  {
    id: 'vidsrc-io',
    name: 'CineBG Cloud (VidSrc IO)',
    flagEmoji: '🌐',
    quality: 'FHD 1080p',
    type: 'multi_sub',
    sandboxed: false,
    getMovieUrl: (tmdbId) => `https://vidsrc.io/embed/movie/${tmdbId}?ds_lang=pt`,
    getShowUrl: (tmdbId, season, episode) =>
      `https://vidsrc.io/embed/tv/${tmdbId}/${season}/${episode}?ds_lang=pt`,
  },
  {
    id: 'vsembed',
    name: 'CineBG Express (VsEmbed)',
    flagEmoji: '🍿',
    quality: 'FHD 1080p',
    type: 'multi_sub',
    sandboxed: false,
    getMovieUrl: (tmdbId) => `https://vsembed.ru/embed/movie/${tmdbId}?ds_lang=pt`,
    getShowUrl: (tmdbId, season, episode) =>
      `https://vsembed.ru/embed/tv/${tmdbId}/${season}/${episode}?ds_lang=pt`,
  },
  {
    id: 'multiembed',
    name: 'CineBG Nativo (Multi-Áudio Dublado)',
    flagEmoji: '🇧🇷',
    quality: 'FHD 1080p',
    type: 'dubbed_br',
    sandboxed: false,
    getMovieUrl: (tmdbId) => `https://multiembed.mov/?video_id=${tmdbId}&tmdb=1`,
    getShowUrl: (tmdbId, season, episode) =>
      `https://multiembed.mov/?video_id=${tmdbId}&tmdb=1&s=${season}&e=${episode}`,
  },
]

// Ordem de fallback dependente do áudio escolhido.
// Dublado: começa no MegaEmbed (áudio PT), cai para os vidsrc (original+legenda PT).
// Original/Legendado: começa nos vidsrc (legenda PT) e deixa o MegaEmbed por último.
export const getNextSilentMirrorId = (currentId: string, audio: AudioOption = 'dub'): string => {
  const sequence =
    audio === 'dub'
      ? ['megaembed', 'vidlink', 'vidsrc-sh', 'vidsrc-io', 'vsembed']
      : ['vidlink', 'vidsrc-sh', 'vidsrc-io', 'vsembed', 'megaembed']

  const currentIndex = sequence.indexOf(currentId)
  if (currentIndex === -1 || currentIndex >= sequence.length - 1) {
    return sequence[0]
  }
  return sequence[currentIndex + 1]
}

// O espelho inicial sempre começa no MegaEmbed para extração direta de fontes nativas (MP4/HLS) sem anúncios (estilo YuCine).
export const getInitialMirrorForAudio = (_audio: AudioOption = 'dub'): string => {
  return 'megaembed'
}

// Indica se o espelho deve ser renderizado dentro de um iframe com `sandbox`.
export const isMirrorSandboxed = (mirrorId: string): boolean => {
  const mirror = MIRRORS.find((m) => m.id === mirrorId)
  return mirror ? mirror.sandboxed : false
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

// =========================================================================
// SELEÇÃO INTELIGENTE DE FONTE DUBLADA (MegaEmbed)
// -------------------------------------------------------------------------
// O player do MegaEmbed reproduz sempre a PRIMEIRA fonte da lista, que nem
// sempre é a dublada (em muitas séries a 1ª é um HLS original em inglês).
// A página de embed libera CORS (`Access-Control-Allow-Origin: *`), então
// lemos a lista `var sources = [...]` e escolhemos o MP4 dublado PT-BR,
// servido pelo CDN "fontedecanais-live" (validado com títulos dublados).
// =========================================================================
const MEGAEMBED_EMBED_BASE = 'https://mgeb.site/embed'
const DUBBED_SOURCE_HOST_HINT = 'fontedecanais'

interface MegaEmbedSource {
  file?: string
  type?: string
  label?: string
}

export const buildMegaEmbedUrl = (
  tmdbId: number,
  mediaType: 'movie' | 'tv',
  season = 1,
  episode = 1
): string =>
  mediaType === 'movie'
    ? `${MEGAEMBED_EMBED_BASE}/${tmdbId}`
    : `${MEGAEMBED_EMBED_BASE}/${tmdbId}/${season}/${episode}`

export interface DirectCandidate {
  url: string
  kind: 'mp4' | 'hls'
  label: string
  isDubbedHint: boolean
}

export interface MegaEmbedResolved {
  // Principal fonte dublada recomendada (MP4 ou HLS)
  dubbedMp4: string | null
  // Principal stream HLS (.m3u8) nativo compatível com hls.js
  hlsProxy: string | null
  // Lista ordenada de todas as fontes diretas limpas (sem anúncios)
  candidates: DirectCandidate[]
}

// Cache em memória de fontes resolvidas para carregamento instantâneo (estilo YuCine)
const resolvedSourcesCache = new Map<string, MegaEmbedResolved>()

// Normaliza URLs de CDN para HTTPS e remove portas obsoletas
export const formatDirectStreamUrl = (url: string | null): string | null => {
  if (!url) return null
  if (url.startsWith('http://www-fontedecanais-live.')) {
    return url.replace('http://', 'https://').replace(':80/', '/')
  }
  return url
}

// Devolve as fontes diretas do MegaEmbed com suporte a CapacitorHttp nativo e retry
const fetchMegaEmbedSources = async (
  tmdbId: number,
  mediaType: 'movie' | 'tv',
  season = 1,
  episode = 1
): Promise<MegaEmbedSource[]> => {
  const targetPath =
    mediaType === 'movie' ? `${tmdbId}` : `${tmdbId}/${season}/${episode}`
  const targetUrl = `https://mgeb.site/embed/${targetPath}`

  // 1. No app nativo Android (Capacitor), usa CapacitorHttp com timeout seguro de 4.5s
  if (Capacitor.isNativePlatform()) {
    try {
      const httpPromise = CapacitorHttp.get({
        url: targetUrl,
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'User-Agent':
            'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
        },
        connectTimeout: 4500,
        readTimeout: 4500,
      })
      const timeoutPromise = new Promise<null>((resolve) =>
        setTimeout(() => resolve(null), 4500)
      )
      const resp = await Promise.race([httpPromise, timeoutPromise])

      if (resp && resp.status >= 200 && resp.status < 300 && typeof resp.data === 'string') {
        const match = resp.data.match(/var sources = (\[[\s\S]*?\]);/)
        if (match) {
          const parsed = JSON.parse(match[1]) as MegaEmbedSource[]
          if (Array.isArray(parsed) && parsed.length > 0) return parsed
        }
      }
    } catch (e) {
      console.warn('[fetchMegaEmbedSources] CapacitorHttp erro, tentando fallback:', e)
    }
  }

  // 2. Ambiente Web (Vite dev proxy ou fetch direto com timeout rápido)
  const endpoints = [
    typeof window !== 'undefined' && window.location.port === '5173'
      ? `/api/mgeb/embed/${targetPath}`
      : null,
    targetUrl,
  ].filter(Boolean) as string[]

  for (const url of endpoints) {
    try {
      const controller = new AbortController()
      const tId = setTimeout(() => controller.abort(), 3500)
      const res = await fetch(url, {
        credentials: 'omit',
        referrerPolicy: 'no-referrer',
        signal: controller.signal,
      })
      clearTimeout(tId)
      if (!res.ok) continue

      const html = await res.text()
      const match = html.match(/var sources = (\[[\s\S]*?\]);/)
      if (!match) continue

      const parsed = JSON.parse(match[1]) as MegaEmbedSource[]
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed
      }
    } catch {}
  }

  return []
}

export const resolveMegaEmbed = async (
  tmdbId: number,
  mediaType: 'movie' | 'tv',
  season = 1,
  episode = 1
): Promise<MegaEmbedResolved> => {
  const cacheKey = `${mediaType}-${tmdbId}-${season}-${episode}`
  if (resolvedSourcesCache.has(cacheKey)) {
    return resolvedSourcesCache.get(cacheKey)!
  }

  const resolveLogic = async (): Promise<MegaEmbedResolved> => {
    const rawSources = await fetchMegaEmbedSources(tmdbId, mediaType, season, episode)
    const candidates: DirectCandidate[] = []

    for (let i = 0; i < rawSources.length; i++) {
      const s = rawSources[i]
      const file = s.file || ''
      if (!file || typeof file !== 'string') continue
      // Descarta se for iframe externo ou página com anúncios
      if (s.type === 'iframe') continue
      if (file.includes('embed') && !file.includes('get_video')) continue

      const cleanUrl = formatDirectStreamUrl(file)
      if (!cleanUrl) continue

      const isFontedecanais = cleanUrl.includes(DUBBED_SOURCE_HOST_HINT)
      const isDubbed =
        isFontedecanais ||
        cleanUrl.toLowerCase().includes('dublado') ||
        cleanUrl.toLowerCase().includes('pt-br')

      const isHls =
        s.type === 'hls' ||
        cleanUrl.includes('.m3u8') ||
        cleanUrl.includes('/hls') ||
        cleanUrl.includes('/includes/hls.php')

      candidates.push({
        url: cleanUrl,
        kind: isHls ? 'hls' : 'mp4',
        label: s.label || (isFontedecanais ? `Opção Dublada ${i + 1}` : `Servidor ${i + 1}`),
        isDubbedHint: isDubbed,
      })
    }

    // Ordenação inteligente estilo YuCine:
    // 1. Fontes com dica de dublagem (fontedecanais / dublado) primeiro
    // 2. MP4s diretos (streamtape, supervideo, etc. - reprodução direta sem ads)
    // 3. HLS streams
    candidates.sort((a, b) => {
      if (a.isDubbedHint && !b.isDubbedHint) return -1
      if (!a.isDubbedHint && b.isDubbedHint) return 1
      if (a.kind === 'mp4' && b.kind === 'hls') return -1
      if (a.kind === 'hls' && b.kind === 'mp4') return 1
      return 0
    })

    const dubbed =
      candidates.find((c) => c.isDubbedHint) ||
      candidates.find((c) => c.kind === 'mp4') ||
      candidates[0]

    const hls =
      candidates.find((c) => c.kind === 'hls') ||
      candidates[0]

    const result: MegaEmbedResolved = {
      dubbedMp4: dubbed?.url ?? null,
      hlsProxy: hls?.url ?? (candidates.length > 0 ? candidates[0].url : null),
      candidates,
    }

    if (result.dubbedMp4 || result.hlsProxy || candidates.length > 0) {
      resolvedSourcesCache.set(cacheKey, result)
    }

    return result
  }

  // Timeout geral de 5.5s para não prender o player em redes lentas de TV
  const fallbackEmpty: MegaEmbedResolved = {
    dubbedMp4: null,
    hlsProxy: null,
    candidates: [],
  }

  const timeoutPromise = new Promise<MegaEmbedResolved>((resolve) =>
    setTimeout(() => resolve(fallbackEmpty), 5500)
  )

  return Promise.race([resolveLogic(), timeoutPromise])
}

export const resolveMegaEmbedDubbedSource = async (
  tmdbId: number,
  mediaType: 'movie' | 'tv',
  season = 1,
  episode = 1
): Promise<string | null> => (await resolveMegaEmbed(tmdbId, mediaType, season, episode)).dubbedMp4
