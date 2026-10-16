import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Crown,
  QrCode,
  Copy,
  Check,
  Clock,
  Sparkles,
  ShieldCheck,
  RefreshCw,
  X,
  Tv,
  CheckCircle2,
  ExternalLink,
  Settings,
  Flame,
} from 'lucide-react'
import { useLicense } from '@/hooks/useLicense'
import {
  VIP_PLANS,
  VipPlan,
  DEFAULT_PIX_KEY,
  createMercadoPagoPix,
  checkMercadoPagoStatus,
  getMercadoPagoToken,
  setMercadoPagoToken,
  CreatePixPaymentResult,
} from '@/services/mercadoPago'
import Focusable from '@/components/tv/Focusable'

interface LicenseGateProps {
  isModal?: boolean
  onClose?: () => void
}

const LicenseGate = ({ isModal = false, onClose }: LicenseGateProps) => {
  const {
    activateLicense,
    getDeviceId,
    isTrial,
    isLicensed,
    trialDaysLeft,
    licenseDaysLeft,
    license,
  } = useLicense()

  const [selectedPlanIndex, setSelectedPlanIndex] = useState(0)
  const [loadingPix, setLoadingPix] = useState(false)
  const [pixData, setPixData] = useState<CreatePixPaymentResult | null>(null)
  const [copied, setCopied] = useState(false)
  const [manualCode, setManualCode] = useState('')
  const [activated, setActivated] = useState(false)
  const [checkingStatus, setCheckingStatus] = useState(false)
  const [showConfig, setShowConfig] = useState(false)
  const [tokenInput, setTokenInput] = useState('')
  const [tokenSaved, setTokenSaved] = useState(false)
  const [showManualSection, setShowManualSection] = useState(false)

  const pollingRef = useRef<NodeJS.Timeout | null>(null)
  const deviceId = getDeviceId()
  const currentPlan: VipPlan = VIP_PLANS[selectedPlanIndex] || VIP_PLANS[0]

  // Limpa o timer de polling ao desmontar
  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
    }
  }, [])

  // Inicializa o valor do token atual nas configs
  useEffect(() => {
    setTokenInput(getMercadoPagoToken())
  }, [showConfig])

  // Polling automático no Mercado Pago
  const startPolling = useCallback(
    (paymentId: number | string, plan: VipPlan) => {
      if (pollingRef.current) clearInterval(pollingRef.current)

      // Se for fallback estático sem Mercado Pago, não faz polling
      if (!paymentId || String(paymentId).startsWith('PIX-')) return

      pollingRef.current = setInterval(async () => {
        try {
          const res = await checkMercadoPagoStatus(paymentId)
          if (res.isApproved) {
            if (pollingRef.current) clearInterval(pollingRef.current)
            activateLicense(`MP-${paymentId}`, plan.days, plan.title, paymentId)
            setActivated(true)
            setTimeout(() => {
              if (onClose) onClose()
            }, 2500)
          }
        } catch {
          // Ignora erros temporários de conexão durante o polling
        }
      }, 3500)
    },
    [activateLicense, onClose]
  )

  const handleGeneratePix = async () => {
    setLoadingPix(true)
    setPixData(null)
    if (pollingRef.current) clearInterval(pollingRef.current)

    try {
      const result = await createMercadoPagoPix(currentPlan, deviceId)
      setPixData(result)

      if (result.success && result.paymentId && !result.isFallback) {
        startPolling(result.paymentId, currentPlan)
      }
    } catch {
      // Tratamento silencioso
    } finally {
      setLoadingPix(false)
    }
  }

  const handleCheckNow = async () => {
    if (!pixData?.paymentId || pixData.isFallback) return
    setCheckingStatus(true)
    try {
      const res = await checkMercadoPagoStatus(pixData.paymentId)
      if (res.isApproved) {
        if (pollingRef.current) clearInterval(pollingRef.current)
        activateLicense(`MP-${pixData.paymentId}`, currentPlan.days, currentPlan.title, pixData.paymentId)
        setActivated(true)
        setTimeout(() => {
          if (onClose) onClose()
        }, 2500)
      } else {
        alert('Pagamento ainda não identificado. Se já pagou, aguarde alguns segundos que a confirmação é automática!')
      }
    } catch {
      alert('Erro ao consultar Mercado Pago. Verifique sua conexão com a internet.')
    } finally {
      setCheckingStatus(false)
    }
  }

  const handleCopyPix = () => {
    const code = pixData?.qrCode
    if (!code) return
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const handleActivateManual = () => {
    if (!manualCode.trim()) return
    activateLicense(manualCode.trim(), currentPlan.days, 'Ativação Manual / Suporte')
    setActivated(true)
    setTimeout(() => {
      if (onClose) onClose()
    }, 2500)
  }

  const handleSaveToken = () => {
    setMercadoPagoToken(tokenInput)
    setTokenSaved(true)
    setTimeout(() => {
      setTokenSaved(false)
      setShowConfig(false)
    }, 1500)
  }

  if (activated) {
    return (
      <div
        className={`${
          isModal ? 'fixed inset-0 z-50 bg-black/85 backdrop-blur-md' : 'min-h-screen bg-bg-primary'
        } flex items-center justify-center p-4`}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass border border-emerald-500/40 rounded-2xl p-8 max-w-md w-full text-center shadow-2xl shadow-emerald-500/20"
        >
          <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="h-10 w-10 text-emerald-400 animate-bounce" />
          </div>
          <h2 className="text-white font-black text-2xl mb-2">🎉 Pagamento Confirmado!</h2>
          <p className="text-emerald-300 font-semibold mb-2">
            Plano VIP Ativado com Sucesso!
          </p>
          <p className="text-white/60 text-sm mb-6">
            Acesso ilimitado a todos os filmes, séries e canais de TV ao vivo liberados.
          </p>
          <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-300 px-4 py-2 rounded-xl text-xs font-mono">
            ID: {deviceId}
          </div>
        </motion.div>
      </div>
    )
  }

  const content = (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-2xl mx-auto my-auto relative"
    >
      {/* Botão fechar (apenas modo modal) */}
      {isModal && onClose && (
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 z-10 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      )}

      {/* Cabeçalho */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs font-bold uppercase tracking-wider mb-3">
          <Crown className="h-3.5 w-3.5" />
          CineBG VIP Membership
        </div>

        <h1 className="text-white font-black text-2xl sm:text-3xl mb-2 flex items-center justify-center gap-2">
          <span>Liberte Todo o Conteúdo</span>
          <Sparkles className="h-6 w-6 text-amber-400" />
        </h1>

        {isTrial ? (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-2 text-amber-200 text-sm max-w-lg mx-auto">
            ⚡ <strong>Período de Teste Grátis Ativo:</strong> Você possui{' '}
            <span className="font-bold underline">{trialDaysLeft} {trialDaysLeft === 1 ? 'dia restante' : 'dias restantes'}</span>.{' '}
            Assine já para garantir seu acesso VIP contínuo sem interrupções!
          </div>
        ) : isLicensed ? (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-2 text-emerald-300 text-sm max-w-lg mx-auto">
            💎 <strong>Você já é Membro VIP!</strong> Seu plano possui{' '}
            <span className="font-bold underline">{licenseDaysLeft} dias restantes</span> ({license?.planName}).
            Deseja estender sua assinatura?
          </div>
        ) : (
          <div className="bg-red-500/15 border border-red-500/30 rounded-xl px-4 py-2 text-red-200 text-sm max-w-lg mx-auto">
            ⏳ <strong>Seu período de teste de 3 dias encerrou.</strong>
            <br />
            Escolha um plano VIP abaixo e desbloqueie o aplicativo instantaneamente via Pix Mercado Pago!
          </div>
        )}
      </div>

      {/* Benefícios VIP */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6 text-xs text-white/80">
        <div className="glass rounded-xl p-2.5 flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-emerald-400 flex-shrink-0" />
          <span>Sem anúncios</span>
        </div>
        <div className="glass rounded-xl p-2.5 flex items-center gap-2">
          <Tv className="h-4 w-4 text-sky-400 flex-shrink-0" />
          <span>Canais de TV ao Vivo</span>
        </div>
        <div className="glass rounded-xl p-2.5 flex items-center gap-2">
          <Flame className="h-4 w-4 text-amber-400 flex-shrink-0" />
          <span>Qualidade 4K / HD</span>
        </div>
        <div className="glass rounded-xl p-2.5 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
          <span>Liberação Imediata</span>
        </div>
      </div>

      {/* Grid de Planos */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {VIP_PLANS.map((p, i) => {
          const isSelected = selectedPlanIndex === i
          return (
            <Focusable
              key={p.id}
              onEnterPress={() => {
                setSelectedPlanIndex(i)
                setPixData(null)
              }}
              className="w-full"
            >
              <button
                type="button"
                onClick={() => {
                  setSelectedPlanIndex(i)
                  setPixData(null)
                }}
                className={`w-full relative p-3.5 rounded-2xl border text-center transition-all duration-200 flex flex-col justify-between ${
                  isSelected
                    ? 'bg-gradient-to-b from-amber-500/20 to-red-500/20 border-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.3)] scale-[1.02]'
                    : 'bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10'
                }`}
              >
                {p.badge && (
                  <span
                    className={`absolute -top-2.5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      p.popular
                        ? 'bg-amber-400 text-black shadow-md'
                        : 'bg-emerald-500 text-white'
                    }`}
                  >
                    {p.badge}
                  </span>
                )}

                <div className="pt-1">
                  <p className="text-white/70 text-xs font-semibold">{p.title}</p>
                  {p.originalPriceLabel && (
                    <p className="text-white/40 text-[11px] line-through mt-0.5">
                      {p.originalPriceLabel}
                    </p>
                  )}
                  <p className="text-white font-black text-xl sm:text-2xl mt-0.5 tracking-tight text-emerald-300">
                    {p.priceLabel}
                  </p>
                  {p.monthlyEquivalent && (
                    <p className="text-amber-300 text-[11px] font-semibold mt-0.5">
                      {p.monthlyEquivalent}
                    </p>
                  )}
                </div>

                <div className="mt-3 pt-2 border-t border-white/10 text-[11px] text-white/50 leading-tight">
                  {p.days} dias de acesso
                </div>
              </button>
            </Focusable>
          )
        })}
      </div>

      {/* Área de Pagamento Pix / Mercado Pago */}
      <div className="glass border border-white/10 rounded-2xl p-5 mb-4 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-400">
              <QrCode className="h-4 w-4" />
            </div>
            <div>
              <p className="text-white font-bold text-sm">
                Pagamento via Pix Mercado Pago
              </p>
              <p className="text-white/40 text-xs">
                {currentPlan.title} • {currentPlan.priceLabel}
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowConfig(!showConfig)}
            title="Configurações de Pagamento"
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-colors"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>

        {/* Painel Configuração Mercado Pago (Opcional para o dono/admin) */}
        <AnimatePresence>
          {showConfig && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-black/40 border border-white/10 rounded-xl p-3.5 mb-4 text-xs overflow-hidden"
            >
              <p className="text-amber-300 font-semibold mb-1">
                ⚙️ Configurar Access Token do Mercado Pago
              </p>
              <p className="text-white/50 mb-2">
                Insira o token de produção do Mercado Pago (<code>APP_USR-...</code>) para gerar Pix dinâmico com auto-liberação.
              </p>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  placeholder="APP_USR-0000000000000000-000000-..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-amber-400/50"
                />
                <button
                  onClick={handleSaveToken}
                  className="px-3 py-2 bg-amber-500 hover:bg-amber-600 text-black font-bold rounded-lg transition-colors"
                >
                  {tokenSaved ? 'Salvo!' : 'Salvar'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {!pixData ? (
          <div className="text-center py-4">
            <p className="text-white/60 text-sm mb-4">
              Clique abaixo para gerar o código Pix e QR Code oficial do Mercado Pago para o plano selecionado.
            </p>
            <Focusable onEnterPress={handleGeneratePix} className="inline-block">
              <button
                type="button"
                onClick={handleGeneratePix}
                disabled={loadingPix}
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-red-600 hover:from-amber-600 hover:to-red-700 text-white font-bold py-3.5 px-8 rounded-xl transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50"
              >
                {loadingPix ? (
                  <>
                    <RefreshCw className="h-5 w-5 animate-spin" />
                    <span>Gerando Pix no Mercado Pago...</span>
                  </>
                ) : (
                  <>
                    <QrCode className="h-5 w-5" />
                    <span>Pagar {currentPlan.priceLabel} via Pix (Liberação Imediata)</span>
                  </>
                )}
              </button>
            </Focusable>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Aviso se for fallback */}
            {pixData.isFallback && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-2.5 text-xs text-amber-200">
                ℹ️ Pix com chave padrão. Após o pagamento, envie o comprovante ou insira o código de ativação.
              </div>
            )}

            {/* QR Code Container */}
            <div className="bg-white rounded-2xl p-4 flex flex-col items-center justify-center max-w-[240px] mx-auto shadow-inner">
              {pixData.qrCodeBase64 ? (
                <img
                  src={`data:image/png;base64,${pixData.qrCodeBase64}`}
                  alt="QR Code Pix Mercado Pago"
                  className="w-48 h-48 object-contain"
                />
              ) : (
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
                    pixData.qrCode || DEFAULT_PIX_KEY
                  )}`}
                  alt="QR Code Pix"
                  className="w-44 h-44 object-contain"
                />
              )}
              <span className="text-black/60 text-[11px] font-semibold mt-2">
                Abra seu banco e pague via Pix
              </span>
            </div>

            {/* Status em Tempo Real */}
            <div className="flex items-center justify-center gap-2 text-xs text-amber-300 bg-amber-500/10 border border-amber-400/20 py-2 px-3 rounded-xl animate-pulse">
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              <span>Aguardando pagamento... O app liberará na hora que for pago!</span>
            </div>

            {/* Botão Copiar Pix */}
            <div className="space-y-2">
              <Focusable onEnterPress={handleCopyPix}>
                <button
                  type="button"
                  onClick={handleCopyPix}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-emerald-500/20"
                >
                  {copied ? (
                    <>
                      <Check className="h-5 w-5 text-white" />
                      <span>Código Pix Copiado com Sucesso!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-5 w-5" />
                      <span>Copiar Código Pix (Copia e Cola)</span>
                    </>
                  )}
                </button>
              </Focusable>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleCheckNow}
                  disabled={checkingStatus}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-white/10 hover:bg-white/15 text-white/80 text-xs font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${checkingStatus ? 'animate-spin' : ''}`} />
                  <span>Verificar Pagamento Agora</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPixData(null)}
                  className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white/50 hover:text-white text-xs rounded-lg transition-colors"
                >
                  Trocar Plano
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Opção Ativação Manual / Chave Pix */}
      <div className="text-center">
        <button
          onClick={() => setShowManualSection(!showManualSection)}
          className="text-white/40 hover:text-white/70 text-xs underline transition-colors"
        >
          {showManualSection
            ? 'Ocultar ativação manual'
            : 'Já efetuou o pagamento e possui código de ativação?'}
        </button>

        <AnimatePresence>
          {showManualSection && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="glass rounded-xl p-4 mt-3 text-left overflow-hidden"
            >
              <p className="text-white/80 text-xs font-semibold mb-1">
                Ativação Manual por Código ou Chave Pix
              </p>
              <p className="text-white/40 text-xs mb-3">
                Chave Pix Direta: <code className="text-amber-300 font-mono">{DEFAULT_PIX_KEY}</code> (CineBG Telecom)
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  placeholder="Cole seu código de ativação aqui"
                  className="flex-1 bg-black/40 border border-white/10 text-white text-xs rounded-lg px-3 py-2.5 outline-none focus:border-amber-400/50"
                />
                <button
                  type="button"
                  onClick={handleActivateManual}
                  disabled={!manualCode.trim()}
                  className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-black font-bold text-xs rounded-lg transition-colors"
                >
                  Ativar
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Rodapé com ID do Dispositivo */}
      <div className="text-center mt-5 text-[11px] text-white/30 flex items-center justify-center gap-2">
        <span>ID do Aparelho:</span>
        <code className="text-white/50 bg-white/5 px-2 py-0.5 rounded font-mono">
          {deviceId}
        </code>
      </div>
    </motion.div>
  )

  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md overflow-y-auto flex items-center justify-center p-4">
        {content}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {content}
    </div>
  )
}

export default LicenseGate
