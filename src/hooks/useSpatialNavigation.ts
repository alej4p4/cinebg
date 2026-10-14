import { useEffect } from 'react'
import {
  init,
  setFocus,
  SpatialNavigation,
  ROOT_FOCUS_KEY,
} from '@noriginmedia/norigin-spatial-navigation'

/**
 * Liga a navegação espacial (controle remoto / D-pad) quando habilitada.
 * `routeKey` força o recálculo dos layouts a cada troca de tela.
 */
export const useSpatialNavigation = (enabled: boolean, routeKey: string) => {
  useEffect(() => {
    if (!enabled) return

    init({
      debug: false,
      visualDebug: false,
      shouldFocusDOMNode: true,
    })
    document.body.classList.add('tv-mode')

    const timer = setTimeout(() => {
      setFocus(ROOT_FOCUS_KEY).catch(() => {})
    }, 300)

    return () => {
      clearTimeout(timer)
      document.body.classList.remove('tv-mode')
      try {
        SpatialNavigation.destroy()
      } catch {
        /* já destruído */
      }
    }
  }, [enabled])

  useEffect(() => {
    if (!enabled) return
    const timer = setTimeout(() => {
      SpatialNavigation.updateAllLayouts().catch(() => {})
    }, 350)
    return () => clearTimeout(timer)
  }, [enabled, routeKey])
}
