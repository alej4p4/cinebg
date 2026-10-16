import { Capacitor } from '@capacitor/core'
import { LocalNotifications } from '@capacitor/local-notifications'
import { getShowDetails } from './tmdb'
import { useAppStore } from '@/store/useAppStore'
import type { FavoriteItem } from '@/types'

const NOTIFIED_KEY = 'cinebg-notified-episodes'
const RECENT_DAYS = 7

type NotifiedMap = Record<string, string>

const loadNotified = (): NotifiedMap => {
  try {
    return JSON.parse(localStorage.getItem(NOTIFIED_KEY) || '{}') as NotifiedMap
  } catch {
    return {}
  }
}

const saveNotified = (map: NotifiedMap) => {
  try {
    localStorage.setItem(NOTIFIED_KEY, JSON.stringify(map))
  } catch {
    /* storage indisponível */
  }
}

const episodeKey = (showId: number, season: number, episode: number) =>
  `${showId}:s${season}e${episode}`

const hashId = (input: string): number => {
  let hash = 0
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) | 0
  }
  return (Math.abs(hash) % 2147483646) + 1
}

const todayISO = () => new Date().toISOString().slice(0, 10)

const daysAgoISO = (days: number) => {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().slice(0, 10)
}

// Reúne séries/animes favoritos de todos os perfis (sem duplicar).
const trackedShows = (): FavoriteItem[] => {
  const { profiles, dataByProfile } = useAppStore.getState()
  const map = new Map<number, FavoriteItem>()
  for (const profile of profiles) {
    const favorites = dataByProfile[profile.id]?.favorites ?? []
    for (const fav of favorites) {
      if (fav.type === 'tv' || fav.type === 'anime') map.set(fav.id, fav)
    }
  }
  return [...map.values()]
}

export const isNativeNotificationsAvailable = () => Capacitor.isNativePlatform()

export const ensureNotificationPermission = async (): Promise<boolean> => {
  if (!Capacitor.isNativePlatform()) return false
  try {
    const perm = await LocalNotifications.checkPermissions()
    return perm.display === 'granted'
  } catch {
    return false
  }
}

export const requestNotificationPermissionExplicit = async (): Promise<boolean> => {
  if (!Capacitor.isNativePlatform()) return false
  try {
    const perm = await LocalNotifications.requestPermissions()
    return perm.display === 'granted'
  } catch {
    return false
  }
}

const scheduleNotification = async (
  id: number,
  title: string,
  body: string,
  at: Date,
) => {
  await LocalNotifications.schedule({
    notifications: [
      {
        id,
        title,
        body,
        schedule: { at },
        channelId: 'episodes',
      },
    ],
  })
}

export const ensureNotificationChannel = async () => {
  if (!Capacitor.isNativePlatform()) return
  try {
    await LocalNotifications.createChannel({
      id: 'episodes',
      name: 'Novos episódios',
      description: 'Avisos quando um episódio novo de uma série favorita é lançado',
      importance: 3,
    })
  } catch {
    /* canal já existe ou não suportado */
  }
}

/**
 * Verifica os favoritos e agenda/emite notificações de novos episódios.
 * Retorna a quantidade de episódios notificados.
 */
export const checkForNewEpisodes = async (): Promise<number> => {
  if (!useAppStore.getState().notificationsEnabled) return 0
  if (!Capacitor.isNativePlatform()) return 0

  const granted = await ensureNotificationPermission()
  if (!granted) return 0

  await ensureNotificationChannel()

  const shows = trackedShows()
  if (shows.length === 0) return 0

  const notified = loadNotified()
  const today = todayISO()
  const recentLimit = daysAgoISO(RECENT_DAYS)
  let count = 0

  for (const show of shows) {
    try {
      const details = await getShowDetails(show.id)
      const last = details.last_episode_to_air
      const next = details.next_episode_to_air

      // Episódio recém-lançado (nos últimos dias) e ainda não notificado.
      if (last?.air_date && last.air_date >= recentLimit && last.air_date <= today) {
        const key = episodeKey(show.id, last.season_number, last.episode_number)
        if (!notified[key]) {
          await scheduleNotification(
            hashId(key),
            'Novo episódio disponível',
            `${show.title} — T${last.season_number} E${last.episode_number}${
              last.name ? `: ${last.name}` : ''
            }`,
            new Date(Date.now() + 1500),
          )
          notified[key] = today
          count++
        }
      }

      // Episódio futuro: agenda para o dia do lançamento (20h local).
      if (next?.air_date && next.air_date > today) {
        const key = episodeKey(show.id, next.season_number, next.episode_number)
        if (!notified[key]) {
          const at = new Date(`${next.air_date}T20:00:00`)
          if (at.getTime() > Date.now()) {
            await scheduleNotification(
              hashId(key),
              'Novo episódio hoje',
              `${show.title} — T${next.season_number} E${next.episode_number}${
                next.name ? `: ${next.name}` : ''
              }`,
              at,
            )
            notified[key] = next.air_date
            count++
          }
        }
      }
    } catch {
      /* ignora falha de um título específico */
    }
  }

  saveNotified(notified)
  return count
}
