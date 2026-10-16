import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import CineBGLogo from './CineBGLogo'

interface SplashScreenProps {
  onComplete: () => void
  version?: string
}

export const SplashScreen = ({
  onComplete,
  version = '1.2.0',
}: SplashScreenProps) => {
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState('Iniciando CineBG...')

  useEffect(() => {
    const startTime = Date.now()
    const totalDuration = 2400

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime
      const pct = Math.min(100, Math.floor((elapsed / totalDuration) * 100))
      setProgress(pct)

      if (pct < 35) {
        setStatus('Carregando catálogo CineBG...')
      } else if (pct < 75) {
        setStatus('Conectando servidores de streaming...')
      } else if (pct < 100) {
        setStatus('Preparando sua experiência...')
      } else {
        setStatus('Pronto!')
        clearInterval(interval)
        setTimeout(() => {
          onComplete()
        }, 350)
      }
    }, 40)

    return () => clearInterval(interval)
  }, [onComplete])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.04 }}
      transition={{ duration: 0.5, ease: 'easeInOut' }}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-between bg-[#08070d] text-white overflow-hidden select-none"
    >
      {/* Imagem de Fundo Abstrata (Cristo Redentor / Barra do Garças) */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <motion.img
          src="/splash-bg.png"
          alt="Barra do Garças"
          initial={{ scale: 1.15, filter: 'blur(3px) brightness(0.65)' }}
          animate={{
            scale: 1.02,
            filter: 'blur(1px) brightness(0.55)',
          }}
          transition={{ duration: 3.5, ease: 'easeOut' }}
          className="w-full h-full object-cover object-center"
        />

        {/* Camada de Gradiente Abstrato / Efeito Vignette Cinematográfico */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#08070d] via-[#08070d]/80 to-[#08070d]/70" />
        <div className="absolute inset-0 bg-radial from-red-600/15 via-amber-500/10 to-transparent" />
        <div className="absolute inset-0 backdrop-blur-[2px]" />
      </div>

      {/* Espaçador Superior */}
      <div className="h-16 z-10" />

      {/* Centro: Logo Oficial CineBG estilo YuCine */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-md w-full">
        {/* Aura de Brilho Neon Pulsante */}
        <div className="absolute -top-12 w-64 h-64 bg-gradient-to-tr from-accent-red/25 via-amber-500/20 to-transparent rounded-full blur-3xl pointer-events-none animate-pulse" />

        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="mb-6 drop-shadow-[0_15px_30px_rgba(0,0,0,0.8)]"
        >
          <CineBGLogo size="xl" showSubtitle={true} />
        </motion.div>

        {/* Barra de Progresso YuCine */}
        <div className="w-full max-w-[260px] space-y-2 mt-4">
          <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden backdrop-blur-sm p-[1px]">
            <motion.div
              className="h-full bg-gradient-to-r from-accent-red via-orange-500 to-amber-400 rounded-full shadow-[0_0_12px_rgba(255,145,0,0.8)]"
              style={{ width: `${progress}%` }}
              transition={{ ease: 'linear' }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] font-semibold text-white/50 px-1">
            <span className="truncate">{status}</span>
            <span className="font-mono text-amber-400/90">{progress}%</span>
          </div>
        </div>
      </div>

      {/* Rodapé: Versão e Localização */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.6 }}
        className="relative z-10 pb-8 flex flex-col items-center gap-1.5 text-center"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[11px] font-bold text-white/80 tracking-wide">
            CineBG v{version}
          </span>
          <span className="text-white/20">·</span>
          <span className="text-[10px] font-medium text-amber-400/80">Barra do Garças</span>
        </div>
        <p className="text-[10px] text-white/30 tracking-wider">
          O melhor do cinema, séries e TV ao seu alcance
        </p>
      </motion.div>
    </motion.div>
  )
}

export default SplashScreen
