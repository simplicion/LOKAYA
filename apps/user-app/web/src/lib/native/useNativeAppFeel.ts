'use client';

import { useEffect } from 'react';

/**
 * Hook to enforce 100% Native App Feel in web browsers:
 * - Completely prevents pinch-to-zoom (touch & gestures)
 * - Completely prevents double-tap zoom
 * - Disables Ctrl + Wheel and Ctrl + (+/-) desktop zoom
 * - Blocks ghost dragging on images and links
 * - Blocks long-press context menus / callouts on images and links
 * - Preserves full text selection & context menus inside form inputs/textareas
 */
export function useNativeAppFeel() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. Prevent iOS Safari Gesture Pinch-to-Zoom
    const handleGesture = (e: any) => {
      e.preventDefault();
    };

    // 2. Prevent Multi-Touch Pinch Zoom (Android Chrome & iOS Safari)
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    };

    // 3. Prevent Double-Tap to Zoom on Mobile Browsers
    let lastTouchEnd = 0;
    const handleTouchEnd = (e: TouchEvent) => {
      const now = Date.now();
      const target = e.target as HTMLElement | null;

      // Allow default behavior for input / textarea so keyboard focus works instantly
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }

      if (now - lastTouchEnd <= 300) {
        e.preventDefault();
      }
      lastTouchEnd = now;
    };

    // 4. Prevent Ctrl + Wheel Zoom (Desktop & Laptop Trackpads)
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
      }
    };

    // 5. Prevent Keyboard Shortcuts for Zooming (Ctrl +, Ctrl -, Ctrl 0)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && (e.key === '+' || e.key === '-' || e.key === '=' || e.key === '0')) {
        e.preventDefault();
      }
    };

    // 6. Prevent Ghost Drag on Images and Links
    const handleDragStart = (e: DragEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'IMG' || target.tagName === 'A' || target.tagName === 'VIDEO')) {
        e.preventDefault();
      }
    };

    // 7. Prevent Browser Context Menu / Callout on Long-Press (Except Form Inputs)
    const handleContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }
      // If user is inside an explicitly selectable area, allow context menu
      if (target && target.closest('[data-selectable="true"]')) {
        return;
      }
      e.preventDefault();
    };

    // Attach listeners with passive: false to allow e.preventDefault()
    document.addEventListener('gesturestart', handleGesture, { passive: false });
    document.addEventListener('gesturechange', handleGesture, { passive: false });
    document.addEventListener('gestureend', handleGesture, { passive: false });
    document.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, { passive: false });
    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('dragstart', handleDragStart);
    document.addEventListener('contextmenu', handleContextMenu);

    return () => {
      document.removeEventListener('gesturestart', handleGesture);
      document.removeEventListener('gesturechange', handleGesture);
      document.removeEventListener('gestureend', handleGesture);
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('dragstart', handleDragStart);
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, []);
}
