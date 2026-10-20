import { Capacitor, registerPlugin } from '@capacitor/core'
import { getDeviceUpdateUrl, getDeviceApkFilename } from '@/utils/tv'

export interface DownloadProgress {
  percent: number
  bytesDownloaded: number
  totalBytes: number
}

interface AppInstallerPluginInterface {
  canRequestPackageInstalls: () => Promise<{ value: boolean }>
  openInstallSettings: () => Promise<void>
  installApk: (options: { filePath: string }) => Promise<{ success: boolean }>
  downloadAndInstall: (options: {
    url: string
    filename?: string
  }) => Promise<{ success: boolean; filePath: string }>
  addListener: (
    eventName: 'downloadProgress',
    listenerFunc: (progress: DownloadProgress) => void
  ) => Promise<{ remove: () => void }>
}

const AppInstaller = registerPlugin<AppInstallerPluginInterface>('AppInstaller')

export interface UpdateExecutionResult {
  success: boolean
  error?: string
}

export const canInstallUnknownApps = async (): Promise<boolean> => {
  if (!Capacitor.isNativePlatform()) return true
  try {
    const res = await AppInstaller.canRequestPackageInstalls()
    return !!res.value
  } catch {
    return true
  }
}

export const openAppInstallSettings = async (): Promise<void> => {
  if (!Capacitor.isNativePlatform()) return
  try {
    await AppInstaller.openInstallSettings()
  } catch {}
}

export const startAppUpdate = async (
  downloadUrl: string,
  onProgress?: (progress: DownloadProgress) => void
): Promise<UpdateExecutionResult> => {
  const resolvedUrl = getDeviceUpdateUrl(downloadUrl)
  const resolvedFilename = getDeviceApkFilename()

  if (Capacitor.isNativePlatform()) {
    try {
      let listenerHandle: { remove: () => void } | null = null
      if (onProgress) {
        listenerHandle = await AppInstaller.addListener('downloadProgress', (p) => {
          onProgress(p)
        })
      }

      await AppInstaller.downloadAndInstall({
        url: resolvedUrl,
        filename: resolvedFilename,
      })

      if (listenerHandle) {
        listenerHandle.remove()
      }

      return { success: true }
    } catch (e: unknown) {
      const err = e as { message?: string }
      console.error('[AppUpdater] Erro nativo ao baixar e instalar:', e)
      return {
        success: false,
        error: err?.message || 'Falha ao baixar e instalar a atualização no dispositivo.',
      }
    }
  }

  // Fallback para Web / Navegador desktop ou mobile
  try {
    const a = document.createElement('a')
    a.href = resolvedUrl
    a.download = resolvedFilename
    a.target = '_blank'
    a.rel = 'noopener noreferrer'
    document.body.appendChild(a)
    a.click()
    setTimeout(() => {
      document.body.removeChild(a)
    }, 500)
    return { success: true }
  } catch (err: unknown) {
    const e = err as { message?: string }
    return { success: false, error: e?.message || 'Falha ao iniciar download no navegador.' }
  }
}
