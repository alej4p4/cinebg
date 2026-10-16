import { useEffect } from 'react'
import {
  init,
  setFocus,
  setKeyMap,
  setThrottle,
  SpatialNavigation,
  ROOT_FOCUS_KEY,
  getCurrentFocusKey,
} from '@noriginmedia/norigin-spatial-navigation'
import { isTvRemoteKey, isTVDevice } from '@/utils/tv'

let isInitialized = false

/**
 * Hook para controle remoto e navegacao espacial (Android TV, TV Box, Teclado/D-Pad).
 * Auto-detecta toques no controle remoto e ativa o modo TV instantaneamente.
 */
export const useSpatialNavigation = (explicitEnabled: boolean, routeKey: string) => {
  useEffect(() => {
    if (!isInitialized) {
      try {
        init({
          debug: false,
          visualDebug: false,
          shouldFocusDOMNode: true,
        })
        setKeyMap({
          left: [37, 21, 'ArrowLeft', 'Left'],
          right: [39, 22, 'ArrowRight', 'Right'],
          up: [38, 19, 'ArrowUp', 'Up'],
          down: [40, 20, 'ArrowDown', 'Down'],
          enter: [13, 23, 66, 'Enter', 'Select', 'OK', 'Space'],
        })
        setThrottle({ throttle: 120 })
        isInitialized = true
      } catch (err) {
        console.warn('Erro ao inicializar spatial navigation:', err)
      }
    }

    // Se o dispositivo ja e uma TV identificada ou explicitamente ativado
    if (explicitEnabled || isTVDevice()) {
      document.body.classList.add('tv-mode', 'tv-remote-active')
      const timer = setTimeout(() => {
        setFocus(ROOT_FOCUS_KEY).catch(() => {})
      }, 250)
      return () => clearTimeout(timer)
    }

    // Auto-ativacao: Ouvinte global de teclas do controle remoto
    const handleRemoteKeyDown = (e: KeyboardEvent) => {
      if (isTvRemoteKey(e)) {
        if (!document.body.classList.contains('tv-remote-active')) {
          document.body.classList.add('tv-mode', 'tv-remote-active')
        }
        // Se ainda nao houver foco ativo, focar o primeiro elemento
        if (!getCurrentFocusKey() || getCurrentFocusKey() === ROOT_FOCUS_KEY) {
          setFocus(ROOT_FOCUS_KEY).catch(() => {})
        }
      }
    }

    // Se o usuario tocar na tela (touch / mouse), desativar o anel de foco ate novo toque no controle
    const handlePointerDown = () => {
      if (!isTVDevice() && !explicitEnabled) {
        document.body.classList.remove('tv-remote-active')
      }
    }

    window.addEventListener('keydown', handleRemoteKeyDown, { passive: true })
    window.addEventListener('touchstart', handlePointerDown, { passive: true })
    window.addEventListener('mousedown', handlePointerDown, { passive: true })

    return () => {
      window.removeEventListener('keydown', handleRemoteKeyDown)
      window.removeEventListener('touchstart', handlePointerDown)
      window.removeEventListener('mousedown', handlePointerDown)
    }
  }, [explicitEnabled])

  // Recalcular layouts e reposicionar foco nas trocas de tela
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        SpatialNavigation.updateAllLayouts().catch(() => {})
        if (
          document.body.classList.contains('tv-remote-active') ||
          explicitEnabled ||
          isTVDevice()
        ) {
          setFocus(ROOT_FOCUS_KEY).catch(() => {})
        }
      } catch {}
    }, 300)
    return () => clearTimeout(timer)
  }, [explicitEnabled, routeKey])
}
