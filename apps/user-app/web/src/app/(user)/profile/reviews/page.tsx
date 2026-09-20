'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Star, Trash2, Package, Store, ShoppingBag, Loader2 } from 'lucide-react';
import { useGetMyReviewsQuery, useDeleteProductReviewMutation } from '@/lib/api';
import { getMediaUrl } from '@/lib/utils';
import { toast } from 'sonner';
import { useCurrency } from '@/context/CurrencyContext';

export default function MyReviewsPage() {
  const router = useRouter();
  const { formatPrice } = useCurrency();
  const { data: reviewsResponse, isLoading, refetch } = useGetMyReviewsQuery();
  const [deleteReview, { isLoading: isDeleting }] = useDeleteProductReviewMutation();

  const reviews = reviewsResponse?.data || [];

  const handleDelete = async (reviewId: string) => {
    if (!confirm('Are you sure you want to delete this review?')) return;

    try {
      await deleteReview(reviewId).unwrap();
      toast.success('Review deleted successfully');
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to delete review');
    }
  };

  return (
    <div className="flex flex-col min-h-[100dvh] bg-[#FAF9F6] pb-24 max-w-md mx-auto relative shadow-2xl">
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
          <h1 className="text-lg font-bold text-[#171717] flex items-center gap-2 leading-tight">
            My Reviews
            {reviews.length > 0 && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-50 text-[#FF5A36] border border-orange-200/50">
                {reviews.length}
              </span>
            )}
          </h1>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 py-4 max-w-2xl mx-auto w-full">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-3xl p-5 border border-[#E5E2DC] animate-pulse space-y-3">
                <div className="flex gap-3 items-center">
                  <div className="w-14 h-14 rounded-2xl bg-gray-200" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/2" />
                    <div className="h-3 bg-gray-100 rounded w-1/3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : reviews.length > 0 ? (
          <div className="space-y-3.5">
            {reviews.map((r: any) => {
              const product = r.product;
              const store = product?.store || r.store;
              const prodImg = product?.imageUrl ? getMediaUrl(product.imageUrl) : null;

              const rawPrice = product?.sellingPrice ?? product?.price;
              const numPrice = typeof rawPrice === 'number' 
                ? rawPrice 
                : parseFloat(String(rawPrice || '0').replace(/[^0-9.-]+/g, ''));

              return (
                <div key={r.id} className="bg-white rounded-3xl p-5 border border-[#E5E2DC] shadow-xs space-y-3.5">
                  {/* Product Header */}
                  <div className="flex gap-3 items-center">
                    <div 
                      onClick={() => product?.id && router.push(`/product/${product.id}`)}
                      className="w-14 h-14 rounded-2xl border border-gray-100 bg-gray-50 overflow-hidden shrink-0 cursor-pointer flex items-center justify-center"
                    >
                      {prodImg ? (
                        <img src={prodImg} alt={product?.name || 'Product'} className="w-full h-full object-cover" />
                      ) : (
                        <Package className="w-6 h-6 text-gray-300" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 
                        onClick={() => product?.id && router.push(`/product/${product.id}`)}
                        className="font-bold text-xs text-[#171717] truncate hover:text-[#FF5A36] cursor-pointer"
                      >
                        {product?.name || 'Product'}
                      </h3>

                      {store?.name && (
                        <p 
                          onClick={() => store?.id && router.push(`/store/${store.id}`)}
                          className="text-[11px] text-[#6B6B6B] flex items-center gap-1 hover:text-[#FF5A36] cursor-pointer mt-0.5"
                        >
                          <Store className="w-3 h-3 text-gray-400" />
                          <span>{store.name}</span>
                        </p>
                      )}

                      {numPrice > 0 && (
                        <div className="font-bold text-xs text-[#171717] mt-1">
                          {formatPrice(numPrice)}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => handleDelete(r.id)}
                      disabled={isDeleting}
                      className="w-8 h-8 rounded-full text-gray-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors cursor-pointer"
                      title="Delete review"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Rating & Comment */}
                  <div className="bg-gray-50/70 rounded-2xl p-3.5 border border-gray-100 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star 
                            key={star}
                            className={`w-4 h-4 ${
                              r.rating >= star ? 'fill-amber-400 text-amber-400' : 'fill-gray-200 text-gray-200'
                            }`}
                          />
                        ))}
                        <span className="text-xs font-bold text-gray-800 ml-1.5">{r.rating}.0</span>
                      </div>

                      <span className="text-[10px] text-gray-400">
                        {new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>

                    {r.comment && (
                      <p className="text-xs text-gray-700 leading-relaxed break-words">
                        {r.comment}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
            <div className="w-18 h-18 bg-amber-50 rounded-full flex items-center justify-center mb-4 text-amber-500 shadow-sm">
              <Star className="w-9 h-9 fill-amber-400 text-amber-400" />
            </div>
            <h2 className="text-xl font-bold text-[#171717] mb-2">No Reviews Yet</h2>
            <p className="text-sm text-[#6B6B6B] max-w-xs mb-8 leading-relaxed">
              Once your orders are delivered, you can share your feedback and rate products to assist other local shoppers.
            </p>
            <button
              onClick={() => router.push('/orders')}
              className="bg-[#FF5A36] text-white px-7 py-3 rounded-full font-bold text-sm shadow-md hover:bg-[#e04d2d] active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Package className="w-4 h-4" />
              <span>View Completed Orders</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
