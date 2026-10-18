import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Menu, X, Heart, Clock, Home, Film, Tv, Star, Radio, Check, UserRound, Download, List, Settings, Crown, LayoutGrid } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { useLicense } from '@/hooks/useLicense'
import Focusable from '@/components/tv/Focusable'
import { setFocus, doesFocusableExist } from '@noriginmedia/norigin-spatial-navigation'

import CineBGLogo from '@/components/ui/CineBGLogo'

const NAV_LINKS = [
  { to: '/', label: 'Início', icon: Home },
  { to: '/movies', label: 'Filmes', icon: Film },
  { to: '/series', label: 'Séries', icon: Tv },
  { to: '/anime', label: 'Anime', icon: Star },
  { to: '/my-list', label: 'Lista', icon: List },
  { to: '/live', label: 'TV', icon: Radio },
]

const CATEGORIES_GRID = [
  { to: '/', label: 'Início', icon: Home, emoji: '🏠' },
  { to: '/movies', label: 'Filmes', icon: Film, emoji: '🎬' },
  { to: '/series', label: 'Séries', icon: Tv, emoji: '📺' },
  { to: '/live', label: 'TV Ao Vivo', icon: Radio, emoji: '📡' },
  { to: '/anime', label: 'Anime', icon: Star, emoji: '🃏' },
  { to: '/my-list', label: 'Minha Lista', icon: List, emoji: '📋' },
  { to: '/favorites', label: 'Favoritos', icon: Heart, emoji: '❤️' },
  { to: '/history', label: 'Histórico', icon: Clock, emoji: '🕒' },
  { to: '/downloads', label: 'Downloads', icon: Download, emoji: '⬇️' },
]

const Navbar = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [gridMenuOpen, setGridMenuOpen] = useState(false)
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
    checkForUpdates,
    updateInfo,
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

  const handleNavDown = () => {
    if (doesFocusableExist('details-play')) {
      setFocus('details-play')
      return false
    }
    if (doesFocusableExist('hero-watch-btn')) {
      setFocus('hero-watch-btn')
      return false
    }
    if (doesFocusableExist('yucine-hero-banner')) {
      setFocus('yucine-hero-banner')
      return false
    }
    if (doesFocusableExist('card-0-0')) {
      setFocus('card-0-0')
      return false
    }
    return true
  }

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled ? 'navbar-blur border-b border-white/5' : 'bg-gradient-to-b from-black/80 to-transparent'
      }`}
    >
      <div className="max-w-screen-2xl mx-auto px-4 md:px-8 h-16 flex items-center gap-4">
        {/* Logo */}
        <Focusable
          focusKey="nav-logo"
          onEnterPress={() => navigate('/')}
          onArrowPress={(dir) => (dir === 'down' ? handleNavDown() : true)}
          className="flex-shrink-0"
        >
          <Link to="/" className="flex items-center">
            <CineBGLogo size="sm" showSubtitle={false} />
          </Link>
        </Focusable>

        {/* Desktop Nav Estilo YuCine */}
        <nav className="hidden md:flex items-center gap-1.5 ml-4">
          {NAV_LINKS.map(({ to, label }, index) => {
            const active = location.pathname === to
            return (
              <Focusable
                key={to}
                focusKey={`nav-item-${index}`}
                onEnterPress={() => navigate(to)}
                onArrowPress={(dir) => (dir === 'down' ? handleNavDown() : true)}
              >
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

        {/* Mobile Grade Button */}
        <button
          type="button"
          onClick={() => setGridMenuOpen(true)}
          className="md:hidden flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-amber-400 hover:bg-white/10 text-xs font-bold transition-all active:scale-95 flex-shrink-0"
          title="Grade de Categorias"
        >
          <LayoutGrid className="h-4 w-4 text-amber-400" />
          <span className="text-white text-[11px] font-bold">Grade</span>
        </button>

        {/* Search */}
        <div className="relative flex items-center">
          {/* Botão de busca Mobile: navega diretamente para /search com teclado pronto */}
          <button
            type="button"
            onClick={() => navigate('/search')}
            className="md:hidden p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/80 hover:text-white transition-colors"
            title="Buscar filmes e séries"
          >
            <Search className="h-4 w-4" />
          </button>

          {/* Busca Desktop expandível */}
          <form onSubmit={handleSearch} className="hidden md:block relative">
            <div
              className={`flex items-center gap-2 rounded-full transition-all duration-300 border ${
                searchFocused
                  ? 'bg-bg-card border-white/20 w-48 md:w-64'
                  : 'bg-white/5 border-white/10 w-9'
              }`}
            >
              <button
                type="button"
                onClick={() => {
                  if (!searchFocused) setSearchFocused(true)
                  else handleSearch({ preventDefault: () => {} } as any)
                }}
                className="p-2 flex-shrink-0 text-white/70 hover:text-white"
              >
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
        </div>

        {/* Favorites */}
        <Focusable
          focusKey="nav-fav"
          onEnterPress={() => navigate('/favorites')}
          onArrowPress={(dir) => (dir === 'down' ? handleNavDown() : true)}
          className="hidden sm:block"
        >
          <Link
            to="/favorites"
            className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors flex"
          >
            <Heart className="h-4 w-4" />
          </Link>
        </Focusable>

        {/* History */}
        <Focusable
          focusKey="nav-history"
          onEnterPress={() => navigate('/history')}
          onArrowPress={(dir) => (dir === 'down' ? handleNavDown() : true)}
          className="hidden sm:block"
        >
          <Link
            to="/history"
            className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors flex"
          >
            <Clock className="h-4 w-4" />
          </Link>
        </Focusable>

        {/* Downloads */}
        <Focusable
          focusKey="nav-downloads"
          onEnterPress={() => navigate('/downloads')}
          onArrowPress={(dir) => (dir === 'down' ? handleNavDown() : true)}
          className="hidden sm:block"
        >
          <Link
            to="/downloads"
            className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors flex"
          >
            <Download className="h-4 w-4" />
          </Link>
        </Focusable>

        {/* Botão VIP */}
        <Focusable
          focusKey="nav-vip"
          onEnterPress={() => setVipModalOpen(true)}
          onArrowPress={(dir) => (dir === 'down' ? handleNavDown() : true)}
        >
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
          <Focusable
            focusKey="nav-profile"
            onEnterPress={() => setProfileOpen((v) => !v)}
            onArrowPress={(dir) => (dir === 'down' ? handleNavDown() : true)}
          >
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
                      setProfileOpen(false)
                      checkForUpdates(true)
                    }}
                  >
                    <button
                      onClick={() => {
                        setProfileOpen(false)
                        checkForUpdates(true)
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white/10 transition-colors text-left"
                    >
                      <div className="flex items-center gap-2.5">
                        <Download className="h-4 w-4 text-accent-red flex-shrink-0" />
                        <span className="text-white text-sm">Atualizar Versão</span>
                      </div>
                      <span className="text-[10px] text-white/50 font-mono bg-white/5 px-1.5 py-0.5 rounded">
                        v{updateInfo.currentVersion}
                      </span>
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

                <div>
                  <p className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-2">Versão do Aplicativo</p>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                    <div>
                      <p className="text-white text-sm font-bold">CineBG v{updateInfo.currentVersion}</p>
                      <p className="text-white/40 text-xs">Compilação Oficial APK</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSettingsOpen(false)
                        checkForUpdates(true)
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent-red hover:bg-red-600 text-white text-xs font-bold transition-colors shadow-md shadow-red-900/40"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Atualizar
                    </button>
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
          className="md:hidden p-2 text-white/80 hover:text-white"
          onClick={() => setGridMenuOpen(true)}
          title="Grade de Categorias"
        >
          <LayoutGrid className="h-5 w-5 text-amber-400" />
        </button>
      </div>

      {/* Barra de Categorias Rápida no Mobile (Estilo YuCine) */}
      <div className="flex md:hidden items-center gap-1.5 px-3 pb-2.5 overflow-x-auto scroll-hide">
        <button
          type="button"
          onClick={() => setGridMenuOpen(true)}
          className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-amber-500/25 to-orange-500/25 text-amber-300 border border-amber-400/40 flex-shrink-0 shadow-[0_0_8px_rgba(251,191,36,0.2)]"
        >
          <LayoutGrid className="h-3 w-3 text-amber-400" />
          <span>Grade</span>
        </button>
        {NAV_LINKS.map(({ to, label }) => {
          const active = location.pathname === to
          return (
            <Link
              key={to}
              to={to}
              className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all flex-shrink-0 ${
                active
                  ? 'border border-amber-400 bg-amber-400/20 text-white shadow-[0_0_12px_rgba(251,191,36,0.3)] scale-[1.02]'
                  : 'text-white/70 bg-white/5 border border-white/5 hover:text-white'
              }`}
            >
              {label}
            </Link>
          )
        })}
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

              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false)
                  checkForUpdates(true)
                }}
                className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-bold bg-white/5 hover:bg-white/10 text-white border border-white/10 mb-2 transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <Download className="h-4 w-4 text-accent-red" />
                  <span>Atualizar Versão</span>
                </div>
                <span className="text-[11px] text-white/50 font-mono bg-white/10 px-2 py-0.5 rounded-full">
                  v{updateInfo.currentVersion}
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

      {/* Grade de Categorias Mobile (Modal Estilo YuCine) */}
      <AnimatePresence>
        {gridMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-md z-50"
              onClick={() => setGridMenuOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: -20 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="fixed inset-x-4 top-16 z-50 bg-[#12111a] border border-white/10 rounded-2xl p-5 shadow-2xl max-w-md mx-auto"
            >
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-amber-400/20 border border-amber-400/40">
                    <LayoutGrid className="h-5 w-5 text-amber-400" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white uppercase tracking-wider">
                      Grade de Conteúdos
                    </h2>
                    <p className="text-[11px] text-white/50">
                      Navegue entre filmes, séries, TV ao vivo e mais
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setGridMenuOpen(false)}
                  className="p-1.5 rounded-full bg-white/5 text-white/60 hover:text-white hover:bg-white/10"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                {CATEGORIES_GRID.map((cat) => {
                  const active = location.pathname === cat.to
                  return (
                    <button
                      key={cat.to}
                      onClick={() => {
                        navigate(cat.to)
                        setGridMenuOpen(false)
                      }}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all active:scale-95 ${
                        active
                          ? 'bg-amber-400/20 border-amber-400 text-amber-300 shadow-[0_0_14px_rgba(251,191,36,0.3)]'
                          : 'bg-white/5 border-white/5 text-white/80 hover:bg-white/10 hover:border-white/15'
                      }`}
                    >
                      <span className="text-2xl mb-1">{cat.emoji}</span>
                      <span className="text-xs font-bold text-center leading-tight">
                        {cat.label}
                      </span>
                    </button>
                  )
                })}
              </div>

              <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
                <span className="text-[11px] text-white/40 font-mono">
                  CineBG v{updateInfo.currentVersion}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setGridMenuOpen(false)
                    checkForUpdates(true)
                  }}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-accent-red/20 hover:bg-accent-red/30 border border-accent-red/40 text-red-200 text-xs font-bold transition-colors"
                >
                  <Download className="h-3 w-3 text-accent-red" />
                  <span>Atualizar Versão</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  )
}

export default Navbar
