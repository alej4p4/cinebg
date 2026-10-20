import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { captureException } from '@/services/observability'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  message?: string
}

class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[CineBG ErrorBoundary] Erro não tratado:', error, info)
    captureException(error, {
      componentStack: info.componentStack || 'unknown',
      boundary: 'RootErrorBoundary',
    })
  }

  handleReset = () => {
    this.setState({ hasError: false, message: undefined })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center text-center px-6">
          <AlertTriangle className="h-16 w-16 text-accent-red mb-5" />
          <h1 className="font-display font-black text-2xl text-white mb-2">
            Algo deu errado
          </h1>
          <p className="text-white/50 max-w-md mb-6 text-sm">
            Encontramos um erro inesperado ao carregar esta página. Tente recarregar
            para continuar a navegação.
          </p>
          {this.state.message && (
            <code className="text-white/30 text-xs bg-white/5 rounded-lg px-3 py-2 mb-6 max-w-lg break-all">
              {this.state.message}
            </code>
          )}
          <div className="flex gap-3">
            <button
              onClick={() => window.location.reload()}
              className="flex items-center gap-2 bg-accent-red hover:bg-red-600 text-white font-bold px-5 py-2.5 rounded-xl transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Recarregar
            </button>
            <button
              onClick={this.handleReset}
              className="glass hover:bg-white/10 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
