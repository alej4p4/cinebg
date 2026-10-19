// Mercado Pago API integration for CineBG VIP Subscriptions
// Handles Pix payment generation, real-time status polling, OAuth token auto-refresh, and fallback options

export interface VipPlan {
  id: '30' | '60' | '90' | '365'
  days: number
  price: number
  priceLabel: string
  originalPriceLabel?: string
  title: string
  popular?: boolean
  badge?: string
  description: string
  monthlyEquivalent?: string
}

export const VIP_PLANS: VipPlan[] = [
  {
    id: '30',
    days: 30,
    price: 11.99,
    priceLabel: 'R$ 11,99',
    originalPriceLabel: 'R$ 19,90',
    title: '30 Dias (1 Mês)',
    badge: 'Mais em Conta',
    description: 'Acesso completo a filmes, séries e todos os canais de TV ao vivo',
    monthlyEquivalent: 'R$ 11,99/mês',
  },
  {
    id: '60',
    days: 60,
    price: 24.9,
    priceLabel: 'R$ 24,90',
    originalPriceLabel: 'R$ 39,90',
    title: '60 Dias (2 Meses)',
    badge: 'Super Oferta',
    description: 'Dois meses de entretenimento sem travamentos com economia real',
    monthlyEquivalent: 'R$ 12,45/mês',
  },
  {
    id: '90',
    days: 90,
    price: 39.9,
    priceLabel: 'R$ 39,90',
    originalPriceLabel: 'R$ 59,90',
    title: '90 Dias (3 Meses)',
    popular: true,
    badge: 'Mais Vendido',
    description: 'Três meses de maratona para toda a família em altíssima resolução',
    monthlyEquivalent: 'R$ 13,30/mês',
  },
  {
    id: '365',
    days: 365,
    price: 109.9,
    priceLabel: 'R$ 109,90',
    originalPriceLabel: 'R$ 169,90',
    title: '1 Ano (12 Meses)',
    badge: 'Melhor Valor',
    description: 'O melhor plano anual: acesso VIP ilimitado por 1 ano completo!',
    monthlyEquivalent: 'R$ 9,15/mês',
  },
]

export const DEFAULT_PIX_KEY = '66996175239'

const MP_STORAGE_TOKEN_KEY = 'cinebg_mp_access_token'
const MP_STORAGE_EXPIRES_KEY = 'cinebg_mp_token_expires'

export const getMercadoPagoToken = (): string => {
  const local = localStorage.getItem(MP_STORAGE_TOKEN_KEY)
  const expires = localStorage.getItem(MP_STORAGE_EXPIRES_KEY)
  const now = Date.now()
  // Se o token em cache ainda for valido por mais de 5 minutos, usa ele
  if (local && local.trim().length > 10 && expires && Number(expires) > now + 300000) {
    return local.trim()
  }

  const envToken = import.meta.env.VITE_MERCADO_PAGO_ACCESS_TOKEN
  if (envToken && typeof envToken === 'string' && envToken.trim().length > 10) {
    return envToken.trim()
  }

  return ''
}

export const setMercadoPagoToken = (token: string, expiresInSeconds = 21600): void => {
  if (token && token.trim().length > 10) {
    localStorage.setItem(MP_STORAGE_TOKEN_KEY, token.trim())
    localStorage.setItem(MP_STORAGE_EXPIRES_KEY, String(Date.now() + (expiresInSeconds * 1000)))
  } else {
    localStorage.removeItem(MP_STORAGE_TOKEN_KEY)
    localStorage.removeItem(MP_STORAGE_EXPIRES_KEY)
  }
}

/**
 * Renova o Access Token do Mercado Pago automaticamente via OAuth 2.0 (Client ID + Client Secret)
 * Garantindo que as requisições de Pix nunca falhem por expiração.
 */
export async function refreshMercadoPagoToken(): Promise<string> {
  const clientId = import.meta.env.VITE_MERCADO_PAGO_CLIENT_ID || '4070043112593139'
  const clientSecret = import.meta.env.VITE_MERCADO_PAGO_CLIENT_SECRET || 'SFtjWhm55MnXqPdyfRH0fNuiBLYHRPjR'

  try {
    const res = await fetch('https://api.mercadopago.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: String(clientId),
        client_secret: String(clientSecret),
      }).toString(),
    })

    if (res.ok) {
      const data = await res.json()
      if (data.access_token) {
        setMercadoPagoToken(data.access_token, data.expires_in || 21600)
        return data.access_token
      }
    } else {
      console.warn('[MercadoPago] Resposta não-ok ao renovar token OAuth:', res.status)
    }
  } catch (e) {
    console.warn('[MercadoPago] Falha de conexão ao renovar OAuth:', e)
  }

  return getMercadoPagoToken()
}

export async function ensureValidMercadoPagoToken(): Promise<string> {
  let token = getMercadoPagoToken()
  if (!token) {
    token = await refreshMercadoPagoToken()
  }
  return token
}

export interface CreatePixPaymentResult {
  success: boolean
  paymentId?: number | string
  qrCode?: string // Pix Copia e Cola string
  qrCodeBase64?: string // Base64 PNG image from Mercado Pago
  ticketUrl?: string
  status?: string
  isFallback?: boolean
  error?: string
}

export interface PaymentStatusResult {
  status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'unknown'
  isApproved: boolean
  statusDetail?: string
}

/**
 * Cria um pagamento Pix dinâmico via API oficial do Mercado Pago
 */
export async function createMercadoPagoPix(
  plan: VipPlan,
  deviceId: string,
  payerEmail?: string
): Promise<CreatePixPaymentResult> {
  let token = getMercadoPagoToken()

  if (!token) {
    token = await refreshMercadoPagoToken()
  }

  const cleanDeviceId = deviceId.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 24)
  const email =
    payerEmail && payerEmail.includes('@')
      ? payerEmail.trim()
      : `cliente_${cleanDeviceId || 'tv'}@cinebg.tv`

  const idempotencyKey = `cinebg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`

  const payload = {
    transaction_amount: plan.price,
    description: `CineBG VIP - ${plan.title} (ID: ${cleanDeviceId})`,
    payment_method_id: 'pix',
    payer: {
      email,
      first_name: 'Cliente',
      last_name: 'CineBG',
    },
    metadata: {
      device_id: deviceId,
      plan_id: plan.id,
      plan_days: plan.days,
    },
  }

  try {
    let response = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify(payload),
    })

    // Se o token expirou (401), renova e tenta mais uma vez
    if (response.status === 401) {
      token = await refreshMercadoPagoToken()
      response = await fetch('https://api.mercadopago.com/v1/payments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-Idempotency-Key': idempotencyKey + '_retry',
        },
        body: JSON.stringify(payload),
      })
    }

    if (!response.ok) {
      const errorJson = await response.json().catch(() => null)
      const errorMsg = errorJson?.message || `HTTP ${response.status} ao conectar com Mercado Pago`
      console.warn('Erro na resposta do Mercado Pago:', errorJson)
      return generateFallbackPix(plan, deviceId, errorMsg)
    }

    const data = await response.json()
    const pointOfInteraction = data.point_of_interaction?.transaction_data

    const qrCode = pointOfInteraction?.qr_code
    const qrCodeBase64 = pointOfInteraction?.qr_code_base64
    const ticketUrl = pointOfInteraction?.ticket_url

    if (!qrCode && !qrCodeBase64) {
      return generateFallbackPix(plan, deviceId, 'Resposta sem QR code do Mercado Pago')
    }

    return {
      success: true,
      paymentId: data.id,
      qrCode: qrCode || '',
      qrCodeBase64: qrCodeBase64 || '',
      ticketUrl,
      status: data.status,
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.warn('Exceção ao chamar Mercado Pago:', message)
    return generateFallbackPix(plan, deviceId, `Falha de rede: ${message}`)
  }
}

/**
 * Consulta o status de um pagamento Pix no Mercado Pago
 */
export async function checkMercadoPagoStatus(
  paymentId: number | string
): Promise<PaymentStatusResult> {
  const token = await ensureValidMercadoPagoToken()
  if (!token || !paymentId) {
    return { status: 'unknown', isApproved: false }
  }

  try {
    const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      return { status: 'unknown', isApproved: false }
    }

    const data = await response.json()
    const status = data.status || 'unknown'
    const isApproved = status === 'approved'

    return {
      status,
      isApproved,
      statusDetail: data.status_detail,
    }
  } catch {
    return { status: 'unknown', isApproved: false }
  }
}

/**
 * Gera Pix estático de fallback caso o Mercado Pago esteja sem token configurado ou indisponível
 */
function generateFallbackPix(
  plan: VipPlan,
  deviceId: string,
  reason: string
): CreatePixPaymentResult {
  const pixKey = DEFAULT_PIX_KEY
  const fallbackCode = `00020126580014BR.GOV.BCB.PIX0136${pixKey}520400005303986540${plan.price.toFixed(2)}5802BR5906CINEBG6009SAO PAULO62170513${deviceId.slice(0, 13)}6304`

  return {
    success: true,
    isFallback: true,
    error: reason,
    paymentId: `PIX-${Date.now().toString(36)}`,
    qrCode: fallbackCode,
    status: 'pending',
  }
}
