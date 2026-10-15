import { motion } from 'framer-motion'

const LoadingSpinner = ({ size = 'md', label }: { size?: 'sm' | 'md' | 'lg'; label?: string }) => {
  const sizes = { sm: 'h-5 w-5', md: 'h-8 w-8', lg: 'h-12 w-12' }
  const borderSizes = { sm: 'border-2', md: 'border-2', lg: 'border-[3px]' }
  return (
    <div className="flex flex-col items-center justify-center gap-2">
      <div className={`relative ${sizes[size]}`}>
        <div
          className={`${sizes[size]} ${borderSizes[size]} rounded-full border-white/10 border-t-accent-red animate-spin absolute inset-0`}
        />
        <motion.div
          className={`${sizes[size]} ${borderSizes[size]} rounded-full border-transparent border-b-red-500/30 absolute inset-0`}
          animate={{ rotate: -360 }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'linear' }}
        />
      </div>
      {label && (
        <motion.p
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.3 }}
          className="text-white/50 text-xs font-medium"
        >
          {label}
        </motion.p>
      )}
    </div>
  )
}

export default LoadingSpinner
