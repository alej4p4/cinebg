import { useEffect } from 'react'
import { useAppStore, type AppUpdateInfo } from '@/store/useAppStore'

export const useAppUpdate = () => {
  const {
    updateModalOpen,
    setUpdateModalOpen,
    updateInfo,
    isCheckingUpdate,
    checkForUpdates,
  } = useAppStore()

  useEffect(() => {
    checkForUpdates(false).catch(() => {})
  }, [checkForUpdates])

  return {
    update: updateInfo.hasUpdate ? updateInfo : null,
    updateInfo,
    visible: updateModalOpen,
    isChecking: isCheckingUpdate,
    openModal: () => setUpdateModalOpen(true),
    dismiss: () => setUpdateModalOpen(false),
    checkForUpdate: () => checkForUpdates(true),
  }
}

export type { AppUpdateInfo }
