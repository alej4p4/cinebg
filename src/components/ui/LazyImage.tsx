import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Film } from 'lucide-react'
import { FLUID_EASE } from '@/utils/motion'

interface LazyImageProps {
  src: string
  alt: string
  className?: string
  containerClassName?: string
  aspectRatio?: string
  fallbackTitle?: string
}

export const LazyImage = ({
  src,
  alt,
  className = '',
  containerClassName = '',
  aspectRatio = 'aspect-[2/3]',
  fallbackTitle,
}: LazyImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)

  const isInvalidSrc = !src || src.includes('null') || src.includes('undefined')

  if (hasError || isInvalidSrc) {
    return (
      <div
        className={`relative w-full ${aspectRatio} flex flex-col items-center justify-center bg-[#13131c] text-white/30 border border-white/5 rounded-xl p-3 text-center ${containerClassName}`}
      >
        <Film className="h-8 w-8 mb-2 opacity-40 text-accent-red" />
        <span className="text-[11px] font-medium text-white/50 line-clamp-2">
          {fallbackTitle || alt || 'Mídia indisponível'}
        </span>
      </div>
    )
  }

  return (
    <div
      className={`relative w-full ${aspectRatio} overflow-hidden rounded-xl bg-[#12121a] ${containerClassName}`}
    >
      {/* Skeleton Shimmer enquanto a imagem carrega */}
      <AnimatePresence>
        {!isLoaded && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="absolute inset-0 skeleton z-0"
          />
        )}
      </AnimatePresence>

      {/* Imagem com desfoque progressivo (Blur-up) e transição fluida */}
      <motion.img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
        initial={{ opacity: 0, filter: 'blur(8px)', scale: 1.03 }}
        animate={{
          opacity: isLoaded ? 1 : 0,
          filter: isLoaded ? 'blur(0px)' : 'blur(8px)',
          scale: isLoaded ? 1 : 1.03,
        }}
        transition={{
          duration: 0.38,
          ease: FLUID_EASE,
        }}
        className={`w-full h-full object-cover select-none ${className}`}
      />
    </div>
  )
}

export default LazyImage
