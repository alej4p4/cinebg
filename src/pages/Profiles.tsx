import { useState } from 'react'
import { motion } from 'framer-motion'
import { Check, Plus, Trash2, Baby, Bell, BellOff, Tv, UserCog } from 'lucide-react'
import { useAppStore, type UserProfile } from '@/store/useAppStore'
import {
  checkForNewEpisodes,
  ensureNotificationPermission,
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
  } = useAppStore()

  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState(EMOJIS[0])
  const [color, setColor] = useState(COLORS[0])
  const [kids, setKids] = useState(false)

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
      const granted = await ensureNotificationPermission()
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