'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { api } from '@/lib/api';

/**
 * AppPrefetchWarmup Engine (Amazon & Flipkart App Shell Pattern)
 * 
 * Runs non-intrusively during browser idle time (requestIdleCallback)
 * after the current page paints. Warmed-up route chunks and data are stored
 * in memory so that when a user switches tabs (Explore, Reels, Search, etc.),
 * the transition is 0ms instantaneous without spinner delays.
 */
export function AppPrefetchWarmup() {
  const router = useRouter();
  const dispatch = useDispatch();
  const hasWarmedUp = useRef(false);

  useEffect(() => {
    if (hasWarmedUp.current) return;
    hasWarmedUp.current = true;

    const executeWarmup = () => {
      try {
        // 1. Warm up Next.js route JS chunks
        router.prefetch('/explore');
        router.prefetch('/search');
        router.prefetch('/home/reels');
        router.prefetch('/cart');

        // 2. Warm up essential public queries into RTK Query memory cache
        // Uses ifOlderThan: 300 (5 minutes) so it only fetches if not fresh
        dispatch(api.util.prefetch('getPublicProducts', { sort: 'newest' }, { ifOlderThan: 300 }) as any);
        dispatch(api.util.prefetch('getBanners', undefined, { ifOlderThan: 300 }) as any);
        dispatch(api.util.prefetch('getReels', undefined, { ifOlderThan: 300 }) as any);
        dispatch(api.util.prefetch('getPosts', undefined, { ifOlderThan: 300 }) as any);
      } catch (err) {
        // Non-blocking background warmup
        console.debug('[AppPrefetchWarmup] Background warmup note:', err);
      }
    };

    // Use requestIdleCallback if available, fallback to setTimeout
    if (typeof window !== 'undefined') {
      if ('requestIdleCallback' in window) {
        const idleId = (window as any).requestIdleCallback(executeWarmup, { timeout: 2000 });
        return () => (window as any).cancelIdleCallback?.(idleId);
      } else {
        const timerId = setTimeout(executeWarmup, 300);
        return () => clearTimeout(timerId);
      }
    }
  }, [router, dispatch]);

  return null;
}
