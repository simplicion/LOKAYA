'use client';

import React, { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { ArrowLeft, Heart, Loader2 } from 'lucide-react';
import { ProductCard } from '@/components/ProductCard';
import { AdaptiveSkeleton } from '@/components/ui/AdaptiveSkeleton';
import { useGetWishlistQuery } from '@/lib/api';
import { useOneEightyAuth } from '@/lib/useOneEightyAuth';

export default function WishlistPage() {
  const router = useRouter();
  const user = useSelector((state: any) => state.auth.user);
  const { openAuth } = useOneEightyAuth();
  const authTriggeredRef = useRef(false);

  useEffect(() => {
    if (!user) {
      if (!authTriggeredRef.current) {
        authTriggeredRef.current = true;
        openAuth({
          redirectOnSuccess: '/wishlist',
          onCancel: () => {
            router.replace('/');
          },
        });
      }
    }
  }, [user, router, openAuth]);

  const { data: wishlistResponse, isLoading } = useGetWishlistQuery(undefined, {
    skip: !user,
  });

  if (!user) {
    return (
      <div className="flex flex-col min-h-[70vh] items-center justify-center bg-[#FAF9F6] gap-3">
        <Loader2 className="w-8 h-8 text-[#FF5A36] animate-spin" />
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Connecting Sovereign Identity...
        </span>
      </div>
    );
  }

  const wishlistProducts = (wishlistResponse?.data || [])
    .map((item: any) => item.product)
    .filter(Boolean);

  return (
    <div className="flex flex-col min-h-screen bg-[#FAF9F6] pb-24">
      {/* Header */}
      <div className="sticky top-0 bg-white z-50 px-4 py-4 border-b border-[#E5E2DC] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => router.back()} 
            className="text-[#171717] hover:bg-gray-50 rounded-full p-1 transition-colors -ml-1"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold text-[#171717] flex items-center gap-2">
            Wishlist
            <span className="text-[#6B6B6B] font-medium text-sm tabular-nums">({wishlistProducts.length})</span>
          </h1>
        </div>
      </div>

      {/* Product Grid */}
      <div className="px-2 py-3">
        {isLoading ? (
          <AdaptiveSkeleton variant="product-grid" count={4} />
        ) : wishlistProducts.length > 0 ? (
          <div className="grid grid-cols-2 gap-2">
            {wishlistProducts.map((product: any) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
            <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mb-4">
              <Heart className="w-8 h-8 fill-rose-100 text-rose-500" />
            </div>
            <h2 className="text-lg font-bold text-[#171717] mb-2">Your wishlist is empty</h2>
            <p className="text-sm text-[#6B6B6B] max-w-xs mb-6">
              Tap the heart icon on products to save them here for later.
            </p>
            <button
              onClick={() => router.push('/explore')}
              className="bg-[#FF5A36] text-white px-6 py-2.5 rounded-full font-bold text-sm shadow-md hover:opacity-90 active:scale-95 transition-all"
            >
              Explore Products
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
