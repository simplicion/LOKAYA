'use client';

import React, { useState, useMemo, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Share2, 
  SlidersHorizontal, 
  ShoppingBag, 
  Store as StoreIcon, 
  CheckCircle2, 
  ChevronDown, 
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ProductCard } from '@/components/ProductCard';
import { ShareBottomSheet } from '@/components/ui/ShareBottomSheet';
import { 
  useGetStoreSummaryQuery, 
  useGetStoreProductsQuery, 
  useGetStoreCategoriesQuery 
} from '@/lib/api';
import { AdaptiveSkeleton } from '@/components/ui/AdaptiveSkeleton';

type SortOption = 'newest' | 'price_asc' | 'price_desc' | 'rating';

export default function StoreCategoryPage({ 
  params 
}: { 
  params: Promise<{ id: string; categoryId: string }> 
}) {
  const resolvedParams = use(params);
  const storeId = resolvedParams.id;
  const categoryId = resolvedParams.categoryId;
  const router = useRouter();

  const [selectedSort, setSelectedSort] = useState<SortOption>('newest');
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);

  // Live queries
  const { data: storeSummary, isLoading: isStoreLoading } = useGetStoreSummaryQuery(storeId, {
    skip: !storeId
  });
  const { data: products = [], isLoading: isProductsLoading } = useGetStoreProductsQuery(storeId, {
    skip: !storeId
  });
  const { data: categories = [], isLoading: isCategoriesLoading } = useGetStoreCategoriesQuery(storeId, {
    skip: !storeId
  });

  const store = storeSummary?.store;
  const storeName = store?.name || 'Store';
  const logoUrl = store?.logoUrl;
  const isVerified = store?.status === 'VERIFIED';

  // Find active category
  const activeCategory = useMemo(() => {
    return categories.find((c: any) => c.id === categoryId);
  }, [categories, categoryId]);

  const categoryName = activeCategory?.name || 'Category Products';

  // Filter products by this category
  const categoryProducts = useMemo(() => {
    const matched = products.filter((p: any) => p.categoryId === categoryId);

    return [...matched].sort((a: any, b: any) => {
      const priceA = Number(a.sellingPrice ?? a.price ?? 0);
      const priceB = Number(b.sellingPrice ?? b.price ?? 0);
      const ratingA = Number(a.avgRating ?? 0);
      const ratingB = Number(b.avgRating ?? 0);

      if (selectedSort === 'price_asc') return priceA - priceB;
      if (selectedSort === 'price_desc') return priceB - priceA;
      if (selectedSort === 'rating') return ratingB - ratingA;
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });
  }, [products, categoryId, selectedSort]);

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';

  // Loading state
  if (isStoreLoading || isCategoriesLoading || isProductsLoading) {
    return <AdaptiveSkeleton variant="store-category" />;
  }

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 2) {
      router.back();
    } else {
      router.replace(`/store/${storeId}`);
    }
  };

  return (
    <div className="flex flex-col min-h-[100dvh] bg-[#FAF9F6] pb-24">
      {/* Top Sticky Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E5E2DC] shadow-xs">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <button 
              onClick={handleBack}
              className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-700 transition-all active:scale-90"
              aria-label="Back to Store"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            
            <div className="flex flex-col min-w-0">
              <span className="font-extrabold text-base text-gray-900 tracking-tight truncate leading-tight">
                {categoryName}
              </span>
              <Link 
                replace
                href={`/store/${storeId}`}
                className="flex items-center gap-1 text-xs text-[#6B6B6B] hover:text-[#FF5A36] transition-colors truncate"
              >
                <span>{storeName}</span>
                {isVerified && (
                  <CheckCircle2 className="w-3 h-3 text-blue-500 fill-blue-50 shrink-0" />
                )}
              </Link>
            </div>
          </div>

          <button 
            onClick={() => setIsShareOpen(true)}
            className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-700 transition-all active:scale-90"
            aria-label="Share Category"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto w-full px-4 pt-4 space-y-4">
        {/* Other Categories Pills (Quick Switcher) */}
        {categories.length > 1 && (
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B6B6B]">
              Browse Other Categories
            </span>
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              <Link
                replace
                href={`/store/${storeId}`}
                className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white border border-[#E5E2DC] text-gray-700 hover:bg-gray-50 shrink-0 transition-all active:scale-95 flex items-center gap-1.5"
              >
                <StoreIcon className="w-3.5 h-3.5 text-[#6B6B6B]" />
                All Store Products
              </Link>
              {categories.map((cat: any) => {
                const isCurrent = cat.id === categoryId;
                return (
                  <Link
                    key={cat.id}
                    replace
                    href={`/store/${storeId}/category/${cat.id}`}
                    className={cn(
                      "px-3.5 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all active:scale-95 border",
                      isCurrent
                        ? "bg-[#FF5A36] border-[#FF5A36] text-white shadow-xs font-bold"
                        : "bg-white border-[#E5E2DC] text-gray-700 hover:bg-gray-50"
                    )}
                  >
                    {cat.name}
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Action Bar: Count & Sorting */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-sm text-gray-900">
              {categoryProducts.length} {categoryProducts.length === 1 ? 'Product' : 'Products'}
            </span>
          </div>

          {/* Sort Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsSortOpen(!isSortOpen)}
              className="flex items-center gap-1.5 bg-white border border-[#E5E2DC] px-3 py-1.5 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors shadow-2xs active:scale-95"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#FF5A36]" />
              <span className="capitalize">
                {selectedSort === 'newest' && 'Newest'}
                {selectedSort === 'price_asc' && 'Price: Low to High'}
                {selectedSort === 'price_desc' && 'Price: High to Low'}
                {selectedSort === 'rating' && 'Top Rated'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
            </button>

            {isSortOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setIsSortOpen(false)} 
                />
                <div className="absolute right-0 mt-1.5 w-48 bg-white rounded-2xl border border-gray-100 shadow-xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                  {[
                    { id: 'newest', label: 'Newest First' },
                    { id: 'price_asc', label: 'Price: Low to High' },
                    { id: 'price_desc', label: 'Price: High to Low' },
                    { id: 'rating', label: 'Top Rated' },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => {
                        setSelectedSort(opt.id as SortOption);
                        setIsSortOpen(false);
                      }}
                      className={cn(
                        "w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center justify-between",
                        selectedSort === opt.id
                          ? "bg-orange-50 text-[#FF5A36] font-bold"
                          : "text-gray-700 hover:bg-gray-50"
                      )}
                    >
                      <span>{opt.label}</span>
                      {selectedSort === opt.id && (
                        <div className="w-1.5 h-1.5 rounded-full bg-[#FF5A36]" />
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Products Grid */}
        {categoryProducts.length > 0 ? (
          <div className="grid grid-cols-2 gap-2 pt-1">
            {categoryProducts.map((product: any) => {
              const primaryImage = product.media?.[0]?.url || product.imageUrl || product.images?.[0] || 'https://placehold.co/400x400/png?text=No+Image';
              const sellingPrice = product.sellingPrice != null ? product.sellingPrice : (product.price || 0);
              const mrp = product.mrp;
              const discountText = mrp && sellingPrice && mrp > sellingPrice
                ? `${Math.round(((mrp - sellingPrice) / mrp) * 100)}% OFF`
                : undefined;

              return (
                <ProductCard 
                  key={product.id} 
                  product={{
                    id: product.id,
                    title: product.name,
                    image: primaryImage,
                    price: Number(sellingPrice).toLocaleString(),
                    originalPrice: mrp ? Number(mrp).toLocaleString() : undefined,
                    discount: discountText,
                    store: { id: store.id, name: storeName, isVerified },
                    rating: product.avgRating ? Number(product.avgRating).toFixed(1) : '5.0',
                    reviews: `(${product.reviewCount || 0})`
                  }}
                />
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-white rounded-3xl border border-gray-100 shadow-sm mt-4">
            <div className="w-16 h-16 rounded-full bg-orange-50 text-[#FF5A36] flex items-center justify-center mb-3">
              <ShoppingBag className="w-8 h-8 stroke-[1.5]" />
            </div>
            <h3 className="font-bold text-gray-900 text-base">No Products Found</h3>
            <p className="text-xs text-gray-500 max-w-xs mt-1">
              There are currently no published products under {categoryName}.
            </p>
            <Link
              href={`/store/${storeId}`}
              className="mt-5 inline-flex items-center gap-1.5 bg-[#FF5A36] text-white px-5 py-2.5 rounded-full text-xs font-bold shadow-md hover:bg-[#e04d2d] transition-all active:scale-95"
            >
              Browse All Products
            </Link>
          </div>
        )}
      </main>

      {/* Share Bottom Sheet */}
      <ShareBottomSheet 
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        url={shareUrl}
      />
    </div>
  );
}
