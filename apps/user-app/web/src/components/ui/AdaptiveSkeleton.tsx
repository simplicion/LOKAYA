import React from 'react';
import { cn } from '@/lib/utils';
import { Skeleton, SkeletonText, SkeletonAvatar, SkeletonPill, SkeletonButton, SkeletonCard } from './skeleton';

export type SkeletonVariant = 
  | 'store-page'
  | 'store-category'
  | 'product-card'
  | 'product-grid'
  | 'product-detail'
  | 'feed-post'
  | 'social-reel'
  | 'seller-dashboard'
  | 'order-card'
  | 'order-list'
  | 'profile'
  | 'category-pills'
  | 'table'
  | 'custom';

export interface AdaptiveSkeletonProps {
  variant?: SkeletonVariant;
  count?: number;
  className?: string;
  gridCols?: number;
  children?: React.ReactNode;
}

export function AdaptiveSkeleton({
  variant = 'product-grid',
  count = 1,
  className,
  gridCols = 2,
  children,
}: AdaptiveSkeletonProps) {
  
  // Custom children wrapper
  if (variant === 'custom' || children) {
    return <div className={cn("w-full", className)}>{children}</div>;
  }

  // 1. STORE PAGE PRESET (Exact match to public store page)
  if (variant === 'store-page') {
    return (
      <div className={cn("flex flex-col min-h-[100dvh] bg-[#FAF9F6] pb-24", className)}>
        {/* Top Header Placeholder */}
        <div className="h-14 bg-white/80 border-b border-gray-100 flex items-center justify-between px-4 sticky top-0 z-10 backdrop-blur-md">
          <Skeleton shape="circle" className="w-9 h-9" />
          <Skeleton className="h-5 w-32 rounded-lg" />
          <Skeleton shape="circle" className="w-9 h-9" />
        </div>

        {/* 16:9 Cover Banner */}
        <div className="w-full aspect-[16/9] max-h-56 bg-gradient-to-tr from-gray-200 to-gray-300 relative overflow-hidden">
          <Skeleton className="w-full h-full rounded-none" />
        </div>

        {/* Store Profile Header Stage */}
        <div className="bg-white border-b border-gray-100 px-4 pt-0 pb-5 shadow-xs">
          <div className="flex flex-col">
            {/* Overlapping Avatar */}
            <div className="relative -mt-10 sm:-mt-12 mb-3">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-white shadow-lg bg-white overflow-hidden p-0.5">
                <Skeleton shape="circle" className="w-full h-full" />
              </div>
            </div>

            {/* Store Name & Verification Badge */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-6 w-44 rounded-md" />
                <Skeleton shape="circle" className="w-4 h-4" />
              </div>
              <Skeleton className="h-3.5 w-32 rounded-md" />

              {/* Location & Tags */}
              <div className="flex items-center gap-2 pt-1">
                <Skeleton className="h-3 w-28 rounded-md" />
                <span className="text-gray-300">•</span>
                <Skeleton className="h-3 w-36 rounded-md" />
              </div>

              {/* Status Badges */}
              <div className="flex items-center gap-2 pt-1.5">
                <Skeleton shape="pill" className="h-6 w-20 rounded-full" />
                <Skeleton shape="pill" className="h-6 w-24 rounded-full" />
              </div>
            </div>
          </div>
        </div>

        {/* Categories Section */}
        <div className="bg-white border-b border-gray-100 px-4 py-4 space-y-3 mt-2">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-28 rounded-md" />
            <Skeleton className="h-3.5 w-16 rounded-md" />
          </div>
          <div className="flex gap-4 overflow-hidden pt-1">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-2 shrink-0">
                <Skeleton shape="circle" className="w-14 h-14" />
                <Skeleton className="h-2.5 w-12 rounded-md" />
              </div>
            ))}
          </div>
        </div>

        {/* All Products Grid Section */}
        <div className="px-4 py-4 space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-32 rounded-md" />
            <Skeleton className="h-4 w-16 rounded-md" />
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 2. STORE CATEGORY PRESET
  if (variant === 'store-category') {
    return (
      <div className={cn("flex flex-col min-h-[100dvh] bg-[#FAF9F6] pb-24", className)}>
        {/* Header */}
        <div className="h-14 bg-white border-b border-gray-100 flex items-center justify-between px-4 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <Skeleton shape="circle" className="w-9 h-9" />
            <div className="space-y-1">
              <Skeleton className="h-4 w-32 rounded-md" />
              <Skeleton className="h-3 w-20 rounded-md" />
            </div>
          </div>
          <Skeleton shape="circle" className="w-9 h-9" />
        </div>

        {/* Category Pills Switcher */}
        <div className="p-4 space-y-4">
          <div className="flex gap-2 overflow-hidden">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} shape="pill" className="h-8 w-28 rounded-full shrink-0" />
            ))}
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 pt-1">
            {Array.from({ length: count > 1 ? count : 4 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 3. PRODUCT CARD (Single Item)
  if (variant === 'product-card') {
    return <ProductCardSkeleton className={className} />;
  }

  // 4. PRODUCT GRID
  if (variant === 'product-grid') {
    const colClasses: Record<number, string> = {
      1: 'grid-cols-1',
      2: 'grid-cols-2',
      3: 'grid-cols-2 sm:grid-cols-3',
      4: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4',
    };

    return (
      <div className={cn("grid gap-3 sm:gap-4", colClasses[gridCols] || 'grid-cols-2', className)}>
        {Array.from({ length: count }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  // 5. PRODUCT DETAIL PAGE
  if (variant === 'product-detail') {
    return (
      <div className={cn("flex flex-col min-h-screen bg-white pb-24", className)}>
        <div className="w-full aspect-square bg-gray-100 relative">
          <Skeleton className="w-full h-full rounded-none" />
        </div>
        <div className="p-5 space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24 rounded-md" />
            <Skeleton className="h-6 w-4/5 rounded-md" />
            <Skeleton className="h-5 w-32 rounded-md" />
          </div>

          <div className="flex gap-3 pt-2">
            <Skeleton shape="pill" className="h-8 w-20 rounded-full" />
            <Skeleton shape="pill" className="h-8 w-24 rounded-full" />
          </div>

          <div className="space-y-2 pt-2 border-t border-gray-100">
            <Skeleton className="h-4 w-32 rounded-md" />
            <SkeletonText lines={3} />
          </div>
        </div>
      </div>
    );
  }

  // 6. FEED POST PRESET
  if (variant === 'feed-post') {
    return (
      <div className={cn("flex flex-col gap-5 px-4 pt-2", className)}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="w-full bg-white rounded-3xl border border-gray-100 p-4 flex flex-col gap-3 shadow-xs">
            {/* Author Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <SkeletonAvatar size="md" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-28 rounded-md" />
                  <Skeleton className="h-3 w-16 rounded-md" />
                </div>
              </div>
              <Skeleton shape="circle" className="w-7 h-7" />
            </div>

            {/* Media Box (4:5 aspect ratio) */}
            <div className="w-full aspect-[4/5] rounded-2xl overflow-hidden">
              <Skeleton className="w-full h-full rounded-2xl" />
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-4">
                <Skeleton shape="circle" className="w-6 h-6" />
                <Skeleton shape="circle" className="w-6 h-6" />
                <Skeleton shape="circle" className="w-6 h-6" />
              </div>
              <Skeleton shape="circle" className="w-6 h-6" />
            </div>

            {/* Caption & Likes */}
            <div className="space-y-1.5 pt-1">
              <Skeleton className="h-3.5 w-24 rounded-md" />
              <Skeleton className="h-3 w-full rounded-md" />
              <Skeleton className="h-3 w-2/3 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // 7. SOCIAL REEL PRESET
  if (variant === 'social-reel') {
    return (
      <div className={cn("w-full h-[100dvh] bg-[#18181B] relative overflow-hidden flex flex-col justify-between p-5", className)}>
        <div className="flex items-center justify-between z-10">
          <Skeleton className="h-6 w-28 rounded-lg bg-white/20" />
          <Skeleton shape="circle" className="w-8 h-8 bg-white/20" />
        </div>

        <div className="flex justify-between items-end z-10">
          <div className="space-y-2 max-w-[70%]">
            <div className="flex items-center gap-2">
              <Skeleton shape="circle" className="w-10 h-10 bg-white/30" />
              <Skeleton className="h-4 w-28 rounded-md bg-white/30" />
            </div>
            <Skeleton className="h-3 w-full rounded-md bg-white/20" />
            <Skeleton className="h-3 w-4/5 rounded-md bg-white/20" />
          </div>

          <div className="flex flex-col items-center gap-4">
            <Skeleton shape="circle" className="w-10 h-10 bg-white/20" />
            <Skeleton shape="circle" className="w-10 h-10 bg-white/20" />
            <Skeleton shape="circle" className="w-10 h-10 bg-white/20" />
          </div>
        </div>
      </div>
    );
  }

  // 8. SELLER DASHBOARD PRESET
  if (variant === 'seller-dashboard') {
    return (
      <div className={cn("p-4 space-y-6 max-w-4xl mx-auto w-full", className)}>
        {/* KPI Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-3xl p-4 border border-gray-100 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <Skeleton className="h-3.5 w-20 rounded-md" />
                <Skeleton shape="circle" className="w-6 h-6" />
              </div>
              <Skeleton className="h-7 w-24 rounded-lg" />
              <Skeleton className="h-3 w-16 rounded-md" />
            </div>
          ))}
        </div>

        {/* Chart Card */}
        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-36 rounded-md" />
            <Skeleton shape="pill" className="h-7 w-24 rounded-full" />
          </div>
          <Skeleton className="w-full h-48 rounded-2xl" />
        </div>

        {/* Recent Orders List */}
        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-32 rounded-md" />
            <Skeleton className="h-4 w-16 rounded-md" />
          </div>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-none">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-10 h-10 rounded-xl" />
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-28 rounded-md" />
                    <Skeleton className="h-3 w-20 rounded-md" />
                  </div>
                </div>
                <Skeleton className="h-4 w-16 rounded-md" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 9. ORDER LIST PRESET
  if (variant === 'order-list' || variant === 'order-card') {
    return (
      <div className={cn("space-y-3.5", className)}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="bg-white rounded-3xl p-4 border border-gray-100 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-gray-50 pb-2.5">
              <Skeleton className="h-3.5 w-24 rounded-md" />
              <Skeleton shape="pill" className="h-6 w-20 rounded-full" />
            </div>
            <div className="flex items-center gap-3">
              <Skeleton className="w-16 h-16 rounded-2xl shrink-0" />
              <div className="space-y-1.5 flex-1">
                <Skeleton className="h-4 w-4/5 rounded-md" />
                <Skeleton className="h-3 w-1/3 rounded-md" />
                <Skeleton className="h-4 w-20 rounded-md" />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Skeleton className="h-8 w-24 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // 10. PROFILE PRESET
  if (variant === 'profile') {
    return (
      <div className={cn("flex flex-col min-h-screen bg-white pb-20", className)}>
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton shape="circle" className="w-20 h-20" />
            <div className="flex gap-6 pr-4">
              <div className="flex flex-col items-center gap-1">
                <Skeleton className="h-5 w-8 rounded-md" />
                <Skeleton className="h-3 w-10 rounded-md" />
              </div>
              <div className="flex flex-col items-center gap-1">
                <Skeleton className="h-5 w-8 rounded-md" />
                <Skeleton className="h-3 w-14 rounded-md" />
              </div>
              <div className="flex flex-col items-center gap-1">
                <Skeleton className="h-5 w-8 rounded-md" />
                <Skeleton className="h-3 w-14 rounded-md" />
              </div>
            </div>
          </div>

          <div className="space-y-1.5 pt-1">
            <Skeleton className="h-4 w-36 rounded-md" />
            <Skeleton className="h-3.5 w-60 rounded-md" />
          </div>

          <div className="flex gap-2 pt-2">
            <Skeleton className="h-9 flex-1 rounded-xl" />
            <Skeleton className="h-9 flex-1 rounded-xl" />
          </div>
        </div>

        {/* 3-Col Media Grid */}
        <div className="grid grid-cols-3 gap-1 pt-4 border-t border-gray-100">
          {Array.from({ length: 9 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-none" />
          ))}
        </div>
      </div>
    );
  }

  // 11. CATEGORY PILLS PRESET
  if (variant === 'category-pills') {
    return (
      <div className={cn("flex gap-2 overflow-hidden py-1", className)}>
        {Array.from({ length: count || 6 }).map((_, i) => (
          <Skeleton key={i} shape="pill" className="h-8 w-24 rounded-full shrink-0" />
        ))}
      </div>
    );
  }

  // 12. TABLE PRESET
  if (variant === 'table') {
    return (
      <div className={cn("bg-white rounded-3xl border border-gray-100 p-4 shadow-xs space-y-3", className)}>
        <div className="flex justify-between items-center pb-2 border-b border-gray-100">
          <Skeleton className="h-4 w-28 rounded-md" />
          <Skeleton className="h-4 w-20 rounded-md" />
        </div>
        {Array.from({ length: count || 5 }).map((_, i) => (
          <div key={i} className="flex justify-between items-center py-2.5 border-b border-gray-50 last:border-none">
            <div className="flex items-center gap-3">
              <Skeleton shape="circle" className="w-8 h-8" />
              <div className="space-y-1">
                <Skeleton className="h-3.5 w-32 rounded-md" />
                <Skeleton className="h-3 w-20 rounded-md" />
              </div>
            </div>
            <Skeleton className="h-4 w-16 rounded-md" />
          </div>
        ))}
      </div>
    );
  }

  return null;
}

// Internal reusable Product Card Skeleton (exactly mirrors ProductCard component)
function ProductCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("bg-white rounded-2xl border border-gray-100 p-2.5 flex flex-col gap-2.5 shadow-xs", className)}>
      {/* 3:4 Media Box */}
      <div className="relative aspect-[3/4] w-full rounded-xl overflow-hidden bg-gray-100">
        <Skeleton className="w-full h-full rounded-xl" />
        
        {/* Rating badge placeholder */}
        <div className="absolute top-2 left-2">
          <Skeleton shape="pill" className="h-5 w-12 rounded-full bg-white/70" />
        </div>

        {/* Heart icon placeholder */}
        <div className="absolute top-2 right-2">
          <Skeleton shape="circle" className="w-6 h-6 bg-white/70" />
        </div>
      </div>

      {/* Details */}
      <div className="space-y-1.5 px-0.5">
        <Skeleton className="h-2.5 w-14 rounded-md" />
        <Skeleton className="h-3.5 w-full rounded-md" />
        
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1.5">
            <Skeleton className="h-4 w-12 rounded-md" />
            <Skeleton className="h-3 w-8 rounded-md" />
          </div>
          <Skeleton className="h-6 w-14 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
