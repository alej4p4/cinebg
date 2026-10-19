import { useState, useEffect, useRef, useCallback } from 'react'
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
  Tv,
  ExternalLink,
} from 'lucide-react'
import Focusable from '@/components/tv/Focusable'
import { setFocus, doesFocusableExist } from '@noriginmedia/norigin-spatial-navigation'
import {
  startAppUpdate,
  openAppInstallSettings,
  canInstallUnknownApps,
  type DownloadProgress,
} from '@/services/appUpdater'
import { Capacitor } from '@capacitor/core'
import { isMobileDevice } from '@/utils/tv'

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
  downloadUrl = 'https://github.com/alej4p4/cinebg/releases/latest/download/CineBG-Mobile-release.apk',
  currentVersion = '1.2.50',
  latestVersion = '1.2.50',
  hasUpdate = false,
  isChecking = false,
  onDismiss,
  onCheckAgain,
}: UpdateModalProps) => {
  const isMobile = isMobileDevice()
  const flavorLabel = isMobile ? 'CineBG Mobile' : 'CineBG TV'
  const deviceConfirmText = isMobile
    ? 'O instalador de pacotes do Android foi acionado. Confirme na tela do seu celular para concluir a atualização.'
    : 'O instalador de pacotes do Android foi acionado. Confirme na tela da sua TV para concluir a atualização.'

  const [stage, setStage] = useState<UpdateStage>('idle')
  const [progress, setProgress] = useState<DownloadProgress>({
    percent: 0,
    bytesDownloaded: 0,
    totalBytes: 0,
  })
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [needsPermission, setNeedsPermission] = useState(false)
  const [activeActionIndex, setActiveActionIndex] = useState<number>(0)

  // Referências para os botões do modal para foco direto no Android TV
  const downloadBtnRef = useRef<HTMLButtonElement | null>(null)
  const dismissBtnRef = useRef<HTMLButtonElement | null>(null)
  const reinstallBtnRef = useRef<HTMLButtonElement | null>(null)
  const installDismissBtnRef = useRef<HTMLButtonElement | null>(null)
  const errorRetryBtnRef = useRef<HTMLButtonElement | null>(null)
  const errorSettingsBtnRef = useRef<HTMLButtonElement | null>(null)
  const errorBrowserBtnRef = useRef<HTMLButtonElement | null>(null)
  const upToDateDownloadBtnRef = useRef<HTMLButtonElement | null>(null)
  const upToDateRecheckBtnRef = useRef<HTMLButtonElement | null>(null)
  const upToDateCloseBtnRef = useRef<HTMLButtonElement | null>(null)

  // Reseta estado quando o modal fecha ou abre
  useEffect(() => {
    if (!visible) {
      setStage('idle')
      setProgress({ percent: 0, bytesDownloaded: 0, totalBytes: 0 })
      setErrorMessage(null)
      setNeedsPermission(false)
      setActiveActionIndex(0)
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

  // Foco ativo direto com sincronização entre D-Pad Spatial Navigation e elementos DOM
  const focusCurrentAction = useCallback(
    (index: number) => {
      setActiveActionIndex(index)
      if (stage === 'downloading') return

      if (hasUpdate && stage === 'idle') {
        if (index === 0) {
          if (doesFocusableExist('modal-update-download')) setFocus('modal-update-download')
          downloadBtnRef.current?.focus()
        } else {
          if (doesFocusableExist('modal-update-dismiss')) setFocus('modal-update-dismiss')
          dismissBtnRef.current?.focus()
        }
      } else if (stage === 'installing') {
        if (index === 0) {
          if (doesFocusableExist('modal-install-retry')) setFocus('modal-install-retry')
          reinstallBtnRef.current?.focus()
        } else {
          if (doesFocusableExist('modal-install-close')) setFocus('modal-install-close')
          installDismissBtnRef.current?.focus()
        }
      } else if (stage === 'error') {
        if (index === 0) {
          if (doesFocusableExist('modal-error-retry')) setFocus('modal-error-retry')
          errorRetryBtnRef.current?.focus()
        } else if (index === 1 && Capacitor.isNativePlatform()) {
          if (doesFocusableExist('modal-error-settings')) setFocus('modal-error-settings')
          errorSettingsBtnRef.current?.focus()
        } else {
          if (doesFocusableExist('modal-error-browser')) setFocus('modal-error-browser')
          errorBrowserBtnRef.current?.focus()
        }
      } else if (!hasUpdate && !isChecking) {
        if (index === 0) {
          if (doesFocusableExist('modal-uptodate-download')) setFocus('modal-uptodate-download')
          upToDateDownloadBtnRef.current?.focus()
        } else if (index === 1 && onCheckAgain) {
          if (doesFocusableExist('modal-uptodate-recheck')) setFocus('modal-uptodate-recheck')
          upToDateRecheckBtnRef.current?.focus()
        } else {
          if (doesFocusableExist('modal-uptodate-close')) setFocus('modal-uptodate-close')
          upToDateCloseBtnRef.current?.focus()
        }
      }
    },
    [hasUpdate, stage, isChecking, onCheckAgain]
  )

  // Ao abrir o modal ou mudar de tela, força foco imediatamente no botão principal
  useEffect(() => {
    if (!visible) return
    setActiveActionIndex(0)
    const t1 = setTimeout(() => focusCurrentAction(0), 50)
    const t2 = setTimeout(() => focusCurrentAction(0), 200)
    const t3 = setTimeout(() => focusCurrentAction(0), 500)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
    }
  }, [visible, stage, hasUpdate, focusCurrentAction])

  // Captura direta de teclas de controle remoto da TV (D-Pad, Enter, OK e Voltar)
  useEffect(() => {
    if (!visible || stage === 'downloading') return

    const handleKeyDown = (e: KeyboardEvent) => {
      const code = e.keyCode || e.which
      const key = (e.key || '').toLowerCase()

      // Back / Voltar / Esc
      if (code === 27 || code === 4 || code === 8 || key === 'escape' || key === 'back') {
        e.preventDefault()
        e.stopPropagation()
        onDismiss()
        return
      }

      // Calcula o número total de botões interativos da tela atual
      let totalActions = 2
      if (hasUpdate && stage === 'idle') {
        totalActions = 2
      } else if (stage === 'installing') {
        totalActions = 2
      } else if (stage === 'error') {
        totalActions = Capacitor.isNativePlatform() ? 3 : 2
      } else if (!hasUpdate && !isChecking) {
        totalActions = onCheckAgain ? 3 : 2
      }

      // D-Pad Left / Up
      if (
        code === 37 ||
        code === 38 ||
        code === 21 ||
        code === 19 ||
        key === 'arrowleft' ||
        key === 'arrowup'
      ) {
        e.preventDefault()
        e.stopPropagation()
        setActiveActionIndex((prev) => {
          const next = prev > 0 ? prev - 1 : totalActions - 1
          focusCurrentAction(next)
          return next
        })
        return
      }

      // D-Pad Right / Down / Tab
      if (
        code === 39 ||
        code === 40 ||
        code === 22 ||
        code === 20 ||
        key === 'arrowright' ||
        key === 'arrowdown' ||
        key === 'tab'
      ) {
        e.preventDefault()
        e.stopPropagation()
        setActiveActionIndex((prev) => {
          const next = prev < totalActions - 1 ? prev + 1 : 0
          focusCurrentAction(next)
          return next
        })
        return
      }

      // Enter / OK / Select / Espaço
      if (
        code === 13 ||
        code === 23 ||
        code === 66 ||
        code === 160 ||
        code === 96 ||
        key === 'enter' ||
        key === 'select' ||
        key === 'ok' ||
        key === ' '
      ) {
        e.preventDefault()
        e.stopPropagation()

        if (hasUpdate && stage === 'idle') {
          if (activeActionIndex === 0) {
            handleStartUpdate()
          } else {
            onDismiss()
          }
        } else if (stage === 'installing') {
          if (activeActionIndex === 0) {
            handleStartUpdate()
          } else {
            onDismiss()
          }
        } else if (stage === 'error') {
          if (activeActionIndex === 0) {
            handleStartUpdate()
          } else if (activeActionIndex === 1 && Capacitor.isNativePlatform()) {
            openAppInstallSettings()
          } else {
            handleOpenBrowserFallback()
          }
        } else if (!hasUpdate && !isChecking) {
          if (activeActionIndex === 0) {
            handleStartUpdate()
          } else if (activeActionIndex === 1 && onCheckAgain) {
            onCheckAgain()
          } else {
            onDismiss()
          }
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown, { capture: true })
    return () => {
      window.removeEventListener('keydown', handleKeyDown, { capture: true })
    }
  }, [
    visible,
    stage,
    hasUpdate,
    isChecking,
    activeActionIndex,
    focusCurrentAction,
    onDismiss,
    onCheckAgain,
  ])

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
                  {isMobile ? <Smartphone className="h-3.5 w-3.5" /> : <Tv className="h-3.5 w-3.5" />}
                  Baixando {flavorLabel}
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
                  {deviceConfirmText}
                </p>

                <div className="p-3 bg-white/5 border border-white/10 rounded-xl text-left text-xs text-white/60 mb-6 space-y-1.5">
                  <div className="flex items-center gap-2 text-white font-semibold">
                    {isMobile ? (
                      <Smartphone className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <Tv className="h-4 w-4 text-emerald-400" />
                    )}
                    <span>Instalação do {flavorLabel}</span>
                  </div>
                  <p className="text-[11px]">
                    Toque em <b>Instalar</b> ou <b>Atualizar</b> na janela do sistema operacional. Seus perfis e favoritos permanecerão intactos.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 w-full">
                  <Focusable
                    focusKey="modal-install-retry"
                    onEnterPress={handleStartUpdate}
                    onFocus={() => setActiveActionIndex(0)}
                    className="flex-1"
                  >
                    <button
                      ref={reinstallBtnRef}
                      type="button"
                      onClick={handleStartUpdate}
                      onFocus={() => setActiveActionIndex(0)}
                      className={`w-full py-3.5 px-4 font-bold rounded-xl text-xs uppercase tracking-wider transition-all outline-none ${
                        activeActionIndex === 0
                          ? 'bg-accent-red text-white ring-4 ring-amber-400 scale-[1.04] shadow-2xl shadow-amber-500/40 brightness-110'
                          : 'bg-white/10 hover:bg-white/15 text-white'
                      }`}
                    >
                      Abrir Instalador Novamente
                    </button>
                  </Focusable>

                  <Focusable
                    focusKey="modal-install-close"
                    onEnterPress={onDismiss}
                    onFocus={() => setActiveActionIndex(1)}
                  >
                    <button
                      ref={installDismissBtnRef}
                      type="button"
                      onClick={onDismiss}
                      onFocus={() => setActiveActionIndex(1)}
                      className={`w-full sm:w-auto py-3.5 px-5 font-bold rounded-xl text-xs uppercase tracking-wider transition-all outline-none ${
                        activeActionIndex === 1
                          ? 'bg-emerald-500 text-white ring-4 ring-amber-400 scale-[1.04] shadow-2xl shadow-amber-500/40 brightness-110'
                          : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/40'
                      }`}
                    >
                      Fechar
                    </button>
                  </Focusable>
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

                <div className="flex flex-col gap-2.5 w-full">
                  <Focusable
                    focusKey="modal-error-retry"
                    onEnterPress={handleStartUpdate}
                    onFocus={() => setActiveActionIndex(0)}
                  >
                    <button
                      ref={errorRetryBtnRef}
                      type="button"
                      onClick={handleStartUpdate}
                      onFocus={() => setActiveActionIndex(0)}
                      className={`w-full flex items-center justify-center gap-2 font-bold py-3.5 px-4 rounded-xl text-sm transition-all outline-none ${
                        activeActionIndex === 0
                          ? 'bg-accent-red text-white ring-4 ring-amber-400 scale-[1.04] shadow-2xl shadow-amber-500/40 brightness-110'
                          : 'bg-accent-red hover:bg-red-600 text-white shadow-lg shadow-red-900/40'
                      }`}
                    >
                      <RefreshCw className={`h-4 w-4 ${activeActionIndex === 0 ? 'animate-spin' : ''}`} />
                      Tentar Novamente
                    </button>
                  </Focusable>

                  {Capacitor.isNativePlatform() && (
                    <Focusable
                      focusKey="modal-error-settings"
                      onEnterPress={openAppInstallSettings}
                      onFocus={() => setActiveActionIndex(1)}
                    >
                      <button
                        ref={errorSettingsBtnRef}
                        type="button"
                        onClick={openAppInstallSettings}
                        onFocus={() => setActiveActionIndex(1)}
                        className={`w-full flex items-center justify-center gap-2 text-xs font-semibold py-3 px-4 rounded-xl transition-all outline-none ${
                          activeActionIndex === 1
                            ? 'bg-white/25 text-white ring-4 ring-amber-400 scale-[1.04] shadow-2xl shadow-amber-500/40 brightness-110'
                            : 'bg-white/10 hover:bg-white/15 text-white'
                        }`}
                      >
                        <Settings className="h-4 w-4 text-amber-400" />
                        Permissões de Instalação (Configurações)
                      </button>
                    </Focusable>
                  )}

                  <Focusable
                    focusKey="modal-error-browser"
                    onEnterPress={handleOpenBrowserFallback}
                    onFocus={() => setActiveActionIndex(Capacitor.isNativePlatform() ? 2 : 1)}
                  >
                    <button
                      ref={errorBrowserBtnRef}
                      type="button"
                      onClick={handleOpenBrowserFallback}
                      onFocus={() => setActiveActionIndex(Capacitor.isNativePlatform() ? 2 : 1)}
                      className={`w-full flex items-center justify-center gap-2 text-xs font-semibold py-3 px-4 rounded-xl transition-all outline-none ${
                        (Capacitor.isNativePlatform() ? activeActionIndex === 2 : activeActionIndex === 1)
                          ? 'bg-white/25 text-white ring-4 ring-amber-400 scale-[1.04] shadow-2xl shadow-amber-500/40 brightness-110'
                          : 'bg-white/5 hover:bg-white/10 text-white/70 hover:text-white'
                      }`}
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Baixar pelo Navegador
                    </button>
                  </Focusable>
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

                <h2 className="text-white font-black text-2xl mb-1">Atualização do {flavorLabel}</h2>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xs font-semibold text-white/50">
                    Instalada: v{currentVersion}
                  </span>
                  <span className="text-xs text-white/30">•</span>
                  <span className="text-xs font-bold text-emerald-400">Nova: v{latestVersion}</span>
                </div>

                <p className="text-white/70 text-sm mb-6 leading-relaxed">
                  Uma versão atualizada do {flavorLabel} está disponível! Clique no botão abaixo para baixar a nova versão e abrir o instalador automaticamente.
                </p>

                {/* Botões com suporte prioritário para controle remoto e D-Pad da TV */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <Focusable
                    focusKey="modal-update-download"
                    onEnterPress={handleStartUpdate}
                    onFocus={() => setActiveActionIndex(0)}
                    className="flex-1"
                  >
                    <button
                      ref={downloadBtnRef}
                      type="button"
                      onClick={handleStartUpdate}
                      onFocus={() => setActiveActionIndex(0)}
                      className={`w-full flex items-center justify-center gap-2 font-bold py-3.5 px-5 rounded-xl transition-all text-sm outline-none ${
                        activeActionIndex === 0
                          ? 'bg-gradient-to-r from-accent-red to-red-600 text-white ring-4 ring-amber-400 scale-[1.04] shadow-2xl shadow-amber-500/50 brightness-110 font-extrabold'
                          : 'bg-gradient-to-r from-accent-red/90 to-red-600/90 text-white hover:from-red-600 hover:to-red-700'
                      }`}
                    >
                      <Download className={`h-4 w-4 ${activeActionIndex === 0 ? 'animate-bounce' : ''}`} />
                      <span>Baixar e Instalar {flavorLabel}</span>
                    </button>
                  </Focusable>

                  <Focusable
                    focusKey="modal-update-dismiss"
                    onEnterPress={onDismiss}
                    onFocus={() => setActiveActionIndex(1)}
                  >
                    <button
                      ref={dismissBtnRef}
                      type="button"
                      onClick={onDismiss}
                      onFocus={() => setActiveActionIndex(1)}
                      className={`w-full sm:w-auto px-6 py-3.5 rounded-xl text-sm font-semibold transition-all outline-none ${
                        activeActionIndex === 1
                          ? 'bg-white/30 text-white ring-4 ring-amber-400 scale-[1.04] shadow-2xl shadow-amber-500/50 brightness-110 font-extrabold'
                          : 'bg-white/10 hover:bg-white/15 text-white/80 hover:text-white'
                      }`}
                    >
                      <span>Depois</span>
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
                    focusKey="modal-uptodate-download"
                    onEnterPress={handleStartUpdate}
                    onFocus={() => setActiveActionIndex(0)}
                    className="flex-1"
                  >
                    <button
                      ref={upToDateDownloadBtnRef}
                      type="button"
                      onClick={handleStartUpdate}
                      onFocus={() => setActiveActionIndex(0)}
                      className={`w-full flex items-center justify-center gap-2 font-bold py-3.5 px-4 rounded-xl transition-all text-sm outline-none ${
                        activeActionIndex === 0
                          ? 'bg-gradient-to-r from-accent-red to-red-600 text-white ring-4 ring-amber-400 scale-[1.04] shadow-2xl shadow-amber-500/50 brightness-110'
                          : 'bg-gradient-to-r from-accent-red to-red-600 hover:from-red-600 text-white shadow-lg shadow-red-900/30'
                      }`}
                    >
                      <Download className={`h-4 w-4 ${activeActionIndex === 0 ? 'animate-bounce' : ''}`} />
                      <span>Baixar e Reinstalar APK</span>
                    </button>
                  </Focusable>

                  {onCheckAgain && (
                    <Focusable
                      focusKey="modal-uptodate-recheck"
                      onEnterPress={onCheckAgain}
                      onFocus={() => setActiveActionIndex(1)}
                    >
                      <button
                        ref={upToDateRecheckBtnRef}
                        type="button"
                        onClick={onCheckAgain}
                        onFocus={() => setActiveActionIndex(1)}
                        className={`w-full sm:w-auto px-4 py-3.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-1.5 outline-none ${
                          activeActionIndex === 1
                            ? 'bg-white/30 text-white ring-4 ring-amber-400 scale-[1.04] shadow-2xl shadow-amber-500/50 brightness-110'
                            : 'bg-white/10 hover:bg-white/15 text-white/80'
                        }`}
                      >
                        <RefreshCw className={`h-4 w-4 ${activeActionIndex === 1 ? 'animate-spin' : ''}`} />
                        <span>Reverificar</span>
                      </button>
                    </Focusable>
                  )}

                  <Focusable
                    focusKey="modal-uptodate-close"
                    onEnterPress={onDismiss}
                    onFocus={() => setActiveActionIndex(onCheckAgain ? 2 : 1)}
                  >
                    <button
                      ref={upToDateCloseBtnRef}
                      type="button"
                      onClick={onDismiss}
                      onFocus={() => setActiveActionIndex(onCheckAgain ? 2 : 1)}
                      className={`w-full sm:w-auto px-6 py-3.5 rounded-xl text-sm font-semibold transition-all outline-none ${
                        (onCheckAgain ? activeActionIndex === 2 : activeActionIndex === 1)
                          ? 'bg-white/30 text-white ring-4 ring-amber-400 scale-[1.04] shadow-2xl shadow-amber-500/50 brightness-110'
                          : 'bg-white/10 hover:bg-white/15 text-white'
                      }`}
                    >
                      <span>OK</span>
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
