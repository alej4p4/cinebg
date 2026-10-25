// Buffer Strategy Adaptativo (T-006)
// Ajusta maxBufferLength, maxMaxBufferLength, maxBufferSize baseado no tipo de conexão
// Objetivo: Otimizar RAM em mobile/cellular, maximizar buffer em wifi/ethernet/TV

import { useState, useEffect } from 'react'

export type ConnectionType = 'wifi' | 'ethernet' | 'cellular' | 'unknown'

export interface BufferConfig {
  maxBufferLength: number      // segundos de buffer à frente
  maxMaxBufferLength: number   // teto máximo de buffer
  maxBufferSize: number        // bytes máximos de buffer
  lowLatencyMode: boolean      // modo baixa latência
  fragLoadingTimeOut: number   // timeout fragmento (ms)
  fragLoadingMaxRetry: number  // retries fragmento
  manifestLoadingTimeOut: number
  manifestLoadingMaxRetry: number
  levelLoadingTimeOut: number
  levelLoadingMaxRetry: number
}

/**
 * Detecta tipo de conexão via Network Information API
 * Funciona em navegadores modernos + WebView Android (Chrome 61+)
 */
export const getConnectionType = (): ConnectionType => {
  if (typeof navigator === 'undefined') return 'unknown'

  const conn = (navigator as Navigator & { connection?: Connection; mozConnection?: Connection; webkitConnection?: Connection }).connection ||
    (navigator as Navigator & { mozConnection?: Connection }).mozConnection ||
    (navigator as Navigator & { webkitConnection?: Connection }).webkitConnection
  if (!conn) return 'unknown'

  const effectiveType = conn.effectiveType // 'slow-2g' | '2g' | '3g' | '4g'
  const type = conn.type // 'wifi' | 'cellular' | 'ethernet' | 'none' | 'unknown'

  // Prioriza type (mais confiável), fallback para effectiveType
  if (type === 'wifi' || type === 'ethernet') return type
  if (type === 'cellular') return 'cellular'

  // Fallback por effectiveType
  if (effectiveType === '4g') return 'cellular'
  if (effectiveType === '3g' || effectiveType === '2g' || effectiveType === 'slow-2g') return 'cellular'

  return 'unknown'
}

interface Connection {
  effectiveType?: 'slow-2g' | '2g' | '3g' | '4g'
  type?: 'wifi' | 'cellular' | 'ethernet' | 'none' | 'unknown'
  addEventListener?: (type: 'change', listener: EventListener) => void
  removeEventListener?: (type: 'change', listener: EventListener) => void
}

/**
 * Configurações de buffer por tipo de conexão
 * Valores baseados em testes em TV Box, Mobile, Desktop
 */
const BUFFER_PRESETS: Record<ConnectionType, BufferConfig> = {
  // WiFi/Ethernet: buffer generoso, prioriza suavidade
  wifi: {
    maxBufferLength: 30,
    maxMaxBufferLength: 60,
    maxBufferSize: 50 * 1000 * 1000,      // 50 MB
    lowLatencyMode: false,
    fragLoadingTimeOut: 20000,
    fragLoadingMaxRetry: 3,
    manifestLoadingTimeOut: 15000,
    manifestLoadingMaxRetry: 3,
    levelLoadingTimeOut: 15000,
    levelLoadingMaxRetry: 3,
  },
  ethernet: {
    maxBufferLength: 30,
    maxMaxBufferLength: 60,
    maxBufferSize: 50 * 1000 * 1000,
    lowLatencyMode: false,
    fragLoadingTimeOut: 20000,
    fragLoadingMaxRetry: 3,
    manifestLoadingTimeOut: 15000,
    manifestLoadingMaxRetry: 3,
    levelLoadingTimeOut: 15000,
    levelLoadingMaxRetry: 3,
  },

  // Cellular: buffer conservador, economiza RAM/data
  cellular: {
    maxBufferLength: 15,
    maxMaxBufferLength: 25,
    maxBufferSize: 20 * 1000 * 1000,      // 20 MB
    lowLatencyMode: true,
    fragLoadingTimeOut: 15000,
    fragLoadingMaxRetry: 2,
    manifestLoadingTimeOut: 10000,
    manifestLoadingMaxRetry: 2,
    levelLoadingTimeOut: 10000,
    levelLoadingMaxRetry: 2,
  },

  // Unknown/TV/TV Box: conservador para estabilidade
  unknown: {
    maxBufferLength: 20,
    maxMaxBufferLength: 35,
    maxBufferSize: 25 * 1000 * 1000,      // 25 MB
    lowLatencyMode: false,
    fragLoadingTimeOut: 15000,
    fragLoadingMaxRetry: 2,
    manifestLoadingTimeOut: 10000,
    manifestLoadingMaxRetry: 2,
    levelLoadingTimeOut: 10000,
    levelLoadingMaxRetry: 2,
  },
}

/**
 * Retorna configuração de buffer adaptada ao dispositivo/conexão
 * TV/TV Box (sem Network Information API) → unknown
 * Mobile cellular → cellular
 * Desktop/TV WiFi → wifi
 */
export const getAdaptiveBufferConfig = (): BufferConfig => {
  const connType = getConnectionType()

  // Override para TV/TV Box detectado via userAgent
  if (typeof navigator !== 'undefined') {
    const ua = navigator.userAgent.toLowerCase()
    const isTV = /android.*tv|googletv|androidtv|firetv|webos|tizen|smarttv/.test(ua)
    if (isTV) return BUFFER_PRESETS.unknown
  }

  return BUFFER_PRESETS[connType] || BUFFER_PRESETS.unknown
}

/**
 * Hook React para configuração reativa de buffer
 * Atualiza automaticamente se conexão mudar (ex: wifi → celular)
 */
export const useAdaptiveBufferConfig = (): BufferConfig => {
  const [config, setConfig] = useState<BufferConfig>(() => getAdaptiveBufferConfig())

  useEffect(() => {
    const conn = (navigator as Navigator & { connection?: Connection }).connection
    if (!conn || !conn.addEventListener || !conn.removeEventListener) return

    const handleChange = () => {
      setConfig(getAdaptiveBufferConfig())
    }

    conn.addEventListener('change', handleChange)
    return () => {
      if (conn.removeEventListener) {
        conn.removeEventListener('change', handleChange)
      }
    }
  }, [])

  return config
}

/**
 * Para uso direto sem hook (ex: dentro de useEffect não-reativo)
 * Retorna config compatível com Hls.js (inclui lowLatencyMode que o Hls.js aceita)
 */
export const getBufferConfigForHls = (): BufferConfig => {
  return getAdaptiveBufferConfig()
}