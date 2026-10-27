/**
 * ============================================================================
 * CINEBG UNIFIED OBSERVABILITY & TELEMETRY ENGINE
 * Providers: Sentry | Datadog RUM & Logs | New Relic | OpenTelemetry (OTLP)
 * ============================================================================
 */

import { isTVDevice, isMobileDevice, getNativeAppVersion } from '@/utils/tv'

export interface TelemetrySpan {
  traceId: string
  spanId: string
  parentSpanId?: string
  name: string
  startTimeUnixNano: number
  endTimeUnixNano?: number
  attributes: Record<string, string | number | boolean>
  status: 'OK' | 'ERROR' | 'UNSET'
}

export interface ObservabilityConfig {
  sentryDsn?: string
  datadogClientToken?: string
  datadogAppId?: string
  datadogSite?: string
  newRelicLicenseKey?: string
  newRelicAccountId?: string
  otelEndpoint?: string
  environment: string
  release: string
}

export interface Breadcrumb {
  category: string
  message: string
  level: 'info' | 'warning' | 'error'
  timestamp: number
  data?: Record<string, unknown>
}

const MAX_BREADCRUMBS = 50
const breadcrumbs: Breadcrumb[] = []
const activeSpans = new Map<string, TelemetrySpan>()
let isInitialized = false
let sessionTraceId = ''

function randomHex(length: number): string {
  const bytes = new Uint8Array(Math.ceil(length / 2))
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes)
  } else {
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = Math.floor(Math.random() * 256)
    }
  }
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, length)
}

export function getObservabilityConfig(): ObservabilityConfig {
  const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env || {}
  return {
    sentryDsn: env.VITE_SENTRY_DSN,
    datadogClientToken: env.VITE_DATADOG_CLIENT_TOKEN,
    datadogAppId: env.VITE_DATADOG_APPLICATION_ID,
    datadogSite: env.VITE_DATADOG_SITE || 'datadoghq.com',
    newRelicLicenseKey: env.VITE_NEW_RELIC_LICENSE_KEY,
    newRelicAccountId: env.VITE_NEW_RELIC_ACCOUNT_ID,
    otelEndpoint: env.VITE_OTEL_EXPORTER_OTLP_ENDPOINT,
    environment: env.MODE || 'production',
    release: env.VITE_APP_VERSION || getNativeAppVersion(),
  }
}

export function getDeviceContext(): Record<string, string | boolean> {
  return {
    platform: isTVDevice() ? 'smart-tv' : isMobileDevice() ? 'mobile' : 'desktop',
    isTV: isTVDevice(),
    isMobile: isMobileDevice(),
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
    language: typeof navigator !== 'undefined' ? navigator.language : 'pt-BR',
  }
}

/**
 * 1. OpenTelemetry (OTLP) — W3C Trace Context & Span Instrumentation
 */
export function createTraceparentHeader(traceId = sessionTraceId || randomHex(32), spanId = randomHex(16)): string {
  return `00-${traceId}-${spanId}-01`
}

export function startSpan(
  name: string,
  attributes: Record<string, string | number | boolean> = {}
): TelemetrySpan {
  if (!sessionTraceId) {
    sessionTraceId = randomHex(32)
  }
  const span: TelemetrySpan = {
    traceId: sessionTraceId,
    spanId: randomHex(16),
    name,
    startTimeUnixNano: Date.now() * 1_000_000,
    attributes: {
      ...getDeviceContext(),
      ...attributes,
    },
    status: 'UNSET',
  }
  activeSpans.set(span.spanId, span)
  return span
}

export function endSpan(span: TelemetrySpan, status: 'OK' | 'ERROR' = 'OK'): TelemetrySpan {
  span.endTimeUnixNano = Date.now() * 1_000_000
  span.status = status
  activeSpans.delete(span.spanId)

  const config = getObservabilityConfig()
  if (config.otelEndpoint && typeof fetch !== 'undefined') {
    const payload = {
      resourceSpans: [
        {
          resource: {
            attributes: [
              { key: 'service.name', value: { stringValue: 'cinebg-client' } },
              { key: 'service.version', value: { stringValue: config.release } },
              { key: 'deployment.environment', value: { stringValue: config.environment } },
            ],
          },
          scopeSpans: [
            {
              scope: { name: 'cinebg-otel-tracer', version: config.release },
              spans: [
                {
                  traceId: span.traceId,
                  spanId: span.spanId,
                  name: span.name,
                  startTimeUnixNano: String(span.startTimeUnixNano),
                  endTimeUnixNano: String(span.endTimeUnixNano),
                  status: { code: status === 'OK' ? 1 : 2 },
                },
              ],
            },
          ],
        },
      ],
    }
    fetch(config.otelEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {})
  }

  return span
}

/**
 * 2. Sentry — Error & Exception Tracking + Breadcrumbs
 */
export function addBreadcrumb(
  category: string,
  message: string,
  level: 'info' | 'warning' | 'error' = 'info',
  data?: Record<string, unknown>
): void {
  breadcrumbs.push({
    category,
    message,
    level,
    timestamp: Date.now(),
    data,
  })
  if (breadcrumbs.length > MAX_BREADCRUMBS) {
    breadcrumbs.shift()
  }
}

export function getBreadcrumbs(): readonly Breadcrumb[] {
  return breadcrumbs
}

export function captureException(error: unknown, context: Record<string, unknown> = {}): void {
  const errObj = error instanceof Error ? error : new Error(String(error))
  const config = getObservabilityConfig()

  addBreadcrumb('exception', errObj.message, 'error', context)

  // Sentry Envelope Dispatch (when DSN is configured)
  if (config.sentryDsn && typeof fetch !== 'undefined') {
    try {
      const url = new URL(config.sentryDsn)
      const projectId = url.pathname.replace(/\//g, '')
      const publicKey = url.username
      const sentryEndpoint = `${url.protocol}//${url.host}/api/${projectId}/store/?sentry_key=${publicKey}&sentry_version=7`

      fetch(sentryEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_id: randomHex(32),
          timestamp: Date.now() / 1000,
          platform: 'javascript',
          release: config.release,
          environment: config.environment,
          exception: {
            values: [
              {
                type: errObj.name,
                value: errObj.message,
                stacktrace: { frames: [{ filename: errObj.stack || 'unknown' }] },
              },
            ],
          },
          breadcrumbs: { values: breadcrumbs.slice(-15) },
          extra: { ...getDeviceContext(), ...context },
        }),
        keepalive: true,
      }).catch(() => {})
    } catch {}
  }

  // Forward to Datadog Logs & New Relic as well
  logDatadogEvent('error', errObj.message, { stack: errObj.stack, ...context })
  recordNewRelicEvent('AppException', {
    errorName: errObj.name,
    errorMessage: errObj.message,
    ...context,
  })
}

/**
 * 3. Datadog RUM & Logs — Session, Views & Structured Logging
 */
export function logDatadogEvent(
  status: 'info' | 'warn' | 'error',
  message: string,
  attributes: Record<string, unknown> = {}
): void {
  const config = getObservabilityConfig()
  if (!config.datadogClientToken || typeof fetch === 'undefined') return

  const endpoint = `https://http-intake.logs.${config.datadogSite}/api/v2/logs`
  fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'DD-API-KEY': config.datadogClientToken,
    },
    body: JSON.stringify([
      {
        ddsource: 'browser',
        ddtags: `env:${config.environment},version:${config.release}`,
        service: 'cinebg-app',
        status,
        message,
        trace_id: sessionTraceId,
        ...getDeviceContext(),
        ...attributes,
      },
    ]),
    keepalive: true,
  }).catch(() => {})
}

export function trackRouteView(pathname: string): void {
  addBreadcrumb('navigation', `Navigated to ${pathname}`, 'info')
  const span = startSpan(`route.view:${pathname}`, { 'http.route': pathname })
  endSpan(span, 'OK')
  logDatadogEvent('info', `View ${pathname}`, { view: pathname })
  recordNewRelicEvent('PageView', { pathname })
}

/**
 * 4. New Relic — Custom Events & Stream Playback QoS Telemetry
 */
export function recordNewRelicEvent(
  eventType: string,
  attributes: Record<string, unknown> = {}
): void {
  const config = getObservabilityConfig()
  if (!config.newRelicLicenseKey || !config.newRelicAccountId || typeof fetch === 'undefined') {
    return
  }

  const endpoint = `https://insights-collector.newrelic.com/v1/accounts/${config.newRelicAccountId}/events`
  fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Api-Key': config.newRelicLicenseKey,
    },
    body: JSON.stringify([
      {
        eventType,
        timestamp: Date.now(),
        appVersion: config.release,
        traceId: sessionTraceId,
        ...getDeviceContext(),
        ...attributes,
      },
    ]),
    keepalive: true,
  }).catch(() => {})
}

export function trackStreamPlayback(event: {
  action: 'stream_start' | 'stream_playing' | 'stream_switch' | 'stream_error'
  tmdbId: number
  mediaType: string
  sourceName: string
  audioOption?: string
  latencyMs?: number
}): void {
  addBreadcrumb('player', `${event.action}: ${event.sourceName} (TMDB ${event.tmdbId})`, event.action === 'stream_error' ? 'warning' : 'info', event)
  const span = startSpan(`player.${event.action}`, {
    tmdbId: event.tmdbId,
    mediaType: event.mediaType,
    sourceName: event.sourceName,
    audioOption: event.audioOption || 'dub',
    latencyMs: event.latencyMs || 0,
  })
  endSpan(span, event.action === 'stream_error' ? 'ERROR' : 'OK')
  logDatadogEvent(event.action === 'stream_error' ? 'warn' : 'info', `Player ${event.action}`, event)
  recordNewRelicEvent('VideoPlaybackEvent', event)
}

/**
 * Global Initialization (Sentry + Datadog + New Relic + OpenTelemetry)
 */
export interface LiveChannelErrorLog {
  timestamp: number
  isoDate: string
  channelId: string
  channelName: string
  sourceIndex: number
  sourceUrl: string
  errorType: string
  details?: string
  platform: string
}

const LIVE_ERRORS_STORAGE_KEY = 'cinebg_live_channel_errors'
const MAX_LIVE_ERROR_LOGS = 100

/**
 * Registra e persiste erros de inicialização e reprodução de canais ao vivo (Live TV).
 * Salva no armazenamento local (localStorage) e propaga para a telemetria full-stack.
 */
export function logLiveChannelError(entry: {
  channelId: string
  channelName: string
  sourceIndex: number
  sourceUrl: string
  errorType: string
  details?: string
}): void {
  const logItem: LiveChannelErrorLog = {
    timestamp: Date.now(),
    isoDate: new Date().toISOString(),
    channelId: entry.channelId,
    channelName: entry.channelName,
    sourceIndex: entry.sourceIndex,
    sourceUrl: entry.sourceUrl,
    errorType: entry.errorType,
    details: entry.details,
    platform: isTVDevice() ? 'smart-tv' : isMobileDevice() ? 'mobile' : 'desktop',
  }

  // 1. Armazenamento persistente local (ring buffer resiliente)
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(LIVE_ERRORS_STORAGE_KEY)
      const list: LiveChannelErrorLog[] = raw ? JSON.parse(raw) : []
      list.unshift(logItem)
      if (list.length > MAX_LIVE_ERROR_LOGS) {
        list.length = MAX_LIVE_ERROR_LOGS
      }
      localStorage.setItem(LIVE_ERRORS_STORAGE_KEY, JSON.stringify(list))
    }
  } catch {}

  // 2. Telemetria Full-Stack (Sentry breadcrumbs, Datadog RUM e New Relic)
  addBreadcrumb('live_channel', `Live Channel ${entry.channelName} error: ${entry.errorType}`, 'error', logItem as unknown as Record<string, unknown>)
  logDatadogEvent('error', `Live Channel ${entry.channelName} failed: ${entry.errorType}`, logItem as unknown as Record<string, unknown>)
  recordNewRelicEvent('LiveStreamError', logItem as unknown as Record<string, unknown>)
}

export function getLiveChannelErrorLogs(): LiveChannelErrorLog[] {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(LIVE_ERRORS_STORAGE_KEY)
      return raw ? JSON.parse(raw) : []
    }
  } catch {}
  return []
}

export function clearLiveChannelErrorLogs(): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(LIVE_ERRORS_STORAGE_KEY)
    }
  } catch {}
}

/**
 * ============================================================================
 * 5. Telemetria de Falhas de Stream & Anúncios (Estilo YouCine)
 * Captura, deduplica temporalmente e dispara relatórios de incidentes.
 * ============================================================================
 */
export type IncidentType = 'STREAM_ERROR' | 'AD_DETECTED' | 'STREAM_TIMEOUT' | 'ALL_MIRRORS_FAILED'

export interface ActivePlaybackContext {
  tmdbId: number
  mediaType: 'movie' | 'tv' | 'anime'
  title?: string
  season?: number
  episode?: number
  sourceName?: string
  sourceUrl?: string
}

export interface StreamIncidentReport {
  id: string
  timestamp: number
  isoDate: string
  incidentType: IncidentType
  tmdbId: number
  mediaType: string
  title?: string
  season?: number
  episode?: number
  sourceName: string
  sourceUrl?: string
  errorDetails?: string
  adUrl?: string
  platform: 'smart-tv' | 'mobile' | 'desktop'
  appVersion: string
  occurrences: number
}

const STREAM_INCIDENTS_STORAGE_KEY = 'cinebg_stream_incidents'
const MAX_STREAM_INCIDENTS = 100
const DEDUPLICATION_WINDOW_MS = 3 * 60 * 1000 // 3 minutos

let currentPlaybackContext: ActivePlaybackContext | null = null

export function setActivePlaybackContext(ctx: ActivePlaybackContext | null): void {
  currentPlaybackContext = ctx
}

export function getActivePlaybackContext(): ActivePlaybackContext | null {
  return currentPlaybackContext
}

export function getStreamIncidentLogs(): StreamIncidentReport[] {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(STREAM_INCIDENTS_STORAGE_KEY)
      return raw ? JSON.parse(raw) : []
    }
  } catch {}
  return []
}

export function clearStreamIncidentLogs(): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(STREAM_INCIDENTS_STORAGE_KEY)
    }
  } catch {}
}

/**
 * Registra um incidente de stream (erro de mídia, timeout, codec ou propaganda).
 * Deduplica registros repetidos no intervalo de 3 minutos incrementando a contagem de ocorrências.
 */
export function reportStreamIncident(entry: {
  incidentType: IncidentType
  tmdbId?: number
  mediaType?: string
  title?: string
  season?: number
  episode?: number
  sourceName?: string
  sourceUrl?: string
  errorDetails?: string
  adUrl?: string
}): StreamIncidentReport {
  const config = getObservabilityConfig()
  const ctx = currentPlaybackContext

  const tmdbId = entry.tmdbId ?? ctx?.tmdbId ?? 0
  const mediaType = entry.mediaType ?? ctx?.mediaType ?? 'movie'
  const title = entry.title ?? ctx?.title ?? 'Título Desconhecido'
  const season = entry.season ?? ctx?.season
  const episode = entry.episode ?? ctx?.episode
  const sourceName = entry.sourceName ?? ctx?.sourceName ?? 'default-mirror'
  const sourceUrl = entry.sourceUrl ?? ctx?.sourceUrl
  const platform: 'smart-tv' | 'mobile' | 'desktop' = isTVDevice() ? 'smart-tv' : isMobileDevice() ? 'mobile' : 'desktop'

  const dedupeKey = `${entry.incidentType}:${tmdbId}:${season || 0}:${episode || 0}:${sourceName}`
  const now = Date.now()

  let incidents = getStreamIncidentLogs()
  const existingIndex = incidents.findIndex((item) => {
    const itemKey = `${item.incidentType}:${item.tmdbId}:${item.season || 0}:${item.episode || 0}:${item.sourceName}`
    return itemKey === dedupeKey && (now - item.timestamp) < DEDUPLICATION_WINDOW_MS
  })

  let incident: StreamIncidentReport

  if (existingIndex >= 0) {
    incident = {
      ...incidents[existingIndex],
      occurrences: incidents[existingIndex].occurrences + 1,
      timestamp: now,
      isoDate: new Date(now).toISOString(),
      errorDetails: entry.errorDetails || incidents[existingIndex].errorDetails,
      adUrl: entry.adUrl || incidents[existingIndex].adUrl,
    }
    incidents[existingIndex] = incident
  } else {
    incident = {
      id: randomHex(16),
      timestamp: now,
      isoDate: new Date(now).toISOString(),
      incidentType: entry.incidentType,
      tmdbId,
      mediaType,
      title,
      season,
      episode,
      sourceName,
      sourceUrl,
      errorDetails: entry.errorDetails,
      adUrl: entry.adUrl,
      platform,
      appVersion: config.release,
      occurrences: 1,
    }
    incidents.unshift(incident)
    if (incidents.length > MAX_STREAM_INCIDENTS) {
      incidents = incidents.slice(0, MAX_STREAM_INCIDENTS)
    }
  }

  // 1. Armazenamento persistente local
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STREAM_INCIDENTS_STORAGE_KEY, JSON.stringify(incidents))
    }
  } catch {}

  // 2. Propagação para Sentry, Datadog e New Relic
  addBreadcrumb(
    'stream_incident',
    `[${entry.incidentType}] ${title} (${sourceName}): ${entry.errorDetails || entry.adUrl || ''}`,
    'warning',
    incident as unknown as Record<string, unknown>
  )
  logDatadogEvent('warn', `Stream Incident: ${entry.incidentType} - ${title}`, incident as unknown as Record<string, unknown>)
  recordNewRelicEvent('StreamIncident', incident as unknown as Record<string, unknown>)

  // 3. Disparo remoto se endpoint de relatórios estiver configurado
  const incidentEndpoint = (import.meta as unknown as { env?: Record<string, string | undefined> }).env?.VITE_STREAM_INCIDENT_ENDPOINT
  if (incidentEndpoint && typeof fetch !== 'undefined') {
    fetch(incidentEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(incident),
      keepalive: true,
    }).catch(() => {})
  }

  return incident
}

/**
 * Interceptação de anúncio ou popup com vinculação automática da mídia em reprodução
 */
export function reportAdInterception(entry: {
  blockedUrl: string
  interceptionSource: string
}): StreamIncidentReport {
  const ctx = currentPlaybackContext
  return reportStreamIncident({
    incidentType: 'AD_DETECTED',
    tmdbId: ctx?.tmdbId,
    mediaType: ctx?.mediaType,
    title: ctx?.title,
    season: ctx?.season,
    episode: ctx?.episode,
    sourceName: ctx?.sourceName || entry.interceptionSource,
    sourceUrl: ctx?.sourceUrl,
    adUrl: entry.blockedUrl,
    errorDetails: `Anúncio ou redirecionamento bloqueado via [${entry.interceptionSource}]: ${entry.blockedUrl}`,
  })
}

/**
 * Formata os incidentes em relatório Markdown padronizado para issues do GitHub.
 */
export function formatIncidentsAsGitHubMarkdown(incidents?: StreamIncidentReport[]): string {
  const list = incidents || getStreamIncidentLogs()
  if (list.length === 0) {
    return '### Nenhum incidente de reprodução registrado.\nTodos os vídeos e canais operando normalmente.'
  }

  let md = '## 🚨 Relatório de Incidentes de Reprodução (CineBG)\n\n'
  md += `**Total de Incidentes**: ${list.length} | **Gerado em**: ${new Date().toLocaleString('pt-BR')}\n\n`
  md += '| Tipo | Título (TMDB) | Fonte / Espelho | Dispositivo | Ocorrências | Detalhes |\n'
  md += '| :--- | :--- | :--- | :--- | :---: | :--- |\n'

  for (const item of list.slice(0, 30)) {
    const epInfo = item.season ? ` (S${item.season}E${item.episode || 1})` : ''
    const titleCol = `${item.title || 'Desconhecido'} (TMDB: ${item.tmdbId})${epInfo}`
    const detailCol = (item.adUrl || item.errorDetails || 'N/A').replace(/\|/g, '\\|')
    md += `| \`${item.incidentType}\` | ${titleCol} | \`${item.sourceName}\` | ${item.platform} | **${item.occurrences}x** | ${detailCol} |\n`
  }

  return md
}


export function initObservability(): void {
  if (isInitialized) return
  isInitialized = true
  sessionTraceId = randomHex(32)

  const bootSpan = startSpan('app.bootstrap', getDeviceContext())

  if (typeof window !== 'undefined') {
    window.addEventListener('error', (event) => {
      captureException(event.error || new Error(event.message), {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      })
    })

    window.addEventListener('unhandledrejection', (event) => {
      captureException(event.reason || new Error('Unhandled Promise Rejection'), {
        type: 'unhandledrejection',
      })
    })
  }

  endSpan(bootSpan, 'OK')
}
