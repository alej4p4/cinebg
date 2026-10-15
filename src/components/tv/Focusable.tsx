import type { ReactNode } from 'react'
import { useFocusable } from '@noriginmedia/norigin-spatial-navigation'

interface FocusableProps {
  onEnterPress?: () => void
  onFocus?: () => void
  className?: string
  children: ReactNode
}

/**
 * Envolve qualquer elemento para torná-lo navegável por controle remoto.
 * Quando a navegação espacial não está ativa, funciona como uma <div> comum.
 */
export const Focusable = ({
  onEnterPress,
  onFocus,
  className = '',
  children,
}: FocusableProps) => {
  const { ref, focused } = useFocusable({
    onEnterPress: () => onEnterPress?.(),
    onFocus: () => onFocus?.(),
  })

  return (
    <div ref={ref} className={`${className} ${focused ? 'tv-focused' : ''} outline-none`}>
      {children}
    </div>
  )
}

export default Focusable
