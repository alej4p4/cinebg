
import { motion } from 'framer-motion'
import {
  Search,
  Heart,
  Download,
  Tv as TvIcon,
  BookOpen,
  Sparkles,
  RotateCcw,
  ArrowRight,
} from 'lucide-react'
import Focusable from '@/components/tv/Focusable'

interface EmptyStateProps {
  variant?: 'search' | 'favorites' | 'history' | 'downloads' | 'livetv' | 'mylist' | 'default'
  title?: string
  message?: string
  actionLabel?: string
  onAction?: () => void
  secondaryActionLabel?: string
  onSecondaryAction?: () => void
  className?: string
}

const variantConfig = {
  search: {
    icon: Search,
    defaultTitle: 'Nenhum resultado encontrado',
    defaultMessage: 'Tente termos diferentes ou verifique a ortografia.',
    actionLabel: 'Limpar busca',
    illustration: '🔍',
  },
  favorites: {
    icon: Heart,
    defaultTitle: 'Sua lista está vazia',
    defaultMessage: 'Adicione filmes e séries aos favoritos clicando no coração.',
    actionLabel: 'Explorar catálogo',
    illustration: '❤️',
  },
  history: {
    icon: RotateCcw,
    defaultTitle: 'Nenhum histórico',
    defaultMessage: 'O que você assistir aparecerá aqui automaticamente.',
    actionLabel: 'Começar a assistir',
    illustration: '📜',
  },
  downloads: {
    icon: Download,
    defaultTitle: 'Nenhum download',
    defaultMessage: 'Baixe filmes e séries para assistir offline.',
    actionLabel: 'Ver catálogo',
    illustration: '⬇️',
  },
  livetv: {
    icon: TvIcon,
    defaultTitle: 'Nenhum canal disponível',
    defaultMessage: 'Não foi possível carregar os canais no momento.',
    actionLabel: 'Tentar novamente',
    illustration: '📺',
  },
  mylist: {
    icon: BookOpen,
    defaultTitle: 'Sua lista está vazia',
    defaultMessage: 'Salve filmes e séries para assistir depois.',
    actionLabel: 'Adicionar à lista',
    illustration: '📋',
  },
  default: {
    icon: Sparkles,
    defaultTitle: 'Conteúdo não disponível',
    defaultMessage: 'Não há nada para mostrar aqui no momento.',
    actionLabel: 'Tentar novamente',
    illustration: '✨',
  },
}

const illustrations = {
  search: (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.2, type: 'spring', stiffness: 200 }}
      className="text-6xl mb-4"
    >
      🔍
    </motion.div>
  ),
  favorites: (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.2, type: 'spring', stiffness: 200 }}
      className="text-6xl mb-4"
    >
      ❤️
    </motion.div>
  ),
  history: (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.2, type: 'spring', stiffness: 200 }}
      className="text-6xl mb-4"
    >
      📜
    </motion.div>
  ),
  downloads: (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.2, type: 'spring', stiffness: 200 }}
      className="text-6xl mb-4"
    >
      ⬇️
    </motion.div>
  ),
  livetv: (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.2, type: 'spring', stiffness: 200 }}
      className="text-6xl mb-4"
    >
      📺
    </motion.div>
  ),
  mylist: (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.2, type: 'spring', stiffness: 200 }}
      className="text-6xl mb-4"
    >
      📋
    </motion.div>
  ),
  default: (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.2, type: 'spring', stiffness: 200 }}
      className="text-6xl mb-4"
    >
      ✨
    </motion.div>
  ),
}

export const EmptyState = ({
  variant = 'default',
  title,
  message,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  className = '',
}: EmptyStateProps) => {
  const config = variantConfig[variant]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className={`flex flex-col items-center justify-center text-center py-16 md:py-24 px-6 ${className}`}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.1, type: 'spring', stiffness: 180, damping: 15 }}
        className="relative mb-6"
      >
        {illustrations[variant as keyof typeof illustrations] || illustrations.default}
        <motion.div
          className="absolute inset-0 rounded-full bg-accent-red/10 blur-2xl"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 0.5, scale: 1 }}
          transition={{ duration: 1.5, delay: 0.3, repeat: Infinity, repeatType: 'reverse' }}
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="space-y-2 max-w-md mx-auto"
      >
        <h3 className="text-xl md:text-2xl font-display font-bold text-white">
          {title || config.defaultTitle}
        </h3>
        <p className="text-white/50 text-base md:text-lg leading-relaxed">
          {message || config.defaultMessage}
        </p>
      </motion.div>

      {(onAction || onSecondaryAction) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-3 mt-8"
        >
          {onAction && (
            <Focusable
              focusKey="empty-state-action"
              onEnterPress={onAction}
              className="rounded-xl"
            >
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={onAction}
                className="flex items-center justify-center gap-2 bg-accent-red hover:bg-red-600 text-white font-bold px-6 py-3 rounded-xl shadow-lg shadow-red-900/40 transition-colors"
              >
                <span className="text-sm font-semibold">{actionLabel || config.actionLabel}</span>
                <ArrowRight className="h-4 w-4" />
              </motion.button>
            </Focusable>
          )}
          {onSecondaryAction && (
            <Focusable
              focusKey="empty-state-secondary-action"
              onEnterPress={onSecondaryAction}
              className="rounded-xl"
            >
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={onSecondaryAction}
                className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
              >
                <span className="text-sm font-semibold">{secondaryActionLabel}</span>
              </motion.button>
            </Focusable>
          )}
        </motion.div>
      )}
    </motion.div>
  )
}

/* Specialized empty states for common patterns */
export const EmptySearch = (props: Omit<EmptyStateProps, 'variant'> & { query?: string }) => (
  <EmptyState variant="search" {...props} />
)

export const EmptyFavorites = (props: Omit<EmptyStateProps, 'variant'>) => (
  <EmptyState variant="favorites" {...props} />
)

export const EmptyHistory = (props: Omit<EmptyStateProps, 'variant'>) => (
  <EmptyState variant="history" {...props} />
)

export const EmptyDownloads = (props: Omit<EmptyStateProps, 'variant'>) => (
  <EmptyState variant="downloads" {...props} />
)

export const EmptyLiveTV = (props: Omit<EmptyStateProps, 'variant'>) => (
  <EmptyState variant="livetv" {...props} />
)

export const EmptyMyList = (props: Omit<EmptyStateProps, 'variant'>) => (
  <EmptyState variant="mylist" {...props} />
)

/* Loading state with progress */
export const LoadingState = ({
  message = 'Carregando...',
  subMessage,
  showSpinner = true,
}: { message?: string; subMessage?: string; showSpinner?: boolean }) => (
  <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
    {showSpinner && (
      <motion.div
        className="w-12 h-12 border-2 border-white/5 border-t-accent-red rounded-full"
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      />
    )}
    <div className="space-y-1 text-center">
      <p className="text-white/80 text-sm font-semibold">{message}</p>
      {subMessage && <p className="text-white/40 text-xs">{subMessage}</p>}
    </div>
  </div>
)

export default EmptyState