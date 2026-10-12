import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from '@/components/layout/Navbar'
import Home from '@/pages/Home'
import Movies from '@/pages/Movies'
import Series from '@/pages/Series'
import Anime from '@/pages/Anime'
import LiveTV from '@/pages/LiveTV'
import Watch from '@/pages/Watch'
import Details from '@/pages/Details'
import Search from '@/pages/Search'

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-bg-primary text-text-primary">
        <Navbar />
        
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/movies" element={<Movies />} />
            <Route path="/series" element={<Series />} />
            <Route path="/anime" element={<Anime />} />
            <Route path="/live" element={<LiveTV />} />
            <Route path="/search" element={<Search />} />
            <Route path="/watch/:type/:id" element={<Watch />} />
            <Route path="/details/:type/:id" element={<Details />} />
            <Route path="*" element={
              <div className="min-h-screen pt-24 px-8 text-center">
                <h1 className="text-4xl font-bold mb-4">404</h1>
                <p>Página não encontrada</p>
              </div>
            } />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App
