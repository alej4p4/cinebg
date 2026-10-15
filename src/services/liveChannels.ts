// =========================================================================
// TV AO VIVO DO CINEBG — CATÁLOGO HLS NATIVO
// -------------------------------------------------------------------------
// Canais públicos e gratuitos reproduzidos nativamente (hls.js), sem iframes
// de páginas inteiras (que costumam ser bloqueados por X-Frame-Options/CSP).
//
// A lista é carregada em tempo real de playlists M3U públicas (iptv-org),
// com cache em memória. Se a rede falhar, caímos para um catálogo curado
// local de canais validados (CORS `*`), garantindo que a tela nunca fique vazia.
// =========================================================================

export interface LiveCategory {
  id: string
  label: string
  emoji: string
}

export interface LiveChannel {
  id: string
  name: string
  logo: string | null
  category: string
  country: string | null
  // Fontes de mídia em ordem de preferência (HLS .m3u8). O player alterna
  // automaticamente para a próxima em caso de falha fatal.
  sources: string[]
  quality: string | null
  geoBlocked: boolean
}

export const LIVE_CATEGORIES: LiveCategory[] = [
  { id: 'news', label: 'Notícias', emoji: '📰' },
  { id: 'movies', label: 'Filmes', emoji: '🎬' },
  { id: 'series', label: 'Séries', emoji: '📺' },
  { id: 'sports', label: 'Esportes', emoji: '⚽' },
  { id: 'kids', label: 'Infantil', emoji: '🧸' },
  { id: 'documentary', label: 'Documentários', emoji: '🌍' },
  { id: 'music', label: 'Música', emoji: '🎵' },
  { id: 'entertainment', label: 'Entretenimento', emoji: '🎭' },
  { id: 'science', label: 'Ciência', emoji: '🔬' },
  { id: 'br', label: 'Brasil', emoji: '🇧🇷' },
]

const CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
  LIVE_CATEGORIES.map((c) => [c.id, c.label])
)

// Playlists públicas (iptv-org) por categoria. CORS liberado (`*`).
const REMOTE_BASE = 'https://iptv-org.github.io/iptv'
const REMOTE_SOURCES: { category: string; url: string }[] = [
  { category: 'news', url: `${REMOTE_BASE}/categories/news.m3u` },
  { category: 'movies', url: `${REMOTE_BASE}/categories/movies.m3u` },
  { category: 'series', url: `${REMOTE_BASE}/categories/series.m3u` },
  { category: 'sports', url: `${REMOTE_BASE}/categories/sports.m3u` },
  { category: 'kids', url: `${REMOTE_BASE}/categories/kids.m3u` },
  { category: 'documentary', url: `${REMOTE_BASE}/categories/documentary.m3u` },
  { category: 'music', url: `${REMOTE_BASE}/categories/music.m3u` },
  { category: 'entertainment', url: `${REMOTE_BASE}/categories/entertainment.m3u` },
  { category: 'science', url: `${REMOTE_BASE}/categories/science.m3u` },
  { category: 'br', url: `${REMOTE_BASE}/countries/br.m3u` },
]

const MAX_PER_CATEGORY = 48
const FETCH_TIMEOUT_MS = 12000

// =========================================================================
// CATÁLOGO CURADO (fallback offline) — canais oficiais gratuitos verificados
// com CORS `*` no manifesto e nos segmentos, reproduzíveis via hls.js.
// =========================================================================
export const CURATED_CHANNELS: LiveChannel[] = [
  {
    id: 'dw-en',
    name: 'DW English',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/95/Deutsche_Welle_symbol_2012.svg/240px-Deutsche_Welle_symbol_2012.svg.png',
    category: 'news',
    country: 'DE',
    sources: [
      'https://dwamdstream102.akamaized.net/hls/live/2015525/dwstream102/index.m3u8',
      'https://dwamdstream103.akamaized.net/hls/live/2015526/dwstream103/index.m3u8',
    ],
    quality: '1080p',
    geoBlocked: false,
  },
  {
    id: 'cbs-news',
    name: 'CBS News 24/7',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ef/CBS_News_24-7_Logo.png/240px-CBS_News_24-7_Logo.png',
    category: 'news',
    country: 'US',
    sources: [
      'https://cbsn-us.cbsnstream.cbsnews.com/out/v1/55a8648e8f134e82a470f83d562deeca/master.m3u8',
    ],
    quality: '1080p',
    geoBlocked: false,
  },
  {
    id: 'france24-en',
    name: 'France 24 English',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/France24_Logo_2013.svg/240px-France24_Logo_2013.svg.png',
    category: 'news',
    country: 'FR',
    sources: ['https://static.france24.com/live/F24_EN_LO_HLS/live_web.m3u8'],
    quality: '720p',
    geoBlocked: false,
  },
  {
    id: 'france24-fr',
    name: 'France 24 Français',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/France24_Logo_2013.svg/240px-France24_Logo_2013.svg.png',
    category: 'news',
    country: 'FR',
    sources: ['https://static.france24.com/live/F24_FR_HI_HLS/live_web.m3u8'],
    quality: '720p',
    geoBlocked: false,
  },
  {
    id: 'france24-es',
    name: 'France 24 Español',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/France24_Logo_2013.svg/240px-France24_Logo_2013.svg.png',
    category: 'news',
    country: 'FR',
    sources: ['https://static.france24.com/live/F24_ES_HI_HLS/live_web.m3u8'],
    quality: '720p',
    geoBlocked: false,
  },
  {
    id: 'france24-ar',
    name: 'France 24 العربية',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/France24_Logo_2013.svg/240px-France24_Logo_2013.svg.png',
    category: 'news',
    country: 'FR',
    sources: ['https://static.france24.com/live/F24_AR_HI_HLS/live_web.m3u8'],
    quality: '720p',
    geoBlocked: false,
  },
  {
    id: 'arirang',
    name: 'Arirang TV',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/Arirang_TV_Logo.svg/240px-Arirang_TV_Logo.svg.png',
    category: 'entertainment',
    country: 'KR',
    sources: [
      'https://amdlive-ch01-ctnd-com.akamaized.net/arirang_1ch/smil:arirang_1ch.smil/playlist.m3u8',
    ],
    quality: '1080p',
    geoBlocked: false,
  },
  {
    id: 'nasa-tv',
    name: 'NASA TV',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/NASA_logo.svg/240px-NASA_logo.svg.png',
    category: 'science',
    country: 'US',
    sources: [
      'https://ntv1.akamaized.net/hls/live/2014075/NASA-NTV1-HLS/master.m3u8',
    ],
    quality: '1080p',
    geoBlocked: false,
  },
  {
    id: 'redbull-tv',
    name: 'Red Bull TV',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Red_Bull_TV_logo.svg/240px-Red_Bull_TV_logo.svg.png',
    category: 'sports',
    country: 'AT',
    sources: ['https://rbmn-live.akamaized.net/hls/live/590964/BoRB-AT/master.m3u8'],
    quality: '1080p',
    geoBlocked: false,
  },
]

// =========================================================================
// PARSER DE PLAYLISTS M3U
// =========================================================================
const COUNTRY_RE = /\.([a-z]{2})@/i

const stripTags = (value: string): string =>
  value
    .replace(/\((?:[^)]*)\)/g, ' ')
    .replace(/\[[^\]]*\]/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()

const attr = (extinf: string, name: string): string | null => {
  const match = extinf.match(new RegExp(`${name}="([^"]*)"`, 'i'))
  return match ? match[1] : null
}

const isPlayable = (url: string): boolean =>
  /^https?:\/\//i.test(url) && (/\.m3u8(\?|$)/i.test(url) || /\.mp4(\?|$)/i.test(url))

export const parseM3U = (text: string, category: string): LiveChannel[] => {
  const lines = text.split(/\r?\n/)
  const channels: LiveChannel[] = []
  let current: string | null = null

  for (const raw of lines) {
    const line = raw.trim()
    if (!line) continue

    if (line.startsWith('#EXTINF:')) {
      current = line
      continue
    }

    // Ignora diretivas (#EXTVLCOPT, #KODIPROP, #EXTGRP, etc.)
    if (line.startsWith('#')) continue

    if (current && isPlayable(line)) {
      const tvgId = attr(current, 'tvg-id')
      const logo = attr(current, 'tvg-logo')
      const rawName = current.slice(current.lastIndexOf(',') + 1).trim()
      const name = stripTags(rawName)
      const qualityMatch = rawName.match(/\((\d{3,4}p)\)/i)
      const geoBlocked = /geo-?blocked/i.test(rawName)
      const country = tvgId ? tvgId.match(COUNTRY_RE)?.[1]?.toUpperCase() ?? null : null

      if (name) {
        channels.push({
          id: tvgId || `${category}:${name}:${line}`,
          name,
          logo: logo && /^https?:\/\//i.test(logo) ? logo : null,
          category,
          country,
          sources: [line],
          quality: qualityMatch ? qualityMatch[1].toLowerCase() : null,
          geoBlocked,
        })
      }
    }

    current = null
  }

  return channels
}

// =========================================================================
// CARREGAMENTO REMOTO (com fallback para o catálogo curado)
// =========================================================================
let cache: LiveChannel[] | null = null
let inflight: Promise<LiveChannel[]> | null = null

const fetchPlaylist = async (category: string, url: string): Promise<LiveChannel[]> => {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  try {
    const res = await fetch(url, { signal: controller.signal, credentials: 'omit' })
    if (!res.ok) return []
    const text = await res.text()
    return parseM3U(text, category)
  } catch {
    return []
  } finally {
    clearTimeout(timer)
  }
}

const dedupe = (channels: LiveChannel[]): LiveChannel[] => {
  const seenUrl = new Set<string>()
  const seenId = new Set<string>()
  const out: LiveChannel[] = []
  for (const channel of channels) {
    const url = channel.sources[0]
    if (seenUrl.has(url) || seenId.has(channel.id)) continue
    seenUrl.add(url)
    seenId.add(channel.id)
    out.push(channel)
  }
  return out
}

export const loadLiveChannels = async (): Promise<LiveChannel[]> => {
  if (cache) return cache
  if (inflight) return inflight

  inflight = (async () => {
    const results = await Promise.allSettled(
      REMOTE_SOURCES.map((source) => fetchPlaylist(source.category, source.url))
    )

    const byCategory = new Map<string, LiveChannel[]>()
    results.forEach((result, index) => {
      if (result.status !== 'fulfilled') return
      const category = REMOTE_SOURCES[index].category
      const limited = dedupe(result.value)
        .filter((c) => !c.geoBlocked)
        .slice(0, MAX_PER_CATEGORY)
      byCategory.set(category, limited)
    })

    const ordered: LiveChannel[] = []
    for (const source of REMOTE_SOURCES) {
      const list = byCategory.get(source.category)
      if (list) ordered.push(...list)
    }

    // Sem rede / tudo vazio: usa o catálogo curado local.
    cache = ordered.length > 0 ? dedupe(ordered) : CURATED_CHANNELS
    return cache
  })()

  try {
    return await inflight
  } finally {
    inflight = null
  }
}

export const resetLiveChannelsCache = () => {
  cache = null
  inflight = null
}

// =========================================================================
// HELPERS DE APRESENTAÇÃO
// =========================================================================
export const categoryLabel = (id: string): string => CATEGORY_LABELS[id] ?? id

export const categoryEmoji = (id: string): string =>
  LIVE_CATEGORIES.find((c) => c.id === id)?.emoji ?? '📡'

export const countryFlag = (country: string | null): string => {
  if (!country || country.length !== 2) return '📡'
  const base = 0x1f1e6
  const code = country.toUpperCase()
  return String.fromCodePoint(
    base + (code.charCodeAt(0) - 65),
    base + (code.charCodeAt(1) - 65)
  )
}
