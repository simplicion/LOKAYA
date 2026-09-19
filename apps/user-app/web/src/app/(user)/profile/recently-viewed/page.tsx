'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Clock, Trash2, ShoppingBag } from 'lucide-react';
import { ProductCard } from '@/components/ProductCard';
import { AdaptiveSkeleton } from '@/components/ui/AdaptiveSkeleton';
import { useGetProductsBatchQuery } from '@/lib/api';
import { getRecentlyViewedIds, clearRecentlyViewed } from '@/lib/services/recentlyViewed';
import { toast } from 'sonner';

export default function RecentlyViewedPage() {
  const router = useRouter();
  const [productIds, setProductIds] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const ids = getRecentlyViewedIds();
    setProductIds(ids);
    setIsLoaded(true);
  }, []);

  const { data: products = [], isLoading } = useGetProductsBatchQuery(productIds, {
    skip: !isLoaded || productIds.length === 0,
  });

  const handleClear = () => {
    clearRecentlyViewed();
    setProductIds([]);
    toast.success('Recently viewed history cleared');
  };

  return (
    <div className="flex flex-col min-h-[100dvh] bg-[#FAF9F6] pb-24">
      {/* Header */}
      <div className="sticky top-0 bg-white/95 backdrop-blur-md z-50 px-4 py-3.5 border-b border-[#E5E2DC] flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2.5">
          <button 
            onClick={() => router.back()} 
            className="w-9 h-9 rounded-full flex items-center justify-center text-[#171717] hover:bg-gray-100 active:scale-95 transition-all -ml-1 cursor-pointer"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" strokeWidth={2.2} />
          </button>
          <div>
            <h1 className="text-lg font-bold text-[#171717] flex items-center gap-2 leading-tight">
              Recently Viewed
              {productIds.length > 0 && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-50 text-[#FF5A36] border border-orange-200/50">
                  {productIds.length}
                </span>
              )}
            </h1>
          </div>
        </div>

        {productIds.length > 0 && (
          <button
            onClick={handleClear}
            className="text-xs font-bold text-[#6B6B6B] hover:text-rose-600 flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
            title="Clear all recently viewed items"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 px-3 py-3">
        {!isLoaded || (isLoading && productIds.length > 0) ? (
          <AdaptiveSkeleton variant="product-grid" count={4} />
        ) : products.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
            {products.map((product: any) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
            <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mb-5 text-[#FF5A36] shadow-sm">
              <Clock className="w-10 h-10" strokeWidth={1.75} />
            </div>
            <h2 className="text-xl font-bold text-[#171717] mb-2">No Recently Viewed Items</h2>
            <p className="text-sm text-[#6B6B6B] max-w-xs mb-8 leading-relaxed">
              Items you browse while exploring products in Lokaya will be saved here for easy revisit.
            </p>
            <button
              onClick={() => router.push('/explore')}
              className="bg-[#FF5A36] text-white px-7 py-3 rounded-full font-bold text-sm shadow-md hover:bg-[#e04d2d] active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Explore Products</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
