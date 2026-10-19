import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import CineBGLogo from './CineBGLogo'
import splashBg from '@/assets/splash-bg.png'

interface SplashScreenProps {
  onComplete: () => void
  version?: string
}

export const SplashScreen = ({
  onComplete,
  version = '1.2.37',
}: SplashScreenProps) => {
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState('Iniciando CineBG...')
  const completedRef = useRef(false)
  const onCompleteRef = useRef(onComplete)

  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  useEffect(() => {
    const totalDuration = 2200 // 2.2 segundos para uma progressao visivel e fluida
    const startTime = Date.now()

    const finish = () => {
      if (completedRef.current) return
      completedRef.current = true
      setProgress(100)
      setStatus('Pronto!')
      setTimeout(() => {
        onCompleteRef.current?.()
      }, 300)
    }

    // Intervalo de 50ms (otimizado para nao engasgar a CPU/GPU de TVs Android)
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime
      const pct = Math.min(100, Math.floor((elapsed / totalDuration) * 100))

      setProgress(pct)

      if (pct < 30) {
        setStatus('Carregando catálogo CineBG...')
      } else if (pct < 70) {
        setStatus('Conectando servidores de streaming...')
      } else if (pct < 98) {
        setStatus('Preparando sua experiência...')
      } else {
        clearInterval(interval)
        finish()
      }
    }, 50)

    // Watchdog de segurança: garante 100% que a tela de carregamento conclua e abra o app
    const watchdog = setTimeout(() => {
      clearInterval(interval)
      finish()
    }, 2800)

    return () => {
      clearInterval(interval)
      clearTimeout(watchdog)
    }
  }, [])

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.45, ease: 'easeInOut' }}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-between bg-[#08070d] text-white overflow-hidden select-none"
      style={{ transform: 'translateZ(0)' }}
    >
      {/* Imagem de Fundo (Cristo Redentor / Barra do Garças) 100% Tela Cheia sem bordas */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <img
          src={splashBg}
          alt="Cristo Redentor - Barra do Garças"
          className="w-full h-full object-cover object-center scale-105"
          style={{ transform: 'translateZ(0)' }}
        />

        {/* Vinhetas cinematográficas suaves para transição harmoniosa com o tema escuro #08070d */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#08070d] via-[#08070d]/30 to-[#08070d]/70 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#08070d]/60 via-transparent to-[#08070d]/90 pointer-events-none" />
        <div className="absolute inset-0 bg-black/30 pointer-events-none" />
      </div>

      {/* Espaçador Superior */}
      <div className="h-16 z-10" />

      {/* Centro: Logo Oficial CineBG estilo YuCine */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-md w-full">
        <div className="mb-6 drop-shadow-[0_15px_30px_rgba(0,0,0,0.8)]" style={{ transform: 'translateZ(0)' }}>
          <CineBGLogo size="xl" showSubtitle={true} />
        </div>

        {/* Barra de Progresso YuCine com transição CSS suave */}
        <div className="w-full max-w-[280px] space-y-2 mt-4">
          <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden p-[1px]">
            <div
              className="h-full bg-gradient-to-r from-accent-red via-orange-500 to-amber-400 rounded-full shadow-[0_0_12px_rgba(255,145,0,0.8)] transition-all duration-150 ease-out"
              style={{ width: `${progress}%`, transform: 'translateZ(0)' }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] font-semibold text-white/60 px-1">
            <span className="truncate">{status}</span>
            <span className="font-mono text-amber-400/90 font-bold">{progress}%</span>
          </div>
        </div>
      </div>

      {/* Rodapé: Versão e Localização */}
      <div className="relative z-10 pb-8 flex flex-col items-center gap-1.5 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10">
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
      </div>
    </motion.div>
  )
}

export default SplashScreen
