import { motion, AnimatePresence } from 'framer-motion'
import { Download, X } from 'lucide-react'

interface UpdateModalProps {
  visible: boolean
  downloadUrl: string
  onDismiss: () => void
}

const UpdateModal = ({ visible, downloadUrl, onDismiss }: UpdateModalProps) => (
  <AnimatePresence>
    {visible && (
      <>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm"
          onClick={onDismiss}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[110] w-[90vw] max-w-sm bg-[#13131c] border border-white/10 rounded-2xl p-6 shadow-2xl"
        >
          <button
            onClick={onDismiss}
            className="absolute top-3 right-3 p-2 text-white/40 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>

          <h2 className="text-white font-bold text-lg mb-2">Atualização disponível</h2>
          <p className="text-white/60 text-sm mb-5">
            Uma nova versão do CineBG está disponível. Baixe e instale para ter as últimas novidades.
          </p>

          <div className="flex gap-3">
            <a
              href={downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 bg-accent-red hover:bg-red-600 text-white font-bold py-3 rounded-xl transition-colors"
            >
              <Download className="h-4 w-4" />
              Baixar
            </a>
            <button
              onClick={onDismiss}
              className="px-4 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white text-sm font-semibold transition-colors"
            >
              Agora não
            </button>
          </div>
        </motion.div>
      </>
    )}
  </AnimatePresence>
)

export default UpdateModal
