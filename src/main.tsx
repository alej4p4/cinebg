import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { initObservability } from '@/services/observability'
import './index.css'

initObservability()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
