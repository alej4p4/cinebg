import React, { useState, useEffect, useRef, useCallback } from 'react'
import { isTVDevice, isTvRemoteKey } from '@/utils/tv'
import { MousePointer2, Move, Navigation } from 'lucide-react'

type NavigationMode = 'focus' | 'cursor'

export const TvCursorOverlay: React.FC = () => {
  const [isTv, setIsTv] = useState(false)
  const [navMode, setNavMode] = useState<NavigationMode>('focus')
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 })
  const [isClicking, setIsClicking] = useState(false)
  const [showBadge, setShowBadge] = useState(true)

  const posRef = useRef({ x: 0, y: 0 })
  const speedRef = useRef(24) // Pixels por pulso de tecla
  const keysDownRef = useRef<Set<string>>(new Set())
  const animationFrameRef = useRef<number | null>(null)
  const hideBadgeTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Detecta se esta em TV
  useEffect(() => {
    const checkTv = () => {
      if (isTVDevice() || document.body.classList.contains('tv-remote-active')) {
        setIsTv(true)
      }
    }
    checkTv()

    // Centraliza o cursor virtual na tela
    if (typeof window !== 'undefined') {
      const initialPos = {
        x: Math.round(window.innerWidth / 2),
        y: Math.round(window.innerHeight / 2),
      }
      posRef.current = initialPos
      setCursorPos(initialPos)
    }

    const handleAnyKey = (e: KeyboardEvent) => {
      if (isTvRemoteKey(e)) {
        setIsTv(true)
        // Alternancia rapida com a tecla Menu / ContextMenu / CC
        if (e.key === 'ContextMenu' || e.key === 'Menu' || e.keyCode === 82) {
          e.preventDefault()
          setNavMode((prev) => (prev === 'focus' ? 'cursor' : 'focus'))
          setShowBadge(true)
        }
      }
    }

    window.addEventListener('keydown', handleAnyKey)
    return () => window.removeEventListener('keydown', handleAnyKey)
  }, [])

  // Atualiza temporizador para esconder badge discretamente apos inatividade
  const refreshBadgeVisibility = useCallback(() => {
    setShowBadge(true)
    if (hideBadgeTimerRef.current) clearTimeout(hideBadgeTimerRef.current)
    hideBadgeTimerRef.current = setTimeout(() => {
      setShowBadge(false)
    }, 6000)
  }, [])

  // Loop de movimentacao suave do cursor virtual
  useEffect(() => {
    if (!isTv || navMode !== 'cursor') {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }
      return
    }

    const moveLoop = () => {
      const keys = keysDownRef.current
      if (keys.size > 0) {
        let dx = 0
        let dy = 0

        if (keys.has('ArrowLeft')) dx -= 1
        if (keys.has('ArrowRight')) dx += 1
        if (keys.has('ArrowUp')) dy -= 1
        if (keys.has('ArrowDown')) dy += 1

        if (dx !== 0 || dy !== 0) {
          refreshBadgeVisibility()
          // Aceleracao suave ao segurar tecla
          speedRef.current = Math.min(speedRef.current + 1.2, 50)

          const newX = Math.max(10, Math.min(window.innerWidth - 10, posRef.current.x + dx * speedRef.current))
          const newY = Math.max(10, Math.min(window.innerHeight - 10, posRef.current.y + dy * speedRef.current))

          posRef.current = { x: newX, y: newY }
          setCursorPos({ x: newX, y: newY })

          // Auto-scroll da tela quando o cursor atinge as bordas
          const edgeThreshold = 80
          if (newY < edgeThreshold) {
            window.scrollBy({ top: -speedRef.current * 1.5, behavior: 'auto' })
          } else if (newY > window.innerHeight - edgeThreshold) {
            window.scrollBy({ top: speedRef.current * 1.5, behavior: 'auto' })
          }
        }
      } else {
        speedRef.current = 24
      }

      animationFrameRef.current = requestAnimationFrame(moveLoop)
    }

    animationFrameRef.current = requestAnimationFrame(moveLoop)

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault()
        e.stopPropagation()
        keysDownRef.current.add(e.key)
      } else if (e.key === 'Enter' || e.key === 'Select' || e.key === 'OK' || e.keyCode === 13 || e.keyCode === 23) {
        e.preventDefault()
        e.stopPropagation()
        // Executa clique no elemento sob o cursor
        setIsClicking(true)
        setTimeout(() => setIsClicking(false), 200)

        const el = document.elementFromPoint(posRef.current.x, posRef.current.y) as HTMLElement | null
        if (el) {
          el.focus()
          // Dispara clique no elemento ou no seu ancestral clicavel
          const clickable = el.closest('button, a, [role="button"], .cursor-pointer, input') as HTMLElement | null
          if (clickable) {
            clickable.click()
          } else {
            el.click()
          }
        }
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        keysDownRef.current.delete(e.key)
      }
    }

    window.addEventListener('keydown', handleKeyDown, { capture: true })
    window.addEventListener('keyup', handleKeyUp, { capture: true })

    return () => {
      window.removeEventListener('keydown', handleKeyDown, { capture: true })
      window.removeEventListener('keyup', handleKeyUp, { capture: true })
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)
    }
  }, [isTv, navMode, refreshBadgeVisibility])

  if (!isTv) return null

  return (
    <>
      {/* Badge de Indicador do Modo de Navegacao TV (topo direito discreto) */}
      <div
        className={`fixed top-4 right-4 z-[9999] transition-all duration-300 pointer-events-auto ${
          showBadge ? 'opacity-90 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'
        }`}
      >
        <button
          onClick={() => {
            setNavMode((m) => (m === 'focus' ? 'cursor' : 'focus'))
            refreshBadgeVisibility()
          }}
          className="flex items-center gap-2 bg-[#08070d]/90 backdrop-blur-md border border-white/20 px-3.5 py-1.5 rounded-full text-xs font-semibold text-white shadow-2xl hover:border-amber-400 transition-colors"
          title="Clique para alternar entre Foco por Setas e Cursor Virtual de Mouse"
        >
          {navMode === 'focus' ? (
            <>
              <Navigation className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span>Modo Foco D-Pad</span>
              <span className="text-[10px] text-white/50 bg-white/10 px-1.5 py-0.5 rounded">Menu = Cursor</span>
            </>
          ) : (
            <>
              <MousePointer2 className="w-3.5 h-3.5 text-accent-red animate-pulse" />
              <span>Modo Cursor Virtual</span>
              <span className="text-[10px] text-white/50 bg-white/10 px-1.5 py-0.5 rounded">Menu = Foco</span>
            </>
          )}
        </button>
      </div>

      {/* Cursor Virtual Visivel na Tela */}
      {navMode === 'cursor' && (
        <div
          className="fixed pointer-events-none z-[100000] transition-transform duration-75 ease-out"
          style={{
            left: `${cursorPos.x}px`,
            top: `${cursorPos.y}px`,
            transform: `translate(-2px, -2px) scale(${isClicking ? 0.85 : 1})`,
          }}
        >
          {/* Efeito de brilho pulsante no ponteiro */}
          <div className="relative">
            <svg
              className="w-8 h-8 drop-shadow-[0_4px_12px_rgba(229,9,20,0.8)] filter"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M3 3L10.5 21L13.5 13.5L21 10.5L3 3Z"
                fill="#e50914"
                stroke="#ffffff"
                strokeWidth="2"
                strokeLinejoin="round"
              />
            </svg>
            {isClicking && (
              <div className="absolute -inset-2 rounded-full border-2 border-amber-400 animate-ping pointer-events-none" />
            )}
          </div>
        </div>
      )}
    </>
  )
}

export default TvCursorOverlay
