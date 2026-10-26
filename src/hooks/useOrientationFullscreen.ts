import { useEffect, useRef } from 'react'
import { Capacitor } from '@capacitor/core'
import { isMobileDevice, setNativePlayerLandscape } from '@/utils/tv'

/**
 * Em celulares (Mobile), garante que as telas de navegação fiquem em Retrato (vertical),
 * ativando modo paisagem (landscape) e tela cheia imersiva sempre que um reprodutor de vídeo
 * (filmes/séries em /watch ou canal de TV ao vivo em /live) estiver ativo.
 */
export const useOrientationFullscreen = () => {
  const fullscreenRequested = useRef(false)

  useEffect(() => {
    const isVideoPlayerActive = () => {
      if (typeof window === 'undefined') return false
      const isWatchRoute = window.location.pathname.startsWith('/watch')
      const hasVideoClass =
        document.documentElement.classList.contains('cinebg-video-playing') ||
        document.body.classList.contains('cinebg-video-playing')
      const hasLivePlayer = Boolean(
        document.querySelector('.live-player-container, [data-live-player="true"]')
      )
      return isWatchRoute || hasVideoClass || hasLivePlayer
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
      const isPlayer = isVideoPlayerActive()
      const landscape = isLandscape()

      // Se for celular e NÃO houver player de vídeo ativo, garante orientação Retrato (vertical)
      if (isMobileDevice() && !isPlayer) {
        setNativePlayerLandscape(false)
        document.documentElement.classList.remove('cinebg-landscape')
        if (document.fullscreenElement) {
          await exitFullscreen()
        }
        if (typeof screen !== 'undefined' && screen.orientation && 'unlock' in screen.orientation) {
          try {
            screen.orientation.unlock()
          } catch {}
        }
        if (Capacitor.isNativePlatform()) {
          try {
            const { StatusBar } = await import('@capacitor/status-bar')
            await StatusBar.show()
          } catch {}
        }
        return
      }

      // Se houver player de vídeo ativo em celular, assegura landscape nativo e tela cheia
      if (isPlayer && isMobileDevice()) {
        setNativePlayerLandscape(true)
        if (typeof screen !== 'undefined' && screen.orientation && 'lock' in screen.orientation) {
          try {
            ;(screen.orientation as unknown as { lock: (o: string) => Promise<void> }).lock('landscape').catch(() => {})
          } catch {}
        }
      }

      if (Capacitor.isNativePlatform()) {
        try {
          const { StatusBar } = await import('@capacitor/status-bar')
          await StatusBar.setOverlaysWebView({ overlay: true })
          if (landscape && isPlayer) await StatusBar.hide()
          else if (isMobileDevice() && !isPlayer) await StatusBar.show()
        } catch {
          /* StatusBar indisponivel neste contexto */
        }
      }

      document.documentElement.classList.toggle('cinebg-landscape', landscape && isPlayer)

      // Auto fullscreen no mobile quando o player estiver ativo
      if (isPlayer && !fullscreenRequested.current && !document.fullscreenElement) {
        await requestFullscreen()
      } else if (!isPlayer && fullscreenRequested.current && document.fullscreenElement) {
        await exitFullscreen()
      }
    }

    const safeUpdate = () => {
      void update()
    }

    const events: Array<[string, EventTarget]> = [
      ['resize', window],
      ['orientationchange', window],
      ['cinebg:player-state', window],
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
