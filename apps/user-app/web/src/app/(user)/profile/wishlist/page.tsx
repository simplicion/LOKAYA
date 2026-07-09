'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, Heart, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function WishlistPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col min-h-screen bg-gray-50/50 pb-safe">
      {/* Header */}
      <div className="flex items-center justify-center py-4 relative px-4 sticky top-0 bg-white z-50">
        <button onClick={() => router.back()} className="absolute left-4 p-2 -ml-2 rounded-full hover:bg-gray-50 text-gray-700">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-bold text-[17px] text-gray-900">Your Wishlist</h1>
      </div>

      {/* Empty State */}
      <div className="flex flex-col items-center justify-center flex-1 px-6 text-center pt-20">
        <div className="w-24 h-24 bg-rose-50 rounded-full flex items-center justify-center mb-6 shadow-sm">
          <Heart className="w-10 h-10 text-rose-400" fill="currentColor" />
        </div>
        
        <h2 className="text-xl font-black text-gray-900 mb-2">Your wishlist is empty</h2>
        <p className="text-gray-500 text-sm font-medium mb-8 max-w-[250px]">
          Save your favorite items here by tapping the heart icon on any product.
        </p>

        <Button 
          onClick={() => router.push('/home')}
          className="w-full max-w-[200px] h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[15px] shadow-[0_8px_30px_rgb(79,70,229,0.25)] transition-all active:scale-[0.98] flex items-center gap-2"
        >
          <ShoppingBag className="w-5 h-5" />
          Explore Products
        </Button>
      </div>
    </div>
  );
}
