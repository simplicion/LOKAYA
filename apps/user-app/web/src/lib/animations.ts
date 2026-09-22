import type { Variants, Transition } from 'framer-motion';

/**
 * Centralized Micro-Animation Design Tokens & Variants
 * 
 * Provides unified physics, spring curves, and transition variants
 * across the entire Lokaya platform (Bottom Sheets, Modals, Drawers,
 * Cards, Buttons, and Staggered Lists).
 */

// ==========================================
// 1. Spring & Timing Physics Presets
// ==========================================
export const springs = {
  // Ultra-smooth bottom sheet motion with natural damping
  sheet: {
    type: 'spring',
    damping: 32,
    stiffness: 360,
    mass: 0.85,
  } as Transition,

  // Snappy feedback for buttons, chips, and quick toggles
  snappy: {
    type: 'spring',
    stiffness: 450,
    damping: 30,
  } as Transition,

  // Gentle, floating motion for cards and dialogs
  gentle: {
    type: 'spring',
    stiffness: 280,
    damping: 28,
  } as Transition,

  // Playful bouncy spring for icons, likes, badges
  bouncy: {
    type: 'spring',
    stiffness: 400,
    damping: 18,
  } as Transition,

  // Easing curves for smooth CSS-like exit transitions
  smoothExit: {
    duration: 0.24,
    ease: [0.32, 0.72, 0, 1], // Apple-style fluid cubic bezier
  } as Transition,

  fastFade: {
    duration: 0.2,
    ease: 'easeInOut',
  } as Transition,
};

// ==========================================
// 2. Centralized Sheet & Backdrop Variants
// ==========================================

/**
 * Bottom Sheet Variants:
 * Smooth slide-up on enter, fluid slide-down on exit.
 */
export const bottomSheetVariants: Variants = {
  hidden: {
    y: '100%',
    opacity: 0.8,
  },
  visible: {
    y: 0,
    opacity: 1,
    transition: springs.sheet,
  },
  exit: {
    y: '100%',
    opacity: 0.6,
    transition: springs.smoothExit,
  },
};

/**
 * Dimmer Backdrop Variants:
 * Subtle fade-in and fade-out matching sheet open/close duration.
 */
export const backdropVariants: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.22,
      ease: 'easeOut',
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.2,
      ease: 'easeIn',
    },
  },
};

/**
 * Centered Modal Variants:
 * Scale-up with slight vertical rise, smooth exit.
 */
export const modalVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.94,
    y: 16,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: springs.gentle,
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 12,
    transition: springs.smoothExit,
  },
};

/**
 * Dropdown & Popover Variants:
 */
export const popoverVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.96,
    y: -8,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: springs.snappy,
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    y: -6,
    transition: { duration: 0.15, ease: 'easeIn' },
  },
};

// ==========================================
// 3. Staggered Item Micro-Animations
// ==========================================

export const staggerContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.05,
    },
  },
};

export const staggerItemVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 14,
    scale: 0.98,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: springs.snappy,
  },
};

// ==========================================
// 4. Interactive Micro-Tap Scales
// ==========================================

export const tapScale = {
  tap: { scale: 0.96 },
  hover: { scale: 1.01 },
  transition: springs.snappy,
};

export const buttonPress = {
  whileTap: { scale: 0.97 },
  whileHover: { scale: 1.015 },
  transition: springs.snappy,
};
