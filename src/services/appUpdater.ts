import { Capacitor, registerPlugin } from '@capacitor/core'
import { getDeviceUpdateUrl, getDeviceApkFilename } from '@/utils/tv'

export interface DownloadProgress {
  percent: number
  bytesDownloaded: number
  totalBytes: number
  downloadId?: string
  cancelled?: boolean
}

interface AppInstallerPluginInterface {
  canRequestPackageInstalls: () => Promise<{ value: boolean }>
  openInstallSettings: () => Promise<void>
  installApk: (options: { filePath: string }) => Promise<{ success: boolean }>
  downloadAndInstall: (options: {
    url: string
    filename?: string
    downloadId?: string
  }) => Promise<{ success: boolean; filePath?: string; cancelled?: boolean }>
  pauseDownload: (options: { downloadId: string }) => Promise<{ paused: boolean; bytesDownloaded?: number; alreadyPaused?: boolean }>
  resumeDownload: (options: { downloadId: string }) => Promise<{ resumed: boolean; alreadyResumed?: boolean }>
  cancelDownload: (options: { downloadId: string }) => Promise<{ cancelled: boolean }>
  addListener: (
    eventName: 'downloadProgress',
    listenerFunc: (progress: DownloadProgress) => void
  ) => Promise<{ remove: () => void }>
}

const AppInstaller = registerPlugin<AppInstallerPluginInterface>('AppInstaller')

export interface UpdateExecutionResult {
  success: boolean
  error?: string
  cancelled?: boolean
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

export const pauseDownload = async (downloadId: string): Promise<{ paused: boolean; bytesDownloaded?: number; alreadyPaused?: boolean; error?: string }> => {
  if (!Capacitor.isNativePlatform()) return { paused: false, error: 'Não disponível no navegador' }
  try {
    return await AppInstaller.pauseDownload({ downloadId })
  } catch (e: unknown) {
    const err = e as { message?: string }
    return { paused: false, error: err?.message || 'Falha ao pausar download.' }
  }
}

export const resumeDownload = async (downloadId: string): Promise<{ resumed: boolean; alreadyResumed?: boolean; error?: string }> => {
  if (!Capacitor.isNativePlatform()) return { resumed: false, error: 'Não disponível no navegador' }
  try {
    return await AppInstaller.resumeDownload({ downloadId })
  } catch (e: unknown) {
    const err = e as { message?: string }
    return { resumed: false, error: err?.message || 'Falha ao retomar download.' }
  }
}

export const cancelDownload = async (downloadId: string): Promise<{ cancelled: boolean; error?: string }> => {
  if (!Capacitor.isNativePlatform()) return { cancelled: false, error: 'Não disponível no navegador' }
  try {
    return await AppInstaller.cancelDownload({ downloadId })
  } catch (e: unknown) {
    const err = e as { message?: string }
    return { cancelled: false, error: err?.message || 'Falha ao cancelar download.' }
  }
}

export const startAppUpdate = async (
  downloadUrl: string,
  onProgress?: (progress: DownloadProgress) => void
): Promise<UpdateExecutionResult> => {
  const resolvedUrl = getDeviceUpdateUrl(downloadUrl)
  const downloadId = resolvedUrl // Use URL as downloadId

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
        filename: getDeviceApkFilename(),
        downloadId,
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
    a.href = getDeviceUpdateUrl(downloadUrl)
    a.download = getDeviceApkFilename()
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
