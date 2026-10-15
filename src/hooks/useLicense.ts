import { useState, useEffect } from 'react'

const TRIAL_DAYS = 3
const LICENSE_KEY = 'cinebg_license'
const FIRST_USE_KEY = 'cinebg_first_use'

interface License {
  code: string
  expiresAt: number
}

interface LicenseResponse {
  licenses: string[]
}

const getFirstUse = (): number => {
  const stored = localStorage.getItem(FIRST_USE_KEY)
  if (stored) return Number(stored)
  const now = Date.now()
  localStorage.setItem(FIRST_USE_KEY, String(now))
  return now
}

const getStoredLicense = (): License | null => {
  const stored = localStorage.getItem(LICENSE_KEY)
  if (!stored) return null
  try {
    const license = JSON.parse(stored) as License
    if (license.expiresAt > Date.now()) return license
    localStorage.removeItem(LICENSE_KEY)
    return null
  } catch {
    return null
  }
}

export const useLicense = () => {
  const [license, setLicense] = useState<License | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = getStoredLicense()
    if (stored) {
      setLicense(stored)
      setLoading(false)
      return
    }

    const firstUse = getFirstUse()
    const trialEnd = firstUse + TRIAL_DAYS * 24 * 60 * 60 * 1000

    if (Date.now() < trialEnd) {
      setLoading(false)
      return
    }

    // Trial expirado — verifica se há licença ativa no servidor
    fetch(`/licenses.json?t=${Date.now()}`)
      .then((r) => r.json())
      .then((data: LicenseResponse) => {
        const active = data.licenses ?? []
        // Se já existe uma licença ativa para este dispositivo, usa ela
        const deviceId = getDeviceId()
        if (active.includes(deviceId)) {
          activateLicense(deviceId, 30)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const getDeviceId = (): string => {
    let id = localStorage.getItem('cinebg_device_id')
    if (!id) {
      id = `dev_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
      localStorage.setItem('cinebg_device_id', id)
    }
    return id
  }

  const activateLicense = (code: string, days: number) => {
    const license: License = {
      code,
      expiresAt: Date.now() + days * 24 * 60 * 60 * 1000,
    }
    localStorage.setItem(LICENSE_KEY, JSON.stringify(license))
    setLicense(license)
  }

  const isLicensed = !!license
  const isTrial = !license && !loading

  return { license, isLicensed, isTrial, loading, activateLicense, getDeviceId }
}
