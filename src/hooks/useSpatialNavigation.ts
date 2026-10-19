import { useEffect } from 'react'
import {
  init,
  setFocus,
  setKeyMap,
  setThrottle,
  SpatialNavigation,
  ROOT_FOCUS_KEY,
  getCurrentFocusKey,
  doesFocusableExist,
} from '@noriginmedia/norigin-spatial-navigation'
import { isTvRemoteKey, isTVDevice, markTvModeActive } from '@/utils/tv'

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
          enter: [13, 23, 'Enter', 'Select', 'OK'],
        })
        setThrottle({ throttle: 20 })
        isInitialized = true
      } catch (err) {
        console.warn('Erro ao inicializar spatial navigation:', err)
      }
    }

    const setInitialFocus = () => {
      if (doesFocusableExist('details-play')) {
        setFocus('details-play')
      } else if (doesFocusableExist('hero-watch-btn')) {
        setFocus('hero-watch-btn')
      } else if (doesFocusableExist('yucine-hero-banner')) {
        setFocus('yucine-hero-banner')
      } else if (doesFocusableExist('card-0-0')) {
        setFocus('card-0-0')
      } else if (doesFocusableExist('nav-item-0')) {
        setFocus('nav-item-0')
      } else {
        setFocus(ROOT_FOCUS_KEY).catch(() => {})
      }
    }

    // Se o dispositivo ja e uma TV identificada ou explicitamente ativado
    if (explicitEnabled || isTVDevice()) {
      markTvModeActive()
      const timer = setTimeout(() => {
        setInitialFocus()
      }, 350)
      return () => clearTimeout(timer)
    }

    // Auto-ativacao: Ouvinte global de teclas do controle remoto
    const handleRemoteKeyDown = (e: KeyboardEvent) => {
      if (isTvRemoteKey(e)) {
        markTvModeActive()
        const currentKey = getCurrentFocusKey()
        if (!currentKey || currentKey === ROOT_FOCUS_KEY) {
          setInitialFocus()
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
