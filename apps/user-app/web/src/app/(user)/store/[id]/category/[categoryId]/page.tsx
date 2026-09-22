'use client';

import React, { useState, useMemo, use } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Share2, 
  SlidersHorizontal, 
  ShoppingBag, 
  Store as StoreIcon, 
  CheckCircle2, 
  ChevronDown, 
  Search, 
  X, 
  Star, 
  User, 
  Tag, 
  RotateCcw, 
  Check, 
  Percent,
  Sliders,
  Sparkles
} from 'lucide-react';
import { cn, getMediaUrl } from '@/lib/utils';
import { ProductCard } from '@/components/ProductCard';
import { ShareBottomSheet } from '@/components/ui/ShareBottomSheet';
import { 
  useGetStoreSummaryQuery, 
  useGetStoreProductsQuery, 
  useGetStoreCategoriesQuery 
} from '@/lib/api';
import { AdaptiveSkeleton } from '@/components/ui/AdaptiveSkeleton';

type SortOption = 'newest' | 'price_asc' | 'price_desc' | 'rating' | 'discount';
type PricePreset = 'all' | 'under_500' | '500_1500' | '1500_5000' | 'above_5000';

export default function StoreCategoryPage({ 
  params 
}: { 
  params: Promise<{ id: string; categoryId: string }> 
}) {
  const routeParams = useParams();
  const resolvedParams = use(params);
  const storeId = (routeParams?.id as string) || resolvedParams?.id || '';
  const categoryId = (routeParams?.categoryId as string) || resolvedParams?.categoryId || '';
  const router = useRouter();

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSort, setSelectedSort] = useState<SortOption>('newest');
  const [pricePreset, setPricePreset] = useState<PricePreset>('all');
  const [customMinPrice, setCustomMinPrice] = useState('');
  const [customMaxPrice, setCustomMaxPrice] = useState('');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [discountOnly, setDiscountOnly] = useState(false);
  const [minRating, setMinRating] = useState<number>(0);

  // Modals / Sheets
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
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
  const isVerified = Boolean(store?.isVerified && store?.verificationStatus === 'APPROVED');
  const ownerUser = store?.users?.[0]?.user;
  const ownerUserId = ownerUser?.id || store?.users?.[0]?.userId;

  // Find active category
  const activeCategory = useMemo(() => {
    return categories.find((c: any) => c.id === categoryId);
  }, [categories, categoryId]);

  const categoryName = activeCategory?.name || 'Category Products';

  // Count active filters (excluding sort)
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (searchQuery.trim()) count++;
    if (pricePreset !== 'all' || customMinPrice || customMaxPrice) count++;
    if (inStockOnly) count++;
    if (discountOnly) count++;
    if (minRating > 0) count++;
    return count;
  }, [searchQuery, pricePreset, customMinPrice, customMaxPrice, inStockOnly, discountOnly, minRating]);

  // Reset all filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setPricePreset('all');
    setCustomMinPrice('');
    setCustomMaxPrice('');
    setInStockOnly(false);
    setDiscountOnly(false);
    setMinRating(0);
    setSelectedSort('newest');
  };

  // Filter & Sort products
  const categoryProducts = useMemo(() => {
    // 1. Initial category match
    let list = products.filter((p: any) => p.categoryId === categoryId);

    // 2. Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((p: any) => {
        const nameMatch = p.name?.toLowerCase().includes(q);
        const descMatch = p.description?.toLowerCase().includes(q);
        const brandMatch = p.brand?.toLowerCase().includes(q);
        const tagsMatch = Array.isArray(p.tags) && p.tags.some((t: string) => t.toLowerCase().includes(q));
        return nameMatch || descMatch || brandMatch || tagsMatch;
      });
    }

    // 3. Price Filter
    list = list.filter((p: any) => {
      const price = Number(p.sellingPrice ?? p.price ?? 0);
      if (customMinPrice && price < Number(customMinPrice)) return false;
      if (customMaxPrice && price > Number(customMaxPrice)) return false;

      if (pricePreset === 'under_500' && price >= 500) return false;
      if (pricePreset === '500_1500' && (price < 500 || price > 1500)) return false;
      if (pricePreset === '1500_5000' && (price < 1500 || price > 5000)) return false;
      if (pricePreset === 'above_5000' && price <= 5000) return false;

      return true;
    });

    // 4. In Stock Filter
    if (inStockOnly) {
      list = list.filter((p: any) => (p.stockCount ?? 1) > 0);
    }

    // 5. Discount Filter
    if (discountOnly) {
      list = list.filter((p: any) => {
        const mrp = Number(p.mrp || 0);
        const selling = Number(p.sellingPrice ?? p.price ?? 0);
        return mrp > selling && mrp > 0;
      });
    }

    // 6. Rating Filter
    if (minRating > 0) {
      list = list.filter((p: any) => Number(p.avgRating || 0) >= minRating);
    }

    // 7. Sort
    return [...list].sort((a: any, b: any) => {
      const priceA = Number(a.sellingPrice ?? a.price ?? 0);
      const priceB = Number(b.sellingPrice ?? b.price ?? 0);
      const ratingA = Number(a.avgRating ?? 0);
      const ratingB = Number(b.avgRating ?? 0);
      const discountA = a.mrp && a.sellingPrice ? ((a.mrp - a.sellingPrice) / a.mrp) : 0;
      const discountB = b.mrp && b.sellingPrice ? ((b.mrp - b.sellingPrice) / b.mrp) : 0;

      if (selectedSort === 'price_asc') return priceA - priceB;
      if (selectedSort === 'price_desc') return priceB - priceA;
      if (selectedSort === 'rating') return ratingB - ratingA;
      if (selectedSort === 'discount') return discountB - discountA;
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });
  }, [products, categoryId, searchQuery, pricePreset, customMinPrice, customMaxPrice, inStockOnly, discountOnly, minRating, selectedSort]);

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
    <div className="flex flex-col min-h-[100dvh] bg-[#FAF9F6] pb-24 text-gray-900">
      {/* Top Sticky Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E5E2DC] shadow-xs">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <button 
              onClick={handleBack}
              className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-700 transition-all active:scale-90 shrink-0 cursor-pointer"
              aria-label="Back to Store"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            
            <div className="flex flex-col min-w-0">
              <span className="font-extrabold text-base text-gray-900 tracking-tight truncate leading-tight">
                {categoryName}
              </span>
              <div className="flex items-center gap-1.5 text-xs text-[#6B6B6B] truncate">
                <Link 
                  replace
                  href={`/store/${storeId}`}
                  className="hover:text-[#FF5A36] font-medium transition-colors flex items-center gap-1 truncate"
                >
                  <span>{storeName}</span>
                  {isVerified && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 fill-blue-500 text-white shrink-0" />
                  )}
                </Link>

                {ownerUserId && (
                  <>
                    <span className="text-gray-300">•</span>
                    <button
                      onClick={() => router.push(`/user/${ownerUserId}`)}
                      className="text-stone-500 hover:text-[#FF5A36] font-semibold transition-colors truncate"
                      title="View Owner Profile"
                    >
                      Owner: {ownerUser?.name || 'Profile'}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button 
              onClick={() => setIsShareOpen(true)}
              className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-700 transition-all active:scale-90 cursor-pointer"
              aria-label="Share Category"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto w-full px-4 pt-3.5 space-y-3.5">
        
        {/* Dynamic Category Switcher Carousel */}
        {categories.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-gray-500 px-0.5">
              <span>Categories in {storeName}</span>
              <span className="text-gray-400">{categories.length} total</span>
            </div>
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              <Link
                replace
                href={`/store/${storeId}`}
                className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white border border-[#E5E2DC] text-gray-700 hover:bg-gray-50 shrink-0 transition-all active:scale-95 flex items-center gap-1.5 shadow-2xs"
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
                      "px-3.5 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all active:scale-95 border flex items-center gap-1.5 shadow-2xs",
                      isCurrent
                        ? "bg-[#FF5A36] border-[#FF5A36] text-white shadow-xs font-bold"
                        : "bg-white border-[#E5E2DC] text-gray-700 hover:bg-gray-50 hover:border-gray-300"
                    )}
                  >
                    <span>{cat.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Live Search Bar for Category */}
        <div className="relative">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search products in ${categoryName}...`}
              className="w-full bg-white border border-[#E5E2DC] pl-10 pr-9 py-2.5 rounded-2xl text-xs font-medium placeholder-gray-400 focus:outline-none focus:border-[#FF5A36] focus:ring-2 focus:ring-[#FF5A36]/10 shadow-2xs transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Quick Filter & Sort Toolbar */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {/* Main Filter Drawer Trigger */}
          <button
            onClick={() => setIsFilterOpen(true)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all active:scale-95 border shadow-2xs cursor-pointer",
              activeFilterCount > 0
                ? "bg-[#FF5A36] text-white border-[#FF5A36] shadow-orange-500/20"
                : "bg-white text-gray-700 border-[#E5E2DC] hover:bg-gray-50"
            )}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-white text-[#FF5A36] font-black text-[10px] flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Sort Dropdown Button */}
          <div className="relative shrink-0">
            <button
              onClick={() => setIsSortOpen(!isSortOpen)}
              className="flex items-center gap-1.5 bg-white border border-[#E5E2DC] px-3 py-1.5 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors shadow-2xs active:scale-95 cursor-pointer"
            >
              <span className="text-gray-400 font-normal">Sort:</span>
              <span className="capitalize">
                {selectedSort === 'newest' && 'Newest'}
                {selectedSort === 'price_asc' && 'Price: Low → High'}
                {selectedSort === 'price_desc' && 'Price: High → Low'}
                {selectedSort === 'rating' && 'Top Rated'}
                {selectedSort === 'discount' && 'Biggest Discount'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
            </button>

            {isSortOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setIsSortOpen(false)} 
                />
                <div className="absolute left-0 mt-1.5 w-52 bg-white rounded-2xl border border-gray-100 shadow-xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                  {[
                    { id: 'newest', label: '⚡ Newest First' },
                    { id: 'price_asc', label: '📉 Price: Low to High' },
                    { id: 'price_desc', label: '📈 Price: High to Low' },
                    { id: 'rating', label: '⭐ Top Rated' },
                    { id: 'discount', label: '🔥 Biggest Discount' },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => {
                        setSelectedSort(opt.id as SortOption);
                        setIsSortOpen(false);
                      }}
                      className={cn(
                        "w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center justify-between cursor-pointer",
                        selectedSort === opt.id
                          ? "bg-orange-50 text-[#FF5A36] font-bold"
                          : "text-gray-700 hover:bg-gray-50"
                      )}
                    >
                      <span>{opt.label}</span>
                      {selectedSort === opt.id && (
                        <Check className="w-3.5 h-3.5 text-[#FF5A36]" />
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Quick Pill: In Stock Only */}
          <button
            onClick={() => setInStockOnly(!inStockOnly)}
            className={cn(
              "px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all active:scale-95 border shadow-2xs flex items-center gap-1.5 cursor-pointer",
              inStockOnly
                ? "bg-orange-50 text-[#FF5A36] border-[#FF5A36] font-bold"
                : "bg-white text-gray-600 border-[#E5E2DC] hover:bg-gray-50"
            )}
          >
            <span>In Stock Only</span>
            {inStockOnly && <Check className="w-3 h-3 text-[#FF5A36]" />}
          </button>

          {/* Quick Pill: On Sale / Discount */}
          <button
            onClick={() => setDiscountOnly(!discountOnly)}
            className={cn(
              "px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all active:scale-95 border shadow-2xs flex items-center gap-1.5 cursor-pointer",
              discountOnly
                ? "bg-orange-50 text-[#FF5A36] border-[#FF5A36] font-bold"
                : "bg-white text-gray-600 border-[#E5E2DC] hover:bg-gray-50"
            )}
          >
            <span>🔥 On Sale</span>
            {discountOnly && <Check className="w-3 h-3 text-[#FF5A36]" />}
          </button>

          {/* Quick Pill: 4+ Rating */}
          <button
            onClick={() => setMinRating(minRating === 4 ? 0 : 4)}
            className={cn(
              "px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all active:scale-95 border shadow-2xs flex items-center gap-1 cursor-pointer",
              minRating === 4
                ? "bg-orange-50 text-[#FF5A36] border-[#FF5A36] font-bold"
                : "bg-white text-gray-600 border-[#E5E2DC] hover:bg-gray-50"
            )}
          >
            <Star className={cn("w-3 h-3", minRating === 4 ? "text-[#FF5A36] fill-[#FF5A36]" : "text-amber-500 fill-amber-500")} />
            <span>4.0+ Stars</span>
          </button>
        </div>

        {/* Active Filters Summary Chips */}
        {activeFilterCount > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
            <span className="text-[11px] font-bold text-gray-400 mr-1">Active:</span>
            
            {searchQuery && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-orange-50 text-[#FF5A36] border border-orange-200">
                "{searchQuery}"
                <button onClick={() => setSearchQuery('')} className="hover:text-black">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {pricePreset !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-orange-50 text-[#FF5A36] border border-orange-200">
                {pricePreset === 'under_500' && 'Under ₹500'}
                {pricePreset === '500_1500' && '₹500 - ₹1,500'}
                {pricePreset === '1500_5000' && '₹1,500 - ₹5,000'}
                {pricePreset === 'above_5000' && 'Above ₹5,000'}
                <button onClick={() => setPricePreset('all')} className="hover:text-black">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {(customMinPrice || customMaxPrice) && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-orange-50 text-[#FF5A36] border border-orange-200">
                ₹{customMinPrice || 0} - ₹{customMaxPrice || '∞'}
                <button onClick={() => { setCustomMinPrice(''); setCustomMaxPrice(''); }} className="hover:text-black">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {inStockOnly && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-orange-50 text-[#FF5A36] border border-orange-200">
                In Stock
                <button onClick={() => setInStockOnly(false)} className="hover:text-black">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {discountOnly && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-orange-50 text-[#FF5A36] border border-orange-200">
                On Sale
                <button onClick={() => setDiscountOnly(false)} className="hover:text-black">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {minRating > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-orange-50 text-[#FF5A36] border border-orange-200">
                {minRating}+ Stars
                <button onClick={() => setMinRating(0)} className="hover:text-black">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            <button
              onClick={handleResetFilters}
              className="text-[11px] font-bold text-[#FF5A36] hover:underline ml-1"
            >
              Clear all
            </button>
          </div>
        )}

        {/* Results Counter */}
        <div className="flex items-center justify-between pt-1 px-0.5">
          <span className="font-extrabold text-sm text-gray-900">
            {categoryProducts.length} {categoryProducts.length === 1 ? 'Product' : 'Products'} found
          </span>
          <span className="text-xs text-gray-500 font-medium">
            Category: <strong className="text-gray-800">{categoryName}</strong>
          </span>
        </div>

        {/* Products Grid */}
        {categoryProducts.length > 0 ? (
          <div className="grid grid-cols-2 gap-2 pt-1">
            {categoryProducts.map((product: any) => {
              const primaryImage = product.media?.[0]?.url || product.imageUrl || product.images?.[0] || '';
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
                    reviews: `(${product.reviewCount || 0})`,
                    stockCount: product.stockCount,
                  }}
                />
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-white rounded-3xl border border-gray-100 shadow-sm mt-4">
            <div className="w-16 h-16 rounded-full bg-orange-50 text-[#FF5A36] flex items-center justify-center mb-3 shadow-inner">
              <ShoppingBag className="w-8 h-8 stroke-[1.5]" />
            </div>
            <h3 className="font-bold text-gray-900 text-base">
              {activeFilterCount > 0 ? 'No Matching Products' : 'No Products in Category'}
            </h3>
            <p className="text-xs text-gray-500 max-w-xs mt-1.5 leading-relaxed">
              {activeFilterCount > 0
                ? 'No products matched your specific search criteria or filter combinations.'
                : `There are currently no published products under ${categoryName}.`}
            </p>
            {activeFilterCount > 0 ? (
              <button
                onClick={handleResetFilters}
                className="mt-5 inline-flex items-center gap-1.5 bg-[#FF5A36] text-white px-5 py-2.5 rounded-full text-xs font-bold shadow-md hover:bg-[#e04d2d] transition-all active:scale-95 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Search & Filters</span>
              </button>
            ) : (
              <Link
                href={`/store/${storeId}`}
                className="mt-5 inline-flex items-center gap-1.5 bg-[#FF5A36] text-white px-5 py-2.5 rounded-full text-xs font-bold shadow-md hover:bg-[#e04d2d] transition-all active:scale-95"
              >
                <StoreIcon className="w-3.5 h-3.5" />
                <span>Browse All Store Products</span>
              </Link>
            )}
          </div>
        )}
      </main>

      {/* Advanced Filter Bottom Sheet Modal */}
      {isFilterOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div 
            className="fixed inset-0" 
            onClick={() => setIsFilterOpen(false)} 
          />
          <div className="relative w-full max-w-lg bg-white rounded-t-[32px] p-6 shadow-2xl max-h-[85vh] flex flex-col z-10 animate-in slide-in-from-bottom duration-250">
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-[#FF5A36]" />
                <h3 className="font-extrabold text-lg text-gray-900">Filter Products</h3>
              </div>
              <button
                onClick={() => setIsFilterOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:text-gray-900 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Filter Content Body */}
            <div className="overflow-y-auto py-4 space-y-6 flex-1 pr-1">
              
              {/* Price Preset Filter */}
              <div className="space-y-2.5">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-600 block">
                  Price Range
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'all', label: 'All Prices' },
                    { id: 'under_500', label: 'Under ₹500' },
                    { id: '500_1500', label: '₹500 - ₹1,500' },
                    { id: '1500_5000', label: '₹1,500 - ₹5,000' },
                    { id: 'above_5000', label: 'Above ₹5,000' },
                  ].map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => {
                        setPricePreset(preset.id as PricePreset);
                        setCustomMinPrice('');
                        setCustomMaxPrice('');
                      }}
                      className={cn(
                        "py-2.5 px-3 rounded-xl text-xs font-semibold border transition-all text-center cursor-pointer",
                        pricePreset === preset.id && !customMinPrice && !customMaxPrice
                          ? "bg-orange-50 border-[#FF5A36] text-[#FF5A36] font-bold ring-1 ring-[#FF5A36]/30"
                          : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                      )}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                {/* Custom Price Range Inputs */}
                <div className="pt-2">
                  <span className="text-[11px] font-semibold text-gray-500 mb-1.5 block">Or Custom Price (₹)</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={customMinPrice}
                      onChange={(e) => {
                        setCustomMinPrice(e.target.value);
                        setPricePreset('all');
                      }}
                      placeholder="Min ₹"
                      className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:border-[#FF5A36]"
                    />
                    <span className="text-gray-400 font-bold">-</span>
                    <input
                      type="number"
                      value={customMaxPrice}
                      onChange={(e) => {
                        setCustomMaxPrice(e.target.value);
                        setPricePreset('all');
                      }}
                      placeholder="Max ₹"
                      className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:border-[#FF5A36]"
                    />
                  </div>
                </div>
              </div>

              {/* Minimum Customer Rating */}
              <div className="space-y-2.5">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-600 block">
                  Customer Rating
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { val: 0, label: 'Any' },
                    { val: 3.5, label: '3.5+ ⭐' },
                    { val: 4.0, label: '4.0+ ⭐' },
                    { val: 4.5, label: '4.5+ ⭐' },
                  ].map((item) => (
                    <button
                      key={item.val}
                      onClick={() => setMinRating(item.val)}
                      className={cn(
                        "py-2 px-2 rounded-xl text-xs font-semibold border transition-all text-center cursor-pointer",
                        minRating === item.val
                          ? "bg-orange-50 border-[#FF5A36] text-[#FF5A36] font-bold ring-1 ring-[#FF5A36]/30"
                          : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                      )}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Toggles */}
              <div className="space-y-3 pt-1">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-600 block">
                  Availability & Offers
                </label>
                
                {/* In Stock Toggle */}
                <div 
                  onClick={() => setInStockOnly(!inStockOnly)}
                  className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 border border-gray-100 cursor-pointer hover:bg-gray-100/80 transition-colors"
                >
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-gray-900">In Stock Products Only</span>
                    <span className="text-[11px] text-gray-500">Hide out of stock items</span>
                  </div>
                  <div className={cn(
                    "w-11 h-6 rounded-full transition-colors relative p-0.5",
                    inStockOnly ? "bg-[#FF5A36]" : "bg-gray-300"
                  )}>
                    <div className={cn(
                      "w-5 h-5 rounded-full bg-white transition-transform shadow-xs",
                      inStockOnly ? "translate-x-5" : "translate-x-0"
                    )} />
                  </div>
                </div>

                {/* On Sale Toggle */}
                <div 
                  onClick={() => setDiscountOnly(!discountOnly)}
                  className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 border border-gray-100 cursor-pointer hover:bg-gray-100/80 transition-colors"
                >
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-gray-900">Discounted / On Sale Only</span>
                    <span className="text-[11px] text-gray-500">Show items with active promotional discounts</span>
                  </div>
                  <div className={cn(
                    "w-11 h-6 rounded-full transition-colors relative p-0.5",
                    discountOnly ? "bg-[#FF5A36]" : "bg-gray-300"
                  )}>
                    <div className={cn(
                      "w-5 h-5 rounded-full bg-white transition-transform shadow-xs",
                      discountOnly ? "translate-x-5" : "translate-x-0"
                    )} />
                  </div>
                </div>
              </div>
            </div>

            {/* Drawer Actions */}
            <div className="pt-4 border-t border-gray-100 flex items-center gap-3">
              <button
                onClick={handleResetFilters}
                className="flex-1 py-3 rounded-2xl border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors active:scale-95 cursor-pointer"
              >
                Reset All
              </button>
              <button
                onClick={() => setIsFilterOpen(false)}
                className="flex-2 py-3 rounded-2xl bg-[#FF5A36] text-white text-xs font-bold shadow-lg shadow-orange-500/25 hover:bg-[#e04d2d] transition-all active:scale-95 cursor-pointer"
              >
                Apply Filters ({categoryProducts.length} Results)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Bottom Sheet */}
      <ShareBottomSheet 
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        url={shareUrl}
        title={`Explore ${categoryName} from ${storeName} on Lokaya!`}
      />
    </div>
  );
}
