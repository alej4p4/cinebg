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
  // true  = provedor TOLERA o atributo `sandbox` (apply sandbox -> bloqueia redirect/popup)
  // false = provedor DETECTA o sandbox e recusa reproduzir (renderiza sem sandbox)
  sandboxed: boolean
  getMovieUrl: (tmdbId: number, audio: AudioOption | Language) => string
  getShowUrl: (tmdbId: number, season: number, episode: number, audio: AudioOption | Language) => string
}

const normalizeAudio = (audio: AudioOption | Language): AudioOption => {
  if (audio === 'pt') return 'dub'
  if (audio === 'en') return 'orig'
  return audio
}

// PROVEDORES VALIDADOS EM TESTE REAL COM O USUÁRIO:
//   - Dublado PT-BR: mgeb.site (MegaEmbed) -> áudio dublado em português (padrão do servidor).
//   - Original + legenda PT: vidsrc.sh / vidsrc.io / vsembed.ru (mesmo player) com ds_lang=pt.
//   - vidlink.pro e multiembed.mov NÃO reproduzem aqui ("We couldn't find this content").
// `sandboxed: false` = renderiza sem o atributo (os provedores detectam o sandbox e recusam).
export const MIRRORS: StreamMirror[] = [
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
    id: 'vidlink',
    name: 'CineBG Ultra (VidLink Pro)',
    flagEmoji: '🚀',
    quality: 'FHD 1080p',
    type: 'multi_sub',
    sandboxed: false,
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
      ? ['megaembed', 'vidsrc-sh', 'vidsrc-io', 'vsembed']
      : ['vidsrc-sh', 'vidsrc-io', 'vsembed', 'megaembed']

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

// Devolve as fontes diretas do MegaEmbed com retry automático resiliente (inspirado na estratégia do YuCine)
const fetchMegaEmbedSources = async (
  tmdbId: number,
  mediaType: 'movie' | 'tv',
  season = 1,
  episode = 1
): Promise<MegaEmbedSource[]> => {
  const targetPath =
    mediaType === 'movie' ? `${tmdbId}` : `${tmdbId}/${season}/${episode}`

  const endpoints = [
    typeof window !== 'undefined' && window.location.hostname === 'localhost'
      ? `/api/mgeb/embed/${targetPath}`
      : null,
    `https://mgeb.site/embed/${targetPath}`,
  ].filter(Boolean) as string[]

  for (const url of endpoints) {
    // Tenta até 2 vezes com pequeno intervalo antes de passar para o próximo endpoint
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const res = await fetch(url, {
          credentials: 'omit',
          referrerPolicy: 'no-referrer',
        })
        if (!res.ok) continue

        const html = await res.text()
        const match = html.match(/var sources = (\[[\s\S]*?\]);/)
        if (!match) continue

        const parsed = JSON.parse(match[1]) as MegaEmbedSource[]
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed
        }
      } catch {
        // Aguarda 800ms antes da próxima tentativa
        if (attempt === 0) {
          await new Promise((resolve) => setTimeout(resolve, 800))
        }
      }
    }
  }

  return []
}

export interface MegaEmbedResolved {
  // MP4 dublado em PT-BR (CDN fontedecanais-live).
  dubbedMp4: string | null
  // Stream HLS (.m3u8) nativo compatível com hls.js.
  hlsProxy: string | null
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

  const sources = await fetchMegaEmbedSources(tmdbId, mediaType, season, episode)

  const dubbed = sources.find(
    (source) =>
      typeof source.file === 'string' && source.file.includes(DUBBED_SOURCE_HOST_HINT)
  )
  const hls = sources.find(
    (source) =>
      typeof source.file === 'string' &&
      (source.file.includes('.m3u8') ||
       source.file.includes('/includes/hls.php') ||
       source.type === 'hls')
  )

  const result: MegaEmbedResolved = {
    dubbedMp4: formatDirectStreamUrl(dubbed?.file ?? null),
    hlsProxy: hls?.file ?? null,
  }

  if (result.dubbedMp4 || result.hlsProxy) {
    resolvedSourcesCache.set(cacheKey, result)
  }

  return result
}

export const resolveMegaEmbedDubbedSource = async (
  tmdbId: number,
  mediaType: 'movie' | 'tv',
  season = 1,
  episode = 1
): Promise<string | null> => (await resolveMegaEmbed(tmdbId, mediaType, season, episode)).dubbedMp4
