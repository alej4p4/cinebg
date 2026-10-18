import { useState } from 'react'
import { motion } from 'framer-motion'
import { Check, Plus, Trash2, Baby, Bell, BellOff, Tv, UserCog, Crown, Sparkles, QrCode, Download, RefreshCw } from 'lucide-react'
import { useAppStore, type UserProfile } from '@/store/useAppStore'
import { useLicense } from '@/hooks/useLicense'
import Focusable from '@/components/tv/Focusable'
import {
  checkForNewEpisodes,
  requestNotificationPermissionExplicit,
  isNativeNotificationsAvailable,
} from '@/services/notifications'

const EMOJIS = ['😀', '😎', '😍', '🤩', '😎', '🥳', '🤔', '😴', '🤓', '🥰', '😎', '🤠', '😇', '🧠', '👻', '🤖', '🦸', '🦹', '🧙', '🧚']
const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e', '#a855f7', '#0ea5e9', '#14b8a6']

const Profiles = () => {
  const {
    profiles,
    activeProfileId,
    setActiveProfile,
    addProfile,
    removeProfile,
    notificationsEnabled,
    setNotificationsEnabled,
    tvMode,
    setTvMode,
    audioOption,
    setAudioOption,
    subtitleOption,
    setSubtitleOption,
    setVipModalOpen,
    checkForUpdates,
    isCheckingUpdate,
    updateInfo,
  } = useAppStore()

  const { isLicensed, isTrial, trialDaysLeft, licenseDaysLeft, license } = useLicense()

  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState(EMOJIS[0])
  const [color, setColor] = useState(COLORS[0])
  const [kids, setKids] = useState(false)
  const [optimizing, setOptimizing] = useState(false)
  const [optimizedMsg, setOptimizedMsg] = useState<string | null>(null)

  const handleCleanCache = () => {
    setOptimizing(true)
    setTimeout(async () => {
      try {
        sessionStorage.clear()
        if (typeof window !== 'undefined' && 'caches' in window) {
          const keys = await window.caches.keys()
          await Promise.all(keys.map((k) => window.caches.delete(k)))
        }
      } catch {}
      setOptimizing(false)
      setOptimizedMsg('✨ Memória otimizada e caches temporários liberados!')
      setTimeout(() => setOptimizedMsg(null), 4000)
    }, 800)
  }

  const handleAdd = () => {
    const trimmed = name.trim()
    if (!trimmed) return
    addProfile({ name: trimmed, emoji, color, kids })
    setName('')
    setEmoji(EMOJIS[0])
    setColor(COLORS[0])
    setKids(false)
  }

  const handleToggleNotifications = async () => {
    if (notificationsEnabled) {
      setNotificationsEnabled(false)
      return
    }
    if (isNativeNotificationsAvailable()) {
      const granted = await requestNotificationPermissionExplicit()
      if (!granted) return
    }
    setNotificationsEnabled(true)
    checkForNewEpisodes().catch(() => {})
  }

  return (
    <motion.div
      className="min-h-screen bg-bg-primary pt-20 pb-16 page-enter"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="max-w-screen-lg mx-auto px-4 md:px-8">
        <div className="py-6">
          <h1 className="font-display font-black text-3xl text-white">Perfis</h1>
          <p className="text-text-secondary text-sm mt-1">
            Cada perfil tem seus próprios favoritos e histórico.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {profiles.map((profile) => (
            <ProfileCard
              key={profile.id}
              profile={profile}
              active={profile.id === activeProfileId}
              canRemove={profiles.length > 1}
              onSelect={() => setActiveProfile(profile.id)}
              onRemove={() => removeProfile(profile.id)}
            />
          ))}
        </div>

        {/* Assinatura & Planos VIP */}
        <div className="glass border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-red-500/5 to-transparent rounded-2xl p-5 mt-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 flex-shrink-0 shadow-lg shadow-amber-500/20">
                <Crown className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-black text-white text-lg">Assinatura & Planos VIP</h2>
                  <Sparkles className="h-4 w-4 text-amber-400" />
                </div>
                <p className="text-white/60 text-xs mt-0.5">
                  {isLicensed ? (
                    <span className="text-emerald-300 font-semibold">
                      💎 Membro VIP Ativo ({licenseDaysLeft} {licenseDaysLeft === 1 ? 'dia restante' : 'dias restantes'}) • {license?.planName}
                    </span>
                  ) : isTrial ? (
                    <span className="text-amber-300 font-semibold">
                      ⚡ Período de Teste Grátis: {trialDaysLeft} {trialDaysLeft === 1 ? 'dia restante' : 'dias restantes'} (de 3 dias)
                    </span>
                  ) : (
                    <span className="text-red-300 font-semibold">
                      ⏳ Período Gratuito Encerrado. Assine para continuar.
                    </span>
                  )}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setVipModalOpen(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-red-600 hover:from-amber-600 hover:to-red-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg shadow-amber-500/20 self-stretch sm:self-auto justify-center"
            >
              <QrCode className="h-4 w-4" />
              <span>{isLicensed ? 'Renovar / Estender VIP' : 'Ver Planos & Pagar via Pix'}</span>
            </button>
          </div>
        </div>

        <div className="glass rounded-xl p-5 mt-8">
          <h2 className="font-bold text-white mb-4 flex items-center gap-2">
            <Plus className="h-5 w-5 text-accent-red" />
            Adicionar perfil
          </h2>

          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAdd()
            }}
            placeholder="Nome do perfil"
            maxLength={20}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder:text-white/40 outline-none focus:border-accent-red/60 mb-4"
          />

          <div className="mb-4">
            <p className="text-white/60 text-xs font-semibold mb-2">Avatar</p>
            <div className="flex flex-wrap gap-2">
              {EMOJIS.map((option) => (
                <button
                  key={option}
                  onClick={() => setEmoji(option)}
                  className={`w-10 h-10 rounded-lg text-lg flex items-center justify-center transition-all ${
                    emoji === option
                      ? 'bg-accent-red/20 ring-2 ring-accent-red'
                      : 'bg-white/5 hover:bg-white/10'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <p className="text-white/60 text-xs font-semibold mb-2">Cor</p>
            <div className="flex flex-wrap gap-2">
              {COLORS.map((option) => (
                <button
                  key={option}
                  onClick={() => setColor(option)}
                  style={{ backgroundColor: option }}
                  className={`w-8 h-8 rounded-full transition-all ${
                    color === option ? 'ring-2 ring-white ring-offset-2 ring-offset-bg-primary' : ''
                  }`}
                />
              ))}
            </div>
          </div>

          <label className="flex items-center gap-2 text-white/80 text-sm mb-4 cursor-pointer w-fit">
            <input
              type="checkbox"
              checked={kids}
              onChange={(e) => setKids(e.target.checked)}
              className="accent-accent-red w-4 h-4"
            />
            <Baby className="h-4 w-4" />
            Perfil infantil
          </label>

          <button
            onClick={handleAdd}
            disabled={!name.trim()}
            className="flex items-center gap-2 bg-accent-red text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-red-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-red-900/40"
          >
            <Plus className="h-4 w-4" />
            Adicionar
          </button>
        </div>

        <div className="glass rounded-xl p-5 mt-8">
          <h2 className="font-bold text-white mb-2 flex items-center gap-2">
            <UserCog className="h-5 w-5 text-accent-red" />
            Preferências do perfil
          </h2>
          <p className="text-text-secondary text-sm mb-4">
            Configure idioma, áudio e legendas para este perfil.
          </p>

          <div className="space-y-4">
            <div>
              <p className="text-white/60 text-xs font-semibold mb-2">Áudio</p>
              <div className="flex flex-wrap gap-2">
                {(['dub', 'sub', 'orig'] as const).map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setAudioOption(opt)}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
                      audioOption === opt
                        ? 'bg-accent-red text-white'
                        : 'bg-white/5 text-white/70 hover:bg-white/10'
                    }`}
                  >
                    {opt === 'dub' ? '🇧🇷 Dublado' : opt === 'sub' ? '🇧🇷 Legendado' : '🌐 Original'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-white/60 text-xs font-semibold mb-2">Legendas</p>
              <div className="flex flex-wrap gap-2">
                {(['off', 'pt', 'en'] as const).map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setSubtitleOption(opt)}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
                      subtitleOption === opt
                        ? 'bg-accent-red text-white'
                        : 'bg-white/5 text-white/70 hover:bg-white/10'
                    }`}
                  >
                    {opt === 'off' ? '🚫 Desativado' : opt === 'pt' ? '🇧🇷 Português' : '🇺🇸 Inglês'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="glass rounded-xl p-5 mt-8">
          <h2 className="font-bold text-white mb-2 flex items-center gap-2">
            <Bell className="h-5 w-5 text-accent-red" />
            Notificações
          </h2>
          <p className="text-text-secondary text-sm mb-4">
            Receba avisos quando um episódio novo de uma série favorita for lançado. Funciona no
            aplicativo Android (requer permissão de notificações).
          </p>
          <button
            onClick={handleToggleNotifications}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-colors ${
              notificationsEnabled
                ? 'bg-white/10 text-white hover:bg-white/15'
                : 'bg-accent-red text-white hover:bg-red-600 shadow-lg shadow-red-900/40'
            }`}
          >
            {notificationsEnabled ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
            {notificationsEnabled ? 'Notificações ativadas' : 'Ativar notificações'}
          </button>
        </div>

        <div className="glass rounded-xl p-5 mt-8">
          <h2 className="font-bold text-white mb-2 flex items-center gap-2">
            <Tv className="h-5 w-5 text-accent-red" />
            Modo TV
          </h2>
          <p className="text-text-secondary text-sm mb-4">
            Ativa a navegação por controle remoto (D-pad) com foco espacial. Em TVs Android é
            detectado automaticamente.
          </p>
          <button
            onClick={() => setTvMode(!tvMode)}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-colors ${
              tvMode
                ? 'bg-white/10 text-white hover:bg-white/15'
                : 'bg-accent-red text-white hover:bg-red-600 shadow-lg shadow-red-900/40'
            }`}
          >
            {tvMode ? 'Modo TV ativado' : 'Ativar modo TV'}
          </button>
        </div>

        {/* Otimização & Limpeza de Cache */}
        <div className="glass rounded-xl p-5 mt-8 border border-white/5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-400 flex-shrink-0 shadow-lg shadow-cyan-500/20">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <h2 className="font-bold text-white text-base">Otimização & Limpeza de Cache</h2>
                <p className="text-text-secondary text-xs mt-0.5">
                  Libera memória RAM e caches de vídeo para deixar a navegação mais rápida no Android e TV.
                </p>
                {optimizedMsg && (
                  <p className="text-emerald-400 text-xs font-semibold mt-1 animate-pulse">
                    {optimizedMsg}
                  </p>
                )}
              </div>
            </div>

            <Focusable
              focusKey="btn-clean-cache"
              onEnterPress={handleCleanCache}
            >
              <button
                type="button"
                onClick={handleCleanCache}
                disabled={optimizing}
                className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-bold px-4 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all self-stretch sm:self-auto border border-white/10 disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${optimizing ? 'animate-spin' : ''}`} />
                <span>{optimizing ? 'Otimizando...' : 'Limpar Cache'}</span>
              </button>
            </Focusable>
          </div>
        </div>

        {/* Atualizações do App / Versão */}
        <div className="glass rounded-xl p-5 mt-8 border border-white/10 bg-gradient-to-r from-white/5 to-transparent">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-accent-red/20 border border-accent-red/40 flex items-center justify-center text-accent-red flex-shrink-0 shadow-lg shadow-red-900/30">
                <Download className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-black text-white text-lg">Versão & Atualizações</h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/10 text-white/80 border border-white/10">
                    v{updateInfo.currentVersion}
                  </span>
                </div>
                <p className="text-text-secondary text-xs mt-0.5">
                  CineBG para Android & Smart TV • Mantenha seu aplicativo sempre atualizado.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-stretch sm:self-auto">
              <Focusable
                focusKey="btn-check-update"
                onEnterPress={() => checkForUpdates(true)}
              >
                <button
                  type="button"
                  onClick={() => checkForUpdates(true)}
                  disabled={isCheckingUpdate}
                  className="flex items-center justify-center gap-2 bg-gradient-to-r from-accent-red to-red-700 hover:from-red-600 hover:to-red-800 text-white font-bold px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg shadow-red-900/40 disabled:opacity-50"
                >
                  <RefreshCw className={`h-4 w-4 ${isCheckingUpdate ? 'animate-spin' : ''}`} />
                  <span>{isCheckingUpdate ? 'Verificando...' : 'Atualizar Versão'}</span>
                </button>
              </Focusable>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

const ProfileCard = ({ profile, active, canRemove, onSelect, onRemove }: { profile: UserProfile; active: boolean; canRemove: boolean; onSelect: () => void; onRemove: () => void }) => (
  <motion.div
    whileHover={{ y: -4 }}
    className={`relative rounded-xl p-5 cursor-pointer border transition-all ${
      active ? 'border-accent-red bg-white/10' : 'border-white/5 bg-bg-card hover:border-white/20'
    }`}
    onClick={onSelect}
  >
    {active && (
      <span className="absolute top-2 right-2 flex items-center gap-1 bg-accent-red text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
        <Check className="h-3 w-3" /> Ativo
      </span>
    )}
    {canRemove && (
      <button onClick={(e) => { e.stopPropagation(); onRemove() }} className="absolute bottom-2 right-2 p-1.5 text-white/30 hover:text-red-400 transition-colors" title="Remover perfil">
        <Trash2 className="h-4 w-4" />
      </button>
    )}
    <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl mb-3" style={{ backgroundColor: `${profile.color}33`, border: `2px solid ${profile.color}` }}>
      {profile.emoji}
    </div>
    <p className="text-white font-bold truncate">{profile.name}</p>
    {profile.kids && (
      <span className="inline-flex items-center gap-1 text-[10px] text-white/50 mt-1">
        <Baby className="h-3 w-3" /> Infantil
      </span>
    )}
  </motion.div>
)

export default Profiles