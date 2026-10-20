import { motion } from 'framer-motion'
import { FLUID_EASE, SKELETON_FADE_VARIANTS } from '@/utils/motion'

export const SkeletonCard = () => (
  <motion.div
    variants={SKELETON_FADE_VARIANTS}
    initial="initial"
    animate="animate"
    exit="exit"
    className="flex-shrink-0 w-32 sm:w-36 md:w-44 select-none"
  >
    <div className="skeleton skeleton-card aspect-[2/3] w-full border border-white/5" />
    <div className="skeleton skeleton-text h-3.5 rounded-md mt-2.5 w-3/4" />
    <div className="skeleton skeleton-text h-2.5 rounded-md mt-1.5 w-1/2 opacity-70" />
  </motion.div>
)

export const SkeletonGrid = ({ count = 12 }: { count?: number }) => (
  <div className="content-grid select-none">
    {Array.from({ length: count }).map((_, i) => (
      <motion.div
        key={i}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.24, delay: Math.min(i * 0.02, 0.25), ease: FLUID_EASE }}
      >
        <div className="skeleton skeleton-card aspect-[2/3] w-full border border-white/5" />
        <div className="skeleton skeleton-text h-3.5 rounded-md mt-2.5 w-3/4" />
        <div className="skeleton skeleton-text h-2.5 rounded-md mt-1.5 w-1/2 opacity-70" />
      </motion.div>
    ))}
  </div>
)

export const SkeletonHero = () => (
  <motion.div
    variants={SKELETON_FADE_VARIANTS}
    initial="initial"
    animate="animate"
    exit="exit"
    className="relative h-[75vh] min-h-[520px] bg-[#0c0c12] overflow-hidden select-none"
  >
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
  </motion.div>
)

export const SkeletonCarousel = ({ count = 6 }: { count?: number }) => (
  <motion.section
    variants={SKELETON_FADE_VARIANTS}
    initial="initial"
    animate="animate"
    exit="exit"
    className="relative px-4 md:px-8 mb-8 select-none"
  >
    <div className="skeleton skeleton-text h-6 w-48 rounded-lg mb-4" />
    <div className="flex gap-3 overflow-hidden">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  </motion.section>
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
  <motion.div
    variants={SKELETON_FADE_VARIANTS}
    initial="initial"
    animate="animate"
    exit="exit"
    className="min-h-screen w-full bg-[#0a0a12] px-4 sm:px-8 md:px-12 pt-6 pb-12 select-none"
  >
    {/* Botão Voltar skeleton */}
    <div className="mb-6">
      <div className="skeleton h-9 w-24 rounded-xl" />
    </div>

    {/* Layout YouCine: Coluna Esquerda (Info) + Coluna Direita (Preview 16:9) */}
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
      <div className="lg:col-span-7 space-y-3.5">
        <div className="skeleton h-10 sm:h-12 w-3/4 rounded-xl" />
        <div className="skeleton skeleton-text h-4 w-1/2 rounded-md opacity-80" />
        <div className="flex items-center gap-3">
          <div className="skeleton skeleton-pill h-6 w-16" />
          <div className="skeleton skeleton-pill h-6 w-36" />
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          <div className="skeleton skeleton-pill h-6 w-20" />
          <div className="skeleton skeleton-pill h-6 w-24" />
          <div className="skeleton skeleton-pill h-6 w-20" />
        </div>
        <div className="skeleton skeleton-text h-4 w-2/3 rounded-md opacity-70" />
        <div className="skeleton skeleton-text h-4 w-3/4 rounded-md opacity-70" />
        <div className="skeleton h-20 w-full rounded-xl opacity-60 mt-2" />
      </div>

      <div className="lg:col-span-5 flex flex-col items-center lg:items-end justify-center">
        <div className="skeleton w-full max-w-[460px] aspect-video rounded-2xl border border-white/10 shadow-2xl" />
      </div>
    </div>

    {/* Barra de botões de ação YouCine */}
    <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-8">
      <div className="skeleton h-12 w-36 rounded-xl" />
      <div className="skeleton h-12 w-44 rounded-xl opacity-85" />
      <div className="skeleton h-12 w-40 rounded-xl opacity-80" />
      <div className="skeleton h-12 w-36 rounded-xl opacity-75" />
      <div className="skeleton h-12 w-36 rounded-xl opacity-70" />
    </div>

    {/* Grade de episódios numerados */}
    <div className="mt-10 space-y-4">
      <div className="skeleton h-6 w-40 rounded-lg" />
      <div className="flex items-center gap-3 overflow-hidden">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="skeleton w-16 sm:w-20 h-14 sm:h-16 rounded-xl flex-shrink-0" />
        ))}
      </div>
    </div>
  </motion.div>
)

export const SkeletonLiveTVGrid = ({ count = 12 }: { count?: number }) => (
  <div className="space-y-5 select-none">
    {/* Categorias em pílulas */}
    <div className="flex gap-2 overflow-hidden pb-2">
      {Array.from({ length: 7 }).map((_, i) => (
        <div key={i} className="skeleton skeleton-pill h-9 w-28 flex-shrink-0" />
      ))}
    </div>

    {/* Grade de canais estilo YuCine */}
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-4 md:gap-6 pb-20">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, delay: Math.min(i * 0.02, 0.2), ease: FLUID_EASE }}
          className="rounded-2xl bg-[#13131f] border border-white/5 p-3.5 sm:p-4 space-y-3"
        >
          <div className="flex items-center gap-3">
            <div className="skeleton skeleton-circle w-12 h-12 flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="skeleton skeleton-text h-4 w-3/4" />
              <div className="skeleton skeleton-pill h-3 w-16 opacity-70" />
            </div>
          </div>
          <div className="space-y-1.5 pt-1">
            <div className="skeleton skeleton-text h-3 w-5/6 opacity-60" />
            <div className="skeleton h-1.5 w-full rounded-full opacity-50" />
          </div>
        </motion.div>
      ))}
    </div>
  </div>
)

const HeroSkeleton = () => (
  <div className="relative h-[75vh] min-h-[520px] bg-[#0c0c12] overflow-hidden">
    <div className="skeleton skeleton-wave absolute inset-0 opacity-40" />
    <div className="absolute inset-0 bg-gradient-to-t from-bg-primary via-transparent to-black/30" />
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
    </div>
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
    </div>
  </div>
)

export const SkeletonLiveTV = () => (
  <div className="min-h-screen bg-bg-primary pt-24 px-4 md:px-8">
    <div className="skeleton skeleton-pill h-8 w-40 mb-8" />
    <SkeletonLiveTVGrid count={12} />
  </div>
)

export const SkeletonMyList = () => (
  <div className="min-h-screen bg-bg-primary pt-24 px-4 md:px-8">
    <div className="skeleton skeleton-pill h-8 w-40 mb-8" />
    <SkeletonCarousel count={8} />
  </div>
)

export default SkeletonCard
