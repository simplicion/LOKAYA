'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { bottomSheetVariants, backdropVariants } from '@/lib/animations';

export interface AnimatedBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: React.ReactNode;
  subtitle?: string;
  icon?: React.ReactNode;
  footer?: React.ReactNode;
  maxHeight?: string;
  showDragHandle?: boolean;
  dragToDismiss?: boolean;
  className?: string;
  contentClassName?: string;
  headerClassName?: string;
  zIndex?: number;
  showCloseButton?: boolean;
}

export function AnimatedBottomSheet({
  isOpen,
  onClose,
  children,
  title,
  subtitle,
  icon,
  footer,
  maxHeight = '88vh',
  showDragHandle = true,
  dragToDismiss = true,
  className,
  contentClassName,
  headerClassName,
  zIndex = 50,
  showCloseButton = true,
}: AnimatedBottomSheetProps) {
  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll while open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // Handle drag to dismiss gesture
  const handleDragEnd = (_: any, info: PanInfo) => {
    if (!dragToDismiss) return;
    // Dismiss if dragged down more than 90px or with downward velocity > 350px/s
    if (info.offset.y > 90 || info.velocity.y > 350) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          className="fixed inset-0 flex items-end sm:items-center justify-center pointer-events-auto"
          style={{ zIndex }}
          role="dialog"
          aria-modal="true"
        >
          {/* 1. Backdrop with Smooth Fade-in / Fade-out */}
          <motion.div
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 bg-black/50 backdrop-blur-xs cursor-pointer select-none"
            onClick={onClose}
          />

          {/* 2. Sheet Container with Spring Slide-in / Fluid Slide-out */}
          <motion.div
            variants={bottomSheetVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            drag={dragToDismiss ? 'y' : false}
            dragConstraints={{ top: 0 }}
            dragElastic={{ top: 0.05, bottom: 0.5 }}
            onDragEnd={handleDragEnd}
            style={{ maxHeight }}
            className={cn(
              'relative w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-[#E5E2DC] z-10 flex flex-col overflow-hidden touch-manipulation',
              className
            )}
          >
            {/* Drag Handle Indicator */}
            {showDragHandle && (
              <div className="flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing sm:hidden select-none">
                <div className="w-12 h-1.5 bg-gray-200 rounded-full transition-colors hover:bg-gray-300" />
              </div>
            )}

            {/* Optional Header */}
            {(title || icon || showCloseButton) && (
              <div className={cn('px-6 py-4 border-b border-[#E5E2DC] flex items-center justify-between shrink-0', headerClassName)}>
                <div className="flex items-center gap-2.5 min-w-0 pr-3">
                  {icon && (
                    <div className="shrink-0">
                      {icon}
                    </div>
                  )}
                  <div className="min-w-0">
                    {typeof title === 'string' ? (
                      <h3 className="text-base font-black text-[#171717] truncate">{title}</h3>
                    ) : (
                      title
                    )}
                    {subtitle && (
                      <p className="text-[11px] text-[#6B6B6B] font-medium truncate">{subtitle}</p>
                    )}
                  </div>
                </div>

                {showCloseButton && (
                  <button
                    onClick={onClose}
                    className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 active:scale-95 text-gray-500 hover:text-[#171717] flex items-center justify-center transition-all cursor-pointer shrink-0"
                    aria-label="Close"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}

            {/* Scrollable Body Content */}
            <div className={cn('flex-1 overflow-y-auto no-scrollbar overscroll-contain', contentClassName)}>
              {children}
            </div>

            {/* Optional Footer */}
            {footer && (
              <div className="shrink-0 border-t border-[#E5E2DC] bg-[#FAF9F6]">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
