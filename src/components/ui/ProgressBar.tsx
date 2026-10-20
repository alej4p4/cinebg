import { motion, AnimatePresence } from 'framer-motion'
import { PROGRESS_EASE, EXIT_EASE } from '@/utils/motion'

interface ProgressBarProps {
  isLoading?: boolean
  progress?: number // 0 to 100
}

export const ProgressBar = ({ isLoading = false, progress }: ProgressBarProps) => {
  const isVisible = isLoading || (progress !== undefined && progress > 0 && progress < 100)

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="top-progress-bar"
          initial={{ opacity: 0, scaleY: 0.5 }}
          animate={{ opacity: 1, scaleY: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.2, ease: EXIT_EASE } }}
          className="fixed top-0 left-0 right-0 z-[100] h-[3.5px] bg-white/5 overflow-hidden pointer-events-none origin-top"
        >
          {progress !== undefined ? (
            <motion.div
              className="h-full bg-gradient-to-r from-accent-red via-amber-400 to-accent-gold shadow-[0_0_12px_rgba(245,197,24,0.85)]"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              transition={{ ease: PROGRESS_EASE, duration: 0.28 }}
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-r from-accent-red via-amber-400 to-accent-gold animate-progress-fast shadow-[0_0_12px_rgba(229,9,20,0.85)]" />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default ProgressBar
