import { Star } from 'lucide-react'

const RatingBadge = ({ rating }: { rating: number }) => {
  return (
    <span className="rating-badge">
      <Star className="h-2.5 w-2.5" />
      {rating.toFixed(1)}
    </span>
  )
}

export default RatingBadge
