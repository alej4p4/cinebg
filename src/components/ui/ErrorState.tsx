import { AlertCircle, RefreshCw } from 'lucide-react'
import Focusable from '@/components/tv/Focusable'

interface ErrorStateProps {
  title?: string
  message?: string
  onRetry?: () => void
}

const ErrorState = ({
  title = 'Não foi possível carregar o conteúdo',
  message = 'Verifique sua conexão e tente novamente.',
  onRetry,
}: ErrorStateProps) => (
  <div className="text-center py-24 text-white/50">
    <AlertCircle className="h-14 w-14 mx-auto mb-4 text-accent-red opacity-70" />
    <p className="text-lg font-semibold text-white/80">{title}</p>
    <p className="text-sm mt-1">{message}</p>
    {onRetry && (
      <div className="mt-6 flex justify-center">
        <Focusable
          focusKey="error-retry-btn"
          onEnterPress={onRetry}
          className="inline-block rounded-xl"
        >
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-2 bg-accent-red hover:bg-red-600 text-white font-bold px-5 py-2.5 rounded-xl transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Tentar novamente
          </button>
        </Focusable>
      </div>
    )}
  </div>
)

export default ErrorState
