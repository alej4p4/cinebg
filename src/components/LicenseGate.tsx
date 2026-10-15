import { useState } from 'react'
import { motion } from 'framer-motion'
import { QrCode, Copy, Check, Clock } from 'lucide-react'
import { useLicense } from '@/hooks/useLicense'

const PIX_KEY = '66996175239'

const PLANS = [
  { days: 30, price: 'R$ 15', label: '1 Mês' },
  { days: 60, price: 'R$ 25', label: '2 Meses' },
  { days: 90, price: 'R$ 35', label: '3 Meses' },
  { days: 365, price: 'R$ 90', label: '1 Ano' },
]

const LicenseGate = () => {
  const { activateLicense, getDeviceId } = useLicense()
  const [selectedPlan, setSelectedPlan] = useState(0)
  const [code, setCode] = useState('')
  const [copied, setCopied] = useState(false)
  const [activated, setActivated] = useState(false)

  const deviceId = getDeviceId()
  const plan = PLANS[selectedPlan]

  const pixCode = `00020126580014BR.GOV.BCB.PIX0136${PIX_KEY}520400005303986540${plan.days}5802BR5905CINEBG6009SAO PAULO62070503***6304`

  const copyPix = () => {
    navigator.clipboard.writeText(pixCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleActivate = () => {
    if (!code.trim()) return
    activateLicense(code.trim(), plan.days)
    setActivated(true)
  }

  if (activated) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <Check className="h-16 w-16 text-green-400 mx-auto mb-4" />
          <h2 className="text-white font-bold text-2xl mb-2">Licença Ativada!</h2>
          <p className="text-white/60">O app será desbloqueado em instantes.</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <Clock className="h-12 w-12 text-accent-red mx-auto mb-3" />
          <h1 className="text-white font-bold text-2xl mb-2">Período Gratuito Encerrado</h1>
          <p className="text-white/50 text-sm">
            Escolha um plano para continuar usando o CineBG
          </p>
        </div>

        {/* Plans */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {PLANS.map((p, i) => (
            <button
              key={p.days}
              onClick={() => setSelectedPlan(i)}
              className={`p-4 rounded-xl border text-center transition-all ${
                selectedPlan === i
                  ? 'bg-accent-red/20 border-accent-red text-white'
                  : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
              }`}
            >
              <p className="font-bold text-lg">{p.price}</p>
              <p className="text-xs opacity-70">{p.label}</p>
            </button>
          ))}
        </div>

        {/* Pix */}
        <div className="glass rounded-xl p-5 mb-4">
          <p className="text-white/70 text-sm font-semibold mb-3 flex items-center gap-2">
            <QrCode className="h-4 w-4" />
            Pague via Pix
          </p>
          <div className="bg-white rounded-xl p-3 flex items-center justify-center mb-3">
            <div className="w-40 h-40 bg-black/10 rounded-lg flex items-center justify-center">
              <QrCode className="h-24 w-24 text-black/60" />
            </div>
          </div>
          <p className="text-white/40 text-xs text-center mb-3">Chave: {PIX_KEY}</p>
          <button
            onClick={copyPix}
            className="w-full flex items-center justify-center gap-2 bg-accent-red hover:bg-red-600 text-white font-bold py-3 rounded-xl transition-colors"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? 'Copiado!' : 'Copiar código Pix'}
          </button>
        </div>

        {/* Activation */}
        <div className="glass rounded-xl p-5">
          <p className="text-white/70 text-sm font-semibold mb-3">Código de Ativação</p>
          <p className="text-white/40 text-xs mb-3">
            Após pagar, cole o código recebido abaixo:
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Cole o código aqui"
              className="flex-1 bg-[#1c1c28] border border-white/10 text-white text-sm rounded-lg px-3 py-2.5 outline-none focus:border-accent-red/50"
            />
            <button
              onClick={handleActivate}
              disabled={!code.trim()}
              className="px-4 py-2.5 bg-accent-red hover:bg-red-600 disabled:opacity-40 text-white font-bold text-sm rounded-lg transition-colors"
            >
              Ativar
            </button>
          </div>
        </div>

        <p className="text-white/30 text-xs text-center mt-4">
          Device ID: {deviceId}
        </p>
      </motion.div>
    </div>
  )
}

export default LicenseGate
