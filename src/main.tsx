import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { initObservability } from '@/services/observability'
import './index.css'

initObservability()

// Error handler global: captura erros não tratados na inicialização
// e evita que o app fique em tela preta em redes móveis/lentas
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    console.error('[CineBG] Erro não tratado:', event.error || event.message)
    // Tenta recarregar a página se o erro for crítico de carregamento
    if (
      event.message &&
      (event.message.includes('Failed to load') ||
        event.message.includes('net::') ||
        event.message.includes('ChunkLoadError'))
    ) {
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    }
  })

  window.addEventListener('unhandledrejection', (event) => {
    console.error('[CineBG] Promise rejeitada não tratada:', event.reason)
    if (
      event.reason &&
      (typeof event.reason === 'string'
        ? event.reason.includes('Failed to load') || event.reason.includes('net::')
        : event.reason?.message?.includes('Failed to load') ||
          event.reason?.message?.includes('net::'))
    ) {
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    }
  })
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
