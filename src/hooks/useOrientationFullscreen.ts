import { useEffect } from 'react'
import { Capacitor } from '@capacitor/core'

/**
 * Em celulares, adapta a interface para paisagem/vertical e oculta a barra de
 * status do Android em paisagem para aproveitar toda a tela.
 */
export const useOrientationFullscreen = () => {
  useEffect(() => {
    const update = async () => {
      const landscape = window.innerWidth > window.innerHeight
      if (!Capacitor.isNativePlatform()) return

      try {
        const { StatusBar } = await import('@capacitor/status-bar')
        if (landscape) await StatusBar.hide()
        else await StatusBar.show()
      } catch {
        /* StatusBar indisponivel neste contexto */
      }

      document.documentElement.classList.toggle('cinebg-landscape', landscape)
    }

    const safeUpdate = () => {
      void update()
    }

    window.addEventListener('resize', safeUpdate)
    window.addEventListener('orientationchange', safeUpdate)
    safeUpdate()

    return () => {
      window.removeEventListener('resize', safeUpdate)
      window.removeEventListener('orientationchange', safeUpdate)
    }
  }, [])
}