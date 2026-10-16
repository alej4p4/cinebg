import { useState, useEffect, useCallback } from 'react'

export const TRIAL_DAYS = 3
const LICENSE_KEY = 'cinebg_license'
const FIRST_USE_KEY = 'cinebg_first_use'
const DEVICE_ID_KEY = 'cinebg_device_id'

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

export const getFirstUse = (): number => {
  const stored = localStorage.getItem(FIRST_USE_KEY)
  if (stored) return Number(stored)
  const now = Date.now()
  localStorage.setItem(FIRST_USE_KEY, String(now))
  return now
}

export const getStoredLicense = (): License | null => {
  const stored = localStorage.getItem(LICENSE_KEY)
  if (!stored) return null
  try {
    const license = JSON.parse(stored) as License
    if (license && typeof license.expiresAt === 'number' && license.expiresAt > Date.now()) {
      return license
    }
    localStorage.removeItem(LICENSE_KEY)
    return null
  } catch {
    return null
  }
}

export const getDeviceId = (): string => {
  let id = localStorage.getItem(DEVICE_ID_KEY)
  if (!id) {
    id = `cinebg_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
    localStorage.setItem(DEVICE_ID_KEY, id)
  }
  return id
}

export const useLicense = () => {
  const [license, setLicense] = useState<License | null>(null)
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

    // Trial expirado
    setIsTrial(false)
    setTrialDaysLeft(0)
    setTrialHoursLeft(0)

    // Verifica se há licença ativa no arquivo de licenças remotas
    fetch(`/licenses.json?t=${Date.now()}`)
      .then((r) => r.json())
      .then((data: LicenseResponse) => {
        const active = data?.licenses ?? []
        const deviceId = getDeviceId()
        if (active.includes(deviceId)) {
          activateLicense(deviceId, 30, 'Plano Mensal (Ativação Remota)')
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    checkStatus()

    // Ouve eventos de atualização de licença entre janelas ou abas
    const handleStorage = (e: StorageEvent) => {
      if (e.key === LICENSE_KEY || e.key === FIRST_USE_KEY) {
        checkStatus()
      }
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
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
    localStorage.setItem(LICENSE_KEY, JSON.stringify(newLicense))
    setLicense(newLicense)
    setIsTrial(false)
    setLoading(false)
  }

  const resetTrialForTesting = () => {
    localStorage.removeItem(LICENSE_KEY)
    localStorage.removeItem(FIRST_USE_KEY)
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
