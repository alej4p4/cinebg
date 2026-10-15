import { Capacitor } from '@capacitor/core'
import { Directory, Filesystem } from '@capacitor/filesystem'
import type { DownloadItem } from '@/types'

const FOLDER = 'cinebg-downloads'

export const downloadsSupported = () => Capacitor.isNativePlatform()

export const buildFileName = (item: Pick<DownloadItem, 'id' | 'type' | 'season' | 'episode'>) =>
  `${item.type}-${item.id}${item.season != null ? `-s${item.season}e${item.episode}` : ''}.mp4`

export const downloadVideo = async (
  url: string,
  fileName: string,
  onProgress?: (ratio: number) => void,
): Promise<string> => {
  try {
    await Filesystem.mkdir({ path: FOLDER, directory: Directory.Data, recursive: true })
  } catch {
    /* pasta já existe */
  }

  let listener: { remove: () => void } | undefined
  if (onProgress) {
    listener = await Filesystem.addListener('progress', (progress) => {
      if (progress.contentLength > 0) onProgress(progress.bytes / progress.contentLength)
    })
  }

  try {
    const result = await Filesystem.downloadFile({
      url,
      path: `${FOLDER}/${fileName}`,
      directory: Directory.Data,
    })
    return result.path ?? `${FOLDER}/${fileName}`
  } finally {
    listener?.remove()
  }
}

export const deleteVideo = async (path: string) => {
  if (!downloadsSupported()) return
  try {
    await Filesystem.deleteFile({ path, directory: Directory.Data })
  } catch {
    /* arquivo já removido */
  }
}

export const getPlayableUrl = async (path: string): Promise<string | null> => {
  try {
    const { uri } = await Filesystem.getUri({ path, directory: Directory.Data })
    return Capacitor.convertFileSrc(uri)
  } catch {
    return null
  }
}
