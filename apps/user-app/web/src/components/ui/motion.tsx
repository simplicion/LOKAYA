'use client';

import React from 'react';
import { motion, AnimatePresence, HTMLMotionProps, type Variants } from 'framer-motion';
import confetti from 'canvas-confetti';
import { cn } from '@/lib/utils';

// ==========================================
// 1. Tactile Scale Touch Feedback Wrapper
// ==========================================
interface PressableScaleProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode;
  className?: string;
  scale?: number;
}

export function PressableScale({
  children,
  className,
  scale = 0.96,
  ...props
}: PressableScaleProps) {
  return (
    <motion.div
      whileTap={{ scale }}
      whileHover={{ scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 450, damping: 25 }}
      className={cn('cursor-pointer select-none', className)}
      {...props}
    >
      {children}
    </motion.div>
  );
}

// ==========================================
// 2. Elastic Shake Error Wrapper
// ==========================================
interface MotionShakeProps {
  children: React.ReactNode;
  triggerKey?: any;
  className?: string;
}

export function MotionShake({ children, triggerKey, className }: MotionShakeProps) {
  return (
    <motion.div
      key={triggerKey}
      animate={
        triggerKey
          ? {
              x: [0, -8, 8, -6, 6, -3, 3, 0],
              transition: { duration: 0.45, ease: 'easeInOut' },
            }
          : {}
      }
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ==========================================
// 3. Animated SVG Success Checkmark
// ==========================================
interface AnimatedSuccessCheckProps {
  size?: number;
  className?: string;
  color?: string;
}

export function AnimatedSuccessCheck({
  size = 64,
  className,
  color = '#10B981',
}: AnimatedSuccessCheckProps) {
  return (
    <motion.div
      initial={{ scale: 0, rotate: -30 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 20,
      }}
      className={cn('relative flex items-center justify-center', className)}
      style={{ width: size, height: size }}
    >
      {/* Expanding Ripple Ring */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0.8 }}
        animate={{ scale: 1.35, opacity: 0 }}
        transition={{
          repeat: Infinity,
          duration: 1.8,
          ease: 'easeOut',
        }}
        className="absolute inset-0 rounded-full"
        style={{ backgroundColor: color }}
      />
      
      {/* Background Circle */}
      <div
        className="w-full h-full rounded-full flex items-center justify-center shadow-lg relative z-10"
        style={{ backgroundColor: color }}
      >
        <svg
          width={size * 0.55}
          height={size * 0.55}
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <motion.path
            d="M20 6L9 17l-5-5"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{
              duration: 0.4,
              delay: 0.15,
              ease: 'easeOut',
            }}
          />
        </svg>
      </div>
    </motion.div>
  );
}

// ==========================================
// 4. Animated SVG Error Cross
// ==========================================
interface AnimatedErrorCrossProps {
  size?: number;
  className?: string;
}

export function AnimatedErrorCross({
  size = 64,
  className,
}: AnimatedErrorCrossProps) {
  return (
    <motion.div
      initial={{ scale: 0, rotate: 45 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{
        type: 'spring',
        stiffness: 350,
        damping: 18,
      }}
      className={cn('relative flex items-center justify-center', className)}
      style={{ width: size, height: size }}
    >
      <div className="w-full h-full rounded-full bg-rose-500 flex items-center justify-center shadow-lg relative z-10">
        <svg
          width={size * 0.5}
          height={size * 0.5}
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <motion.line
            x1="18"
            y1="6"
            x2="6"
            y2="18"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          />
          <motion.line
            x1="6"
            y1="6"
            x2="18"
            y2="18"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          />
        </svg>
      </div>
    </motion.div>
  );
}

// ==========================================
// 5. Celebration Confetti Trigger
// ==========================================
export function triggerCelebrationConfetti() {
  if (typeof window === 'undefined') return;

  const count = 180;
  const defaults = {
    origin: { y: 0.7 },
    zIndex: 9999,
  };

  function fire(particleRatio: number, opts: confetti.Options) {
    confetti({
      ...defaults,
      ...opts,
      particleCount: Math.floor(count * particleRatio),
    });
  }

  fire(0.25, {
    spread: 26,
    startVelocity: 55,
    colors: ['#FF5A36', '#FF9F1C', '#2EC4B6', '#E71D36'],
  });
  fire(0.2, {
    spread: 60,
    colors: ['#FF5A36', '#FFB703', '#10B981'],
  });
  fire(0.35, {
    spread: 100,
    decay: 0.91,
    scalar: 0.8,
    colors: ['#FF5A36', '#4361EE', '#3A0CA3', '#7209B7'],
  });
  fire(0.1, {
    spread: 120,
    startVelocity: 25,
    decay: 0.92,
    scalar: 1.2,
    colors: ['#FF5A36', '#F72585'],
  });
  fire(0.1, {
    spread: 120,
    startVelocity: 45,
    colors: ['#FFD166', '#06D6A0', '#118AB2'],
  });
}

// ==========================================
// 6. Staggered List Container & Items
// ==========================================
export const staggerContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.05,
    },
  },
};

export const staggerItemVariants: Variants = {
  hidden: { opacity: 0, y: 16, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 350,
      damping: 24,
    },
  },
};

export function FadeInStagger({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      variants={staggerContainerVariants}
      initial="hidden"
      animate="visible"
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div variants={staggerItemVariants} className={className}>
      {children}
    </motion.div>
  );
}

export { motion, AnimatePresence };
