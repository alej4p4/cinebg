import { motion } from 'framer-motion'

interface ProgressBarProps {
  isLoading?: boolean
  progress?: number // 0 to 100
}

export const ProgressBar = ({ isLoading = false, progress }: ProgressBarProps) => {
  if (!isLoading && progress === undefined) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-[3px] bg-transparent overflow-hidden pointer-events-none">
      {progress !== undefined ? (
        <motion.div
          className="h-full bg-gradient-to-r from-accent-red via-red-500 to-accent-gold shadow-[0_0_8px_rgba(229,9,20,0.8)]"
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.3 }}
        />
      ) : (
        <div className="h-full w-full bg-gradient-to-r from-accent-red via-red-400 to-accent-gold animate-progress-fast shadow-[0_0_8px_rgba(229,9,20,0.8)]" />
      )}
    </div>
  )
}

export default ProgressBar
