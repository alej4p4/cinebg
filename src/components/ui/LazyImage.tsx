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
      <img
        src={src}
        alt={alt}
        loading="eager"
        decoding="async"
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
        className={`w-full h-full object-cover select-none ${className}`}
        style={{ transform: 'translateZ(0)' }}
      />
    </div>
  )
}

export default LazyImage
