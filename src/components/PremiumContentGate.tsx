import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Lock } from 'lucide-react'
import Focusable from '@/components/tv/Focusable'
import { useLicense } from '@/hooks/useLicense'
import { useAppStore } from '@/store/useAppStore'
import { FLUID_EASE } from '@/utils/motion'

type PremiumContentType = 'movie' | 'tv' | 'anime'

const CONTENT_LABEL: Record<PremiumContentType, string> = {
  movie: 'filmes',
  tv: 'séries',
  anime: 'animes',
}

interface PremiumContentGateProps {
  contentType: PremiumContentType
  /** Layout do bloqueio: página do catálogo ou player em tela cheia. */
  variant?: 'page' | 'fullscreen'
  children: ReactNode
}

/**
 * Bloqueia filmes, séries e animes quando o teste de 3 dias venceu e não há VIP ativo.
 * - Síncrono: usa o mesmo estado de useLicense (sem rede, sem spinner isolado).
 * - Enquanto a licença é verificada, renderiza o conteúdo (o App já validou o acesso
 *   na entrada), evitando telas vazias.
 * - TV aberta (LiveTV) nunca passa por este bloqueio.
 */
const PremiumContentGate = ({ contentType, variant = 'page', children }: PremiumContentGateProps) => {
  const { isLicensed, isTrial, loading } = useLicense()
  const setVipModalOpen = useAppStore((s) => s.setVipModalOpen)

  if (loading || isLicensed || isTrial) {
    return <>{children}</>
  }

  const containerClass =
    variant === 'fullscreen'
      ? 'fixed inset-0 z-50 w-screen h-screen bg-black flex items-center justify-center'
      : 'min-h-screen bg-bg-primary flex items-center justify-center pt-16'

  return (
    <div className={containerClass}>
      <motion.div
        className="text-center px-6 max-w-md"
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: FLUID_EASE }}
      >
        <div className="mx-auto mb-5 w-16 h-16 rounded-full bg-amber-400/15 border border-amber-400/30 flex items-center justify-center">
          <Lock className="w-8 h-8 text-amber-300" aria-hidden="true" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Acesso Bloqueado</h2>
        <p className="text-white/70 mb-6">
          Seu período gratuito de 3 dias expirou. Assine o VIP para continuar assistindo{' '}
          {CONTENT_LABEL[contentType]}. Os canais de TV aberta continuam liberados.
        </p>
        <Focusable focusKey="premium-gate-plans" onEnterPress={() => setVipModalOpen(true)}>
          <button
            type="button"
            onClick={() => setVipModalOpen(true)}
            className="px-6 py-3 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-extrabold rounded-xl transition-all shadow-md active:scale-95"
          >
            👑 Ver Planos VIP
          </button>
        </Focusable>
      </motion.div>
    </div>
  )
}

export default PremiumContentGate
