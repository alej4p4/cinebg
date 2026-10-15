import { motion } from 'framer-motion'

export const SkeletonCard = () => (
  <div className="flex-shrink-0 w-40 md:w-44 select-none">
    <div className="skeleton skeleton-card aspect-[2/3] w-full border border-white/5" />
    <div className="skeleton skeleton-text h-3.5 rounded-md mt-2.5 w-3/4" />
    <div className="skeleton skeleton-text h-2.5 rounded-md mt-1.5 w-1/2 opacity-70" />
  </div>
)

export const SkeletonGrid = ({ count = 12 }: { count?: number }) => (
  <div className="content-grid select-none">
    {Array.from({ length: count }).map((_, i) => (
      <motion.div
        key={i}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: i * 0.02 }}
      >
        <div className="skeleton skeleton-card aspect-[2/3] w-full border border-white/5" />
        <div className="skeleton skeleton-text h-3.5 rounded-md mt-2.5 w-3/4" />
        <div className="skeleton skeleton-text h-2.5 rounded-md mt-1.5 w-1/2 opacity-70" />
      </motion.div>
    ))}
  </div>
)

export const SkeletonHero = () => (
  <div className="relative h-[75vh] min-h-[520px] bg-[#0c0c12] overflow-hidden select-none">
    <div className="skeleton skeleton-wave absolute inset-0 opacity-40" />
    <div className="absolute inset-0 bg-gradient-to-t from-bg-primary via-transparent to-black/30" />
    <div className="absolute inset-0 flex items-end pb-20 md:pb-24">
      <div className="max-w-screen-2xl mx-auto px-4 md:px-8 w-full">
        <div className="max-w-xl space-y-4">
          <div className="skeleton skeleton-pill h-6 w-24" />
          <div className="skeleton h-12 w-4/5 rounded-xl" />
          <div className="skeleton skeleton-text h-4 w-2/3 rounded-lg opacity-80" />
          <div className="skeleton h-16 w-full rounded-xl opacity-60" />
          <div className="flex gap-3 pt-2">
            <div className="skeleton h-11 w-32 rounded-xl" />
            <div className="skeleton h-11 w-28 rounded-xl opacity-75" />
          </div>
        </div>
      </div>
    </div>
  </div>
)

export const SkeletonCarousel = ({ count = 6 }: { count?: number }) => (
  <section className="relative px-4 md:px-8 mb-8 select-none">
    <div className="skeleton skeleton-text h-6 w-48 rounded-lg mb-4" />
    <div className="flex gap-3 overflow-hidden">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  </section>
)

export const SkeletonEpisodeList = ({ count = 5 }: { count?: number }) => (
  <div className="space-y-2 select-none">
    {Array.from({ length: count }).map((_, i) => (
      <div
        key={i}
        className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5"
      >
        <div className="skeleton skeleton-pill h-4 w-8" />
        <div className="flex-1 space-y-1.5">
          <div className="skeleton skeleton-text h-3.5 w-1/2" />
          <div className="skeleton skeleton-text h-2.5 w-3/4 opacity-60" />
        </div>
      </div>
    ))}
  </div>
)

export const SkeletonDetailPage = () => (
  <div className="min-h-screen bg-bg-primary pt-24 pb-12 px-4 md:px-8 max-w-screen-2xl mx-auto select-none">
    <div className="flex flex-col lg:flex-row gap-8">
      <div className="w-full lg:w-72 xl:w-80 flex-shrink-0">
        <div className="skeleton skeleton-card aspect-[2/3] w-full border border-white/5 shadow-2xl" />
      </div>
      <div className="flex-1 space-y-5">
        <div className="skeleton skeleton-pill h-10 w-3/4" />
        <div className="flex gap-3">
          <div className="skeleton skeleton-pill h-5 w-16" />
          <div className="skeleton skeleton-pill h-5 w-20" />
          <div className="skeleton skeleton-pill h-5 w-16" />
        </div>
        <div className="skeleton h-24 w-full rounded-xl opacity-70" />
        <div className="flex gap-4 pt-4">
          <div className="skeleton h-12 w-40 rounded-xl" />
          <div className="skeleton h-12 w-32 rounded-xl" />
        </div>
      </div>
    </div>
  </div>
)

export const SkeletonMoviesPage = () => (
  <div className="min-h-screen bg-bg-primary pt-24 pb-12 px-4 md:px-8 select-none">
    <div className="skeleton skeleton-pill h-8 w-40 mb-8" />
    <HeroSkeleton />
    <div className="space-y-10 py-8">
      <section className="skeleton-stagger px-4 md:px-8">
        <div className="skeleton skeleton-text h-6 w-32 mb-4" />
        <SkeletonCarousel count={6} />
      </section>
      <section className="skeleton-stagger px-4 md:px-8">
        <div className="skeleton skeleton-text h-6 w-32 mb-4" />
        <SkeletonCarousel count={6} />
      </section>
      <section className="skeleton-stagger px-4 md:px-8">
        <div className="skeleton skeleton-text h-6 w-32 mb-4" />
        <SkeletonCarousel count={6} />
      </section>
    </div>
  </div>
)

const HeroSkeleton = () => (
  <div className="relative h-[75vh] min-h-[520px] bg-[#0c0c12] overflow-hidden">
    <div className="skeleton skeleton-wave absolute inset-0 opacity-40" />
    <div className="absolute inset-0 bg-gradient-to-t from-bg-primary via-transparent to-black/30" />
  </div>
)

export const SkeletonSeriesPage = () => (
  <div className="min-h-screen bg-bg-primary pt-24 pb-12 px-4 md:px-8 select-none">
    <div className="skeleton skeleton-pill h-8 w-40 mb-8" />
    <HeroSkeleton />
    <div className="space-y-10 py-8">
      <section className="skeleton-stagger px-4 md:px-8">
        <div className="skeleton skeleton-text h-6 w-32 mb-4" />
        <SkeletonCarousel count={6} />
      </section>
      <section className="skeleton-stagger px-4 md:px-8">
        <div className="skeleton skeleton-text h-6 w-32 mb-4" />
        <SkeletonCarousel count={6} />
      </section>
      <section className="skeleton-stagger px-4 md:px-8">
        <div className="skeleton skeleton-text h-6 w-32 mb-4" />
        <SkeletonCarousel count={6} />
      </section>
    </div>
  </div>
)

export const SkeletonLiveTV = () => (
  <div className="min-h-screen bg-bg-primary pt-24 px-4 md:px-8">
    <div className="skeleton skeleton-pill h-8 w-40 mb-8" />
    <div className="skeleton skeleton-text h-6 w-48 mb-6" />
    <SkeletonCarousel count={8} />
  </div>
)

export const SkeletonMyList = () => (
  <div className="min-h-screen bg-bg-primary pt-24 px-4 md:px-8">
    <div className="skeleton skeleton-pill h-8 w-40 mb-8" />
    <SkeletonCarousel count={8} />
  </div>
)

export default SkeletonCard