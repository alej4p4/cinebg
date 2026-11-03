import { useState, useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Home, Film, Tv, Radio, UserRound } from 'lucide-react'
import { isMobileDevice } from '@/utils/tv'
import { useAppStore } from '@/store/useAppStore'

const BOTTOM_NAV_ITEMS = [
  { to: '/', label: 'Início', icon: Home },
  { to: '/movies', label: 'Filmes', icon: Film },
  { to: '/series', label: 'Séries', icon: Tv },
  { to: '/live', label: 'TV Ao Vivo', icon: Radio },
  { to: '/profiles', label: 'Minha Conta', icon: UserRound },
]

export const BottomNav = () => {
  const location = useLocation()
  const { profiles, activeProfileId } = useAppStore()
  const activeProfile = profiles.find((p) => p.id === activeProfileId) || profiles[0]

  // Esconder suavemente ao rolar para baixo para liberar espaço e prevenir toques acidentais
  const [isVisible, setIsVisible] = useState(true)
  const lastScrollYRef = useRef(0)
  const touchStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const isDraggingRef = useRef(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    let ticking = false
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentY = window.scrollY
          const delta = currentY - lastScrollYRef.current

          // Só esconde se o usuário rolou para baixo mais de 8px e já passou do topo (50px)
          if (delta > 8 && currentY > 50) {
            setIsVisible(false)
          } else if (delta < -8 || currentY <= 30) {
            setIsVisible(true)
          }

          lastScrollYRef.current = currentY
          ticking = false
        })
        ticking = true
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Exclusivo para dispositivos móveis
  if (!isMobileDevice()) {
    return null
  }

  // Ocultar dentro do player de vídeo (/watch) ou canal de TV ao vivo para tela cheia imersiva
  if (
    location.pathname.startsWith('/watch') ||
    (typeof document !== 'undefined' && document.documentElement.classList.contains('cinebg-video-playing'))
  ) {
    return null
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      }
      isDraggingRef.current = false
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      const deltaX = Math.abs(e.touches[0].clientX - touchStartRef.current.x)
      const deltaY = Math.abs(e.touches[0].clientY - touchStartRef.current.y)
      if (deltaX > 10 || deltaY > 10) {
        isDraggingRef.current = true
      }
    }
  }

  return (
    <nav
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      className={`fixed bottom-0 left-0 right-0 z-40 bg-[#0c0d14]/95 backdrop-blur-xl border-t border-white/10 md:hidden transition-transform duration-300 pl-[env(safe-area-inset-left,0px)] pr-[env(safe-area-inset-right,0px)] ${
        isVisible ? 'translate-y-0' : 'translate-y-[calc(100%+env(safe-area-inset-bottom,0px))]'
      }`}
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      aria-label="Navegação inferior mobile"
    >
      <div className="flex items-center justify-around h-16 max-w-md mx-auto px-2">
        {BOTTOM_NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const isActive =
            item.to === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.to)

          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={(e) => {
                if (isDraggingRef.current) {
                  e.preventDefault()
                }
              }}
              className={`flex flex-col items-center justify-center flex-1 py-1 transition-all select-none active:scale-90 ${
                isActive
                  ? 'text-amber-400 font-bold scale-105'
                  : 'text-white/60 hover:text-white/90 font-medium'
              }`}
            >
              <div className="relative flex items-center justify-center">
                {item.to === '/profiles' && activeProfile ? (
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs transition-transform ${
                      isActive
                        ? 'ring-2 ring-amber-400 scale-110 shadow-lg shadow-amber-500/30'
                        : 'opacity-85'
                    }`}
                    style={{
                      backgroundColor: `${activeProfile.color}33`,
                      border: `1.5px solid ${activeProfile.color}`,
                    }}
                  >
                    {activeProfile.emoji}
                  </span>
                ) : (
                  <Icon
                    className={`w-5 h-5 transition-transform ${
                      isActive ? 'stroke-[2.5px]' : 'stroke-2'
                    }`}
                  />
                )}
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-amber-400 shadow-[0_0_6px_#fbbf24]" />
                )}
              </div>
              <span className="text-[10px] mt-1 tracking-tight leading-tight font-display">
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

export default BottomNav
