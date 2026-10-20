import type { Transition, Variants } from 'framer-motion'

// =========================================================================
// MOTION PRINCIPLES (KYLE ZANTOS — github.com/kylezantos/design-principles)
// Design Tokens de Física, Curvas de Aceleração, Entrada, Saída e Progresso
// =========================================================================

// 1. Curvas de Easing Fundamentais (Snappy start, buttery landing)
export const FLUID_EASE: [number, number, number, number] = [0.16, 1, 0.3, 1]
export const EXIT_EASE: [number, number, number, number] = [0.4, 0, 1, 1]
export const SMOOTH_EASE: [number, number, number, number] = [0.25, 0.1, 0.25, 1]
export const PROGRESS_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1]

// 2. Molas Baseadas em Física Real (Physics-based springs)
export const SPRING_SNAPPY: Transition = {
  type: 'spring',
  stiffness: 380,
  damping: 26,
  mass: 0.8,
}

export const SPRING_GENTLE: Transition = {
  type: 'spring',
  stiffness: 240,
  damping: 24,
  mass: 1,
}

export const SPRING_BOUNCE: Transition = {
  type: 'spring',
  stiffness: 450,
  damping: 18,
  mass: 0.6,
}

export const SPRING_PROGRESS: Transition = {
  type: 'spring',
  stiffness: 180,
  damping: 28,
  mass: 0.9,
}

// 3. Transição Suave de Páginas (Entrada, Permanência e Saída Fluida em 60fps)
export const PAGE_VARIANTS: Variants = {
  initial: {
    opacity: 0,
    y: 6,
    scale: 0.995,
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.22,
      ease: FLUID_EASE,
    },
  },
  exit: {
    opacity: 0,
    y: -4,
    scale: 0.998,
    transition: {
      duration: 0.14,
      ease: EXIT_EASE,
    },
  },
}

// 4. Stagger Cascading Containers (Entrada coordenada e suave de listas e grades)
export const STAGGER_CONTAINER: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.025,
      delayChildren: 0.02,
      ease: FLUID_EASE,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.12,
      ease: EXIT_EASE,
    },
  },
}

export const STAGGER_ITEM: Variants = {
  hidden: {
    opacity: 0,
    y: 8,
    scale: 0.985,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.22,
      ease: FLUID_EASE,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.98,
    transition: {
      duration: 0.12,
      ease: EXIT_EASE,
    },
  },
}

// 5. Variantes de Skeleton & Lazy Reveal (Kyle Zantos Loading & Reveal)
export const SKELETON_FADE_VARIANTS: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { duration: 0.18, ease: SMOOTH_EASE },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.2, ease: EXIT_EASE },
  },
}

export const LAZY_IMAGE_VARIANTS: Variants = {
  loading: {
    opacity: 0,
    scale: 1.02,
  },
  loaded: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.28,
      ease: FLUID_EASE,
    },
  },
}

// 6. Botões e Micro-interações Táteis (Depress & Elevation)
export const BUTTON_INTERACTIONS = {
  whileHover: { scale: 1.04, y: -1 },
  whileTap: { scale: 0.95, y: 1 },
  transition: SPRING_SNAPPY,
}

export const CARD_HOVER_INTERACTION = {
  whileHover: {
    scale: 1.045,
    y: -6,
    transition: {
      type: 'spring',
      stiffness: 320,
      damping: 22,
    },
  },
  whileTap: {
    scale: 0.98,
    transition: { duration: 0.1 },
  },
}
