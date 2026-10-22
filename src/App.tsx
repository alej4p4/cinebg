import { lazy, Suspense, useState, useEffect, useCallback } from 'react'
import { BrowserRouter, Routes, Route, useLocation, useNavigate, Navigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { App as CapApp } from '@capacitor/app'
import Navbar from '@/components/layout/Navbar'
import ErrorBoundary from '@/components/ErrorBoundary'
import { SkeletonCarousel } from '@/components/ui/SkeletonCard'
import ProgressBar from '@/components/ui/ProgressBar'
import SplashScreen from '@/components/ui/SplashScreen'
import { useEpisodeNotifications } from '@/hooks/useEpisodeNotifications'
import { useSpatialNavigation } from '@/hooks/useSpatialNavigation'
import { useOrientationFullscreen } from '@/hooks/useOrientationFullscreen'
import { useAppStore } from '@/store/useAppStore'
import { isTVDevice, isMobileDevice, markBackHandled, wasBackRecentlyHandled } from '@/utils/tv'
import { trackRouteView } from '@/services/observability'
import UpdateModal from '@/components/UpdateModal'
import { useLicense } from '@/hooks/useLicense'
import LicenseGate from '@/components/LicenseGate'
import TvCursorOverlay from '@/components/tv/TvCursorOverlay'
import BottomNav from '@/components/layout/BottomNav'
import { setFocus, doesFocusableExist, getCurrentFocusKey, SpatialNavigation } from '@noriginmedia/norigin-spatial-navigation'

const Home = lazy(() => import('@/pages/Home'))
const Movies = lazy(() => import('@/pages/Movies'))
const Series = lazy(() => import('@/pages/Series'))
const Anime = lazy(() => import('@/pages/Anime'))
const LiveTV = lazy(() => import('@/pages/LiveTV'))
const Watch = lazy(() => import('@/pages/Watch'))
const Details = lazy(() => import('@/pages/Details'))
const Search = lazy(() => import('@/pages/Search'))
const Favorites = lazy(() => import('@/pages/Favorites'))
const MyList = lazy(() => import('@/pages/MyList'))
const History = lazy(() => import('@/pages/History'))
const Profiles = lazy(() => import('@/pages/Profiles'))
const Downloads = lazy(() => import('@/pages/Downloads'))

const PageFallback = () => (
  <div className="min-h-screen bg-bg-primary pt-24 space-y-8">
    <ProgressBar isLoading={true} />
    <SkeletonCarousel count={6} />
    <SkeletonCarousel count={6} />
  </div>
)

const AnimatedRoutes = ({ isVipActive }: { isVipActive: boolean }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const { tvMode, setVipModalOpen } = useAppStore()
  useSpatialNavigation(tvMode || isTVDevice(), location.pathname)

  useEffect(() => {
    trackRouteView(location.pathname)
  }, [location.pathname])

  useEffect(() => {
    if (!isVipActive) {
      setVipModalOpen(true)
    }
  }, [isVipActive, setVipModalOpen])

  // Tratamento universal do botao Voltar do controle remoto e do Android (Sem disparo duplo e sem pular para a Home)
  useEffect(() => {
    const performSafeBack = () => {
      if (wasBackRecentlyHandled(600)) return
      markBackHandled()

      if (location.pathname === '/') {
        return
      }

      // Se estiver no player (/watch/:type/:id), volta sempre para a tela de Sinopse/Detalhes (/details/:type/:id)
      if (location.pathname.startsWith('/watch/')) {
        const historyIdx = window.history.state?.idx ?? 0
        if (historyIdx > 0) {
          navigate(-1)
        } else {
          navigate(location.pathname.replace('/watch/', '/details/'), { replace: true })
        }
        return
      }

      const historyIdx = window.history.state?.idx ?? 0
      if (historyIdx > 0) {
        navigate(-1)
      } else {
        navigate('/', { replace: true })
      }
    }

    let removeListener: (() => void) | null = null
    let disposed = false
    try {
      CapApp.addListener('backButton', () => {
        if (wasBackRecentlyHandled(600)) return
        if (location.pathname === '/') {
          CapApp.exitApp()
        } else {
          performSafeBack()
        }
      })
        .then((h) => {
          // Evita vazamento de listener quando a rota muda antes da Promise resolver
          if (disposed) {
            h.remove()
          } else {
            removeListener = () => h.remove()
          }
        })
        .catch(() => {})
    } catch {}

    const handleWebBackKey = (e: KeyboardEvent) => {
      // Se a tecla já foi tratada por um player em tela cheia, modal ou input, não altera rota
      if (e.defaultPrevented || wasBackRecentlyHandled(600)) return

      // Detecta se há algum modal/overlay aberto (fixed inset-0 com z-index alto)
      const hasModalOpen = document.querySelector(
        '.fixed.inset-0.z-50, .fixed.inset-0.z-\\[10000\\], .fixed.inset-0.z-50.flex, [data-radix-dialog-overlay], .animate-in.fade-in'
      )

      const code = e.keyCode || e.which
      // Teclas Voltar / Escape de controle remoto ou teclado (Android TV, Tizen, LG WebOS)
      if (
        e.key === 'Escape' ||
        e.key === 'GoBack' ||
        code === 27 ||
        code === 4 ||
        code === 10009 ||
        code === 461 ||
        code === 283
      ) {
        // Se há modal aberto, não intercepta - deixa o modal tratar
        if (hasModalOpen) {
          return
        }
        if (location.pathname !== '/') {
          e.preventDefault()
          performSafeBack()
        }
      }
    }
    window.addEventListener('keydown', handleWebBackKey)

    return () => {
      disposed = true
      removeListener?.()
      window.removeEventListener('keydown', handleWebBackKey)
    }
  }, [location.pathname, navigate])

  return (
    <Suspense fallback={<PageFallback />}>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Home />} />
          <Route path="/movies" element={<Movies />} />
          <Route path="/series" element={<Series />} />
          <Route path="/anime" element={<Anime />} />
          <Route path="/live" element={<LiveTV />} />
          <Route path="/search" element={<Search />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/my-list" element={<MyList />} />
          <Route path="/history" element={<History />} />
          <Route path="/profiles" element={<Profiles />} />
          <Route path="/downloads" element={<Downloads />} />
          <Route path="/watch/:type/:id" element={<Watch />} />
          <Route path="/details/:type/:id" element={<Details />} />

          {/* Rotas canônicas e atalhos estilo YuCine */}
          <Route path="/movie" element={<Navigate to="/movies" replace />} />
          <Route path="/filmes" element={<Navigate to="/movies" replace />} />
          <Route path="/filme" element={<Navigate to="/movies" replace />} />
          <Route path="/serie" element={<Navigate to="/series" replace />} />
          <Route path="/player/:type/:id" element={<Navigate to="/watch/:type/:id" replace />} />
          <Route
            path="*"
            element={
              <div className="min-h-screen pt-24 px-8 text-center">
                <h1 className="text-4xl font-bold mb-4">404</h1>
                <p>Página não encontrada</p>
              </div>
            }
          />
        </Routes>
      </AnimatePresence>
    </Suspense>
  )
}

function App() {
  useEpisodeNotifications()
  useOrientationFullscreen()
  const { isLicensed, isTrial, loading } = useLicense()
  const {
    vipModalOpen,
    setVipModalOpen,
    updateModalOpen,
    setUpdateModalOpen,
    updateInfo,
    isCheckingUpdate,
    checkForUpdates,
  } = useAppStore()
  const [showSplash, setShowSplash] = useState(true)

  const handleUpdateComplete = useCallback(() => {
    // Re-inicializa a navegação espacial após atualização concluir
    try {
      SpatialNavigation.updateAllLayouts().catch(() => {})
      const current = getCurrentFocusKey()
      if (current && current !== 'SN:ROOT' && doesFocusableExist(current)) {
        return
      }
      if (doesFocusableExist('hero-watch-btn')) {
        setFocus('hero-watch-btn')
      } else if (doesFocusableExist('card-0-0')) {
        setFocus('card-0-0')
      }
    } catch {}
  }, [])

  useEffect(() => {
    checkForUpdates(false).catch(() => {})
  }, [checkForUpdates])

  const handleSplashComplete = useCallback(() => {
    // Garante que o splash sempre some, mesmo que algo dê erro depois
    setShowSplash(false)
    const focusHome = () => {
      try {
        SpatialNavigation.updateAllLayouts().catch(() => {})
        const current = getCurrentFocusKey()
        if (current && current !== 'SN:ROOT' && doesFocusableExist(current)) {
          return
        }
        if (doesFocusableExist('hero-watch-btn')) {
          setFocus('hero-watch-btn')
        } else if (doesFocusableExist('card-0-0')) {
          setFocus('card-0-0')
        }
      } catch {}
    }

    focusHome()
    setTimeout(focusHome, 120)
    setTimeout(focusHome, 450)
  }, [])

  // Watchdog de segurança: garante que o splash some mesmo se algo falhar
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false)
    }, 3500)
    return () => clearTimeout(timer)
  }, [])

  const isVipOrTrialActive = isLicensed || isTrial

  return (
    <>
      <AnimatePresence>
        {showSplash && (
          <SplashScreen
            version={updateInfo.currentVersion}
            onComplete={handleSplashComplete}
          />
        )}
      </AnimatePresence>

      {loading && showSplash ? null : loading ? (
        <div className="min-h-screen bg-bg-primary flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-white/10 border-t-accent-red rounded-full animate-spin" />
        </div>
      ) : !isVipOrTrialActive ? (
        <>
          <ErrorBoundary>
            <LicenseGate isModal={false} />
            {!isMobileDevice() && <TvCursorOverlay />}
          </ErrorBoundary>
          <UpdateModal
            visible={updateModalOpen}
            downloadUrl={updateInfo.downloadUrl}
            currentVersion={updateInfo.currentVersion}
            latestVersion={updateInfo.latestVersion}
            hasUpdate={updateInfo.hasUpdate}
            isChecking={isCheckingUpdate}
            onDismiss={() => setUpdateModalOpen(false)}
            onCheckAgain={() => checkForUpdates(true)}
            onUpdateComplete={handleUpdateComplete}
          />
        </>
      ) : (
        <BrowserRouter>
          <ErrorBoundary>
            <div className="min-h-screen bg-bg-primary text-text-primary pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))] md:pb-0">
              <Navbar />
              <main>
                <AnimatedRoutes isVipActive={isVipOrTrialActive} />
              </main>
              <BottomNav />
              {!isMobileDevice() && <TvCursorOverlay />}
            </div>
          </ErrorBoundary>
          <UpdateModal
            visible={updateModalOpen}
            downloadUrl={updateInfo.downloadUrl}
            currentVersion={updateInfo.currentVersion}
            latestVersion={updateInfo.latestVersion}
            hasUpdate={updateInfo.hasUpdate}
            isChecking={isCheckingUpdate}
            onDismiss={() => setUpdateModalOpen(false)}
            onCheckAgain={() => checkForUpdates(true)}
            onUpdateComplete={handleUpdateComplete}
          />
          {vipModalOpen && (
            <LicenseGate isModal={true} onClose={() => setVipModalOpen(false)} />
          )}
        </BrowserRouter>
      )}
    </>
  )
}

export default App
