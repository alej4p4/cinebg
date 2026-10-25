import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { initObservability } from '@/services/observability'
import { init as initSpatialNav } from '@noriginmedia/norigin-spatial-navigation'
import './index.css'

initObservability()

try {
  initSpatialNav({
    debug: false,
    visualDebug: false,
    shouldFocusDOMNode: true,
  })
} catch (e) {
  console.warn('[CineBG] Falha ao inicializar SpatialNav no bootstrap:', e)
}

// Error handler global com proteção estrita contra loop de reload infinito
if (typeof window !== 'undefined') {
  const CHUNK_RELOAD_KEY = 'cinebg_chunk_reload_count'

  window.addEventListener('error', (event) => {
    console.error('[CineBG] Erro capturado:', event.error || event.message)
    const msg = event.message || ''
    const isChunkError =
      msg.includes('ChunkLoadError') ||
      msg.includes('Loading chunk') ||
      (event.error && (event.error.name === 'ChunkLoadError' || event.error.message?.includes('ChunkLoadError')))

    if (isChunkError) {
      try {
        const count = Number(sessionStorage.getItem(CHUNK_RELOAD_KEY) || '0')
        if (count < 1) {
          sessionStorage.setItem(CHUNK_RELOAD_KEY, String(count + 1))
          console.warn('[CineBG] ChunkLoadError detectado. Recarregando uma única vez...')
          window.location.reload()
        }
      } catch {}
    }
  })

  window.addEventListener('unhandledrejection', (event) => {
    console.warn('[CineBG] Promise rejeitada tratada:', event.reason)
    const reasonStr = typeof event.reason === 'string' ? event.reason : event.reason?.message || ''
    const isChunkError = reasonStr.includes('ChunkLoadError') || reasonStr.includes('Loading chunk')

    if (isChunkError) {
      try {
        const count = Number(sessionStorage.getItem(CHUNK_RELOAD_KEY) || '0')
        if (count < 1) {
          sessionStorage.setItem(CHUNK_RELOAD_KEY, String(count + 1))
          console.warn('[CineBG] Rejeição de ChunkLoadError detectada. Recarregando uma única vez...')
          window.location.reload()
        }
      } catch {}
    }
  })
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
