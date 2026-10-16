import { lazy, Suspense, useState } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import Navbar from '@/components/layout/Navbar'
import ErrorBoundary from '@/components/ErrorBoundary'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import SplashScreen from '@/components/ui/SplashScreen'
import { useEpisodeNotifications } from '@/hooks/useEpisodeNotifications'
import { useSpatialNavigation } from '@/hooks/useSpatialNavigation'
import { useOrientationFullscreen } from '@/hooks/useOrientationFullscreen'
import { useAppStore } from '@/store/useAppStore'
import { isTVDevice } from '@/utils/tv'
import { useAppUpdate } from '@/hooks/useAppUpdate'
import UpdateModal from '@/components/UpdateModal'
import { useLicense } from '@/hooks/useLicense'
import LicenseGate from '@/components/LicenseGate'

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
  <div className="min-h-screen bg-bg-primary flex items-center justify-center">
    <LoadingSpinner size="lg" label="Carregando..." />
  </div>
)

const AnimatedRoutes = () => {
  const location = useLocation()
  const { tvMode } = useAppStore()
  useSpatialNavigation(tvMode || isTVDevice(), location.pathname)
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
  const { update, dismiss } = useAppUpdate()
  const { isLicensed, isTrial, loading } = useLicense()
  const [showSplash, setShowSplash] = useState(true)

  return (
    <>
      <AnimatePresence>
        {showSplash && (
          <SplashScreen
            version="1.2.0"
            onComplete={() => setShowSplash(false)}
          />
        )}
      </AnimatePresence>

      {loading ? (
        <div className="min-h-screen bg-bg-primary flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-white/10 border-t-accent-red rounded-full animate-spin" />
        </div>
      ) : !isLicensed && !isTrial ? (
        <LicenseGate />
      ) : (
        <BrowserRouter>
          <ErrorBoundary>
            <div className="min-h-screen bg-bg-primary text-text-primary">
              <Navbar />
              <main>
                <AnimatedRoutes />
              </main>
            </div>
          </ErrorBoundary>
          <UpdateModal
            visible={!!update}
            downloadUrl={update?.downloadUrl ?? ''}
            onDismiss={dismiss}
          />
        </BrowserRouter>
      )}
    </>
  )
}

export default App
