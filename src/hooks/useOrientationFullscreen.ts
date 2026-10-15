import { useEffect, useRef } from 'react'
import { Capacitor } from '@capacitor/core'

/**
 * Adapta a interface para portrait/landscape e usa tela cheia em paisagem
 * em dispositivos Android. Solicita fullscreen automaticamente em landscape.
 */
export const useOrientationFullscreen = () => {
  const fullscreenRequested = useRef(false)

  useEffect(() => {
    const isLandscape = () => {
      if (typeof screen !== 'undefined' && screen.orientation?.type) {
        return screen.orientation.type.startsWith('landscape')
      }
      return window.matchMedia('(orientation: landscape)').matches
    }

    const requestFullscreen = async () => {
      if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
        try {
          await document.documentElement.requestFullscreen()
          fullscreenRequested.current = true
        } catch {
          /* Fullscreen não disponível ou negado pelo usuário */
        }
      }
    }

    const exitFullscreen = async () => {
      if (document.fullscreenElement && document.exitFullscreen) {
        try {
          await document.exitFullscreen()
          fullscreenRequested.current = false
        } catch {
          /* Ignore */
        }
      }
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

      // Auto fullscreen no mobile/web quando em landscape
      if (landscape && !fullscreenRequested.current && !document.fullscreenElement) {
        await requestFullscreen()
      } else if (!landscape && fullscreenRequested.current && document.fullscreenElement) {
        await exitFullscreen()
      }
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
      // Não sair do fullscreen automaticamente ao desmontar - deixar o usuário controlar
    }
  }, [])
}