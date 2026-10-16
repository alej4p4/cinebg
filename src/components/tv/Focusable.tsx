import { useEffect, useRef, type ReactNode } from 'react'
import { useFocusable } from '@noriginmedia/norigin-spatial-navigation'

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
  const { ref, focused } = useFocusable({
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
      requestAnimationFrame(() => {
        const el = (ref as any)?.current || innerRef.current
        if (el && typeof el.scrollIntoView === 'function') {
          el.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
            inline: 'center',
          })
        }
      })
    }
  }, [focused, autoScroll, ref])

  return (
    <div
      ref={(node) => {
        if (node) {
          if (typeof ref === 'function') {
            (ref as any)(node)
          } else if (ref && 'current' in (ref as any)) {
            ;(ref as any).current = node
          }
          innerRef.current = node
        }
      }}
      className={`${className} ${focused ? 'tv-focused' : ''} outline-none`}
    >
      {children}
    </div>
  )
}

export default Focusable
