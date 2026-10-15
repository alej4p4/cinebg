import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import Navbar from '@/components/layout/Navbar'
import ErrorBoundary from '@/components/ErrorBoundary'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { useEpisodeNotifications } from '@/hooks/useEpisodeNotifications'
import { useSpatialNavigation } from '@/hooks/useSpatialNavigation'
import { useOrientationFullscreen } from '@/hooks/useOrientationFullscreen'
import { useAppStore } from '@/store/useAppStore'
import { isTVDevice } from '@/utils/tv'

const Home = lazy(() => import('@/pages/Home'))
const Movies = lazy(() => import('@/pages/Movies'))
const Series = lazy(() => import('@/pages/Series'))
const Anime = lazy(() => import('@/pages/Anime'))
const LiveTV = lazy(() => import('@/pages/LiveTV'))
const Watch = lazy(() => import('@/pages/Watch'))
const Details = lazy(() => import('@/pages/Details'))
const Search = lazy(() => import('@/pages/Search'))
const Favorites = lazy(() => import('@/pages/Favorites'))
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

  return (
    <BrowserRouter>
      <ErrorBoundary>
        <div className="min-h-screen bg-bg-primary text-text-primary">
          <Navbar />
          <main>
            <AnimatedRoutes />
          </main>
        </div>
      </ErrorBoundary>
    </BrowserRouter>
  )
}

export default App
