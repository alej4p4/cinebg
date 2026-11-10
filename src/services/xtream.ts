import { Capacitor, CapacitorHttp } from '@capacitor/core'

/**
 * ============================================================================
 * MOTOR DE STREAMING XTREAM CODES (IPTV & VOD DEDICADO DE ALTA PERFORMANCE)
 * ============================================================================
 * Permite que o CineBG conecte-se a qualquer servidor comercial Xtream Codes /
 * Painel IPTV / VOD privado.
 *
 * Oferece:
 * 1. Resolução direta de filmes e séries com áudio nativo em português (FHD/4K).
 * 2. Disponibilidade 24/7 sem dependência de scrapers web gratuitos.
 * 3. Mapeamento de canais de TV ao vivo diretamente da grade do servidor.
 * 4. Suporte a CapacitorHttp nativo para Android TV / TV Box e Web fetch.
 */

export interface XtreamAccountInfo {
  username: string
  status: string
  expDate?: string | number | null
  maxConnections?: number | string
  activeCons?: number | string
  serverName?: string
  serverProtocol?: string
  serverPort?: string
}

export interface XtreamConfig {
  serverUrl: string
  username: string
  password: string
  enabled: boolean
  syncLiveChannels?: boolean
  accountInfo?: XtreamAccountInfo | null
  lastChecked?: number
}

export interface XtreamVodStream {
  num?: number
  name: string
  stream_type?: string
  stream_id: number | string
  stream_icon?: string
  rating?: string
  rating_5based?: number
  added?: string
  category_id?: string
  container_extension?: string
  custom_sid?: string
  direct_source?: string
}

export interface XtreamSeriesItem {
  num?: number
  name: string
  series_id: number | string
  cover?: string
  plot?: string
  cast?: string
  director?: string
  genre?: string
  releaseDate?: string
  rating?: string
  category_id?: string
}

export interface XtreamSeriesEpisode {
  id: string | number
  episode_num: number | string
  title?: string
  container_extension?: string
  info?: Record<string, unknown>
}

export interface XtreamSeriesInfo {
  seasons?: Array<{
    air_date?: string
    episode_count?: number
    id?: number
    name?: string
    overview?: string
    season_number: number
    cover?: string
  }>
  episodes?: Record<string, XtreamSeriesEpisode[]>
}

export interface XtreamResolvedStream {
  url: string
  kind: 'mp4' | 'hls'
  label: string
  isDubbedHint: boolean
}

export interface XtreamLiveStream {
  num?: number
  name: string
  stream_type?: string
  stream_id: number | string
  stream_icon?: string
  epg_channel_id?: string
  added?: string
  category_id?: string
  custom_sid?: string
  tv_archive?: number
  direct_source?: string
  tv_archive_duration?: number
}

export interface XtreamLiveChannelMapped {
  id: string
  name: string
  streamUrl: string
  logo: string
  category: string
}

// Configuração padrão de fábrica (servidor de alta performance pré-conectado)
export const DEFAULT_XTREAM_CONFIG: XtreamConfig = {
  serverUrl: 'http://drd33.com',
  username: '53993977',
  password: '47333',
  enabled: true,
  syncLiveChannels: true,
}

const STORAGE_KEY = 'cinebg_xtream_config'
const VOD_CACHE_KEY = 'cinebg_xtream_vod_cache'
const SERIES_CACHE_KEY = 'cinebg_xtream_series_cache'
const CACHE_TTL_MS = 30 * 60 * 1000 // 30 minutos

// Cache em memória para evitar limites de QuotaExceededError do sessionStorage (catálogo de 44k filmes)
let inMemoryVodList: XtreamVodStream[] | null = null
let inMemorySeriesList: XtreamSeriesItem[] | null = null
let inMemoryLiveList: XtreamLiveChannelMapped[] | null = null
let vodFetchPromise: Promise<XtreamVodStream[] | null> | null = null
let seriesFetchPromise: Promise<XtreamSeriesItem[] | null> | null = null
let liveFetchPromise: Promise<XtreamLiveChannelMapped[] | null> | null = null
let vodCacheTime = 0
let seriesCacheTime = 0
let liveCacheTime = 0

// Normaliza URLs de servidor (adiciona http:// se omitido e remove barra final)
export const normalizeServerUrl = (raw: string): string => {
  let clean = raw.trim()
  if (!clean) return ''
  if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
    clean = `http://${clean}`
  }
  return clean.replace(/\/+$/, '')
}

// Limpa strings para busca difusa (remove acentos, pontuação e artigos)
export const sanitizeTitleForSearch = (str: string): string => {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// Recupera a configuração ativa do Xtream Codes
export const getXtreamConfig = (): XtreamConfig | null => {
  if (typeof localStorage !== 'undefined') {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as XtreamConfig
        if (parsed && parsed.serverUrl && parsed.username && parsed.password) {
          return parsed
        }
      }
    } catch {}
  }

  // Fallback para variáveis de ambiente VITE (se pré-configuradas na build para distribuição)
  const envServer = typeof import.meta !== 'undefined' && import.meta.env?.VITE_XTREAM_SERVER
  const envUser = typeof import.meta !== 'undefined' && import.meta.env?.VITE_XTREAM_USER
  const envPass = typeof import.meta !== 'undefined' && import.meta.env?.VITE_XTREAM_PASS

  if (envServer && envUser && envPass) {
    return {
      serverUrl: normalizeServerUrl(envServer),
      username: envUser,
      password: envPass,
      enabled: true,
      syncLiveChannels: true,
    }
  }

  // Retorna a configuração padrão de fábrica integrada
  return DEFAULT_XTREAM_CONFIG
}

// Salva ou remove a configuração do Xtream Codes
export const saveXtreamConfig = (config: XtreamConfig | null): void => {
  inMemoryVodList = null
  inMemorySeriesList = null
  inMemoryLiveList = null
  if (typeof localStorage === 'undefined') return
  if (!config) {
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(VOD_CACHE_KEY)
    localStorage.removeItem(SERIES_CACHE_KEY)
    return
  }
  config.serverUrl = normalizeServerUrl(config.serverUrl)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
}

// Verifica se há um servidor Xtream Codes configurado e ativo
export const isXtreamActive = (): boolean => {
  const config = getXtreamConfig()
  return !!(config && config.enabled && config.serverUrl && config.username && config.password)
}

// Utilitário de requisição HTTP compatível com Capacitor Android e Navegadores Web
async function xtreamFetchJson<T>(url: string, timeoutMs = 15000): Promise<T | null> {
  if (Capacitor.isNativePlatform()) {
    try {
      const httpPromise = CapacitorHttp.get({
        url,
        headers: {
          'Accept': 'application/json, text/plain, */*',
          'User-Agent': 'IPTVSmarters/3.0.0 (Linux; Android 12)',
        },
        connectTimeout: timeoutMs,
        readTimeout: timeoutMs,
      })
      const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), timeoutMs))
      const resp = await Promise.race([httpPromise, timeoutPromise])

      if (resp && resp.status >= 200 && resp.status < 300) {
        if (typeof resp.data === 'string') {
          return JSON.parse(resp.data) as T
        }
        return resp.data as T
      }
      return null
    } catch {
      return null
    }
  }

  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'Accept': 'application/json, text/plain, */*' },
    })
    clearTimeout(timer)
    if (!res.ok) return null
    return (await res.json()) as T
  } catch {
    return null
  }
}

// Testa a conexão com o servidor Xtream Codes e recupera dados da conta
export const testXtreamConnection = async (
  rawServerUrl: string,
  rawUsername: string,
  rawPassword: string
): Promise<{ success: boolean; account?: XtreamAccountInfo; error?: string }> => {
  const serverUrl = normalizeServerUrl(rawServerUrl)
  const username = rawUsername.trim()
  const password = rawPassword.trim()

  if (!serverUrl || !username || !password) {
    return { success: false, error: 'Preencha o servidor, usuário e senha.' }
  }

  const endpoint = `${serverUrl}/player_api.php?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`

  try {
    const data = await xtreamFetchJson<{
      user_info?: {
        username?: string
        status?: string
        exp_date?: string | number
        max_connections?: number | string
        active_cons?: number | string
        auth?: number
      }
      server_info?: {
        server_name?: string
        server_protocol?: string
        port?: string
      }
    }>(endpoint, 12000)

    if (!data || !data.user_info) {
      return { success: false, error: 'Servidor inacessível ou credenciais inválidas.' }
    }

    const u = data.user_info
    if (u.status !== 'Active') {
      return {
        success: false,
        error: `Conta com status: ${u.status || 'Inativa/Expirada'}.`,
      }
    }

    const account: XtreamAccountInfo = {
      username: u.username || username,
      status: u.status || 'Active',
      expDate: u.exp_date ? (typeof u.exp_date === 'string' ? u.exp_date : new Date(Number(u.exp_date) * 1000).toLocaleDateString('pt-BR')) : null,
      maxConnections: u.max_connections || '1',
      activeCons: u.active_cons || '0',
      serverName: data.server_info?.server_name || 'Servidor Xtream Codes',
      serverProtocol: data.server_info?.server_protocol || 'http',
      serverPort: data.server_info?.port || '',
    }

    return { success: true, account }
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Falha na conexão com o servidor Xtream Codes.',
    }
  }
}

// Constrói a URL direta de reprodução para filme, série ou canal ao vivo
export const buildXtreamStreamUrl = (
  config: XtreamConfig,
  type: 'movie' | 'series' | 'live',
  streamId: number | string,
  containerExtension = 'mp4'
): string => {
  const base = normalizeServerUrl(config.serverUrl)
  const user = encodeURIComponent(config.username)
  const pass = encodeURIComponent(config.password)
  const ext = containerExtension.replace(/^\.+/, '')

  if (type === 'live') {
    // Servidores XUI específicos (como drd33) utilizam o formato direto sem o prefixo /live/
    if (base.includes('drd33.com') || base.includes('pjrplay.xyz')) {
      return `${base}/${user}/${pass}/${streamId}.m3u8`
    }
    return `${base}/live/${user}/${pass}/${streamId}.m3u8`
  }
  if (type === 'movie') {
    return `${base}/movie/${user}/${pass}/${streamId}.${ext || 'mp4'}`
  }
  return `${base}/series/${user}/${pass}/${streamId}.${ext || 'mp4'}`
}

// Busca filme VOD no catálogo do servidor Xtream Codes
export const searchXtreamVod = async (
  title: string,
  _year?: number
): Promise<XtreamResolvedStream | null> => {
  const config = getXtreamConfig()
  if (!config || !config.enabled) return null

  const targetTitle = sanitizeTitleForSearch(title)
  if (!targetTitle) return null

  // Tenta carregar catálogo VOD em memória
  if (inMemoryVodList && Date.now() - vodCacheTime > CACHE_TTL_MS) {
    inMemoryVodList = null
  }
  if (!inMemoryVodList) {
    if (!vodFetchPromise) {
      const endpoint = `${config.serverUrl}/player_api.php?username=${encodeURIComponent(config.username)}&password=${encodeURIComponent(config.password)}&action=get_vod_streams`
      vodFetchPromise = xtreamFetchJson<XtreamVodStream[]>(endpoint, 20000).then((res) => {
        if (res && Array.isArray(res)) {
          inMemoryVodList = res
          vodCacheTime = Date.now()
        }
        vodFetchPromise = null
        return inMemoryVodList
      })
    }
    await vodFetchPromise
  }

  const vodList = inMemoryVodList
  if (!vodList || !Array.isArray(vodList) || vodList.length === 0) return null

  // Localiza o filme por correspondência inteligente:
  // 1. Prioriza versões DUBLADAS em português brasileiro (sem indicador [L] ou [LEG])
  // 2. Se não houver dublada, aceita versão legendada [L]
  const matched =
    vodList.find((v) => {
      const isLegendado = v.name.includes('[L]') || v.name.includes('[LEG]')
      if (isLegendado) return false
      const cleanName = sanitizeTitleForSearch(v.name)
      return cleanName === targetTitle || cleanName.includes(targetTitle) || targetTitle.includes(cleanName)
    }) ||
    vodList.find((v) => {
      const cleanName = sanitizeTitleForSearch(v.name)
      return cleanName === targetTitle || cleanName.includes(targetTitle) || targetTitle.includes(cleanName)
    })

  if (!matched) return null

  const ext = matched.container_extension || 'mp4'
  const streamUrl = buildXtreamStreamUrl(config, 'movie', matched.stream_id, ext)

  return {
    url: streamUrl,
    kind: ext === 'm3u8' ? 'hls' : 'mp4',
    label: `Opção 1 (Servidor VOD: ${matched.name.slice(0, 30)})`,
    isDubbedHint: !matched.name.includes('[L]') && !matched.name.includes('[LEG]'),
  }
}

// Busca episódio de série no catálogo do servidor Xtream Codes
export const searchXtreamSeriesEpisode = async (
  title: string,
  season: number,
  episode: number
): Promise<XtreamResolvedStream | null> => {
  const config = getXtreamConfig()
  if (!config || !config.enabled) return null

  const targetTitle = sanitizeTitleForSearch(title)
  if (!targetTitle) return null

  if (inMemorySeriesList && Date.now() - seriesCacheTime > CACHE_TTL_MS) {
    inMemorySeriesList = null
  }
  if (!inMemorySeriesList) {
    if (!seriesFetchPromise) {
      const endpoint = `${config.serverUrl}/player_api.php?username=${encodeURIComponent(config.username)}&password=${encodeURIComponent(config.password)}&action=get_series`
      seriesFetchPromise = xtreamFetchJson<XtreamSeriesItem[]>(endpoint, 20000).then((res) => {
        if (res && Array.isArray(res)) {
          inMemorySeriesList = res
          seriesCacheTime = Date.now()
        }
        seriesFetchPromise = null
        return inMemorySeriesList
      })
    }
    await seriesFetchPromise
  }

  const seriesList = inMemorySeriesList
  if (!seriesList || !Array.isArray(seriesList) || seriesList.length === 0) return null

  // Prioriza série com áudio dublado nativo em PT-BR (sem sufixo [L])
  const matchedSeries =
    seriesList.find((s) => {
      const isLegendado = s.name.includes('[L]') || s.name.includes('[LEG]')
      if (isLegendado) return false
      const cleanName = sanitizeTitleForSearch(s.name)
      return cleanName === targetTitle || cleanName.includes(targetTitle) || targetTitle.includes(cleanName)
    }) ||
    seriesList.find((s) => {
      const cleanName = sanitizeTitleForSearch(s.name)
      return cleanName === targetTitle || cleanName.includes(targetTitle) || targetTitle.includes(cleanName)
    })

  if (!matchedSeries) return null

  // Busca episódios da série
  const infoEndpoint = `${config.serverUrl}/player_api.php?username=${encodeURIComponent(config.username)}&password=${encodeURIComponent(config.password)}&action=get_series_info&series_id=${matchedSeries.series_id}`
  const seriesInfo = await xtreamFetchJson<XtreamSeriesInfo>(infoEndpoint, 15000)

  if (!seriesInfo || !seriesInfo.episodes) return null

  // Encontra o episódio correspondente à temporada solicitada
  const seasonKey = String(season)
  const episodesList = seriesInfo.episodes[seasonKey] || seriesInfo.episodes[String(season).padStart(2, '0')]
  if (!episodesList || !Array.isArray(episodesList)) return null

  const targetEpisode = episodesList.find(
    (e) => Number(e.episode_num) === episode
  )

  if (!targetEpisode) return null

  const ext = targetEpisode.container_extension || 'mp4'
  const streamUrl = buildXtreamStreamUrl(config, 'series', targetEpisode.id, ext)

  return {
    url: streamUrl,
    kind: ext === 'm3u8' ? 'hls' : 'mp4',
    label: `Opção 1 (Servidor VOD Séries: T${season}:E${episode})`,
    isDubbedHint: !matchedSeries.name.includes('[L]') && !matchedSeries.name.includes('[LEG]'),
  }
}

// Resolvedor unificado para filmes e séries a partir do servidor Xtream Codes
export const resolveXtreamMedia = async (
  title: string,
  mediaType: 'movie' | 'tv' | 'anime',
  season = 1,
  episode = 1,
  year?: number
): Promise<XtreamResolvedStream | null> => {
  if (!isXtreamActive()) return null
  try {
    if (mediaType === 'movie') {
      return await searchXtreamVod(title, year)
    }
    return await searchXtreamSeriesEpisode(title, season, episode)
  } catch (err) {
    console.warn('[Xtream] Falha ao resolver mídia no servidor dedicado:', err)
    return null
  }
}

// Carrega os canais ao vivo fornecidos pelo servidor Xtream Codes
export const fetchXtreamLiveChannels = async (): Promise<XtreamLiveChannelMapped[]> => {
  if (inMemoryLiveList && Date.now() - liveCacheTime > CACHE_TTL_MS) {
    inMemoryLiveList = null
  }
  if (inMemoryLiveList) return inMemoryLiveList
  const config = getXtreamConfig()
  if (!config || !config.enabled || config.syncLiveChannels === false) return []

  if (!liveFetchPromise) {
    const endpoint = `${config.serverUrl}/player_api.php?username=${encodeURIComponent(config.username)}&password=${encodeURIComponent(config.password)}&action=get_live_streams`
    liveFetchPromise = xtreamFetchJson<XtreamLiveStream[]>(endpoint, 15000).then((rawStreams) => {
      liveFetchPromise = null
      if (!rawStreams || !Array.isArray(rawStreams)) return []
      liveCacheTime = Date.now()
      inMemoryLiveList = rawStreams.slice(0, 500).map((s) => ({
        id: `xtream-${s.stream_id}`,
        name: s.name,
        streamUrl: buildXtreamStreamUrl(config, 'live', s.stream_id, 'm3u8'),
        logo: s.stream_icon || 'https://i.imgur.com/tc1ALuu.png',
        category: 'Servidor IPTV Dedicado',
      }))
      return inMemoryLiveList
    })
  }

  const res = await liveFetchPromise
  return res || []
}
