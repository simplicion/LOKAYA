'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  TrendingUp, 
  SlidersHorizontal, 
  ChevronDown, 
  Sparkles,
  ShoppingBag,
  ArrowRight,
  Filter,
  Check
} from 'lucide-react';
import { ProductCard } from '@/components/ProductCard';
import { AdaptiveSkeleton } from '@/components/ui/AdaptiveSkeleton';
import { BannerMediaItem } from '@/components/banner/BannerMediaItem';
import { api, useGetBannersQuery, useGetPublicProductsQuery } from '@/lib/api';
import { useDispatch } from 'react-redux';
import { cn, getMediaUrl } from '@/lib/utils';



const SORT_OPTIONS = [
  { id: 'newest', label: 'Newest First' },
  { id: 'price_asc', label: 'Price: Low to High' },
  { id: 'price_desc', label: 'Price: High to Low' },
];

export default function ExplorePage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);
  const [selectedSort, setSelectedSort] = useState('newest');
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isNavVisible, setIsNavVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const bannerScrollRef = useRef<HTMLDivElement>(null);

  // Live queries
  const { data: banners = [], isLoading: isBannersLoading } = useGetBannersQuery();
  const { data: products = [], isLoading: isProductsLoading } = useGetPublicProductsQuery({
    sort: selectedSort,
  });

  // Background idle prefetching of top 4 visible products (Amazon / Flipkart pattern)
  useEffect(() => {
    if (products && products.length > 0) {
      const topProducts = products.slice(0, 4);
      topProducts.forEach((p: any) => {
        if (p?.id) {
          try {
            dispatch(api.util.prefetch('getProductById', p.id, { ifOlderThan: 180 }) as any);
          } catch {
            // Ignore idle prefetch errors
          }
        }
      });
    }
  }, [products, dispatch]);

  // Dynamically derive trending tags from live catalog products without hardcoded mock tags
  const trendingTags = React.useMemo(() => {
    if (!products || products.length === 0) return [];
    const unique = new Set<string>();
    products.forEach((p: any) => {
      if (p.category && typeof p.category === 'string') {
        unique.add(p.category.trim());
      }
    });
    return Array.from(unique);
  }, [products]);

  // Track scroll direction for sticky bar
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 50) {
        setIsNavVisible(false);
      } else if (currentScrollY < lastScrollY || currentScrollY <= 50) {
        setIsNavVisible(true);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // Handle banner scroll pagination indicator
  const handleBannerScroll = () => {
    if (bannerScrollRef.current) {
      const scrollLeft = bannerScrollRef.current.scrollLeft;
      const width = bannerScrollRef.current.offsetWidth;
      const newIndex = Math.round(scrollLeft / (width * 0.85));
      setActiveBannerIndex(Math.min(newIndex, Math.max(0, banners.length - 1)));
    }
  };

  const handleBannerClick = (linkUrl?: string | null) => {
    if (linkUrl) {
      if (linkUrl.startsWith('http://') || linkUrl.startsWith('https://')) {
        window.open(linkUrl, '_blank');
      } else {
        router.push(linkUrl);
      }
    } else {
      router.push('/search');
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#FAF9F6] pb-24">
      
      {/* 1. Search Bar */}
      <div className="px-4 pt-3 pb-2 sticky top-0 bg-[#FAF9F6]/95 backdrop-blur-md z-40">
        <Link 
          href="/search" 
          className="relative flex items-center w-full h-11 bg-white border border-gray-200 rounded-2xl px-3.5 shadow-sm hover:border-[#FF5A36] transition cursor-pointer"
        >
          <Search className="w-4 h-4 text-gray-400 shrink-0" />
          <div className="flex-1 px-3 text-sm text-gray-400 font-medium">Search products, stores and more</div>
        </Link>
      </div>

      {/* 2. Promotional Banners (Uploaded from Admin Panel) */}
      {!isBannersLoading && banners && banners.length > 0 && (
        <div className="py-2.5">
          <div 
            ref={bannerScrollRef}
            onScroll={handleBannerScroll}
            className="flex overflow-x-auto no-scrollbar px-4 gap-3 snap-x snap-mandatory scroll-smooth"
          >
            {banners.map((banner: any, index: number) => (
              <div
                key={banner.id || index}
                onClick={() => handleBannerClick(banner.linkUrl)}
                className="min-w-[88%] sm:min-w-[340px] h-[168px] rounded-3xl bg-[#1C1917] relative overflow-hidden snap-center shrink-0 flex items-center cursor-pointer shadow-md hover:shadow-lg transition-transform active:scale-[0.99] group border border-stone-800"
              >
                {/* Background Media (Image or Video with Autoplay on Mute & Pause on Scroll) */}
                <BannerMediaItem
                  url={banner.imageUrl}
                  alt={banner.title}
                  isActiveSlide={activeBannerIndex === index}
                  className="absolute inset-0 w-full h-full object-cover opacity-75 group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-transparent pointer-events-none" />

                {/* Banner Content */}
                <div className="relative z-10 p-5 flex flex-col items-start max-w-[72%]">
                  {banner.tagline && (
                    <span className="text-[10px] font-extrabold uppercase tracking-wider bg-[#FF5A36] text-white px-2.5 py-0.5 rounded-full mb-1.5 shadow-sm">
                      {banner.tagline}
                    </span>
                  )}
                  <h3 className="text-white text-lg font-bold leading-tight line-clamp-1">{banner.title}</h3>
                  {banner.subtitle && (
                    <p className="text-gray-300 text-xs font-normal mt-1 line-clamp-2 leading-snug">
                      {banner.subtitle}
                    </p>
                  )}
                  <div className="mt-3 inline-flex items-center gap-1.5 bg-white text-gray-900 text-xs font-bold px-3.5 py-1.5 rounded-full shadow-md group-hover:bg-gray-100 transition">
                    <span>{banner.buttonText || 'Shop Now'}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#FF5A36]" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Carousel Dots */}
          {banners.length > 1 && (
            <div className="flex items-center justify-center gap-1.5 mt-3">
              {banners.map((_: any, idx: number) => (
                <div 
                  key={idx}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    activeBannerIndex === idx ? 'w-5 bg-[#FF5A36]' : 'w-1.5 bg-gray-300'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* 3. Trending Searches Chips */}
      {trendingTags.length > 0 && (
        <div className="pt-2 pb-1">
          <div className="flex items-center gap-1.5 px-4 mb-2">
            <TrendingUp className="w-3.5 h-3.5 text-[#FF5A36]" />
            <h2 className="text-xs font-bold text-gray-600 uppercase tracking-wider">Trending Searches</h2>
          </div>
          <div className="flex overflow-x-auto no-scrollbar px-4 gap-2 pb-2">
            {trendingTags.map((tag) => (
              <Link 
                key={tag}
                href={`/search?q=${encodeURIComponent(tag)}`}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-gray-200 bg-white text-gray-800 text-xs font-semibold shrink-0 shadow-2xs hover:border-[#FF5A36] hover:text-[#FF5A36] transition"
              >
                <span>#{tag}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* 4. Sticky Header with Products Count & Sort Options */}
      <div className={cn(
        "flex items-center justify-between px-4 py-3 bg-white border-y border-gray-100 sticky z-30 transition-all duration-300 shadow-2xs",
        isNavVisible ? "top-[58px]" : "top-0"
      )}>
        <div className="flex items-center gap-2">
          <ShoppingBag className="w-4 h-4 text-[#FF5A36]" />
          <span className="text-sm font-bold text-gray-900">
            Explore Products
          </span>
          <span className="text-xs text-gray-500 font-semibold">
            ({products.length})
          </span>
        </div>

        {/* Sort Selector */}
        <div className="relative">
          <button 
            onClick={() => setIsSortOpen(!isSortOpen)}
            className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-xl hover:bg-gray-100 transition"
          >
            <span>{SORT_OPTIONS.find(s => s.id === selectedSort)?.label}</span>
            <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
          </button>

          {isSortOpen && (
            <div className="absolute right-0 top-full mt-1.5 bg-white border border-gray-100 rounded-2xl shadow-xl py-1.5 w-44 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              {SORT_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  onClick={() => {
                    setSelectedSort(option.id);
                    setIsSortOpen(false);
                  }}
                  className="w-full text-left px-3.5 py-2 text-xs font-medium text-gray-700 hover:bg-orange-50 hover:text-[#FF5A36] flex items-center justify-between"
                >
                  <span>{option.label}</span>
                  {selectedSort === option.id && <Check className="w-3.5 h-3.5 text-[#FF5A36]" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 5. Live Product Grid */}
      <div className="px-2 py-3">
        {/* Loading Skeleton */}
        {isProductsLoading && (
          <AdaptiveSkeleton variant="product-grid" count={6} />
        )}

        {/* Real Products */}
        {!isProductsLoading && products.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {products.map((product: any) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isProductsLoading && products.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <div className="w-16 h-16 rounded-full bg-orange-50 text-[#FF5A36] flex items-center justify-center mb-4">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-gray-900">No products available</h3>
            <p className="text-xs text-gray-500 mt-1 max-w-xs">
              Check back soon as local stores and artisans add new products to the catalog.
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
