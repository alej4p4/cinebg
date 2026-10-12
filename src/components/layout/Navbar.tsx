import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Menu, X, Heart, Clock, Home, Film, Tv, Star, Radio } from 'lucide-react'

const NAV_LINKS = [
  { to: '/', label: 'Início', icon: Home },
  { to: '/movies', label: 'Filmes', icon: Film },
  { to: '/series', label: 'Séries', icon: Tv },
  { to: '/anime', label: 'Anime', icon: Star },
  { to: '/live', label: 'TV ao Vivo', icon: Radio },
]

const Navbar = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery('')
      setSearchFocused(false)
    }
  }

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled ? 'navbar-blur border-b border-white/5' : 'bg-gradient-to-b from-black/80 to-transparent'
      }`}
    >
      <div className="max-w-screen-2xl mx-auto px-4 md:px-8 h-16 flex items-center gap-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-accent-red flex items-center justify-center font-display font-black text-white text-sm">
            C
          </div>
          <span className="font-display font-black text-xl text-white hidden sm:block">
            Cine<span className="text-accent-red">BG</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1 ml-4">
          {NAV_LINKS.map(({ to, label }) => {
            const active = location.pathname === to
            return (
              <Link
                key={to}
                to={to}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  active
                    ? 'bg-white/10 text-white'
                    : 'text-white/70 hover:text-white hover:bg-white/5'
                }`}
              >
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Search */}
        <form onSubmit={handleSearch} className="relative">
          <div
            className={`flex items-center gap-2 rounded-full transition-all duration-300 border ${
              searchFocused
                ? 'bg-bg-card border-white/20 w-48 md:w-64'
                : 'bg-white/5 border-white/10 w-9'
            }`}
          >
            <button type="submit" className="p-2 flex-shrink-0 text-white/70 hover:text-white">
              <Search className="h-4 w-4" />
            </button>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
              placeholder="Buscar..."
              className={`bg-transparent text-sm text-white placeholder:text-white/40 transition-all duration-300 pr-3 ${
                searchFocused ? 'w-full' : 'w-0 opacity-0'
              }`}
            />
          </div>
        </form>

        {/* Favorites */}
        <Link
          to="/favorites"
          className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors hidden sm:flex"
        >
          <Heart className="h-4 w-4" />
        </Link>

        {/* History */}
        <Link
          to="/history"
          className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors hidden sm:flex"
        >
          <Clock className="h-4 w-4" />
        </Link>

        {/* Mobile menu */}
        <button
          className="md:hidden p-2 text-white"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden navbar-blur border-t border-white/5"
          >
            <div className="px-4 py-3 flex flex-col gap-1">
              {NAV_LINKS.map(({ to, label, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    location.pathname === to
                      ? 'bg-white/10 text-white'
                      : 'text-white/70 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              ))}
              <div className="border-t border-white/10 mt-2 pt-2 flex gap-3">
                <Link
                  to="/favorites"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 text-sm text-white/70"
                >
                  <Heart className="h-4 w-4" /> Favoritos
                </Link>
                <Link
                  to="/history"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 text-sm text-white/70"
                >
                  <Clock className="h-4 w-4" /> Histórico
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}

export default Navbar
