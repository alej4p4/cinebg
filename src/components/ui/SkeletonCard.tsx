const SkeletonCard = () => (
  <div className="flex-shrink-0 w-40 md:w-44">
    <div className="skeleton rounded-xl aspect-[2/3] w-full" />
    <div className="skeleton h-3 rounded mt-2 w-3/4" />
    <div className="skeleton h-3 rounded mt-1 w-1/2" />
  </div>
)

export const SkeletonGrid = ({ count = 12 }: { count?: number }) => (
  <div className="content-grid">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i}>
        <div className="skeleton rounded-xl aspect-[2/3] w-full" />
        <div className="skeleton h-3 rounded mt-2 w-3/4" />
        <div className="skeleton h-3 rounded mt-1 w-1/2" />
      </div>
    ))}
  </div>
)

export default SkeletonCard
