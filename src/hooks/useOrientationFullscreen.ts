import { useEffect, useRef } from 'react'
import { Capacitor } from '@capacitor/core'
import { isMobileDevice, setNativePlayerLandscape } from '@/utils/tv'

/**
 * Em celulares (Mobile), garante que todas as telas de navegação fiquem em Retrato (vertical),
 * ativando modo paisagem/tela cheia apenas dentro do player (/watch).
 */
export const useOrientationFullscreen = () => {
  const fullscreenRequested = useRef(false)

  useEffect(() => {
    // Se for celular e não estiver no player de vídeo (/watch), garante orientação Retrato (em pé)
    if (isMobileDevice() && !window.location.pathname.startsWith('/watch')) {
      setNativePlayerLandscape(false)
      try {
        if (typeof screen !== 'undefined' && screen.orientation && 'unlock' in screen.orientation) {
          screen.orientation.unlock()
        }
      } catch {}
    }

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
      const isWatchRoute = window.location.pathname.startsWith('/watch')
      const landscape = isLandscape()

      if (isMobileDevice() && !isWatchRoute) {
        setNativePlayerLandscape(false)
        document.documentElement.classList.remove('cinebg-landscape')
        if (document.fullscreenElement) {
          await exitFullscreen()
        }
        if (Capacitor.isNativePlatform()) {
          try {
            const { StatusBar } = await import('@capacitor/status-bar')
            await StatusBar.show()
          } catch {}
        }
        return
      }

      if (Capacitor.isNativePlatform()) {
        try {
          const { StatusBar } = await import('@capacitor/status-bar')
          await StatusBar.setOverlaysWebView({ overlay: true })
          if (landscape && isWatchRoute) await StatusBar.hide()
          else if (isMobileDevice()) await StatusBar.show()
        } catch {
          /* StatusBar indisponivel neste contexto */
        }
      }

      document.documentElement.classList.toggle('cinebg-landscape', landscape && isWatchRoute)

      // Auto fullscreen no mobile apenas dentro do player (/watch)
      if (isWatchRoute && landscape && !fullscreenRequested.current && !document.fullscreenElement) {
        await requestFullscreen()
      } else if ((!landscape || !isWatchRoute) && fullscreenRequested.current && document.fullscreenElement) {
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