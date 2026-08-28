'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { ArrowLeft, Bookmark } from 'lucide-react';
import { ExploreProductCard } from '@/components/explore/ExploreProductCard';

const WISHLIST_PRODUCTS = [
  {
    id: 'p1',
    title: 'Waffle Knit Shirt',
    image: 'https://images.unsplash.com/photo-1596755094514-f87e32f85e2c?q=80&w=600&auto=format&fit=crop',
    price: '1,499',
    originalPrice: '2,499',
    discount: '-40%',
    tag: { text: 'Bestseller', bg: 'bg-[#FF9800]' },
    store: { name: 'Urban Threads', isVerified: true },
    rating: '4.7',
    reviews: '(1.2K)'
  },
  {
    id: 'p2',
    title: 'Urban Runner Sneakers',
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=600&auto=format&fit=crop',
    price: '2,999',
    originalPrice: '3,999',
    discount: '-25%',
    tag: { text: 'New', bg: 'bg-[#16845B]' },
    store: { name: 'Sneak Peak', isVerified: true },
    rating: '4.8',
    reviews: '(856)'
  },
  {
    id: 'p4',
    title: 'Modern Table Lamp',
    image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?q=80&w=600&auto=format&fit=crop',
    price: '1,899',
    originalPrice: '2,700',
    discount: '-32%',
    store: { name: 'Luxe Living', isVerified: true },
    rating: '4.9',
    reviews: '(312)'
  },
  {
    id: 'p6',
    title: 'Leather Tote Bag',
    image: 'https://images.unsplash.com/photo-1584916201218-f4242ceb4809?q=80&w=600&auto=format&fit=crop',
    price: '4,599',
    originalPrice: '6,000',
    discount: '-23%',
    store: { name: 'Chic Bags', isVerified: true },
    rating: '4.8',
    reviews: '(420)'
  },
];

export default function WishlistPage() {
  const router = useRouter();
  const user = useSelector((state: any) => state.auth.user);

  useEffect(() => {
    if (!user) {
      router.push('/login?redirect=/wishlist');
    }
  }, [user, router]);

  if (!user) return null;

  return (
    <div className="flex flex-col min-h-screen bg-[#FAF9F6] pb-24">
      {/* Header */}
      <div className="sticky top-0 bg-white z-50 px-4 py-4 border-b border-[#E5E2DC] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={() => router.back()} className="text-[#171717] hover:bg-gray-50 rounded-full p-1 transition-colors -ml-1">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold text-[#171717] flex items-center gap-2">
            Wishlist
            <span className="text-[#6B6B6B] font-medium text-sm tabular-nums">({WISHLIST_PRODUCTS.length})</span>
          </h1>
        </div>
      </div>

      {/* Product Grid */}
      <div className="p-4">
        {WISHLIST_PRODUCTS.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {WISHLIST_PRODUCTS.map((product) => (
              <ExploreProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Bookmark className="w-8 h-8 text-gray-400" />
            </div>
            <h2 className="text-lg font-bold text-[#171717] mb-2">Your wishlist is empty</h2>
            <p className="text-sm text-[#6B6B6B]">Tap the bookmark icon on products to save them here for later.</p>
          </div>
        )}
      </div>
    </div>
  );
}
