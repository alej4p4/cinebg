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

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-[#0c0d14]/95 backdrop-blur-xl border-t border-white/10 md:hidden transition-transform duration-300 pl-[env(safe-area-inset-left,0px)] pr-[env(safe-area-inset-right,0px)]"
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
