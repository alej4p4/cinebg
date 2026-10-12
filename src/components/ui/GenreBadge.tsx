interface GenreBadgeProps {
  name: string
  onClick?: () => void
}

const GenreBadge = ({ name, onClick }: GenreBadgeProps) => (
  <button
    onClick={onClick}
    className="px-3 py-1 text-xs font-medium rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors border border-white/10 hover:border-white/20"
  >
    {name}
  </button>
)

export default GenreBadge
