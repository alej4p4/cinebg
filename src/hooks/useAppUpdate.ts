import { useState, useEffect } from 'react'

const LOCAL_VERSION = '1.0.0'
const UPDATE_URL = '/update.json'

interface UpdateInfo {
  version: string
  downloadUrl: string
  mandatory: boolean
}

export const useAppUpdate = () => {
  const [update, setUpdate] = useState<UpdateInfo | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    fetch(`${UPDATE_URL}?t=${Date.now()}`)
      .then((r) => r.json())
      .then((data: UpdateInfo) => {
        if (data.version !== LOCAL_VERSION) setUpdate(data)
      })
      .catch(() => {})
  }, [])

  const visible = update && !dismissed

  return { update: visible ? update : null, dismiss: () => setDismissed(true) }
}
