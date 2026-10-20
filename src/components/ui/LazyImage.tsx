import { useState, useEffect, useRef, memo } from 'react'
import { Film } from 'lucide-react'

interface LazyImageProps {
  src: string
  alt: string
  className?: string
  containerClassName?: string
  aspectRatio?: string
  fallbackTitle?: string
  priority?: boolean
}

export const LazyImage = memo(({
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
      { rootMargin: '280px 140px' }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [priority, isInView])

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
      ref={containerRef}
      className={`relative w-full ${aspectRatio} overflow-hidden rounded-xl bg-[#12121a] ${containerClassName}`}
    >
      {/* Skeleton Shimmer leve via CSS puro acelerado por GPU (sem instâncias extras de JS por card) */}
      {!isLoaded && (
        <div className="skeleton absolute inset-0 z-10 pointer-events-none" />
      )}

      {isInView && (
        <img
          src={src}
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          className={`w-full h-full object-cover select-none transition-opacity duration-200 ease-out ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          } ${className}`}
          style={{ transform: 'translateZ(0)' }}
        />
      )}
    </div>
  )
})

LazyImage.displayName = 'LazyImage'

export default LazyImage
