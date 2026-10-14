import { useEffect } from 'react'
import { App as CapacitorApp } from '@capacitor/app'
import { checkForNewEpisodes } from '@/services/notifications'

export const useEpisodeNotifications = () => {
  useEffect(() => {
    const run = () => {
      checkForNewEpisodes().catch(() => {})
    }

    run()

    const listener = CapacitorApp.addListener('appStateChange', ({ isActive }) => {
      if (isActive) run()
    })

    return () => {
      listener.then((handle) => handle.remove()).catch(() => {})
    }
  }, [])
}
