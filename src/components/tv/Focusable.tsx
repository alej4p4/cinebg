import { useEffect, useRef, type ReactNode } from 'react'
import { useFocusable } from '@noriginmedia/norigin-spatial-navigation'
import { scrollTvElementIntoView } from '@/utils/tv'

interface FocusableProps {
  onEnterPress?: () => void
  onFocus?: () => void
  onArrowPress?: (direction: string) => boolean | void
  className?: string
  focusKey?: string
  autoScroll?: boolean
  children: ReactNode
}

/**
 * Envolve qualquer elemento para torna-lo navegavel por controle remoto.
 * Garante scroll suave automatico (scrollIntoView) quando o item e focado pelo controle.
 */
export const Focusable = ({
  onEnterPress,
  onFocus,
  onArrowPress,
  className = '',
  focusKey,
  autoScroll = true,
  children,
}: FocusableProps) => {
  const innerRef = useRef<HTMLDivElement | null>(null)
  const { ref: spatialRef, focused } = useFocusable({
    focusKey,
    onEnterPress: () => onEnterPress?.(),
    onFocus: () => onFocus?.(),
    onArrowPress: (direction) => {
      if (onArrowPress) {
        const result = onArrowPress(direction)
        if (result === false) return false
      }
      return true
    },
  })

  useEffect(() => {
    if (focused && autoScroll) {
      const el = (spatialRef && typeof spatialRef === 'object' && 'current' in spatialRef && spatialRef.current instanceof HTMLElement ? spatialRef.current : null) || innerRef.current
      scrollTvElementIntoView(el)
    }
  }, [focused, autoScroll, spatialRef])

  return (
    <div
      ref={(node) => {
        if (node) {
          if (spatialRef && typeof spatialRef === 'object' && 'current' in spatialRef) {
            (spatialRef as React.MutableRefObject<HTMLDivElement | null>).current = node
          }
          innerRef.current = node
        }
      }}
      className={`${className} ${focused ? 'tv-focused' : ''} outline-none`}
      data-focus-key={focusKey}
    >
      {children}
    </div>
  )
}

export default Focusable
