import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Crown, ArrowLeft, Tv } from 'lucide-react'
import Focusable from '@/components/tv/Focusable'
import { useLicense } from '@/hooks/useLicense'
import { useAppStore } from '@/store/useAppStore'
import { useNavigate } from 'react-router-dom'
import { FLUID_EASE } from '@/utils/motion'

type PremiumContentType = 'movie' | 'tv' | 'anime'

const CONTENT_LABEL: Record<PremiumContentType, string> = {
  movie: 'deste filme',
  tv: 'desta série',
  anime: 'deste anime',
}

interface PremiumContentGateProps {
  contentType: PremiumContentType
  /** Layout do bloqueio: página do catálogo ou player em tela cheia. */
  variant?: 'page' | 'fullscreen'
  children: ReactNode
}

/**
 * Bloqueia a reprodução de filmes, séries e animes para usuários sem assinatura ativa.
 * - Abre normalmente para o catálogo e TV aberta gratuita.
 * - Ao tentar reproduzir, exibe mensagem clara de exclusividade para assinantes.
 * - Oferece opção direta para contratação/assinatura e retorno ao catálogo.
 */
const PremiumContentGate = ({ contentType, variant = 'fullscreen', children }: PremiumContentGateProps) => {
  const { isLicensed, isTrial, loading } = useLicense()
  const setVipModalOpen = useAppStore((s) => s.setVipModalOpen)
  const navigate = useNavigate()

  if (loading || isLicensed || isTrial) {
    return <>{children}</>
  }

  const containerClass =
    variant === 'fullscreen'
      ? 'fixed inset-0 z-50 w-screen h-screen bg-black/95 backdrop-blur-md flex items-center justify-center p-4'
      : 'min-h-screen bg-bg-primary flex items-center justify-center pt-16 p-4'

  return (
    <div className={containerClass}>
      <motion.div
        className="text-center px-6 py-8 max-w-lg bg-bg-elevated border border-amber-400/30 rounded-3xl shadow-2xl"
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: FLUID_EASE }}
      >
        <div className="mx-auto mb-5 w-16 h-16 rounded-full bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
          <Crown className="w-8 h-8" aria-hidden="true" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-3">
          Conteúdo Exclusivo para Assinantes
        </h2>
        <p className="text-white/70 text-sm sm:text-base mb-6 leading-relaxed">
          A reprodução {CONTENT_LABEL[contentType]} é exclusiva para assinantes do CineBG.
          Contrate um plano agora mesmo para liberar o acesso imediato e ilimitado a todos os filmes e séries do catálogo!
        </p>

        <div className="bg-white/5 border border-white/10 rounded-xl p-3 mb-6 flex items-center justify-between text-xs text-amber-200">
          <span className="flex items-center gap-2">
            <Tv className="w-4 h-4 text-amber-300" /> TV ao vivo liberada gratuitamente
          </span>
          <button
            type="button"
            onClick={() => navigate('/tv')}
            className="text-amber-400 font-bold hover:underline"
          >
            Assistir TV
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Focusable focusKey="premium-gate-plans" onEnterPress={() => setVipModalOpen(true)}>
            <button
              type="button"
              onClick={() => setVipModalOpen(true)}
              className="w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-extrabold rounded-xl transition-all shadow-lg active:scale-95"
            >
              👑 Contratar Assinatura
            </button>
          </Focusable>
          <Focusable focusKey="premium-gate-back" onEnterPress={() => navigate(-1)}>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="w-full sm:w-auto px-6 py-3.5 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> Voltar ao Catálogo
            </button>
          </Focusable>
        </div>
      </motion.div>
    </div>
  )
}

export default PremiumContentGate
