import { useState, useEffect, useCallback } from 'react'
import { getCineBGNativeBridge } from '@/utils/tv'

export const TRIAL_DAYS = 3
const LICENSE_KEY = 'cinebg_license'
const FIRST_USE_KEY = 'cinebg_first_use'
const DEVICE_ID_KEY = 'cinebg_device_id'
const MIN_VALID_TIMESTAMP = 1577836800000 // 2020-01-01
const LICENSE_EVENT_NAME = 'cinebg-license-updated'

export interface License {
  code: string
  expiresAt: number
  planDays?: number
  planName?: string
  paymentId?: string | number
  activatedAt?: number
}

interface LicenseResponse {
  licenses: string[]
}

/** Planos aceitos em códigos de ativação manual (devem coincidir com VIP_PLANS). */
export const VALID_ACTIVATION_DAYS = [30, 60, 90, 365] as const
const ACTIVATION_SALT = 'cinebg-vip-v1'
const ACTIVATION_CODE_REGEX = /^CINEBG-(\d{2,3})-([0-9A-Z]{8})$/

/** Hash FNV-1a 32 bits determinístico (sem dependências, roda em TV Box antigas). */
const fnv1a = (input: string): number => {
  let hash = 0x811c9dc5
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193) >>> 0
  }
  return hash >>> 0
}

/**
 * Checksum de 8 caracteres vinculado ao aparelho + plano.
 * Um código gerado para um aparelho NÃO funciona em outro (anti-compartilhamento).
 */
export const computeActivationChecksum = (deviceId: string, days: number): string => {
  const a = fnv1a(`${ACTIVATION_SALT}|${deviceId}|${days}`)
  const b = fnv1a(`${days}|${deviceId}|${ACTIVATION_SALT}|${a}`)
  return (a.toString(36) + b.toString(36)).toUpperCase().padStart(8, '0').slice(-8)
}

export type ActivationValidation =
  | { valid: true; days: number }
  | { valid: false; reason: 'empty' | 'format' | 'plan' | 'checksum' | 'device' }

/**
 * Valida um código de ativação manual (CWE-306: impede liberar o VIP com qualquer texto).
 * Formato: CINEBG-<DIAS>-<CHECKSUM>, ex.: CINEBG-30-1A2B3C4D
 */
export const validateActivationCode = (rawCode: string, deviceId: string): ActivationValidation => {
  const code = (rawCode ?? '').trim().toUpperCase().replace(/\s+/g, '')
  if (!code) return { valid: false, reason: 'empty' }
  if (!deviceId || !deviceId.trim()) return { valid: false, reason: 'device' }
  if (code.length > 32) return { valid: false, reason: 'format' }
  const match = ACTIVATION_CODE_REGEX.exec(code)
  if (!match) return { valid: false, reason: 'format' }
  const days = Number(match[1])
  if (!(VALID_ACTIVATION_DAYS as readonly number[]).includes(days)) {
    return { valid: false, reason: 'plan' }
  }
  if (computeActivationChecksum(deviceId.trim(), days) !== match[2]) {
    return { valid: false, reason: 'checksum' }
  }
  return { valid: true, days }
}

/** Consulta a lista remota de licenças (ativação feita pelo suporte). */
export const isLicensedRemotely = async (code: string, deviceId: string): Promise<boolean> => {
  try {
    const res = await fetch(`/licenses.json?t=${Date.now()}`)
    if (!res.ok) return false
    const data = (await res.json()) as LicenseResponse
    const active = Array.isArray(data?.licenses) ? data.licenses : []
    const normalized = code.trim()
    return active.includes(deviceId) || (normalized.length >= 6 && active.includes(normalized))
  } catch {
    return false
  }
}

/**
 * Obtém e sincroniza a data/hora real da primeira instalação do CineBG no aparelho.
 * Prioriza o timestamp mais antigo entre o PackageManager/SharedPreferences nativo do Android
 * e o armazenamento local, garantindo que os 3 dias de teste NUNCA zerem ao atualizar o APK.
 */
export const getFirstUse = (): number => {
  let localTs = 0
  try {
    const stored = localStorage.getItem(FIRST_USE_KEY)
    if (stored) {
      const parsed = Number(stored)
      if (Number.isFinite(parsed) && parsed > MIN_VALID_TIMESTAMP) {
        localTs = parsed
      }
    }
  } catch {}

  let nativeTs = 0
  try {
    const bridge = getCineBGNativeBridge()
    if (bridge && typeof bridge.getFirstInstallTime === 'function') {
      const rawNative = Number(bridge.getFirstInstallTime())
      if (Number.isFinite(rawNative) && rawNative > MIN_VALID_TIMESTAMP) {
        nativeTs = rawNative
      }
    }
  } catch {}

  let earliest = Date.now()
  if (localTs > MIN_VALID_TIMESTAMP && nativeTs > MIN_VALID_TIMESTAMP) {
    earliest = Math.min(localTs, nativeTs)
  } else if (nativeTs > MIN_VALID_TIMESTAMP) {
    earliest = nativeTs
  } else if (localTs > MIN_VALID_TIMESTAMP) {
    earliest = localTs
  }

  try {
    localStorage.setItem(FIRST_USE_KEY, String(earliest))
  } catch {}

  try {
    const bridge = getCineBGNativeBridge()
    if (bridge && typeof bridge.syncFirstInstallTime === 'function') {
      const synced = Number(bridge.syncFirstInstallTime(earliest))
      if (Number.isFinite(synced) && synced > MIN_VALID_TIMESTAMP && synced < earliest) {
        earliest = synced
        localStorage.setItem(FIRST_USE_KEY, String(earliest))
      }
    }
  } catch {}

  return earliest
}

export const getStoredLicense = (): License | null => {
  let raw: string | null = null
  try {
    raw = localStorage.getItem(LICENSE_KEY)
  } catch {}

  if (!raw) {
    try {
      const bridge = getCineBGNativeBridge()
      if (bridge && typeof bridge.getSavedLicense === 'function') {
        const nativeRaw = bridge.getSavedLicense()
        if (nativeRaw && nativeRaw.trim().length > 0) {
          raw = nativeRaw.trim()
          try {
            localStorage.setItem(LICENSE_KEY, raw)
          } catch {}
        }
      }
    } catch {}
  }

  if (!raw) return null
  try {
    const license = JSON.parse(raw) as License
    if (license && typeof license.expiresAt === 'number' && license.expiresAt > Date.now()) {
      return license
    }
    try {
      localStorage.removeItem(LICENSE_KEY)
      getCineBGNativeBridge()?.saveLicense?.('')
    } catch {}
    return null
  } catch {
    return null
  }
}

export const getDeviceId = (): string => {
  try {
    const bridge = getCineBGNativeBridge()
    if (bridge && typeof bridge.getHardwareDeviceId === 'function') {
      const hwId = bridge.getHardwareDeviceId()
      if (hwId && typeof hwId === 'string' && hwId.trim().length > 0 && hwId !== 'cinebg_unknown') {
        try {
          localStorage.setItem(DEVICE_ID_KEY, hwId.trim())
        } catch {}
        return hwId.trim()
      }
    }
  } catch {}

  let id = ''
  try {
    id = localStorage.getItem(DEVICE_ID_KEY) || ''
  } catch {}

  if (!id) {
    id = `cinebg_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
    try {
      localStorage.setItem(DEVICE_ID_KEY, id)
    } catch {}
  }
  return id
}

export const useLicense = () => {
  const [license, setLicense] = useState<License | null>(() => getStoredLicense())
  const [loading, setLoading] = useState(true)
  const [trialDaysLeft, setTrialDaysLeft] = useState(TRIAL_DAYS)
  const [trialHoursLeft, setTrialHoursLeft] = useState(TRIAL_DAYS * 24)
  const [isTrial, setIsTrial] = useState(false)

  const checkStatus = useCallback(() => {
    const stored = getStoredLicense()
    if (stored) {
      setLicense(stored)
      setIsTrial(false)
      setLoading(false)
      return
    }

    const firstUse = getFirstUse()
    const trialEnd = firstUse + TRIAL_DAYS * 24 * 60 * 60 * 1000
    const now = Date.now()

    if (now < trialEnd) {
      const msLeft = trialEnd - now
      const days = Math.max(1, Math.ceil(msLeft / (24 * 60 * 60 * 1000)))
      const hours = Math.max(1, Math.ceil(msLeft / (60 * 60 * 1000)))
      setTrialDaysLeft(days)
      setTrialHoursLeft(hours)
      setIsTrial(true)
      setLicense(null)
      setLoading(false)
      return
    }

    // Período de teste de 3 dias expirado: força aquisição da versão paga VIP
    setIsTrial(false)
    setTrialDaysLeft(0)
    setTrialHoursLeft(0)
    setLicense(null)

    // Verifica se há licença ativa no arquivo de licenças remotas
    fetch(`/licenses.json?t=${Date.now()}`)
      .then((r) => r.json())
      .then((data: LicenseResponse) => {
        const active = data?.licenses ?? []
        const deviceId = getDeviceId()
        if (active.includes(deviceId)) {
          const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000
          const remoteLic: License = {
            code: deviceId,
            expiresAt,
            planDays: 30,
            planName: 'Plano Mensal (Ativação Remota)',
            activatedAt: Date.now(),
          }
          const serialized = JSON.stringify(remoteLic)
          try {
            localStorage.setItem(LICENSE_KEY, serialized)
            getCineBGNativeBridge()?.saveLicense?.(serialized)
          } catch {}
          setLicense(remoteLic)
          setIsTrial(false)
          window.dispatchEvent(new CustomEvent(LICENSE_EVENT_NAME))
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    checkStatus()

    const handleStorage = (e: StorageEvent) => {
      if (e.key === LICENSE_KEY || e.key === FIRST_USE_KEY) {
        checkStatus()
      }
    }
    const handleCustomSync = () => {
      checkStatus()
    }
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        checkStatus()
      }
    }

    // Revalida periodicamente a cada 60 segundos para detectar o vencimento dos 3 dias em tempo real
    const intervalId = setInterval(checkStatus, 60_000)

    window.addEventListener('storage', handleStorage)
    window.addEventListener(LICENSE_EVENT_NAME, handleCustomSync)
    window.addEventListener('focus', handleCustomSync)
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      clearInterval(intervalId)
      window.removeEventListener('storage', handleStorage)
      window.removeEventListener(LICENSE_EVENT_NAME, handleCustomSync)
      window.removeEventListener('focus', handleCustomSync)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [checkStatus])

  const activateLicense = (
    code: string,
    days: number,
    planName?: string,
    paymentId?: string | number
  ) => {
    const expiresAt = Date.now() + days * 24 * 60 * 60 * 1000
    const newLicense: License = {
      code,
      expiresAt,
      planDays: days,
      planName: planName || `Plano ${days} Dias`,
      paymentId,
      activatedAt: Date.now(),
    }
    const serialized = JSON.stringify(newLicense)
    try {
      localStorage.setItem(LICENSE_KEY, serialized)
      getCineBGNativeBridge()?.saveLicense?.(serialized)
    } catch {}
    setLicense(newLicense)
    setIsTrial(false)
    setLoading(false)
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(LICENSE_EVENT_NAME))
    }
  }

  const resetTrialForTesting = () => {
    try {
      localStorage.removeItem(LICENSE_KEY)
      getCineBGNativeBridge()?.saveLicense?.('')
    } catch {}
    checkStatus()
  }

  const isLicensed = !!license && license.expiresAt > Date.now()
  const licenseDaysLeft = license
    ? Math.max(0, Math.ceil((license.expiresAt - Date.now()) / (24 * 60 * 60 * 1000)))
    : 0

  return {
    license,
    isLicensed,
    isTrial,
    loading,
    trialDaysLeft,
    trialHoursLeft,
    licenseDaysLeft,
    deviceId: getDeviceId(),
    activateLicense,
    getDeviceId,
    resetTrialForTesting,
    refreshLicense: checkStatus,
  }
}
