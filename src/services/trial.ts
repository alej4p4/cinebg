// =========================================================================
// CINEBG — SERVIÇO DO PERÍODO DE TESTE (3 DIAS) E AUDITORIA DE LICENÇA
// =========================================================================
// Lógica pura e síncrona (sem rede, sem React) consumida por useLicense.
//
// Princípios (Issue #237):
// - Fonte única de verdade do início do teste: getFirstUse() em useLicense
//   (timestamp nativo de instalação do Android + localStorage), portanto o
//   teste NUNCA reinicia ao atualizar o APK nem ao limpar estados internos.
// - Relógio confiável offline ("high-water mark"): voltar o relógio do aparelho
//   não estende o teste, e um relógio adiantado/atrasado em TV Box não encerra
//   nem reinicia o teste. Nenhuma chamada de rede é feita.
// =========================================================================

import { addBreadcrumb, recordNewRelicEvent } from '@/services/observability'

const DAY_MS = 24 * 60 * 60 * 1000
const HOUR_MS = 60 * 60 * 1000
const MIN_VALID_TIMESTAMP = 1577836800000 // 2020-01-01

const LAST_SEEN_KEY = 'cinebg_clock_last_seen'
const AUDIT_LOG_KEY = 'cinebg_audit_log'
const TRIAL_STARTED_LOGGED_KEY = 'cinebg_trial_started_logged'
const TRIAL_ENDED_LOGGED_KEY = 'cinebg_trial_ended_logged'
const MAX_AUDIT_ENTRIES = 200

// =========================================================================
// RELÓGIO CONFIÁVEL (ANTI-RETROCESSO)
// =========================================================================

const readNumber = (key: string): number => {
  try {
    const raw = localStorage.getItem(key)
    const parsed = raw ? Number(raw) : 0
    return Number.isFinite(parsed) ? parsed : 0
  } catch {
    return 0
  }
}

/**
 * Retorna o instante "confiável" atual: o maior valor já observado entre o
 * relógio do aparelho e o último instante registrado.
 * - Relógio voltado para trás (ou TV Box que liga em 1970 antes do NTP):
 *   devolve o último instante conhecido, impedindo estender o teste.
 * - Nunca encerra nem reinicia o teste por divergência de relógio.
 */
export const getTrustedNow = (deviceNow: number = Date.now()): number => {
  const lastSeen = readNumber(LAST_SEEN_KEY)
  const deviceValid = Number.isFinite(deviceNow) && deviceNow > MIN_VALID_TIMESTAMP

  if (deviceValid && deviceNow >= lastSeen) {
    try {
      localStorage.setItem(LAST_SEEN_KEY, String(deviceNow))
    } catch {}
    return deviceNow
  }

  if (lastSeen > MIN_VALID_TIMESTAMP) return lastSeen
  return deviceValid ? deviceNow : Date.now()
}

// =========================================================================
// JANELA DO PERÍODO DE TESTE
// =========================================================================

export interface TrialWindow {
  active: boolean
  startedAt: number
  endsAt: number
  msLeft: number
  daysLeft: number
  hoursLeft: number
}

/** Calcula a janela do teste a partir do primeiro uso (função pura). */
export const computeTrialWindow = (firstUse: number, trialDays: number, now: number): TrialWindow => {
  const endsAt = firstUse + trialDays * DAY_MS
  const msLeft = Math.max(0, endsAt - now)
  const active = msLeft > 0
  return {
    active,
    startedAt: firstUse,
    endsAt,
    msLeft,
    daysLeft: active ? Math.max(1, Math.ceil(msLeft / DAY_MS)) : 0,
    hoursLeft: active ? Math.max(1, Math.ceil(msLeft / HOUR_MS)) : 0,
  }
}

// =========================================================================
// AUDITORIA (local + observabilidade)
// =========================================================================

export type AuditEventType = 'trial_started' | 'trial_ended' | 'plan_activated'

export interface AuditLogEntry {
  id: string
  timestamp: number
  event: AuditEventType
  metadata?: Record<string, unknown>
}

export const getAuditLogs = (): AuditLogEntry[] => {
  try {
    const stored = localStorage.getItem(AUDIT_LOG_KEY)
    const parsed = stored ? JSON.parse(stored) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export const logAuditEvent = (event: AuditEventType, metadata?: Record<string, unknown>): void => {
  const entry: AuditLogEntry = {
    id: `audit_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
    timestamp: Date.now(),
    event,
    metadata,
  }

  try {
    const logs = getAuditLogs()
    logs.push(entry)
    if (logs.length > MAX_AUDIT_ENTRIES) logs.splice(0, logs.length - MAX_AUDIT_ENTRIES)
    localStorage.setItem(AUDIT_LOG_KEY, JSON.stringify(logs))
  } catch {}

  try {
    addBreadcrumb('license', event, 'info', metadata)
    recordNewRelicEvent('LicenseAudit', { event, ...metadata })
  } catch {}
}

/**
 * Registra o início do teste apenas uma vez por instalação
 * (identificada pelo timestamp de primeiro uso).
 */
export const logTrialStartedOnce = (trial: TrialWindow): void => {
  if (readNumber(TRIAL_STARTED_LOGGED_KEY) === trial.startedAt) return
  try {
    localStorage.setItem(TRIAL_STARTED_LOGGED_KEY, String(trial.startedAt))
  } catch {}
  logAuditEvent('trial_started', { startedAt: trial.startedAt, endsAt: trial.endsAt })
}

/** Registra o fim do teste apenas uma vez (evita spam na revalidação de 60s). */
export const logTrialEndedOnce = (trial: TrialWindow): void => {
  if (readNumber(TRIAL_ENDED_LOGGED_KEY) === trial.startedAt) return
  try {
    localStorage.setItem(TRIAL_ENDED_LOGGED_KEY, String(trial.startedAt))
  } catch {}
  logAuditEvent('trial_ended', { reason: 'expired', startedAt: trial.startedAt, endsAt: trial.endsAt })
}

export const logPlanActivated = (planId: string, planName: string, durationDays: number): void => {
  logAuditEvent('plan_activated', {
    planId,
    planName,
    durationDays,
    expiresAt: Date.now() + durationDays * DAY_MS,
  })
}
