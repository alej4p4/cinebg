interface CineBGLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  showSubtitle?: boolean
  variant?: 'full' | 'icon'
  className?: string
}

export const CineBGLogo = ({
  size = 'md',
  showSubtitle = false,
  variant = 'full',
  className = '',
}: CineBGLogoProps) => {
  const iconSizes = {
    xs: 'w-6 h-6 rounded-md',
    sm: 'w-8 h-8 rounded-lg',
    md: 'w-10 h-10 rounded-xl',
    lg: 'w-16 h-16 rounded-2xl',
    xl: 'w-24 h-24 rounded-3xl',
  }

  const textSizes = {
    xs: 'text-base',
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-4xl',
    xl: 'text-5xl',
  }

  const emblem = (
    <div
      className={`relative flex items-center justify-center bg-gradient-to-br from-[#201a33] via-[#120e20] to-[#08070d] border border-amber-500/40 shadow-lg shadow-red-950/50 flex-shrink-0 overflow-hidden ${iconSizes[size]}`}
    >
      {/* Glow highlight overlay */}
      <div className="absolute inset-0 bg-gradient-to-tr from-accent-red/20 via-transparent to-amber-400/20" />

      {/* Styled C with forward play triangle */}
      <svg
        viewBox="0 0 100 100"
        className="w-4/5 h-4/5 relative z-10 drop-shadow-[0_2px_8px_rgba(255,23,68,0.6)]"
      >
        <defs>
          <linearGradient id="logoEmblemGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#ff1744" />
            <stop offset="50%" stop-color="#ff5252" />
            <stop offset="100%" stop-color="#ffb300" />
          </linearGradient>
        </defs>
        {/* C curve */}
        <path
          d="M 68 28 C 60 21, 48 18, 38 23 C 24 29, 18 43, 18 56 C 18 70, 28 80, 42 82 C 54 84, 66 78, 72 70 L 62 62 C 58 66, 52 69, 44 68 C 34 66, 29 58, 29 50 C 29 41, 35 34, 44 32 C 51 31, 58 33, 62 37 Z"
          fill="url(#logoEmblemGrad)"
        />
        {/* Play triangle */}
        <polygon points="46,34 76,51 46,68" fill="url(#logoEmblemGrad)" />
      </svg>
    </div>
  )

  if (variant === 'icon') {
    return <div className={`inline-flex items-center ${className}`}>{emblem}</div>
  }

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {emblem}
      <div className="flex flex-col">
        <span
          className={`font-display font-black tracking-tight text-white leading-none ${textSizes[size]}`}
        >
          Cine
          <span className="bg-gradient-to-r from-red-500 via-orange-500 to-amber-400 bg-clip-text text-transparent ml-0.5">
            BG
          </span>
        </span>
        {showSubtitle && (
          <span className="text-[9px] font-black uppercase tracking-[0.25em] text-amber-400/90 mt-1">
            Streaming
          </span>
        )}
      </div>
    </div>
  )
}

export default CineBGLogo
