import type { Transition, Variants } from 'framer-motion'

// =========================================================================
// MOTION PRINCIPLES (KYLE ZANTOS / EMIL KOWALSKI / JAKUB KREHEL)
// Design Tokens de Física, Curvas de Aceleração e Micro-interações
// =========================================================================

// 1. Curvas de Easing Fundamentais
export const FLUID_EASE: [number, number, number, number] = [0.16, 1, 0.3, 1] // Snappy start, buttery landing
export const EXIT_EASE: [number, number, number, number] = [0.4, 0, 1, 1]    // Fast exit, no linger
export const SMOOTH_EASE: [number, number, number, number] = [0.25, 0.1, 0.25, 1]

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

// 3. Transição de Páginas (Entrada fluida de 320ms, Saída ágil de 160ms)
export const PAGE_VARIANTS: Variants = {
  initial: {
    opacity: 0,
    y: 12,
    scale: 0.995,
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.32,
      ease: FLUID_EASE,
    },
  },
  exit: {
    opacity: 0,
    y: -8,
    scale: 0.995,
    transition: {
      duration: 0.16,
      ease: EXIT_EASE,
    },
  },
}

// 4. Stagger Cascading Containers (Efeito cascata suave para listas/grids)
export const STAGGER_CONTAINER: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.06,
    },
  },
}

export const STAGGER_ITEM: Variants = {
  hidden: {
    opacity: 0,
    y: 16,
    scale: 0.96,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.35,
      ease: FLUID_EASE,
    },
  },
}

// 5. Botões e Micro-interações Táteis (Depress & Elevation)
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
