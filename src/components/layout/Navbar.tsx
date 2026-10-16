import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Menu, X, Heart, Clock, Home, Film, Tv, Star, Radio, Check, UserRound, Download, List, Settings, Crown } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { useLicense } from '@/hooks/useLicense'
import Focusable from '@/components/tv/Focusable'

import CineBGLogo from '@/components/ui/CineBGLogo'

const NAV_LINKS = [
  { to: '/', label: 'Início', icon: Home },
  { to: '/movies', label: 'Filmes', icon: Film },
  { to: '/series', label: 'Séries', icon: Tv },
  { to: '/anime', label: 'Anime', icon: Star },
  { to: '/my-list', label: 'Lista', icon: List },
  { to: '/live', label: 'TV', icon: Radio },
]

const Navbar = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const {
    profiles,
    activeProfileId,
    setActiveProfile,
    language,
    audioOption,
    setLanguage,
    setAudioOption,
    setVipModalOpen,
  } = useAppStore()
  const { isTrial, isLicensed, trialDaysLeft, licenseDaysLeft } = useLicense()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const activeProfile = profiles.find((p) => p.id === activeProfileId) ?? profiles[0]

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
        <Focusable onEnterPress={() => navigate('/')} className="flex-shrink-0">
          <Link to="/" className="flex items-center">
            <CineBGLogo size="sm" showSubtitle={false} />
          </Link>
        </Focusable>

        {/* Desktop Nav Estilo YuCine */}
        <nav className="hidden md:flex items-center gap-1.5 ml-4">
          {NAV_LINKS.map(({ to, label }) => {
            const active = location.pathname === to
            return (
              <Focusable key={to} onEnterPress={() => navigate(to)}>
                <Link
                  to={to}
                  className={`block px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                    active
                      ? 'border border-amber-400 bg-amber-400/10 text-white shadow-[0_0_12px_rgba(251,191,36,0.3)] scale-[1.03]'
                      : 'text-white/70 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {label}
                </Link>
              </Focusable>
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
        <Focusable onEnterPress={() => navigate('/favorites')} className="hidden sm:block">
          <Link
            to="/favorites"
            className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors flex"
          >
            <Heart className="h-4 w-4" />
          </Link>
        </Focusable>

        {/* History */}
        <Focusable onEnterPress={() => navigate('/history')} className="hidden sm:block">
          <Link
            to="/history"
            className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors flex"
          >
            <Clock className="h-4 w-4" />
          </Link>
        </Focusable>

        {/* Downloads */}
        <Focusable onEnterPress={() => navigate('/downloads')} className="hidden sm:block">
          <Link
            to="/downloads"
            className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors flex"
          >
            <Download className="h-4 w-4" />
          </Link>
        </Focusable>

        {/* Botão VIP */}
        <Focusable onEnterPress={() => setVipModalOpen(true)}>
          <button
            type="button"
            onClick={() => setVipModalOpen(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wider transition-all duration-200 ${
              isLicensed
                ? 'bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-400/50 text-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.25)] hover:bg-amber-500/30'
                : isTrial
                ? 'bg-gradient-to-r from-amber-500/20 to-red-500/20 border border-amber-400/40 text-amber-200 hover:border-amber-400'
                : 'bg-accent-red text-white hover:bg-red-600 shadow-md shadow-red-900/40'
            }`}
            title="Planos VIP CineBG"
          >
            <Crown className="h-3.5 w-3.5 text-amber-400" />
            <span className="hidden sm:inline">
              {isLicensed ? `VIP (${licenseDaysLeft}d)` : isTrial ? `Teste (${trialDaysLeft}d)` : 'Seja VIP'}
            </span>
            <span className="sm:hidden">
              {isLicensed ? 'VIP' : 'Planos'}
            </span>
          </button>
        </Focusable>

        {/* Perfil ativo */}
        <div className="relative">
          <Focusable onEnterPress={() => setProfileOpen((v) => !v)}>
            <button
              onClick={() => setProfileOpen((v) => !v)}
              className="flex items-center gap-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors pl-1 pr-2 py-1"
              title="Trocar de perfil"
            >
              <span
                className="w-7 h-7 rounded-full flex items-center justify-center text-base"
                style={{
                  backgroundColor: `${activeProfile.color}33`,
                  border: `2px solid ${activeProfile.color}`,
                }}
              >
                {activeProfile.emoji}
              </span>
              <span className="text-white/70 text-sm hidden lg:block max-w-[90px] truncate">
                {activeProfile.name}
              </span>
            </button>
          </Focusable>

          <AnimatePresence>
            {profileOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="absolute right-0 top-full mt-2 z-50 w-56 navbar-blur border border-white/10 rounded-xl p-2 shadow-xl"
                >
                  <p className="text-white/40 text-[11px] font-semibold px-3 py-1.5">Perfis</p>
                  {profiles.map((profile) => (
                    <Focusable
                      key={profile.id}
                      onEnterPress={() => {
                        setActiveProfile(profile.id)
                        setProfileOpen(false)
                      }}
                    >
                      <button
                        onClick={() => {
                          setActiveProfile(profile.id)
                          setProfileOpen(false)
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors text-left"
                      >
                        <span
                          className="w-7 h-7 rounded-full flex items-center justify-center text-base flex-shrink-0"
                          style={{
                            backgroundColor: `${profile.color}33`,
                            border: `2px solid ${profile.color}`,
                          }}
                        >
                          {profile.emoji}
                        </span>
                        <span className="text-white text-sm truncate flex-1">{profile.name}</span>
                        {profile.id === activeProfileId && (
                          <Check className="h-4 w-4 text-accent-red flex-shrink-0" />
                        )}
                      </button>
                    </Focusable>
                  ))}

                  {/* Assinatura VIP no menu de perfil */}
                  <Focusable
                    onEnterPress={() => {
                      setProfileOpen(false)
                      setVipModalOpen(true)
                    }}
                  >
                    <button
                      onClick={() => {
                        setProfileOpen(false)
                        setVipModalOpen(true)
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-400/20 transition-colors text-left my-1"
                    >
                      <Crown className="h-4 w-4 text-amber-400 flex-shrink-0" />
                      <span className="text-amber-300 text-xs font-bold truncate">
                        {isLicensed ? `VIP Ativo (${licenseDaysLeft}d)` : isTrial ? `Teste Grátis (${trialDaysLeft}d)` : 'Seja Membro VIP'}
                      </span>
                    </button>
                  </Focusable>

                  <Focusable
                    onEnterPress={() => {
                      setSettingsOpen(true)
                      setProfileOpen(false)
                    }}
                  >
                    <button
                      onClick={() => {
                        setSettingsOpen(true)
                        setProfileOpen(false)
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors text-left"
                    >
                      <Settings className="h-4 w-4 text-white/60" />
                      <span className="text-white text-sm">Configurações</span>
                    </button>
                  </Focusable>
                  <Focusable
                    onEnterPress={() => {
                      navigate('/profiles')
                      setProfileOpen(false)
                    }}
                  >
                    <Link
                      to="/profiles"
                      onClick={() => setProfileOpen(false)}
                      className="block text-center text-accent-red text-xs font-bold mt-1 py-2 rounded-lg hover:bg-white/5 transition-colors"
                    >
                      Gerenciar perfis
                    </Link>
                  </Focusable>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Settings Modal */}
      <AnimatePresence>
        {settingsOpen && (
          <>
            <div className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm" onClick={() => setSettingsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[70] w-[90vw] max-w-sm bg-[#13131c] border border-white/10 rounded-2xl p-6 shadow-2xl"
            >
              <h2 className="text-white font-bold text-lg mb-5 flex items-center gap-2">
                <Settings className="h-5 w-5 text-accent-red" />
                Configurações
              </h2>

              <div className="space-y-5">
                <div>
                  <p className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-2">Idioma</p>
                  <div className="flex gap-2">
                    {([['pt', 'Português'], ['en', 'English']] as const).map(([lang, label]) => (
                      <button
                        key={lang}
                        onClick={() => setLanguage(lang)}
                        className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                          language === lang
                            ? 'bg-accent-red text-white'
                            : 'bg-white/5 text-white/60 hover:bg-white/10'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-2">Áudio Padrão</p>
                  <div className="flex gap-2">
                    {([['dub', 'Dublado'], ['orig', 'Original']] as const).map(([opt, label]) => (
                      <button
                        key={opt}
                        onClick={() => setAudioOption(opt)}
                        className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                          audioOption === opt
                            ? 'bg-accent-red text-white'
                            : 'bg-white/5 text-white/60 hover:bg-white/10'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSettingsOpen(false)}
                className="w-full mt-6 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-sm font-bold transition-colors"
              >
                Fechar
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

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
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false)
                  setVipModalOpen(true)
                }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-amber-500/20 to-red-500/20 text-amber-300 border border-amber-400/30 mb-1"
              >
                <Crown className="h-4 w-4 text-amber-400" />
                <span>
                  {isLicensed
                    ? `Membro VIP (${licenseDaysLeft} dias restantes)`
                    : isTrial
                    ? `Teste Grátis (${trialDaysLeft} dias restantes)`
                    : 'Assinar Plano VIP (Mercado Pago Pix)'}
                </span>
              </button>

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
                <Link
                  to="/downloads"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 text-sm text-white/70"
                >
                  <Download className="h-4 w-4" /> Downloads
                </Link>
                <Link
                  to="/profiles"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 text-sm text-white/70"
                >
                  <UserRound className="h-4 w-4" /> Perfis
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
