import React, { useState, useEffect, useRef, useCallback } from 'react'
import { isTVDevice, isTvRemoteKey, markTvModeActive, isMobileDevice } from '@/utils/tv'
import { useAppStore } from '@/store/useAppStore'
import { SpatialNavigation } from '@noriginmedia/norigin-spatial-navigation'
import { MousePointer2 } from 'lucide-react'

type NavigationMode = 'focus' | 'cursor'
type Direction = 'up' | 'down' | 'left' | 'right'

const getDirectionFromEvent = (e: KeyboardEvent): Direction | null => {
  const code = e.keyCode || e.which
  const key = (e.key || '').toLowerCase()
  if (code === 38 || code === 19 || key === 'arrowup' || key === 'up') return 'up'
  if (code === 40 || code === 20 || key === 'arrowdown' || key === 'down') return 'down'
  if (code === 37 || code === 21 || key === 'arrowleft' || key === 'left') return 'left'
  if (code === 39 || code === 22 || key === 'arrowright' || key === 'right') return 'right'
  return null
}

const isEnterEvent = (e: KeyboardEvent): boolean => {
  const code = e.keyCode || e.which
  const key = (e.key || '').toLowerCase()
  return (
    code === 13 || // Enter
    code === 23 || // KEYCODE_DPAD_CENTER
    code === 66 || // KEYCODE_ENTER (Android)
    code === 160 || // NUMPAD_ENTER
    code === 96 || // BUTTON_A
    key === 'enter' ||
    key === 'select' ||
    key === 'ok' ||
    key === ' '
  )
}

const isToggleModeEvent = (e: KeyboardEvent): boolean => {
  // Se estiver em campo de texto ou input, NUNCA alterna modo de cursor
  const activeEl = typeof document !== 'undefined' ? document.activeElement : null
  if (
    activeEl &&
    (activeEl.tagName === 'INPUT' ||
      activeEl.tagName === 'TEXTAREA' ||
      (activeEl as HTMLElement).isContentEditable)
  ) {
    return false
  }

  const code = e.keyCode || e.which
  const key = (e.key || '').toLowerCase()

  // NUNCA disparar com letras normais do teclado (R, C, M, ou qualquer A-Z: 65 a 90)
  // Nota: o keycode 82 é a letra 'R' no browser! Não pode alternar o cursor!
  if (
    key === 'r' ||
    key === 'c' ||
    key === 'm' ||
    (code >= 65 && code <= 90) ||
    (code >= 97 && code <= 122)
  ) {
    return false
  }

  // Apenas teclas reais exclusivas de controle remoto de TV
  return (
    code === 165 || // KEYCODE_INFO
    code === 172 || // KEYCODE_GUIDE
    key === 'contextmenu' ||
    key === 'menu' ||
    key === 'info' ||
    key === 'guide'
  )
}

export const TvCursorOverlay: React.FC = () => {
  // Celulares e tablets móveis NUNCA devem renderizar ou ativar o cursor virtual
  if (isMobileDevice()) {
    try {
      localStorage.removeItem('cinebg_virtual_cursor')
      localStorage.removeItem('cinebg_tv_mode')
      document.body.classList.remove('tv-mode', 'tv-remote-active')
    } catch {}
    return null
  }
  const { tvMode, virtualCursor, setVirtualCursor } = useAppStore()
  const [isTvActive, setIsTvActive] = useState(false)
  const [navMode, setNavMode] = useState<NavigationMode>(() => (virtualCursor ? 'cursor' : 'focus'))
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 })
  const [isClicking, setIsClicking] = useState(false)
  const [showBadge, setShowBadge] = useState(false)

  const posRef = useRef({ x: 0, y: 0 })
  const speedRef = useRef(20) // Velocidade base do cursor (pixels por frame)
  const activeDirectionsRef = useRef<Set<Direction>>(new Set())
  const animationFrameRef = useRef<number | null>(null)
  const hideBadgeTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Sincroniza o modo inicial com a preferencia salva na Store (apenas se for TV legítima)
  useEffect(() => {
    if (isMobileDevice()) {
      setIsTvActive(false)
      setVirtualCursor(false)
      return
    }
    if (virtualCursor) {
      setNavMode('cursor')
      setIsTvActive(true)
    }
  }, [virtualCursor, setVirtualCursor])

  // Detecta dispositivo de TV ou ativacao por controle remoto
  useEffect(() => {
    const checkTv = () => {
      if (isMobileDevice()) {
        setIsTvActive(false)
        return
      }
      if (
        isTVDevice() ||
        tvMode ||
        virtualCursor ||
        document.body.classList.contains('tv-remote-active') ||
        document.body.classList.contains('tv-mode')
      ) {
        setIsTvActive(true)
      }
    }
    checkTv()

    // Centraliza o cursor virtual na tela inicialmente
    if (typeof window !== 'undefined') {
      const initialPos = {
        x: Math.round(window.innerWidth / 2),
        y: Math.round(window.innerHeight / 2),
      }
      posRef.current = initialPos
      setCursorPos(initialPos)
    }

    const handleGlobalKey = (e: KeyboardEvent) => {
      if (isTvRemoteKey(e)) {
        setIsTvActive(true)
        markTvModeActive()

        // Alternancia rapida com atalhos de controle remoto (Menu, Info, Guide, C, M)
        if (isToggleModeEvent(e)) {
          e.preventDefault()
          e.stopPropagation()
          setNavMode((prev) => {
            const next = prev === 'focus' ? 'cursor' : 'focus'
            setVirtualCursor(next === 'cursor')
            if (next === 'cursor') {
              setShowBadge(true)
              if (hideBadgeTimerRef.current) clearTimeout(hideBadgeTimerRef.current)
              hideBadgeTimerRef.current = setTimeout(() => {
                setShowBadge(false)
              }, 3000)
            } else {
              setShowBadge(false)
            }
            return next
          })
        }
      }
    }

    window.addEventListener('keydown', handleGlobalKey, { passive: false })
    return () => window.removeEventListener('keydown', handleGlobalKey)
  }, [tvMode, virtualCursor, setVirtualCursor])

  // Temporizador para esconder badge discretamente apos 6 segundos
  const refreshBadgeVisibility = useCallback(() => {
    setShowBadge(true)
    if (hideBadgeTimerRef.current) clearTimeout(hideBadgeTimerRef.current)
    hideBadgeTimerRef.current = setTimeout(() => {
      setShowBadge(false)
    }, 6000)
  }, [])

  // Gerencia o congelamento/reativacao da navegacao espacial do Norigin
  useEffect(() => {
    try {
      if (navMode === 'cursor') {
        SpatialNavigation.pause()
      } else {
        SpatialNavigation.resume()
      }
    } catch {}
  }, [navMode])

  // Loop de movimentacao suave com aceleracao continua no modo cursor
  useEffect(() => {
    if (!isTvActive || navMode !== 'cursor') {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }
      activeDirectionsRef.current.clear()
      return
    }

    const moveLoop = () => {
      const dirs = activeDirectionsRef.current
      if (dirs.size > 0) {
        let dx = 0
        let dy = 0

        if (dirs.has('left')) dx -= 1
        if (dirs.has('right')) dx += 1
        if (dirs.has('up')) dy -= 1
        if (dirs.has('down')) dy += 1

        if (dx !== 0 || dy !== 0) {
          // Aceleracao suave e dinamica ao segurar a tecla (de 20px ate 48px)
          speedRef.current = Math.min(speedRef.current + 1.4, 48)

          const newX = Math.max(
            8,
            Math.min(window.innerWidth - 8, posRef.current.x + dx * speedRef.current)
          )
          const newY = Math.max(
            8,
            Math.min(window.innerHeight - 8, posRef.current.y + dy * speedRef.current)
          )

          posRef.current = { x: newX, y: newY }
          setCursorPos({ x: newX, y: newY })

          // Rolagem automatica de pagina ao atingir as bordas superior/inferior
          const edgeMargin = 75
          if (newY < edgeMargin) {
            window.scrollBy({ top: -speedRef.current * 1.6, behavior: 'auto' })
          } else if (newY > window.innerHeight - edgeMargin) {
            window.scrollBy({ top: speedRef.current * 1.6, behavior: 'auto' })
          }
        }
      } else {
        speedRef.current = 20
      }

      animationFrameRef.current = requestAnimationFrame(moveLoop)
    }

    animationFrameRef.current = requestAnimationFrame(moveLoop)

    const handleCursorKeyDown = (e: KeyboardEvent) => {
      const dir = getDirectionFromEvent(e)
      if (dir) {
        e.preventDefault()
        e.stopPropagation()
        activeDirectionsRef.current.add(dir)
        return
      }

      if (isEnterEvent(e)) {
        e.preventDefault()
        e.stopPropagation()

        setIsClicking(true)
        setTimeout(() => setIsClicking(false), 220)

        // Localiza e clica no elemento na posicao exata do cursor virtual
        const target = document.elementFromPoint(
          posRef.current.x,
          posRef.current.y
        ) as HTMLElement | null

        if (target) {
          const clickable = target.closest(
            'button, a, [role="button"], input, select, textarea, [tabindex], .cursor-pointer'
          ) as HTMLElement | null

          const elementToClick = clickable || target
          try {
            elementToClick.focus?.()
            elementToClick.click?.()

            // Dispara tambem eventos de mouse nativos com coordenadas reais para players e controles
            const mouseOpts = {
              bubbles: true,
              cancelable: true,
              view: window,
              clientX: posRef.current.x,
              clientY: posRef.current.y,
            }
            elementToClick.dispatchEvent(new MouseEvent('mousedown', mouseOpts))
            elementToClick.dispatchEvent(new MouseEvent('mouseup', mouseOpts))
          } catch {}
        }
      }
    }

    const handleCursorKeyUp = (e: KeyboardEvent) => {
      const dir = getDirectionFromEvent(e)
      if (dir) {
        activeDirectionsRef.current.delete(dir)
      }
    }

    window.addEventListener('keydown', handleCursorKeyDown, { capture: true })
    window.addEventListener('keyup', handleCursorKeyUp, { capture: true })

    return () => {
      window.removeEventListener('keydown', handleCursorKeyDown, { capture: true })
      window.removeEventListener('keyup', handleCursorKeyUp, { capture: true })
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)
    }
  }, [isTvActive, navMode, refreshBadgeVisibility])

  if (
    !isTvActive ||
    (typeof navigator !== 'undefined' && navigator.userAgent.includes('CineBG-Mobile')) ||
    (typeof window !== 'undefined' &&
      (window.innerHeight > window.innerWidth || window.innerWidth < 768))
  ) {
    return null
  }

  return (
    <>
      {/* Indicador temporário exibido apenas quando o Cursor Virtual for ativado */}
      {navMode === 'cursor' && showBadge && (
        <div className="fixed top-4 right-4 z-[9999] transition-all duration-300 pointer-events-none">
          <div className="flex items-center gap-2 bg-[#0c0d14]/95 backdrop-blur-md border border-amber-400/40 px-3.5 py-1.5 rounded-full text-xs font-semibold text-white shadow-2xl">
            <MousePointer2 className="w-3.5 h-3.5 text-accent-red animate-pulse" />
            <span className="font-bold text-amber-300">Cursor Virtual Ativo</span>
            <span className="text-[10px] text-white/60 bg-white/10 px-1.5 py-0.5 rounded font-mono">
              Menu = Foco D-Pad
            </span>
          </div>
        </div>
      )}

      {/* Ponteiro do Cursor Virtual na Tela */}
      {navMode === 'cursor' && (
        <div
          className="fixed pointer-events-none z-[100000] transition-transform duration-75 ease-out"
          style={{
            left: `${cursorPos.x}px`,
            top: `${cursorPos.y}px`,
            transform: `translate(-2px, -2px) scale(${isClicking ? 0.82 : 1})`,
          }}
        >
          <div className="relative">
            <svg
              className="w-8 h-8 drop-shadow-[0_4px_14px_rgba(229,9,20,0.9)] filter"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M3 3L10.5 21L13.5 13.5L21 10.5L3 3Z"
                fill="#e50914"
                stroke="#ffffff"
                strokeWidth="2.2"
                strokeLinejoin="round"
              />
            </svg>
            {isClicking && (
              <div className="absolute -inset-3 rounded-full border-2 border-amber-400 animate-ping pointer-events-none" />
            )}
          </div>
        </div>
      )}
    </>
  )
}

export default TvCursorOverlay
