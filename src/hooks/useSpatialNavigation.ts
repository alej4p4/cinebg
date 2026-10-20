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
import { isTvRemoteKey, isTVDevice, markTvModeActive, isMobileDevice } from '@/utils/tv'

let isInitialized = false

/**
 * Hook para controle remoto e navegação espacial (Android TV, Fire TV, TV Box, Teclado/D-Pad).
 * Otimizado para não roubar o foco quando o usuário já está navegando e evitar sobrecarga de layout.
 */
export const useSpatialNavigation = (explicitEnabled: boolean, routeKey: string) => {
  useEffect(() => {
    if (isMobileDevice()) {
      return
    }
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
        // Throttle de 32ms (~30fps de repetição de tecla ao segurar seta) para evitar engasgos na Main Thread de TVs
        setThrottle({ throttle: 32 })
        isInitialized = true
      } catch (err) {
        console.warn('Erro ao inicializar spatial navigation:', err)
      }
    }

    const setInitialFocusIfUnfocused = (forceOnRouteChange = false) => {
      const currentKey = getCurrentFocusKey()
      // Se já existe um elemento focado válido na tela atual e não é troca de rota forçada, NÃO rouba o foco do usuário
      if (!forceOnRouteChange && currentKey && currentKey !== ROOT_FOCUS_KEY && doesFocusableExist(currentKey)) {
        return
      }

      if (routeKey === '/' || !routeKey) {
        if (doesFocusableExist('hero-watch-btn')) {
          setFocus('hero-watch-btn')
          return
        }
        if (doesFocusableExist('card-0-0')) {
          setFocus('card-0-0')
          return
        }
        if (doesFocusableExist('card-1-0')) {
          setFocus('card-1-0')
          return
        }
      }

      if (routeKey === '/search') {
        if (doesFocusableExist('tvkey-A')) {
          setFocus('tvkey-A')
          return
        }
      }

      if (routeKey.startsWith('/details')) {
        if (doesFocusableExist('details-fullscreen')) {
          setFocus('details-fullscreen')
          return
        }
        if (doesFocusableExist('details-play')) {
          setFocus('details-play')
          return
        }
      }

      if (routeKey === '/live') {
        if (doesFocusableExist('cat-todos')) {
          setFocus('cat-todos')
          return
        }
      }

      if (routeKey === '/movies') {
        if (doesFocusableExist('movie-card-0')) {
          setFocus('movie-card-0')
          return
        }
        if (doesFocusableExist('movies-platform-all')) {
          setFocus('movies-platform-all')
          return
        }
      }

      if (routeKey === '/series') {
        if (doesFocusableExist('series-card-0')) {
          setFocus('series-card-0')
          return
        }
        if (doesFocusableExist('series-platform-all')) {
          setFocus('series-platform-all')
          return
        }
      }

      if (routeKey === '/anime') {
        if (doesFocusableExist('anime-card-0')) {
          setFocus('anime-card-0')
          return
        }
      }

      if (routeKey === '/favorites') {
        if (doesFocusableExist('fav-card-0')) {
          setFocus('fav-card-0')
          return
        }
        if (doesFocusableExist('empty-state-action')) {
          setFocus('empty-state-action')
          return
        }
      }

      if (routeKey === '/my-list') {
        if (doesFocusableExist('mylist-card-0')) {
          setFocus('mylist-card-0')
          return
        }
        if (doesFocusableExist('empty-state-action')) {
          setFocus('empty-state-action')
          return
        }
      }

      if (routeKey === '/history') {
        if (doesFocusableExist('history-play-0')) {
          setFocus('history-play-0')
          return
        }
        if (doesFocusableExist('empty-state-action')) {
          setFocus('empty-state-action')
          return
        }
      }

      if (routeKey === '/downloads') {
        if (doesFocusableExist('download-play-0')) {
          setFocus('download-play-0')
          return
        }
        if (doesFocusableExist('downloads-back-btn')) {
          setFocus('downloads-back-btn')
          return
        }
      }

      if (routeKey === '/profiles') {
        if (doesFocusableExist('profile-card-0')) {
          setFocus('profile-card-0')
          return
        }
      }

      if (doesFocusableExist('details-fullscreen')) {
        setFocus('details-fullscreen')
      } else if (doesFocusableExist('details-play')) {
        setFocus('details-play')
      } else if (doesFocusableExist('hero-watch-btn')) {
        setFocus('hero-watch-btn')
      } else if (doesFocusableExist('yucine-hero-banner')) {
        setFocus('yucine-hero-banner')
      } else if (doesFocusableExist('card-0-0')) {
        setFocus('card-0-0')
      } else if (doesFocusableExist('nav-item-0')) {
        setFocus('nav-item-0')
      }
    }

    if (explicitEnabled || isTVDevice()) {
      markTvModeActive()
      const t1 = setTimeout(() => setInitialFocusIfUnfocused(true), 120)
      const t2 = setTimeout(() => setInitialFocusIfUnfocused(false), 500)
      return () => {
        clearTimeout(t1)
        clearTimeout(t2)
      }
    }

    const handleRemoteKeyDown = (e: KeyboardEvent) => {
      if (isTvRemoteKey(e)) {
        markTvModeActive()
        setInitialFocusIfUnfocused(false)
      }
    }

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
  }, [explicitEnabled, routeKey])

  // Atualiza layouts apenas uma vez por mudança de rota (sem poluir o foco se já estiver posicionado)
  useEffect(() => {
    if (isMobileDevice()) {
      return
    }
    const timer = setTimeout(() => {
      try {
        SpatialNavigation.updateAllLayouts().catch(() => {})
      } catch {}
    }, 220)
    return () => clearTimeout(timer)
  }, [explicitEnabled, routeKey])
}
