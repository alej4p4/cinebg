import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Film } from 'lucide-react'
import { FLUID_EASE, EXIT_EASE } from '@/utils/motion'

interface LazyImageProps {
  src: string
  alt: string
  className?: string
  containerClassName?: string
  aspectRatio?: string
  fallbackTitle?: string
  priority?: boolean
}

export const LazyImage = ({
  src,
  alt,
  className = '',
  containerClassName = '',
  aspectRatio = 'aspect-[2/3]',
  fallbackTitle,
  priority = false,
}: LazyImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [isInView, setIsInView] = useState(priority)
  const containerRef = useRef<HTMLDivElement | null>(null)

  const isInvalidSrc = !src || src.includes('null') || src.includes('undefined')

  useEffect(() => {
    setIsLoaded(false)
    setHasError(false)
  }, [src])

  useEffect(() => {
    if (priority || isInView) return
    const el = containerRef.current
    if (!el || typeof IntersectionObserver === 'undefined') {
      setIsInView(true)
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setIsInView(true)
            observer.disconnect()
            break
          }
        }
      },
      { rootMargin: '320px 160px' }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [priority, isInView])

  if (hasError || isInvalidSrc) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2, ease: FLUID_EASE }}
        className={`relative w-full ${aspectRatio} flex flex-col items-center justify-center bg-[#13131c] text-white/30 border border-white/5 rounded-xl p-3 text-center ${containerClassName}`}
      >
        <Film className="h-8 w-8 mb-2 opacity-40 text-accent-red" />
        <span className="text-[11px] font-medium text-white/50 line-clamp-2">
          {fallbackTitle || alt || 'Mídia indisponível'}
        </span>
      </motion.div>
    )
  }

  return (
    <div
      ref={containerRef}
      className={`relative w-full ${aspectRatio} overflow-hidden rounded-xl bg-[#12121a] ${containerClassName}`}
    >
      {/* Skeleton Shimmer durante o carregamento da imagem (Motion Principles) */}
      <AnimatePresence>
        {!isLoaded && (
          <motion.div
            key="lazy-skeleton"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: EXIT_EASE }}
            className="skeleton absolute inset-0 z-10 pointer-events-none"
          />
        )}
      </AnimatePresence>

      {isInView && (
        <img
          src={src}
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          className={`w-full h-full object-cover select-none transition-all duration-300 ease-out ${
            isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-[1.02]'
          } ${className}`}
          style={{ transform: 'translateZ(0)' }}
        />
      )}
    </div>
  )
}

export default LazyImage
