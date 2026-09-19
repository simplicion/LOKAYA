'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Loader2, Store as StoreIcon, MapPin, Sparkles, Navigation } from 'lucide-react';
import { motion, AnimatePresence, useMotionValue } from 'framer-motion';
import { cn } from '@/lib/utils';
import { StoreCard } from '@/components/StoreCard';
import { useGetExploreStoresQuery } from '@/lib/api';
import { FadeInStagger, StaggerItem, PressableScale } from '@/components/ui/motion';

type SnapPoint = 'peek' | 'mid' | 'expanded';

const SNAP_HEIGHTS = {
  peek: '22vh',
  mid: '54vh',
  expanded: '88vh',
};

// Haversine geodesic distance helper
function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)} m away`;
  }
  return `${km.toFixed(1)} km away`;
}

interface NearbyBottomSheetProps {
  userCoords?: [number, number];
  radiusKm?: number;
  onExpandRadius?: (radius: number) => void;
}

export function NearbyBottomSheet({
  userCoords,
  radiusKm = 2,
  onExpandRadius,
}: NearbyBottomSheetProps) {
  const router = useRouter();
  const [snap, setSnap] = useState<SnapPoint>('peek');
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const { data: allStores = [] } = useGetExploreStoresQuery();
  const { data: rawStores = [], isLoading } = useGetExploreStoresQuery({
    category: activeCategory,
    search: debouncedSearch,
  });

  // Calculate distance, filter by radius, and sort by proximity
  const processedStores = useMemo(() => {
    return rawStores
      .map((store: any) => {
        let distanceKm: number | null = null;
        let formattedDist = store.distance || '';

        if (
          userCoords &&
          typeof store.lat === 'number' &&
          typeof store.lng === 'number' &&
          !isNaN(store.lat) &&
          !isNaN(store.lng)
        ) {
          distanceKm = calculateDistanceKm(userCoords[0], userCoords[1], store.lat, store.lng);
          formattedDist = formatDistance(distanceKm);
        }

        return {
          ...store,
          distanceKm,
          distance: formattedDist,
        };
      })
      .filter((store: any) => {
        // If radiusKm is 0 or no userCoords, show all
        if (!radiusKm || radiusKm <= 0 || !userCoords) return true;
        // If store has valid coordinates, check if within radius
        if (typeof store.distanceKm === 'number') {
          return store.distanceKm <= radiusKm;
        }
        return true;
      })
      .sort((a: any, b: any) => {
        if (typeof a.distanceKm === 'number' && typeof b.distanceKm === 'number') {
          return a.distanceKm - b.distanceKm;
        }
        return 0;
      });
  }, [rawStores, userCoords, radiusKm]);

  // Dynamically extract categories from live stores
  const categories = useMemo(() => {
    const set = new Set<string>();
    allStores.forEach((s: any) => {
      if (s.category && typeof s.category === 'string') {
        set.add(s.category.trim());
      }
    });
    if (set.size === 0) return [];
    return [
      { id: 'all', label: 'All' },
      ...Array.from(set).map((cat) => ({ id: cat.toLowerCase(), label: cat })),
    ];
  }, [allStores]);

  const handleDragEnd = (
    _: any,
    info: { offset: { y: number }; velocity: { y: number } }
  ) => {
    const { offset, velocity } = info;
    const threshold = 40;
    const velocityThreshold = 400;

    if (velocity.y < -velocityThreshold || offset.y < -120) {
      if (snap === 'peek') setSnap('mid');
      else setSnap('expanded');
    } else if (velocity.y > velocityThreshold || offset.y > 120) {
      if (snap === 'expanded') setSnap('mid');
      else setSnap('peek');
    } else if (offset.y < -threshold) {
      if (snap === 'peek') setSnap('mid');
      else if (snap === 'mid') setSnap('expanded');
    } else if (offset.y > threshold) {
      if (snap === 'expanded') setSnap('mid');
      else if (snap === 'mid') setSnap('peek');
    }
  };

  const toggleSnap = () => {
    if (snap === 'peek') setSnap('mid');
    else if (snap === 'mid') setSnap('expanded');
    else setSnap('peek');
  };

  return (
    <>
      {/* Dynamic Glassmorphic Dimmer Backdrop */}
      <AnimatePresence>
        {snap === 'expanded' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={() => setSnap('mid')}
            className="fixed inset-0 z-20 bg-black/30 backdrop-blur-[2px]"
          />
        )}
      </AnimatePresence>

      {/* Gesture Bottom Sheet Container */}
      <motion.div
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.15}
        onDragEnd={handleDragEnd}
        animate={{
          height: SNAP_HEIGHTS[snap],
        }}
        transition={{
          type: 'spring',
          damping: 30,
          stiffness: 380,
          mass: 0.8,
        }}
        className={cn(
          'absolute w-full bottom-0 bg-white rounded-t-[36px] z-30 flex flex-col',
          'shadow-[0_-12px_40px_rgba(0,0,0,0.12)] border-t border-gray-100',
          'touch-manipulation hardware-accelerated'
        )}
      >
        {/* Interactive Drag Handle Area */}
        <div
          onClick={toggleSnap}
          className="w-full pt-3.5 pb-2.5 flex flex-col items-center justify-center cursor-grab active:cursor-grabbing select-none"
        >
          <motion.div
            whileHover={{ scale: 1.15, width: 56 }}
            whileTap={{ scale: 0.95, width: 44 }}
            className="w-12 h-1.5 bg-gray-300 rounded-full transition-all duration-150"
          />
        </div>

        {/* Sheet Header */}
        <div className="px-5 flex items-center justify-between pb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-black text-gray-900 tracking-tight">Nearby Stores</h2>
            {processedStores.length > 0 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-orange-50 text-[10px] font-bold text-[#FF5A36] border border-orange-100">
                {processedStores.length} {processedStores.length === 1 ? 'store' : 'stores'}
              </span>
            )}
          </div>

          <button
            onClick={() => setSnap(snap === 'expanded' ? 'peek' : 'expanded')}
            className="text-[11px] font-bold text-[#FF5A36] hover:underline cursor-pointer"
          >
            {snap === 'expanded' ? 'Minimize' : 'View full map / list'}
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-4 pb-20 no-scrollbar">
          <div className="flex flex-col gap-3.5">
            {/* Search Input & Live Filter Chips */}
            <div className="flex flex-col gap-2.5">
              <div className="relative">
                <Search
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                  strokeWidth={2.5}
                />
                <input
                  type="text"
                  value={searchQuery}
                  onFocus={() => {
                    if (snap === 'peek') setSnap('mid');
                  }}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search stores, categories..."
                  className="w-full bg-[#FAF9F6] border border-[#E5E2DC] rounded-2xl py-2.5 pl-10 pr-10 text-[13px] font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FF5A36]/20 focus:border-[#FF5A36] transition-all"
                />
                {isLoading && (
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                    <Loader2 className="w-4 h-4 text-[#FF5A36] animate-spin" />
                  </div>
                )}
              </div>

              {categories.length > 0 && (
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 -mx-4 px-4">
                  {categories.map((cat) => {
                    const isSelected = activeCategory === cat.id;
                    return (
                      <PressableScale key={cat.id} scale={0.94}>
                        <button
                          onClick={() => setActiveCategory(cat.id)}
                          className={cn(
                            'px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border transition-all duration-200 cursor-pointer',
                            isSelected
                              ? 'bg-[#FF5A36] text-white border-[#FF5A36] shadow-sm shadow-orange-500/20'
                              : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                          )}
                        >
                          {cat.label}
                        </button>
                      </PressableScale>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Store List with Distance Sorting */}
            {isLoading ? (
              <div className="flex flex-col gap-3 py-3">
                {[1, 2, 3].map((n) => (
                  <div
                    key={n}
                    className="bg-[#FAF9F6] rounded-2xl p-3.5 flex gap-4 animate-pulse h-28 border border-[#E5E2DC]"
                  >
                    <div className="w-[84px] h-[92px] bg-gray-200 rounded-xl shrink-0" />
                    <div className="flex-1 py-1.5 space-y-2">
                      <div className="w-32 h-4 bg-gray-200 rounded" />
                      <div className="w-24 h-3 bg-gray-200 rounded" />
                      <div className="w-20 h-3 bg-gray-200 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : processedStores.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col items-center justify-center py-10 text-center"
              >
                <div className="w-14 h-14 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center text-[#FF5A36] mb-3 shadow-sm">
                  <StoreIcon className="w-7 h-7" />
                </div>
                <p className="font-bold text-gray-900 text-sm">No stores found in this area</p>
                <p className="text-xs text-gray-500 mt-1 max-w-[240px]">
                  {radiusKm > 0 ? `No verified stores found within ${radiusKm} km.` : 'Try searching with a different keyword or category.'}
                </p>
                {radiusKm > 0 && onExpandRadius && (
                  <button
                    onClick={() => onExpandRadius(radiusKm < 10 ? 10 : 25)}
                    className="mt-3.5 px-4 py-2 bg-[#FF5A36] text-white rounded-full text-xs font-bold shadow-sm hover:bg-[#e04d2d] transition-all cursor-pointer"
                  >
                    Expand to {radiusKm < 10 ? '10 km' : '25 km'}
                  </button>
                )}
              </motion.div>
            ) : (
              <FadeInStagger className="flex flex-col gap-3">
                {processedStores.map((store: any) => (
                  <StaggerItem key={store.id}>
                    <StoreCard store={store} />
                  </StaggerItem>
                ))}
              </FadeInStagger>
            )}

            <div className="h-16" />
          </div>
        </div>
      </motion.div>
    </>
  );
}
