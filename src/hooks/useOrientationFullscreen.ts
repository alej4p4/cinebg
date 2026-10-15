import { useEffect } from 'react'
import { Capacitor } from '@capacitor/core'

/**
 * Adapta a interface para portrait/landscape e usa tela cheia em paisagem
 * em dispositivos Android.
 */
export const useOrientationFullscreen = () => {
  useEffect(() => {
    const isLandscape = () => {
      if (typeof screen !== 'undefined' && screen.orientation?.type) {
        return screen.orientation.type.startsWith('landscape')
      }
      return window.matchMedia('(orientation: landscape)').matches
    }

    const update = async () => {
      const landscape = isLandscape()

      if (Capacitor.isNativePlatform()) {
        try {
          const { StatusBar } = await import('@capacitor/status-bar')
          await StatusBar.setOverlaysWebView({ overlay: true })
          if (landscape) await StatusBar.hide()
          else await StatusBar.show()
        } catch {
          /* StatusBar indisponivel neste contexto */
        }
      }

      document.documentElement.classList.toggle('cinebg-landscape', landscape)
    }

    const safeUpdate = () => {
      void update()
    }

    const events: Array<[string, EventTarget]> = [
      ['resize', window],
      ['orientationchange', window],
    ]
    if (typeof screen !== 'undefined' && screen.orientation) {
      events.push(['change', screen.orientation])
    }

    events.forEach(([event, target]) => target.addEventListener(event, safeUpdate))
    safeUpdate()

    return () => {
      events.forEach(([event, target]) => target.removeEventListener(event, safeUpdate))
    }
  }, [])
}