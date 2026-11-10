/**
 * ============================================================================
 * MOTOR DE STREAMING MOVIEBOX HD (PORTADO DE MOVIEBOX-TUI)
 * ============================================================================
 * Integração de catálogo e streams de alta definição (FHD/4K) com autenticação
 * de visitante, cabeçalhos assinados criptograficamente (HMAC-MD5), resolução
 * direta de manifestos DASH e streams MP4 com cookies CloudFront.
 *
 * Baseado no motor de providers do MovieBox-TUI (GitHub: mesamirh/MovieBox-Tui).
 */

import { Capacitor, CapacitorHttp } from '@capacitor/core'
import {
  base64ToBytes,
  bytesToBase64,
  hmacMd5,
  md5Hex,
} from '@/utils/crypto'

const HOST_POOL = [
  'https://api6.aoneroom.com',
  'https://api5.aoneroom.com',
  'https://api4.aoneroom.com',
  'https://api.inmoviebox.com',
]

export const MOVIEBOX_STREAM_REFERER = 'https://sportslive.wine'

const DEFAULT_SECRET_BYTES = new Uint8Array([
  0xef, 0xa8, 0x91, 0x97, 0x4e, 0xec, 0xd3, 0x14, 0x8d, 0xf6, 0x3a, 0xa6,
  0x11, 0x60, 0x2d, 0xef, 0xd1, 0x01, 0x25, 0x9b, 0xa5, 0x21, 0x02, 0x2c,
  0x57, 0xae, 0x05, 0x66, 0xbd, 0x8e,
])

const SIGNATURE_BODY_MAX_BYTES = 102400

export interface MovieBoxSubtitle {
  name: string
  url: string
}

export interface MovieBoxStreamRelease {
  id: string
  title: string
  directUrl: string
  resolution: number
  format: string
  codec?: string
  sizeBytes?: number
  headers: Record<string, string>
  subtitles: MovieBoxSubtitle[]
}

export interface MovieBoxCatalogSubject {
  subjectId: string
  title: string
  subjectType: number // 1: Movie, 2: Series
  releaseDate?: string
  coverUrl?: string
  duration?: string
  imdbRating?: string
  genre?: string
}

export interface MovieBoxRawSubject {
  subjectId?: string | number
  id?: string | number
  title?: string
  name?: string
  subjectType?: number
  stype?: number
  releaseDate?: string
  year?: string
  cover?: { url?: string }
  coverUrl?: string
  poster?: string
  duration?: string
  imdbRatingValue?: string
  genre?: string
}

export interface MovieBoxRawCaption {
  lanName?: string
  lan?: string
  url?: string
}

export interface MovieBoxPlayStream {
  id?: string | number
  url?: string
  signCookie?: string
  resolution?: number
  resolutions?: string
  format?: string
  codecName?: string
  size?: number | string
}

export interface MovieBoxRawResourceItem {
  resourceId?: string | number
  resourceLink?: string
  url?: string
  resolution?: number | string
  codecName?: string
  size?: number | string
}

export interface MovieBoxApiResponse {
  code?: number
  message?: string
  data?: {
    results?: Array<{ subjects?: MovieBoxRawSubject[] }>
    list?: MovieBoxRawResourceItem[]
    streams?: MovieBoxPlayStream[]
    extCaptions?: MovieBoxRawCaption[]
    displayResolutions?: string
    [key: string]: unknown
  }
  results?: Array<{ subjects?: MovieBoxRawSubject[] }>
  list?: MovieBoxRawResourceItem[]
  [key: string]: unknown
}

// ============================================================================
// ASSINATURA E GERAÇÃO DE CABEÇALHOS (PADRÃO MOVIEBOX-TUI)
// ============================================================================

export function generateXClientToken(ts: number): string {
  const tsStr = ts.toString()
  const reversed = tsStr.split('').reverse().join('')
  const hash = md5Hex(reversed)
  return `${tsStr},${hash}`
}

export function buildCanonicalString(
  method: string,
  accept: string,
  contentType: string,
  urlStr: string,
  body: string | null,
  timestampMs: number
): string {
  let canonicalUrl = urlStr
  try {
    const parsed = new URL(urlStr)
    const path = parsed.pathname
    const searchEntries = Array.from(parsed.searchParams.entries()).sort(
      (a, b) => a[0].localeCompare(b[0])
    )
    const query = searchEntries.map(([k, v]) => `${k}=${v}`).join('&')
    canonicalUrl = query ? `${path}?${query}` : path
  } catch {
    canonicalUrl = urlStr
  }

  let bodyHash = ''
  let bodyLen = ''
  if (body) {
    const enc = new TextEncoder().encode(body)
    bodyLen = enc.length.toString()
    const truncated =
      enc.length > SIGNATURE_BODY_MAX_BYTES
        ? enc.subarray(0, SIGNATURE_BODY_MAX_BYTES)
        : enc
    bodyHash = md5Hex(truncated)
  }

  return [
    method.toUpperCase(),
    accept || '',
    contentType || '',
    bodyLen,
    timestampMs.toString(),
    bodyHash,
    canonicalUrl,
  ].join('\n')
}

export function generateXTrSignature(
  method: string,
  accept: string,
  contentType: string,
  urlStr: string,
  body: string | null,
  timestampMs: number
): string {
  const canonical = buildCanonicalString(
    method,
    accept,
    contentType,
    urlStr,
    body,
    timestampMs
  )
  const canonicalBytes = new TextEncoder().encode(canonical)
  const signatureBytes = hmacMd5(DEFAULT_SECRET_BYTES, canonicalBytes)
  const sigB64 = bytesToBase64(signatureBytes)
  return `${timestampMs}|2|${sigB64}`
}

export function getRandomSpoofedIp(): string {
  const prefixes = [
    '103.241',
    '49.36',
    '117.195',
    '106.198',
    '122.162',
    '157.32',
    '182.70',
    '103.58',
    '27.60',
    '59.90',
  ]
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)]
  const c = Math.floor(Math.random() * 253) + 1
  const d = Math.floor(Math.random() * 253) + 1
  return `${prefix}.${c}.${d}`
}

const DEFAULT_USER_AGENT =
  'com.community.oneroom/50020119 (Linux; U; Android 12; Redmi; Build/S1B.220414.015; Cronet/135.0.7012.3)'

const DEFAULT_CLIENT_INFO = JSON.stringify({
  package_name: 'com.community.oneroom',
  version_name: '4.0.01.0813.03',
  version_code: 50020119,
  os: 'android',
  os_version: '12',
  install_ch: 'ps',
  device_id: 'a1b2c3d4e5f60718293a4b5c6d7e8f90',
  install_store: 'ps',
  gaid: '12345678-1234-1234-1234-123456789abc',
  brand: 'Redmi',
  model: '2201117TY',
  system_language: 'pt',
  net: 'NETWORK_WIFI',
  region: 'BR',
  timezone: 'America/Sao_Paulo',
  sp_code: '40401',
  'X-Play-Mode': '2',
})

// ============================================================================
// CLIENTE HTTP RESILIENTE DO MOVIEBOX COM GESTÃO DE SESSÃO
// ============================================================================

let cachedSessionToken: string | null = null
let sessionTokenExpiry = 0

async function ensureMovieBoxSession(): Promise<string> {
  if (cachedSessionToken && Date.now() < sessionTokenExpiry) {
    return cachedSessionToken
  }

  const storedToken =
    typeof localStorage !== 'undefined'
      ? localStorage.getItem('moviebox_session_token')
      : null
  const storedExp =
    typeof localStorage !== 'undefined'
      ? Number(localStorage.getItem('moviebox_session_exp') || 0)
      : 0

  if (storedToken && Date.now() < storedExp) {
    cachedSessionToken = storedToken
    sessionTokenExpiry = storedExp
    return storedToken
  }

  const path = '/wefeed-mobile-bff/user-api/visitor-login'
  const response = await executeRawRequest('POST', path, '{}', null)
  const token = response?.data?.token || response?.token

  if (!token || typeof token !== 'string') {
    throw new Error('MovieBox: falha ao adquirir token de sessão visitante')
  }

  cachedSessionToken = token
  sessionTokenExpiry = Date.now() + 3600 * 1000 // 1 hora de validade

  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem('moviebox_session_token', token)
      localStorage.setItem(
        'moviebox_session_exp',
        sessionTokenExpiry.toString()
      )
    } catch {
      // Ignora erro de storage se indisponível
    }
  }

  return token
}

async function executeRawRequest(
  method: string,
  pathAndQuery: string,
  body: string | null,
  authToken: string | null
): Promise<MovieBoxApiResponse> {
  const ts = Date.now()
  const accept = 'application/json'
  const contentType = 'application/json'
  const spoofedIp = getRandomSpoofedIp()
  const clientToken = generateXClientToken(ts)

  let lastError: Error | null = null

  for (let i = 0; i < HOST_POOL.length; i++) {
    const host = HOST_POOL[i]
    const url = `${host}${pathAndQuery}`
    const signature = generateXTrSignature(
      method,
      accept,
      contentType,
      url,
      body,
      ts
    )

    const headers: Record<string, string> = {
      'User-Agent': DEFAULT_USER_AGENT,
      'Accept': accept,
      'Content-Type': contentType,
      'Connection': 'keep-alive',
      'x-client-token': clientToken,
      'x-tr-signature': signature,
      'x-client-info': DEFAULT_CLIENT_INFO,
      'x-client-status': '0',
      'x-forwarded-for': spoofedIp,
    }

    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`
    }

    try {
      if (Capacitor.isNativePlatform()) {
        const nativeResp = await CapacitorHttp.request({
          url,
          method,
          headers,
          data: body ? JSON.parse(body) : undefined,
          connectTimeout: 9000,
          readTimeout: 9000,
        })

        if (nativeResp.status >= 200 && nativeResp.status < 300) {
          const raw = nativeResp.data
          return typeof raw === 'string' ? JSON.parse(raw) : raw
        }
      } else {
        const fetchResp = await fetch(url, {
          method,
          headers,
          body: body || undefined,
        })

        if (fetchResp.ok) {
          return await fetchResp.json()
        }
      }
    } catch (err: unknown) {
      lastError = err instanceof Error ? err : new Error(String(err))
      continue
    }
  }

  throw lastError || new Error('MovieBox: todos os servidores estão inacessíveis')
}

export async function requestMovieBox(
  method: string,
  pathAndQuery: string,
  body: unknown = null
): Promise<MovieBoxApiResponse> {
  const token = await ensureMovieBoxSession()
  const bodyStr = body ? JSON.stringify(body) : null

  try {
    return await executeRawRequest(method, pathAndQuery, bodyStr, token)
  } catch {
    // Se o token expirou (401/403), invalida e tenta uma vez mais com token fresco
    cachedSessionToken = null
    const freshToken = await ensureMovieBoxSession()
    return await executeRawRequest(method, pathAndQuery, bodyStr, freshToken)
  }
}

// ============================================================================
// DETECÇÃO DE MANIFESTOS DASH, STREAM DIRECTO E FILTRO ANTI-PLACEHOLDER
// ============================================================================

export function isDeprecationNoticeUrl(url: string): boolean {
  if (!url) return true
  const lower = url.toLowerCase()
  return (
    lower.includes('1c7de0bd3393702d9191801f15f88f8d') ||
    lower.includes('9a0461bc39da389663bf3dbb17091d3f') ||
    lower.includes('b164fbfb4347792950bdfbfb563d39d9') ||
    lower.includes('/notice.mp4') ||
    (lower.includes('macdn.aoneroom.com') && lower.includes('/other/'))
  )
}

function toDashMpd(urlStr: string): string | null {
  const base = urlStr.replace(/[*/]+$/, '')
  if (
    base &&
    (base.startsWith('http://') || base.startsWith('https://')) &&
    base.includes('/dash/')
  ) {
    return `${base}/index.mpd`
  }
  return null
}

export function resolveDashManifestFromPolicy(signCookie: string): string | null {
  if (!signCookie) return null

  for (const part of signCookie.split(';')) {
    const trimmed = part.trim()

    // 1. Caso urlprefix=
    if (trimmed.includes('urlprefix=')) {
      const prefixPart = trimmed.slice(trimmed.indexOf('urlprefix=') + 10)
      const b64Token = (prefixPart.split(':')[0] || prefixPart).trim()
      try {
        const decodedBytes = base64ToBytes(b64Token)
        const urlStr = new TextDecoder().decode(decodedBytes)
        const mpd = toDashMpd(urlStr)
        if (mpd) return mpd
      } catch {
        // Ignora erro de base64 malformado
      }
    }

    // 2. Caso CloudFront-Policy=
    if (trimmed.startsWith('CloudFront-Policy=')) {
      const policyRaw = trimmed.replace('CloudFront-Policy=', '').trim()
      try {
        const decodedBytes = base64ToBytes(policyRaw)
        const jsonStr = new TextDecoder().decode(decodedBytes)
        const json = JSON.parse(jsonStr)
        const resource = json?.Statement?.[0]?.Resource
        if (typeof resource === 'string') {
          const mpd = toDashMpd(resource)
          if (mpd) return mpd
        }
      } catch {
        // Ignora erro de decode
      }
    }
  }

  return null
}

// ============================================================================
// BUSCA E METADADOS DO MOVIEBOX
// ============================================================================

export async function searchMovieBox(
  query: string,
  page = 1
): Promise<MovieBoxCatalogSubject[]> {
  const payload = {
    keyword: query,
    page,
    perPage: 15,
    subjectType: 0,
  }

  const res = await requestMovieBox(
    'POST',
    '/wefeed-mobile-bff/subject-api/search/v2',
    payload
  )

  const results = res?.data?.results || res?.results || []
  const list = (results[0]?.subjects || res?.data?.list || []) as MovieBoxRawSubject[]

  return list.map((item: MovieBoxRawSubject) => ({
    subjectId: String(item.subjectId || item.id || ''),
    title: String(item.title || item.name || 'Sem título'),
    subjectType: Number(item.subjectType || item.stype || 1),
    releaseDate: item.releaseDate || item.year,
    coverUrl: item.cover?.url || item.coverUrl || item.poster,
    duration: item.duration,
    imdbRating: item.imdbRatingValue,
    genre: item.genre,
  }))
}

export async function getMovieBoxDetails(subjectId: string): Promise<MovieBoxApiResponse> {
  return await requestMovieBox(
    'GET',
    `/wefeed-mobile-bff/subject-api/get?subjectId=${subjectId}`
  )
}

export async function getMovieBoxPlayInfo(
  subjectId: string,
  season = 0,
  episode = 0
): Promise<MovieBoxApiResponse> {
  const path =
    season === 0 && episode === 0
      ? `/wefeed-mobile-bff/subject-api/play-info/v2?subjectId=${subjectId}`
      : `/wefeed-mobile-bff/subject-api/play-info/v2?subjectId=${subjectId}&se=${season}&ep=${episode}`
  return await requestMovieBox('GET', path)
}

export async function getMovieBoxResources(
  subjectId: string,
  season = 0,
  episode = 0,
  page = 1,
  perPage = 20
): Promise<MovieBoxApiResponse> {
  const path =
    season === 0 && episode === 0
      ? `/wefeed-mobile-bff/subject-api/resource?subjectId=${subjectId}&page=${page}&perPage=${perPage}`
      : `/wefeed-mobile-bff/subject-api/resource?subjectId=${subjectId}&se=${season}&ep=${episode}&page=${page}&perPage=${perPage}`
  return await requestMovieBox('GET', path)
}

// ============================================================================
// RESOLVEDOR DE TRANSMISSÃO MOVIEBOX
// ============================================================================

export async function resolveMovieBoxStream(
  title: string,
  _year?: number,
  season?: number,
  episode?: number
): Promise<MovieBoxStreamRelease | null> {
  try {
    // 1. Busca por título no catálogo
    const cleanTitle = title
      .replace(/[:-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
    const subjects = await searchMovieBox(cleanTitle, 1)

    if (!subjects || subjects.length === 0) {
      return null
    }

    // Localiza o assunto mais aproximado (preferindo filme vs série conforme temporada)
    const isSeries = Boolean(season && season > 0)
    const matchedSubject =
      subjects.find((s) => (isSeries ? s.subjectType === 2 : s.subjectType === 1)) ||
      subjects[0]

    const subjectId = matchedSubject.subjectId
    const se = season || 0
    const ep = episode || 0

    // 2. Consulta play-info e resources em paralelo
    const [playInfoRes, resourcesRes] = await Promise.allSettled([
      getMovieBoxPlayInfo(subjectId, se, ep),
      getMovieBoxResources(subjectId, se, ep),
    ])

    const releases: MovieBoxStreamRelease[] = []

    // 2.1 Processa play-info
    if (playInfoRes.status === 'fulfilled' && playInfoRes.value) {
      const data = playInfoRes.value.data || playInfoRes.value
      const streams = (Array.isArray(data?.streams) ? data.streams : []) as MovieBoxPlayStream[]
      const extCaptions = (Array.isArray(data?.extCaptions) ? data.extCaptions : []) as MovieBoxRawCaption[]

      const subtitles: MovieBoxSubtitle[] = extCaptions
        .filter((c: MovieBoxRawCaption) => c.url && !c.url.includes('aa348f2541d13ffe'))
        .map((c: MovieBoxRawCaption) => ({
          name: c.lanName || c.lan || 'Legenda',
          url: c.url || '',
        }))

      for (const stream of streams) {
        const rawUrl = stream.url || ''
        const signCookie = stream.signCookie || ''
        const manifestUrl =
          resolveDashManifestFromPolicy(signCookie) ||
          (!isDeprecationNoticeUrl(rawUrl) && rawUrl.startsWith('http')
            ? rawUrl
            : null)

        if (!manifestUrl) continue

        const headers: Record<string, string> = {
          'Referer': MOVIEBOX_STREAM_REFERER,
          'User-Agent': DEFAULT_USER_AGENT,
        }
        if (signCookie) {
          headers['Cookie'] = signCookie
        }

        const resStr = String(stream.resolutions || (data as Record<string, unknown>)?.displayResolutions || '1080')
        const resolution = Number.parseInt(resStr) || 1080

        releases.push({
          id: String(stream.id || Math.random().toString(36).slice(2)),
          title: `${matchedSubject.title} (${resolution}p)`,
          directUrl: manifestUrl,
          resolution,
          format: stream.format || 'MP4',
          codec: stream.codecName,
          sizeBytes: stream.size ? Number(stream.size) : undefined,
          headers,
          subtitles,
        })
      }
    }

    // 2.2 Processa direct resources caso play-info não tenha links diretos
    if (resourcesRes.status === 'fulfilled' && resourcesRes.value) {
      const rawList = resourcesRes.value?.data?.list || resourcesRes.value?.list
      const list = (Array.isArray(rawList) ? rawList : []) as MovieBoxRawResourceItem[]
      for (const item of list) {
        const link = item.resourceLink || item.url
        if (!link || isDeprecationNoticeUrl(link)) continue

        releases.push({
          id: String(item.resourceId || Math.random().toString(36).slice(2)),
          title: `${matchedSubject.title} (${item.resolution || 1080}p)`,
          directUrl: link,
          resolution: Number(item.resolution) || 1080,
          format: 'MP4',
          codec: item.codecName,
          sizeBytes: item.size ? Number(item.size) : undefined,
          headers: {
            'User-Agent': DEFAULT_USER_AGENT,
            'Referer': MOVIEBOX_STREAM_REFERER,
          },
          subtitles: [],
        })
      }
    }

    if (releases.length === 0) return null

    // Ordena do maior para menor resolução
    releases.sort((a, b) => b.resolution - a.resolution)
    return releases[0]
  } catch (error) {
    console.warn('[MovieBox] Falha ao resolver stream:', error)
    return null
  }
}
