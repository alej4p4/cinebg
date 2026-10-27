import { Capacitor, CapacitorHttp } from '@capacitor/core'
import type { Language, AudioOption } from '@/store/useAppStore'

// =========================================================================
// MOTOR DE STREAMING NATIVO CINEBG (ESTILO YUCINE - ZERO PROPAGANDAS / ZERO ADS)
// Prioridade absoluta para extração e reprodução nativa de fontes diretas MP4 e HLS.
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
    id: 'megaembed',
    name: 'CineBG Direto (MegaEmbed)',
    flagEmoji: '🇧🇷',
    quality: 'FHD 1080p',
    type: 'dubbed_br',
    sandboxed: false,
    getMovieUrl: (tmdbId) => `https://mgeb.lat/embed/${tmdbId}?autoplay=1&ads=0&adblock=1`,
    getShowUrl: (tmdbId, season, episode) =>
      `https://mgeb.lat/embed/${tmdbId}/${season}/${episode}?autoplay=1&ads=0&adblock=1`,
  },
  {
    id: 'superflix',
    name: 'CineBG YouCine (SuperFlix PT-BR)',
    flagEmoji: '🇧🇷',
    quality: 'FHD 1080p',
    type: 'dubbed_br',
    sandboxed: false,
    getMovieUrl: (tmdbId) => `https://superflixapi.fun/filme/${tmdbId}`,
    getShowUrl: (tmdbId, season, episode) =>
      `https://superflixapi.fun/serie/${tmdbId}/${season}/${episode}`,
  },
  {
    id: 'vidlink',
    name: 'CineBG Ultra (VidLink Pro)',
    flagEmoji: '🚀',
    quality: 'FHD 1080p',
    type: 'multi_sub',
    sandboxed: false,
    getMovieUrl: (tmdbId) =>
      `https://vidlink.pro/movie/${tmdbId}?primaryColor=ef4444&secondaryColor=10b981&sub_lang=pt&autoplay=true&muted=false&fallback=true&ads=0`,
    getShowUrl: (tmdbId, season, episode) =>
      `https://vidlink.pro/tv/${tmdbId}/${season}/${episode}?primaryColor=ef4444&secondaryColor=10b981&sub_lang=pt&autoplay=true&muted=false&fallback=true&ads=0`,
  },
]

export const getNextSilentMirrorId = (currentId: string, audio: AudioOption = 'dub'): string => {
  const sequence =
    audio === 'dub'
      ? ['megaembed', 'vidlink']
      : ['vidlink', 'megaembed']

  const currentIndex = sequence.indexOf(currentId)
  if (currentIndex === -1 || currentIndex >= sequence.length - 1) {
    return sequence[0]
  }
  return sequence[currentIndex + 1]
}

export const getInitialMirrorForAudio = (_audio: AudioOption = 'dub'): string => {
  return 'megaembed'
}

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
  const rawTarget = mirrorId || getInitialMirrorForAudio(normAudio)
  const targetId = rawTarget === 'superflix' ? 'megaembed' : rawTarget
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
  const rawTarget = mirrorId || getInitialMirrorForAudio(normAudio)
  const targetId = rawTarget === 'superflix' ? 'megaembed' : rawTarget
  const mirror = MIRRORS.find((m) => m.id === targetId) || MIRRORS[0]
  return mirror.getShowUrl(tmdbId, season, episode, normAudio)
}

// =========================================================================
// SELEÇÃO INTELIGENTE DE FONTES DIRETAS (MegaEmbed) & FILTRO ANTI-1XBET/CAMRIP
// =========================================================================
const MEGAEMBED_EMBED_BASE = 'https://mgeb.lat/embed'

// Hosts confirmados com áudio Dublado PT-BR no MegaEmbed
const DUBBED_HOST_HINTS = [
  'fontedecanais',
  'gviudclrb.com',
  'mgeb.space/cache/hls',
  '123flmsfree.com',
  '321moviesfree.com',
  '123pelicula.com',
  'flixlat.com',
  'onfilom.com',
  'cuevana4br.com',
  'playspelis.com',
]

/**
 * Heurística robusta para identificar candidatos com áudio em Português (Dublado ou Nacional).
 * Detecta termos no rótulo, URL e produções originais brasileiras/portuguesas (originalLanguage === 'pt').
 */
export const isPortugueseAudioCandidate = (
  label?: string | null,
  url?: string | null,
  originalLanguage?: string | null
): boolean => {
  if ((originalLanguage || '').toLowerCase() === 'pt') return true
  const l = (label || '').toLowerCase()
  const u = (url || '').toLowerCase()
  return (
    DUBBED_HOST_HINTS.some((hint) => u.includes(hint)) ||
    /dub|dublado|portugu[eê]s|pt[-_]?br|audio[-_ ]?pt|nacional|\bbr\b/i.test(l) ||
    /dublado|audio[-_]pt|-dub|pt[-_]br|portugues|portuguese/i.test(u)
  )
}

// Hosts com token travado por IP do servidor backend (retornam text/html ou 404 no cliente)
const BROKEN_IP_LOCKED_HOSTS = [
  'streamtape.com',
  '97bf1.com',
  'playercdnx.workers.dev',
]

// Palavras-chave proibidas de propagandas de apostas (1xBet / 1xbt) e gravações de cinema (HDCAM / CAMRIP / TS)
export const BANNED_AD_STREAM_HINTS = [
  '1xbet',
  '1xbt',
  'xbet',
  'melbet',
  'mostbet',
  'linebet',
  'betwinner',
  'parimatch',
  '22bet',
  'megapari',
  '888starz',
  'hdcam',
  'camrip',
  'cam-rip',
  'telesync',
  'tsrip',
  'hdts',
  'telecine',
  'clean.cam',
  'cleancam',
]

const CAMRIP_LABEL_REGEX = /\b(1xbt|1xbet|xbet|cam|hdcam|camrip|telesync|hdts|tsrip|telecine)\b/i

export const isAdOrCamripStream = (value: string | null | undefined): boolean => {
  if (!value) return false
  const lower = value.toLowerCase()
  if (BANNED_AD_STREAM_HINTS.some((kw) => lower.includes(kw))) {
    return true
  }
  return CAMRIP_LABEL_REGEX.test(lower)
}

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

// Cache em memória de fontes resolvidas com limite LRU (50 entradas) e TTL de 15 minutos
// (evita reutilizar tokens de CDN expirados caso o usuário pause/retorne depois)
const MAX_RESOLVED_CACHE = 200
const RESOLVED_CACHE_TTL_MS = 15 * 60 * 1000
const resolvedSourcesCache = new Map<string, { data: MegaEmbedResolved; timestamp: number }>()

const getValidCachedEntry = (key: string): MegaEmbedResolved | null => {
  const entry = resolvedSourcesCache.get(key)
  if (!entry) return null
  if (Date.now() - entry.timestamp > RESOLVED_CACHE_TTL_MS) {
    resolvedSourcesCache.delete(key)
    return null
  }
  return entry.data
}

const setResolvedCache = (key: string, value: MegaEmbedResolved) => {
  if (resolvedSourcesCache.has(key)) {
    resolvedSourcesCache.delete(key)
  } else if (resolvedSourcesCache.size >= MAX_RESOLVED_CACHE) {
    const oldestKey = resolvedSourcesCache.keys().next().value
    if (oldestKey !== undefined) {
      resolvedSourcesCache.delete(oldestKey)
    }
  }
  resolvedSourcesCache.set(key, { data: value, timestamp: Date.now() })
}

// Normaliza URLs de CDN para HTTPS e remove portas obsoletas (:80)
// Normaliza URLs de CDN para HTTPS e remove portas obsoletas (:80)
// Preserva HTTP para endereços de IP numérico (que não possuem certificado SSL na porta 443)
export const formatDirectStreamUrl = (url: string | null): string | null => {
  if (!url) return null
  let clean = url.trim()
  try {
    const u = new URL(clean)
    const isIpHost = /^\d+\.\d+\.\d+\.\d+$/.test(u.hostname)
    if (isIpHost || u.hostname === 'localhost' || u.hostname === '127.0.0.1') {
      return clean
    }
  } catch {}
  if (clean.startsWith('http://')) {
    clean = clean.replace('http://', 'https://').replace(':80/', '/')
  }
  return clean
}

// Extrai chave canônica sem parâmetros de token dinâmico para deduplicar mirrors idênticos
const getCanonicalMediaKey = (url: string): string => {
  try {
    const u = new URL(url)
    if (u.pathname.includes('/includes/hls.php')) {
      return `${u.hostname}${u.pathname}?url=${u.searchParams.get('url') || ''}`
    }
    return `${u.hostname}${u.pathname}`
  } catch {
    return url
  }
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
  const targetUrl = `https://mgeb.lat/embed/${targetPath}`

  // 1. No app nativo Android (Capacitor), usa CapacitorHttp com timeout seguro de 8s
  if (Capacitor.isNativePlatform()) {
    try {
      const httpPromise = CapacitorHttp.get({
        url: targetUrl,
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        },
        connectTimeout: 8000,
        readTimeout: 8000,
      })
      const timeoutPromise = new Promise<null>((resolve) =>
        setTimeout(() => resolve(null), 8500)
      )
      const resp = await Promise.race([httpPromise, timeoutPromise])

      if (resp && resp.status >= 200 && resp.status < 300 && typeof resp.data === 'string') {
        const match = resp.data.match(/var sources\s*=\s*(\[[\s\S]*?\]);/)
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
      const tId = setTimeout(() => controller.abort(), 9000)
      const res = await fetch(url, {
        credentials: 'omit',
        referrerPolicy: 'no-referrer',
        signal: controller.signal,
      })
      clearTimeout(tId)
      if (!res.ok) continue

      const html = await res.text()
      const match = html.match(/var sources\s*=\s*(\[[\s\S]*?\]);/)
      if (!match) continue

      const parsed = JSON.parse(match[1]) as MegaEmbedSource[]
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed
      }
    } catch {}
  }

  return []
}

export const getCachedMegaEmbed = (
  tmdbId: number,
  mediaType: 'movie' | 'tv',
  season = 1,
  episode = 1,
  originalLanguage?: string
): MegaEmbedResolved | null => {
  const cacheKey = `${mediaType}-${tmdbId}-${season}-${episode}${originalLanguage ? `-${originalLanguage}` : ''}`
  return getValidCachedEntry(cacheKey) || getValidCachedEntry(`${mediaType}-${tmdbId}-${season}-${episode}`)
}

export const resolveMegaEmbed = async (
  tmdbId: number,
  mediaType: 'movie' | 'tv',
  season = 1,
  episode = 1,
  originalLanguage?: string
): Promise<MegaEmbedResolved> => {
  const cacheKey = `${mediaType}-${tmdbId}-${season}-${episode}${originalLanguage ? `-${originalLanguage}` : ''}`
  const cached = getValidCachedEntry(cacheKey)
  if (cached) {
    return cached
  }

  const resolveLogic = async (): Promise<MegaEmbedResolved> => {
    const rawSources = await fetchMegaEmbedSources(tmdbId, mediaType, season, episode)
    const candidates: DirectCandidate[] = []
    const seenCanonicalKeys = new Set<string>()

    for (let i = 0; i < rawSources.length; i++) {
      const s = rawSources[i]
      const file = s.file || ''
      if (!file || typeof file !== 'string') continue
      if (s.type === 'iframe') continue
      if (file.includes('/embed')) continue

      const cleanUrl = formatDirectStreamUrl(file)
      if (!cleanUrl) continue

      const lowerUrl = cleanUrl.toLowerCase()
      // Filtra servidores com token travado no IP do servidor backend (ex: streamtape get_video que retorna text/html e 97bf1 que retorna 404)
      if (BROKEN_IP_LOCKED_HOSTS.some((badHost) => lowerUrl.includes(badHost))) {
        continue
      }

      // Filtra estritamente qualquer vídeo ou fonte com propaganda 1xBet (1xbt) ou gravação de cinema (HDCAM / CAMRIP / TS)
      if (isAdOrCamripStream(cleanUrl) || isAdOrCamripStream(s.label)) {
        continue
      }

      // Deduplica fontes que apontam para o mesmo arquivo de mídia no mesmo CDN
      const canonicalKey = getCanonicalMediaKey(cleanUrl)
      if (seenCanonicalKeys.has(canonicalKey)) {
        continue
      }
      seenCanonicalKeys.add(canonicalKey)

      const isHls =
        s.type === 'hls' ||
        lowerUrl.includes('.m3u8') ||
        lowerUrl.includes('/hls') ||
        lowerUrl.includes('/includes/hls.php')

      const isDubbed = isPortugueseAudioCandidate(s.label, cleanUrl, originalLanguage)
      const isPtOriginal = (originalLanguage || '').toLowerCase() === 'pt'

      candidates.push({
        url: cleanUrl,
        kind: isHls ? 'hls' : 'mp4',
        label: isPtOriginal
          ? `Opção ${candidates.length + 1} (Português Original)`
          : isDubbed
          ? `Opção Dublada ${candidates.length + 1}`
          : `Opção ${candidates.length + 1}`,
        isDubbedHint: isDubbed,
      })
    }

    // Ordenação inteligente estilo YuCine:
    // 1. Fontes com áudio dublado confirmado primeiro
    // 2. Dentro das dubladas: MP4 direto ('fontedecanais' / 'gviudclrb') antes de HLS ('mgeb.space' / '123flmsfree')
    // 3. Fontes HLS multi-áudio/legendadas ('playercdnx.workers.dev') com legenda PT-BR nativa
    candidates.sort((a, b) => {
      if (a.isDubbedHint && !b.isDubbedHint) return -1
      if (!a.isDubbedHint && b.isDubbedHint) return 1
      if (a.kind === 'mp4' && b.kind === 'hls') return -1
      if (a.kind === 'hls' && b.kind === 'mp4') return 1
      return 0
    })

    const isPtOriginal = (originalLanguage || '').toLowerCase() === 'pt'
    // Renumera os rótulos na ordem final limpa (Opção 1, Opção 2...)
    candidates.forEach((c, idx) => {
      c.label = isPtOriginal
        ? `Opção ${idx + 1} (Português Original)`
        : c.isDubbedHint
        ? `Opção ${idx + 1} (Dublado)`
        : `Opção ${idx + 1}`
    })

    const dubbed =
      candidates.find((c) => c.isDubbedHint && c.kind === 'mp4') ||
      candidates.find((c) => c.isDubbedHint) ||
      (isPtOriginal ? candidates[0] : null) ||
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
      setResolvedCache(cacheKey, result)
    }

    return result
  }

  const fallbackEmpty: MegaEmbedResolved = {
    dubbedMp4: null,
    hlsProxy: null,
    candidates: [],
  }

  const timeoutPromise = new Promise<MegaEmbedResolved>((resolve) =>
    setTimeout(() => resolve(fallbackEmpty), 10000)
  )

  return Promise.race([resolveLogic(), timeoutPromise])
}

export const resolveMegaEmbedDubbedSource = async (
  tmdbId: number,
  mediaType: 'movie' | 'tv',
  season = 1,
  episode = 1,
  originalLanguage?: string
): Promise<string | null> => (await resolveMegaEmbed(tmdbId, mediaType, season, episode, originalLanguage)).dubbedMp4

// Limpa o cache de fontes resolvidas (útil para forçar nova busca após falha de iframe externo)
export const clearResolvedSourcesCache = (): void => {
  resolvedSourcesCache.clear()
}
