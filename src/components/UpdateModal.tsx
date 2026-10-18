import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Download,
  X,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  AlertCircle,
  Settings,
  Smartphone,
  ExternalLink,
} from 'lucide-react'
import Focusable from '@/components/tv/Focusable'
import {
  startAppUpdate,
  openAppInstallSettings,
  canInstallUnknownApps,
  type DownloadProgress,
} from '@/services/appUpdater'
import { Capacitor } from '@capacitor/core'

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

type UpdateStage = 'idle' | 'downloading' | 'installing' | 'error'

const UpdateModal = ({
  visible,
  downloadUrl = 'https://github.com/alej4p4/cinebg/releases/latest/download/CineBG-release.apk',
  currentVersion = '1.2.10',
  latestVersion = '1.2.10',
  hasUpdate = false,
  isChecking = false,
  onDismiss,
  onCheckAgain,
}: UpdateModalProps) => {
  const [stage, setStage] = useState<UpdateStage>('idle')
  const [progress, setProgress] = useState<DownloadProgress>({
    percent: 0,
    bytesDownloaded: 0,
    totalBytes: 0,
  })
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [needsPermission, setNeedsPermission] = useState(false)

  // Reseta estado quando o modal fecha ou abre
  useEffect(() => {
    if (!visible) {
      setStage('idle')
      setProgress({ percent: 0, bytesDownloaded: 0, totalBytes: 0 })
      setErrorMessage(null)
      setNeedsPermission(false)
    }
  }, [visible])

  const formatBytes = (bytes: number): string => {
    if (!bytes || bytes <= 0) return '0 MB'
    const mb = bytes / (1024 * 1024)
    return `${mb.toFixed(1)} MB`
  }

  const handleStartUpdate = async () => {
    setErrorMessage(null)
    setStage('downloading')
    setProgress({ percent: 0, bytesDownloaded: 0, totalBytes: 0 })

    // No Android 8+, verifica se permissão de fontes desconhecidas é necessária
    if (Capacitor.isNativePlatform()) {
      const canInstall = await canInstallUnknownApps()
      if (!canInstall) {
        setNeedsPermission(true)
      }
    }

    try {
      const result = await startAppUpdate(downloadUrl, (p) => {
        setProgress(p)
        if (p.percent >= 99) {
          setStage('installing')
        }
      })

      if (!result.success) {
        setStage('error')
        setErrorMessage(result.error || 'Não foi possível concluir o download ou a instalação.')
      } else {
        setStage('installing')
      }
    } catch (e: unknown) {
      const err = e as { message?: string }
      setStage('error')
      setErrorMessage(err?.message || 'Erro inesperado durante a atualização.')
    }
  }

  const handleOpenBrowserFallback = () => {
    try {
      const a = document.createElement('a')
      a.href = downloadUrl
      a.target = '_blank'
      a.rel = 'noopener noreferrer'
      document.body.appendChild(a)
      a.click()
      setTimeout(() => document.body.removeChild(a), 500)
    } catch {
      window.location.href = downloadUrl
    }
  }

  return (
    <AnimatePresence>
      {visible && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md"
            onClick={stage === 'downloading' ? undefined : onDismiss}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 15 }}
            transition={{ duration: 0.2 }}
            className="relative z-10 w-full max-w-md bg-[#13131c] border border-white/10 rounded-2xl p-6 shadow-2xl overflow-hidden my-auto"
          >
            {/* Botão fechar */}
            {stage !== 'downloading' && (
              <button
                onClick={onDismiss}
                className="absolute top-4 right-4 p-2 text-white/40 hover:text-white rounded-full hover:bg-white/10 transition-colors"
                title="Fechar"
              >
                <X className="h-5 w-5" />
              </button>
            )}

            {isChecking ? (
              <div className="py-8 text-center flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-accent-red/20 border-2 border-accent-red/40 flex items-center justify-center mb-4">
                  <RefreshCw className="h-8 w-8 text-accent-red animate-spin" />
                </div>
                <h2 className="text-white font-black text-xl mb-2">Buscando Atualizações</h2>
                <p className="text-white/60 text-sm max-w-xs">
                  Verificando a versão mais recente do CineBG no servidor...
                </p>
              </div>
            ) : stage === 'downloading' ? (
              <div className="py-6 text-center flex flex-col items-center justify-center">
                <div className="relative w-20 h-20 mb-5 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-4 border-white/10" />
                  <div
                    className="absolute inset-0 rounded-full border-4 border-accent-red border-t-transparent animate-spin"
                    style={{ animationDuration: '1.2s' }}
                  />
                  <Download className="h-8 w-8 text-accent-red animate-pulse" />
                </div>

                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent-red/15 border border-accent-red/30 text-red-300 text-xs font-bold uppercase tracking-wider mb-2">
                  <Smartphone className="h-3.5 w-3.5" />
                  Baixando Atualização
                </div>

                <h2 className="text-white font-black text-xl mb-1">
                  Atualizando para v{latestVersion}
                </h2>
                <p className="text-white/50 text-xs mb-5">
                  Não feche o aplicativo enquanto o download estiver em andamento.
                </p>

                {/* Barra de Progresso */}
                <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden mb-2 p-0.5 border border-white/5">
                  <div
                    className="bg-gradient-to-r from-accent-red to-red-500 h-full rounded-full transition-all duration-300 shadow-lg shadow-red-900/60"
                    style={{ width: `${Math.min(100, Math.max(5, progress.percent))}%` }}
                  />
                </div>

                <div className="w-full flex items-center justify-between text-xs text-white/60 px-1 font-mono">
                  <span>{progress.percent}% concluído</span>
                  <span>
                    {progress.totalBytes > 0
                      ? `${formatBytes(progress.bytesDownloaded)} / ${formatBytes(progress.totalBytes)}`
                      : formatBytes(progress.bytesDownloaded)}
                  </span>
                </div>

                {needsPermission && (
                  <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-left">
                    <p className="text-amber-300 text-xs font-semibold flex items-center gap-1.5 mb-1">
                      <Settings className="h-3.5 w-3.5" />
                      Permissão de Instalação
                    </p>
                    <p className="text-amber-200/70 text-[11px] leading-relaxed">
                      Ao término do download, o Android solicitará permissão para instalar fontes desconhecidas para este app.
                    </p>
                  </div>
                )}
              </div>
            ) : stage === 'installing' ? (
              <div className="py-6 text-center flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center mb-4 text-emerald-400 shadow-lg shadow-emerald-500/20">
                  <CheckCircle2 className="h-9 w-9 animate-bounce" />
                </div>
                <h2 className="text-white font-black text-2xl mb-1">Download Concluído!</h2>
                <p className="text-white/70 text-sm mb-4 max-w-xs">
                  O instalador de pacotes do Android foi acionado. Confirme na tela do seu aparelho para concluir a atualização.
                </p>

                <div className="p-3 bg-white/5 border border-white/10 rounded-xl text-left text-xs text-white/60 mb-6 space-y-1.5">
                  <div className="flex items-center gap-2 text-white font-semibold">
                    <Smartphone className="h-4 w-4 text-emerald-400" />
                    <span>Instalação do CineBG</span>
                  </div>
                  <p className="text-[11px]">
                    Toque em <b>Instalar</b> ou <b>Atualizar</b> na janela do sistema operacional. Seus perfis e favoritos permanecerão intactos.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 w-full">
                  <button
                    type="button"
                    onClick={handleStartUpdate}
                    className="flex-1 py-3 px-4 bg-white/10 hover:bg-white/15 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-colors"
                  >
                    Abrir Instalador Novamente
                  </button>
                  <button
                    type="button"
                    onClick={onDismiss}
                    className="py-3 px-5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-colors shadow-lg shadow-emerald-900/40"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            ) : stage === 'error' ? (
              <div className="py-4 text-center flex flex-col items-center justify-center">
                <div className="w-14 h-14 rounded-2xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 mb-4">
                  <AlertCircle className="h-7 w-7" />
                </div>
                <h2 className="text-white font-black text-xl mb-1">Falha na Atualização</h2>
                <p className="text-white/60 text-xs mb-4 max-w-xs">
                  {errorMessage || 'Não foi possível baixar e iniciar o pacote de instalação.'}
                </p>

                <div className="flex flex-col gap-2 w-full">
                  <button
                    type="button"
                    onClick={handleStartUpdate}
                    className="w-full flex items-center justify-center gap-2 bg-accent-red hover:bg-red-600 text-white font-bold py-3 px-4 rounded-xl text-sm transition-colors shadow-lg shadow-red-900/40"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Tentar Novamente
                  </button>

                  {Capacitor.isNativePlatform() && (
                    <button
                      type="button"
                      onClick={openAppInstallSettings}
                      className="w-full flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 text-white text-xs font-semibold py-2.5 px-4 rounded-xl transition-colors"
                    >
                      <Settings className="h-4 w-4 text-amber-400" />
                      Permissões de Instalação (Configurações)
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleOpenBrowserFallback}
                    className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-xs font-semibold py-2.5 px-4 rounded-xl transition-colors"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Baixar pelo Navegador
                  </button>
                </div>
              </div>
            ) : hasUpdate ? (
              <div>
                <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 mb-4 shadow-lg shadow-amber-500/20">
                  <Sparkles className="h-7 w-7" />
                </div>

                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-400/30 text-amber-300 text-xs font-bold uppercase tracking-wider mb-2">
                  <AlertCircle className="h-3.5 w-3.5" />
                  Nova Versão Pronta
                </div>

                <h2 className="text-white font-black text-2xl mb-1">Atualização do CineBG</h2>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xs font-semibold text-white/50">
                    Instalada: v{currentVersion}
                  </span>
                  <span className="text-xs text-white/30">•</span>
                  <span className="text-xs font-bold text-emerald-400">Nova: v{latestVersion}</span>
                </div>

                <p className="text-white/70 text-sm mb-6 leading-relaxed">
                  Uma versão atualizada do CineBG está disponível! Clique no botão abaixo para baixar a nova versão e abrir o instalador automaticamente.
                </p>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Focusable
                    focusKey="modal-update-download"
                    onEnterPress={handleStartUpdate}
                    className="flex-1"
                  >
                    <button
                      type="button"
                      onClick={handleStartUpdate}
                      className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-accent-red to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold py-3 px-5 rounded-xl transition-all shadow-lg shadow-red-900/40 text-sm"
                    >
                      <Download className="h-4 w-4" />
                      Baixar e Instalar APK
                    </button>
                  </Focusable>

                  <Focusable focusKey="modal-update-dismiss" onEnterPress={onDismiss}>
                    <button
                      type="button"
                      onClick={onDismiss}
                      className="w-full sm:w-auto px-5 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white/80 hover:text-white text-sm font-semibold transition-colors"
                    >
                      Depois
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
                  Seu CineBG já está na versão mais recente. Caso queira reinstalar ou atualizar o binário do aplicativo, use a opção abaixo.
                </p>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Focusable
                    focusKey="modal-update-redownload"
                    onEnterPress={handleStartUpdate}
                    className="flex-1"
                  >
                    <button
                      type="button"
                      onClick={handleStartUpdate}
                      className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-accent-red to-red-600 hover:from-red-600 text-white font-bold py-3 px-4 rounded-xl transition-all text-sm shadow-lg shadow-red-900/30"
                    >
                      <Download className="h-4 w-4" />
                      Baixar e Reinstalar APK
                    </button>
                  </Focusable>

                  {onCheckAgain && (
                    <Focusable focusKey="modal-update-recheck" onEnterPress={onCheckAgain}>
                      <button
                        type="button"
                        onClick={onCheckAgain}
                        className="w-full sm:w-auto px-4 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white/80 text-sm font-semibold transition-colors flex items-center justify-center gap-1.5"
                      >
                        <RefreshCw className="h-4 w-4" />
                        Reverificar
                      </button>
                    </Focusable>
                  )}

                  <Focusable focusKey="modal-update-close" onEnterPress={onDismiss}>
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
        </div>
      )}
    </AnimatePresence>
  )
}

export default UpdateModal
