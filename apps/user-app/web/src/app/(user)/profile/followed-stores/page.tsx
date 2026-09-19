'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Store, Star, MapPin, CheckCircle2, ChevronRight, ShoppingBag, Loader2 } from 'lucide-react';
import { useGetFollowedStoresQuery, useFollowStoreMutation } from '@/lib/api';
import { getMediaUrl, cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function FollowedStoresPage() {
  const router = useRouter();
  const { data: stores = [], isLoading } = useGetFollowedStoresQuery();
  const [toggleFollowStore, { isLoading: isToggling }] = useFollowStoreMutation();

  const handleUnfollow = async (e: React.MouseEvent, storeId: string, storeName: string) => {
    e.stopPropagation();
    try {
      await toggleFollowStore(storeId).unwrap();
      toast.success(`Unfollowed ${storeName}`);
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to update follow status');
    }
  };

  return (
    <div className="flex flex-col min-h-[100dvh] bg-[#FAF9F6] pb-24">
      {/* Top Header */}
      <div className="sticky top-0 bg-white/95 backdrop-blur-md z-50 px-4 py-3.5 border-b border-[#E5E2DC] flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2.5">
          <button 
            onClick={() => router.back()} 
            className="w-9 h-9 rounded-full flex items-center justify-center text-[#171717] hover:bg-gray-100 active:scale-95 transition-all -ml-1 cursor-pointer"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" strokeWidth={2.2} />
          </button>
          <h1 className="text-lg font-bold text-[#171717] flex items-center gap-2 leading-tight">
            Followed Stores
            {stores.length > 0 && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-50 text-[#FF5A36] border border-orange-200/50">
                {stores.length}
              </span>
            )}
          </h1>
        </div>
      </div>

      {/* Stores List */}
      <div className="flex-1 px-4 py-4">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-4 border border-[#E5E2DC] animate-pulse flex gap-3.5 items-center">
                <div className="w-14 h-14 rounded-full bg-gray-200 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                  <div className="h-3 bg-gray-100 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : stores.length > 0 ? (
          <div className="space-y-3.5">
            {stores.map((store: any) => {
              const logo = store.logoUrl ? getMediaUrl(store.logoUrl) : null;

              return (
                <div 
                  key={store.id}
                  onClick={() => router.push(`/store/${store.id}`)}
                  className="bg-white rounded-2xl p-4 border border-[#E5E2DC] shadow-xs hover:shadow-md transition-all cursor-pointer group flex flex-col gap-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#171717] to-gray-800 border-2 border-white shadow-xs overflow-hidden shrink-0 flex items-center justify-center text-white font-bold text-lg">
                        {logo ? (
                          <img src={logo} alt={store.name} className="w-full h-full object-cover" />
                        ) : (
                          store.name ? store.name.charAt(0).toUpperCase() : 'S'
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-bold text-[#171717] text-base truncate group-hover:text-[#FF5A36] transition-colors">
                            {store.name}
                          </h3>
                          {store.isVerified && (
                            <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0 fill-blue-50" />
                          )}
                        </div>

                        {store.category && (
                          <p className="text-xs font-medium text-[#6B6B6B] truncate mt-0.5">
                            {store.category}
                          </p>
                        )}

                        <div className="flex items-center gap-2 mt-1.5 text-xs text-[#6B6B6B]">
                          {store.rating ? (
                            <span className="flex items-center gap-1 font-bold text-gray-800 bg-amber-50 px-1.5 py-0.5 rounded text-[11px] text-amber-700">
                              <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                              {store.rating}
                            </span>
                          ) : null}

                          {(store.city || store.address) && (
                            <span className="flex items-center gap-0.5 truncate max-w-[140px]">
                              <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
                              {store.city || store.address}
                            </span>
                          )}

                          {store.productsCount !== undefined && (
                            <span className="text-gray-400 font-normal">
                              • {store.productsCount} {store.productsCount === 1 ? 'item' : 'items'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Unfollow / Following Button */}
                    <button
                      onClick={(e) => handleUnfollow(e, store.id, store.name)}
                      disabled={isToggling}
                      className="px-3 py-1.5 rounded-full border border-gray-200 text-xs font-bold text-[#171717] hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all shrink-0 active:scale-95 cursor-pointer"
                    >
                      Following
                    </button>
                  </div>

                  {/* Bottom visit action */}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs text-[#FF5A36] font-semibold">
                    <span className="flex items-center gap-1">
                      <ShoppingBag className="w-3.5 h-3.5" />
                      View Storefront & Products
                    </span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
            <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mb-5 text-[#FF5A36] shadow-sm">
              <Store className="w-10 h-10" strokeWidth={1.75} />
            </div>
            <h2 className="text-xl font-bold text-[#171717] mb-2">No Followed Stores Yet</h2>
            <p className="text-sm text-[#6B6B6B] max-w-xs mb-8 leading-relaxed">
              Follow your favorite local stores and verified merchants to receive updates on new products and exclusive deals.
            </p>
            <button
              onClick={() => router.push('/explore')}
              className="bg-[#FF5A36] text-white px-7 py-3 rounded-full font-bold text-sm shadow-md hover:bg-[#e04d2d] active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Store className="w-4 h-4" />
              <span>Discover Stores</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
