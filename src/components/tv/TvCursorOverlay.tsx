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
    code === 13 ||
    code === 23 ||
    code === 66 ||
    code === 160 ||
    code === 96 ||
    key === 'enter' ||
    key === 'select' ||
    key === 'ok'
  )
}

const isToggleModeEvent = (e: KeyboardEvent): boolean => {
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

  if (
    key.length === 1 ||
    key === 'r' ||
    key === 'c' ||
    key === 'm' ||
    (code >= 48 && code <= 90) ||
    (code >= 96 && code <= 122)
  ) {
    return false
  }

  return (
    code === 165 ||
    code === 172 ||
    key === 'contextmenu' ||
    key === 'menu' ||
    key === 'info' ||
    key === 'guide'
  )
}

const TvCursorOverlayContent: React.FC = () => {
  const { tvMode, virtualCursor, setVirtualCursor } = useAppStore()
  const [isTvActive, setIsTvActive] = useState(false)
  const [navMode, setNavMode] = useState<NavigationMode>(() => (virtualCursor ? 'cursor' : 'focus'))
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 })
  const [isClicking, setIsClicking] = useState(false)
  const [showBadge, setShowBadge] = useState(false)

  const posRef = useRef({ x: 0, y: 0 })
  const speedRef = useRef(20)
  const activeDirectionsRef = useRef<Set<Direction>>(new Set())
  const animationFrameRef = useRef<number | null>(null)
  const hideBadgeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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

    const alignToInitialTarget = () => {
      if (typeof window === 'undefined') return
      const targetEl =
        document.querySelector('[data-focus-key="hero-watch-btn"]') ||
        document.querySelector('[data-focus-key="card-0-0"]') ||
        document.querySelector('.tv-focused') ||
        document.querySelector('[data-focus-key="nav-item-0"]')
      if (targetEl) {
        const rect = targetEl.getBoundingClientRect()
        if (rect.width > 0 && rect.height > 0) {
          const targetPos = {
            x: Math.round(rect.left + rect.width / 2),
            y: Math.round(rect.top + rect.height / 2),
          }
          posRef.current = targetPos
          setCursorPos(targetPos)
          return
        }
      }
      const initialPos = {
        x: Math.round(window.innerWidth * 0.22),
        y: Math.round(window.innerHeight * 0.48),
      }
      posRef.current = initialPos
      setCursorPos(initialPos)
    }

    alignToInitialTarget()
    const tInitial1 = setTimeout(alignToInitialTarget, 300)

    const handleGlobalKey = (e: KeyboardEvent) => {
      if (isTvRemoteKey(e)) {
        setIsTvActive(true)
        markTvModeActive()

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
    return () => {
      window.removeEventListener('keydown', handleGlobalKey)
      clearTimeout(tInitial1)
    }
  }, [tvMode, virtualCursor, setVirtualCursor])

  const refreshBadgeVisibility = useCallback(() => {
    setShowBadge(true)
    if (hideBadgeTimerRef.current) clearTimeout(hideBadgeTimerRef.current)
    hideBadgeTimerRef.current = setTimeout(() => {
      setShowBadge(false)
    }, 6000)
  }, [])

  useEffect(() => {
    try {
      if (navMode === 'cursor') {
        SpatialNavigation.pause()
      } else {
        SpatialNavigation.resume()
      }
    } catch {}
  }, [navMode])

  // Loop de movimentação ON-DEMAND: roda requestAnimationFrame APENAS enquanto teclas direcionais estão pressionadas (0% uso de CPU ociosa)
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
      if (dirs.size === 0) {
        speedRef.current = 20
        animationFrameRef.current = null
        return
      }

      let dx = 0
      let dy = 0

      if (dirs.has('left')) dx -= 1
      if (dirs.has('right')) dx += 1
      if (dirs.has('up')) dy -= 1
      if (dirs.has('down')) dy += 1

      if (dx !== 0 || dy !== 0) {
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

        const edgeMargin = 75
        if (newY < edgeMargin) {
          window.scrollBy({ top: -speedRef.current * 1.6, behavior: 'auto' })
        } else if (newY > window.innerHeight - edgeMargin) {
          window.scrollBy({ top: speedRef.current * 1.6, behavior: 'auto' })
        }
      }

      animationFrameRef.current = requestAnimationFrame(moveLoop)
    }

    const startMoveLoopIfNeeded = () => {
      if (animationFrameRef.current === null && activeDirectionsRef.current.size > 0) {
        animationFrameRef.current = requestAnimationFrame(moveLoop)
      }
    }

    const handleCursorKeyDown = (e: KeyboardEvent) => {
      const dir = getDirectionFromEvent(e)
      if (dir) {
        e.preventDefault()
        e.stopPropagation()
        activeDirectionsRef.current.add(dir)
        startMoveLoopIfNeeded()
        return
      }

      if (isEnterEvent(e)) {
        e.preventDefault()
        e.stopPropagation()

        setIsClicking(true)
        setTimeout(() => setIsClicking(false), 220)

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
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }
    }
  }, [isTvActive, navMode, refreshBadgeVisibility])

  if (!isTvActive || isMobileDevice()) {
    return null
  }

  return (
    <>
      {navMode === 'cursor' && showBadge && (
        <div className="fixed top-4 right-4 z-[9999] transition-all duration-300 pointer-events-none">
          <div className="flex items-center gap-2 bg-[#0c0d14]/95 border border-amber-400/40 px-3.5 py-1.5 rounded-full text-xs font-semibold text-white shadow-2xl">
            <MousePointer2 className="w-3.5 h-3.5 text-accent-red" />
            <span className="font-bold text-amber-300">Cursor Virtual Ativo</span>
            <span className="text-[10px] text-white/60 bg-white/10 px-1.5 py-0.5 rounded font-mono">
              Menu = Foco D-Pad
            </span>
          </div>
        </div>
      )}

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
              className="w-8 h-8 drop-shadow-[0_4px_14px_rgba(229,9,20,0.9)]"
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

export const TvCursorOverlay: React.FC = () => {
  const [isMobile, setIsMobile] = useState(() => isMobileDevice())

  useEffect(() => {
    const check = () => {
      const mobile = isMobileDevice()
      setIsMobile(mobile)
      if (mobile) {
        try {
          localStorage.removeItem('cinebg_virtual_cursor')
          localStorage.removeItem('cinebg_tv_mode')
          document.body.classList.remove('tv-mode', 'tv-remote-active')
        } catch {}
      }
    }
    check()
    window.addEventListener('resize', check)
    window.addEventListener('orientationchange', check)
    return () => {
      window.removeEventListener('resize', check)
      window.removeEventListener('orientationchange', check)
    }
  }, [])

  if (isMobile) {
    return null
  }

  return <TvCursorOverlayContent />
}

export default TvCursorOverlay
