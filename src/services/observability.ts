/**
 * ============================================================================
 * CINEBG UNIFIED OBSERVABILITY & TELEMETRY ENGINE
 * Providers: Sentry | Datadog RUM & Logs | New Relic | OpenTelemetry (OTLP)
 * ============================================================================
 */

import { isTVDevice, isMobileDevice } from '@/utils/tv'

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
    release: env.VITE_APP_VERSION || '1.2.57',
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
