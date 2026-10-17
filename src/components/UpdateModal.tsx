import { motion, AnimatePresence } from 'framer-motion'
import { Download, X, CheckCircle2, RefreshCw, Sparkles, AlertCircle } from 'lucide-react'
import Focusable from '@/components/tv/Focusable'

interface UpdateModalProps {
  visible: boolean
  downloadUrl?: string
  currentVersion?: string
  latestVersion?: string
  hasUpdate?: boolean
  isChecking?: boolean
  onDismiss: () => void
  onCheckAgain?: () => void
}

const UpdateModal = ({
  visible,
  downloadUrl = 'https://github.com/alej4p4/cinebg/releases/latest',
  currentVersion = '1.2.10',
  latestVersion = '1.2.10',
  hasUpdate = false,
  isChecking = false,
  onDismiss,
  onCheckAgain,
}: UpdateModalProps) => {
  const handleDownload = () => {
    try {
      const a = document.createElement('a')
      a.href = downloadUrl
      a.target = '_blank'
      a.rel = 'noopener noreferrer'
      document.body.appendChild(a)
      a.click()
      setTimeout(() => {
        document.body.removeChild(a)
      }, 500)
    } catch {
      window.location.href = downloadUrl
    }
  }

  return (
    <AnimatePresence>
      {visible && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md"
            onClick={onDismiss}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[110] w-[92vw] max-w-md bg-[#13131c] border border-white/10 rounded-2xl p-6 shadow-2xl overflow-hidden"
          >
            {/* Botão fechar */}
            <button
              onClick={onDismiss}
              className="absolute top-4 right-4 p-2 text-white/40 hover:text-white rounded-full hover:bg-white/10 transition-colors"
              title="Fechar"
            >
              <X className="h-5 w-5" />
            </button>

            {isChecking ? (
              <div className="py-8 text-center flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-accent-red/20 border-2 border-accent-red/40 flex items-center justify-center mb-4">
                  <RefreshCw className="h-8 w-8 text-accent-red animate-spin" />
                </div>
                <h2 className="text-white font-black text-xl mb-2">Verificando Atualizações</h2>
                <p className="text-white/60 text-sm max-w-xs">
                  Consultando o servidor de versões do CineBG. Aguarde um instante...
                </p>
              </div>
            ) : hasUpdate ? (
              <div>
                <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 mb-4 shadow-lg shadow-amber-500/20">
                  <Sparkles className="h-7 w-7" />
                </div>

                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-400/30 text-amber-300 text-xs font-bold uppercase tracking-wider mb-2">
                  <AlertCircle className="h-3.5 w-3.5" />
                  Nova Versão Disponível
                </div>

                <h2 className="text-white font-black text-2xl mb-1">Atualização do CineBG</h2>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xs font-semibold text-white/50">Versão instalada: v{currentVersion}</span>
                  <span className="text-xs text-white/30">•</span>
                  <span className="text-xs font-bold text-emerald-400">Nova: v{latestVersion}</span>
                </div>

                <p className="text-white/70 text-sm mb-6 leading-relaxed">
                  Uma versão atualizada do CineBG está pronta! Baixe e instale para receber novos canais, filmes atualizados, correções e melhor desempenho na reprodução.
                </p>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Focusable
                    focusKey="modal-update-download"
                    onEnterPress={handleDownload}
                    className="flex-1"
                  >
                    <button
                      type="button"
                      onClick={handleDownload}
                      className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-accent-red to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold py-3 px-5 rounded-xl transition-all shadow-lg shadow-red-900/40 text-sm"
                    >
                      <Download className="h-4 w-4" />
                      Baixar e Atualizar APK
                    </button>
                  </Focusable>

                  <Focusable
                    focusKey="modal-update-dismiss"
                    onEnterPress={onDismiss}
                  >
                    <button
                      type="button"
                      onClick={onDismiss}
                      className="w-full sm:w-auto px-5 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white/80 hover:text-white text-sm font-semibold transition-colors"
                    >
                      Agora não
                    </button>
                  </Focusable>
                </div>
              </div>
            ) : (
              <div>
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 mb-4 shadow-lg shadow-emerald-500/20">
                  <CheckCircle2 className="h-7 w-7" />
                </div>

                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-2">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Aplicativo Atualizado
                </div>

                <h2 className="text-white font-black text-2xl mb-1">Você está atualizado!</h2>
                <p className="text-xs font-mono text-emerald-400 font-semibold mb-4">
                  Versão {currentVersion} (Compilação Oficial)
                </p>

                <p className="text-white/70 text-sm mb-6 leading-relaxed">
                  Seu CineBG já está rodando a versão mais recente com todos os canais de TV ao vivo, séries e filmes sincronizados.
                </p>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Focusable
                    focusKey="modal-update-redownload"
                    onEnterPress={handleDownload}
                    className="flex-1"
                  >
                    <button
                      type="button"
                      onClick={handleDownload}
                      className="w-full flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 border border-white/10 text-white font-bold py-3 px-4 rounded-xl transition-all text-sm"
                    >
                      <Download className="h-4 w-4" />
                      Baixar APK Novamente
                    </button>
                  </Focusable>

                  {onCheckAgain && (
                    <Focusable
                      focusKey="modal-update-recheck"
                      onEnterPress={onCheckAgain}
                    >
                      <button
                        type="button"
                        onClick={onCheckAgain}
                        className="w-full sm:w-auto px-4 py-3 rounded-xl bg-accent-red/20 border border-accent-red/40 hover:bg-accent-red/30 text-red-200 text-sm font-semibold transition-colors flex items-center justify-center gap-1.5"
                      >
                        <RefreshCw className="h-4 w-4" />
                        Reverificar
                      </button>
                    </Focusable>
                  )}

                  <Focusable
                    focusKey="modal-update-close"
                    onEnterPress={onDismiss}
                  >
                    <button
                      type="button"
                      onClick={onDismiss}
                      className="w-full sm:w-auto px-5 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white text-sm font-semibold transition-colors"
                    >
                      OK
                    </button>
                  </Focusable>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default UpdateModal
