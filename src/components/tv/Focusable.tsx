import { useEffect, useRef, type ReactNode } from 'react'
import { useFocusable } from '@noriginmedia/norigin-spatial-navigation'

interface FocusableProps {
  onEnterPress?: () => void
  onFocus?: () => void
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
