'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { 
  ArrowLeft, 
  Share2, 
  Heart, 
  CheckCircle, 
  Truck, 
  Store as StoreIcon, 
  ShieldCheck, 
  Sparkles, 
  ShoppingBag, 
  ShoppingCart, 
  ChevronLeft,
  ChevronRight,
  Play,
  Volume2,
  VolumeX,
  PackageCheck,
  Package,
  RotateCcw,
  Loader2,
  Tag,
  Star,
  ThumbsUp,
  MessageSquare,
  PenLine,
  X
} from 'lucide-react';
import { 
  useGetProductByIdQuery, 
  useToggleWishlistMutation, 
  useAddToCartMutation
} from '@/lib/api';
import { addToCart } from '@/lib/features/cartSlice';
import { getMediaUrl, cn } from '@/lib/utils';
import { HeartPlusIcon } from '@/components/ui/HeartPlusIcon';
import { Button } from '@/components/ui/button';
import { useCurrency } from '@/context/CurrencyContext';
import { toast } from 'sonner';
import Link from 'next/link';
import { recordRecentlyViewed } from '@/lib/services/recentlyViewed';
import { AdaptiveSkeleton } from '@/components/ui/AdaptiveSkeleton';
import { ReviewBottomSheet } from '@/components/ui/ReviewBottomSheet';

export default function ProductViewClient({ productId, initialData }: { productId: string; initialData?: any }) {
  const router = useRouter();
  const dispatch = useDispatch();
  const { formatPrice } = useCurrency();
  const user = useSelector((state: any) => state.auth.user);
  const { data: serverProduct, isLoading: isQueryLoading, isError, refetch: refetchProduct } = useGetProductByIdQuery(productId);
  const product = serverProduct || initialData;
  const isLoading = isQueryLoading && !product;
  const [toggleWishlist, { isLoading: isTogglingWishlist }] = useToggleWishlistMutation();
  const [addToCartAPI] = useAddToCartMutation();

  const sliderRef = useRef<HTMLDivElement>(null);
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [isWishlisted, setIsWishlisted] = useState(false);

  // Review bottom sheet & filter state
  const [isReviewBottomSheetOpen, setIsReviewBottomSheetOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'all' | number>('all');
  const [helpfulReviews, setHelpfulReviews] = useState<Record<string, number>>({});

  // Automatically record product in recently viewed history
  useEffect(() => {
    if (product?.id) {
      recordRecentlyViewed(product.id);
    }
  }, [product?.id]);

  // Computed media list with video and image type identification
  const galleryMedia = useMemo<{ url: string; type: 'IMAGE' | 'VIDEO' }[]>(() => {
    if (!product) return [];
    const items: { url: string; type: 'IMAGE' | 'VIDEO' }[] = [];
    const seenUrls = new Set<string>();

    const isVideoUrl = (u: string, t?: string) => {
      if (t === 'VIDEO') return true;
      const clean = (u || '').toLowerCase();
      return clean.includes('.mp4') || clean.includes('.mov') || clean.includes('.webm') || clean.includes('.m3u8');
    };

    if (product.media && product.media.length > 0) {
      // Sort with primary first, then by displayOrder
      const sortedMedia = [...product.media].sort((a: any, b: any) => {
        if (a.isPrimary && !b.isPrimary) return -1;
        if (!a.isPrimary && b.isPrimary) return 1;
        return (a.displayOrder ?? 0) - (b.displayOrder ?? 0);
      });

      sortedMedia.forEach((m: any) => {
        if (m.url && !seenUrls.has(m.url)) {
          seenUrls.add(m.url);
          items.push({
            url: getMediaUrl(m.url),
            type: isVideoUrl(m.url, m.type) ? 'VIDEO' : 'IMAGE',
          });
        }
      });
    }

    if (product.imageUrl && !seenUrls.has(product.imageUrl)) {
      seenUrls.add(product.imageUrl);
      items.unshift({
        url: getMediaUrl(product.imageUrl),
        type: isVideoUrl(product.imageUrl) ? 'VIDEO' : 'IMAGE',
      });
    }

    return items;
  }, [product]);

  const galleryImages = useMemo(() => galleryMedia.map(m => m.url), [galleryMedia]);

  const handleScroll = () => {
    if (!sliderRef.current) return;
    const scrollLeft = sliderRef.current.scrollLeft;
    const width = sliderRef.current.offsetWidth;
    if (width > 0) {
      const newIndex = Math.round(scrollLeft / width);
      if (newIndex !== activeMediaIndex && newIndex >= 0 && newIndex < galleryMedia.length) {
        setActiveMediaIndex(newIndex);
      }
    }
  };

  const scrollToMedia = (idx: number) => {
    if (!sliderRef.current) return;
    const width = sliderRef.current.offsetWidth;
    sliderRef.current.scrollTo({
      left: idx * width,
      behavior: 'smooth'
    });
    setActiveMediaIndex(idx);
  };

  // Selected variant computation
  const variants = product?.variants || [];
  const selectedVariant = useMemo(() => {
    if (!variants || variants.length === 0) return null;
    if (selectedVariantId) {
      return variants.find((v: any) => v.id === selectedVariantId) || variants[0];
    }
    return variants[0];
  }, [variants, selectedVariantId]);

  // Active pricing & authoritative stock
  const activePrice = selectedVariant?.price ?? product?.sellingPrice ?? 0;
  const activeMrp = product?.mrp && product.mrp > activePrice ? product.mrp : undefined;
  const discountPercent = activeMrp ? Math.round(((activeMrp - activePrice) / activeMrp) * 100) : 0;
  
  const rawStock = selectedVariant?.stockCount ?? product?.stockCount;
  const activeStock = rawStock !== undefined ? Number(rawStock) : undefined;
  const inStock = activeStock !== undefined ? activeStock > 0 : true;
  const isLowStock = inStock && activeStock !== undefined && activeStock > 0 && activeStock <= 5;

  // Cart quantity check to enforce maximum inventory cap
  const cartItems = useSelector((state: any) => state.cart?.items || []);
  const currentCartItem = cartItems.find((i: any) => {
    if (selectedVariant?.id) {
      return (i.productId === product?.id && i.variantId === selectedVariant.id) || i.id === `${product?.id}-${selectedVariant.id}`;
    }
    return i.productId === product?.id || i.id === product?.id;
  });
  const cartQuantity = currentCartItem?.quantity || 0;
  const isMaxInCart = inStock && activeStock !== undefined && cartQuantity >= activeStock;

  const handleShare = async () => {
    if (typeof window === 'undefined') return;
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: product?.name || 'Check out this product on Lokaya',
          url,
        });
      } catch (err) {
        // User cancelled share
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('Product link copied to clipboard!');
    }
  };

  const handleWishlist = async () => {
    if (!product?.id) return;
    if (!user) {
      toast.error('Please sign in to save items to your wishlist');
      router.push('/login');
      return;
    }
    setIsWishlisted(prev => !prev);
    try {
      await toggleWishlist({ productId: product.id }).unwrap();
      toast.success(isWishlisted ? 'Removed from wishlist' : 'Added to wishlist');
    } catch {
      setIsWishlisted(prev => !prev);
    }
  };

  const handleAddToCart = async () => {
    if (!product?.id) return;

    if (!user) {
      toast.error('Please sign in to add items to your cart');
      router.push('/login');
      return;
    }

    if (!inStock) {
      toast.error('This product is currently out of stock');
      return;
    }

    if (isMaxInCart) {
      toast.info(`Maximum available stock (${activeStock} units) is already in your bag`);
      return;
    }

    const itemPayload = {
      id: selectedVariant ? `${product.id}-${selectedVariant.id}` : product.id,
      productId: product.id,
      variantId: selectedVariant?.id,
      name: product.name,
      price: activePrice,
      quantity: 1,
      stockCount: activeStock,
      storeId: product.storeId,
      storeName: product.store?.name,
      image: galleryImages[0],
      variantName: selectedVariant?.name
    };

    dispatch(addToCart(itemPayload));
    toast.success(`${product.name} added to bag!`);

    if (user) {
      try {
        await addToCartAPI({
          productId: product.id,
          variantId: selectedVariant?.id,
          quantity: 1,
        }).unwrap();
      } catch (e) {
        // Optimistic Redux cart updated
      }
    }
  };

  const handleBuyNow = () => {
    if (!user) {
      toast.error('Please sign in to complete your purchase');
      router.push('/login');
      return;
    }

    if (!inStock) {
      toast.error('This product is currently out of stock');
      return;
    }
    if (product?.id) {
      router.push(`/checkout?productId=${product.id}${selectedVariant?.id ? `&variantId=${selectedVariant.id}` : ''}&quantity=1`);
    } else {
      toast.info('Proceeding to order...');
    }
  };

  // Reviews and Ratings Computations
  const reviewsList = useMemo(() => {
    return (product as any)?.reviews || [];
  }, [product?.reviews]);

  const totalReviewsCount = (product as any)?.reviewsCount ?? reviewsList.length;

  const averageRating = useMemo(() => {
    if ((product as any)?.rating !== undefined && (product as any)?.rating !== null && Number((product as any).rating) > 0) {
      return Number((product as any).rating);
    }
    if (reviewsList.length > 0) {
      const sum = reviewsList.reduce((acc: number, cur: any) => acc + (Number(cur.rating) || 0), 0);
      return Number((sum / reviewsList.length).toFixed(1));
    }
    return 5.0;
  }, [product?.rating, reviewsList]);

  const ratingDistribution = useMemo(() => {
    if ((product as any)?.ratingDistribution) {
      return (product as any).ratingDistribution;
    }
    const dist: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviewsList.forEach((r: any) => {
      const star = Math.min(5, Math.max(1, Math.round(r.rating || 5)));
      dist[star] = (dist[star] || 0) + 1;
    });
    return dist;
  }, [product?.ratingDistribution, reviewsList]);

  const filteredReviews = useMemo(() => {
    if (selectedFilter === 'all') return reviewsList;
    return reviewsList.filter((r: any) => Math.round(r.rating) === selectedFilter);
  }, [reviewsList, selectedFilter]);

  const handleToggleHelpful = (reviewId: string) => {
    setHelpfulReviews(prev => ({
      ...prev,
      [reviewId]: (prev[reviewId] || 0) + 1
    }));
    toast.success('Marked as helpful! Thank you.');
  };

  const renderStars = (ratingVal: number, size = "w-3.5 h-3.5") => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = star <= Math.round(ratingVal);
          return (
            <Star
              key={star}
              className={cn(
                size,
                isFilled
                  ? "fill-amber-400 text-amber-500"
                  : "fill-gray-200 text-gray-300"
              )}
            />
          );
        })}
      </div>
    );
  };

  if (isLoading) {
    return <AdaptiveSkeleton variant="product-detail" />;
  }

  if (isError || !product) {
    return (
      <div className="min-h-[100dvh] bg-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-orange-50 border border-orange-100 flex items-center justify-center text-[#FF5A36] mb-4 shadow-sm">
          <PackageCheck className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-[#171717]">Product Not Found</h2>
        <p className="text-xs text-gray-500 max-w-xs mt-1.5 leading-relaxed">
          This product may have been archived, removed, or the link is incorrect.
        </p>
        <div className="mt-6 flex gap-3">
          <Button 
            variant="outline"
            onClick={() => router.back()}
            className="rounded-full px-5 font-bold"
          >
            Go Back
          </Button>
          <Button 
            onClick={() => router.push('/home')}
            className="bg-[#FF5A36] hover:bg-[#E04B28] text-white rounded-full px-5 font-bold shadow-sm"
          >
            Explore Feed
          </Button>
        </div>
      </div>
    );
  }

  const store = product.store;
  const categoryName = product.categoryModel?.name || product.category || 'General';

  return (
    <div className="min-h-screen bg-white pb-36 flex flex-col max-w-lg mx-auto relative shadow-2xl">
      {/* 1. Image Gallery */}
      <div className="relative aspect-[3/4] w-full bg-[#F5F4F0] overflow-hidden">
        {/* Floating Header Actions */}
        <div className="absolute top-4 left-4 right-4 z-20 flex justify-between items-center pointer-events-auto">
          <button 
            onClick={() => router.back()}
            className="h-10 w-10 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center shadow-md active:scale-95 transition-transform"
          >
            <ArrowLeft className="w-5 h-5 text-gray-800" />
          </button>
          
          <div className="flex gap-2">
            <button 
              onClick={handleShare}
              className="h-10 w-10 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center shadow-md active:scale-95 transition-transform"
            >
              <Share2 className="w-4 h-4 text-gray-800" />
            </button>
            <button 
              onClick={handleWishlist}
              disabled={isTogglingWishlist}
              className="h-10 w-10 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center shadow-md active:scale-95 transition-transform text-gray-800 hover:text-rose-500"
            >
              <HeartPlusIcon 
                isSaved={isWishlisted}
                className={cn("w-5 h-5 transition-colors", isWishlisted ? "fill-rose-500 text-rose-500" : "text-gray-800")} 
                strokeWidth={1.8}
              />
            </button>
          </div>
        </div>

        {/* Swipeable / Scrollable Slide Carousel Container */}
        {galleryMedia.length > 0 ? (
          <div 
            ref={sliderRef}
            onScroll={handleScroll}
            className="flex w-full h-full overflow-x-auto snap-x snap-mandatory no-scrollbar touch-pan-y touch-pan-x select-none scroll-smooth"
            style={{ scrollSnapType: 'x mandatory' }}
          >
            {galleryMedia.map((media, idx) => (
              <div 
                key={idx} 
                className="w-full h-full shrink-0 snap-center snap-always relative flex items-center justify-center bg-[#F5F4F0]"
              >
                {media.type === 'VIDEO' ? (
                  <div className="relative w-full h-full bg-black flex items-center justify-center">
                    <video 
                      src={getMediaUrl(media.url)} 
                      playsInline 
                      muted={isMuted}
                      autoPlay={idx === activeMediaIndex}
                      loop
                      className="w-full h-full object-contain"
                    />
                    {/* Sound / Mute toggle */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsMuted(!isMuted);
                      }}
                      className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-md text-white p-2.5 rounded-full z-20 shadow-md hover:bg-black/80 active:scale-95 transition-transform"
                      aria-label={isMuted ? "Unmute video" : "Mute video"}
                    >
                      {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </button>
                  </div>
                ) : (
                  <img 
                    src={getMediaUrl(media.url)} 
                    alt={`${product.name} slide ${idx + 1}`} 
                    className="w-full h-full object-cover select-none"
                    loading={idx === 0 ? "eager" : "lazy"}
                  />
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 text-gray-400 gap-2">
            <Package className="w-16 h-16 stroke-[1.2]" />
            <span className="text-xs font-semibold uppercase tracking-wider">No Image Available</span>
          </div>
        )}

        {/* Floating Left / Right Arrow Buttons */}
        {galleryMedia.length > 1 && (
          <>
            {activeMediaIndex > 0 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  scrollToMedia(activeMediaIndex - 1);
                }}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/85 hover:bg-white backdrop-blur-md text-gray-800 flex items-center justify-center shadow-lg z-20 active:scale-90 transition-all cursor-pointer"
                aria-label="Previous Slide"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            {activeMediaIndex < galleryMedia.length - 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  scrollToMedia(activeMediaIndex + 1);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/85 hover:bg-white backdrop-blur-md text-gray-800 flex items-center justify-center shadow-lg z-20 active:scale-90 transition-all cursor-pointer"
                aria-label="Next Slide"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
          </>
        )}

        {/* Pagination Indicators */}
        {galleryMedia.length > 1 && (
          <>
            {/* Number Pill at Bottom Left */}
            <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md text-white px-3 py-1 rounded-full text-[11px] font-bold z-10 shadow-sm pointer-events-none">
              {activeMediaIndex + 1} / {galleryMedia.length}
            </div>

            {/* Indicator Dots at Bottom Center */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10 bg-black/30 backdrop-blur-xs px-2.5 py-1.5 rounded-full pointer-events-none">
              {galleryMedia.map((_, i) => (
                <div 
                  key={i} 
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-300",
                    activeMediaIndex === i ? "w-4 bg-white" : "w-1.5 bg-white/50"
                  )}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Thumbnails Row */}
      {galleryMedia.length > 1 && (
        <div className="flex gap-2.5 p-3 bg-white border-b border-gray-100 overflow-x-auto no-scrollbar">
          {galleryMedia.map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => scrollToMedia(idx)}
              className={cn(
                "relative w-16 h-20 shrink-0 rounded-xl overflow-hidden border-2 transition-all shadow-xs cursor-pointer",
                activeMediaIndex === idx 
                  ? "border-[#FF5A36] ring-2 ring-[#FF5A36]/30 scale-105" 
                  : "border-gray-200 opacity-60 hover:opacity-100"
              )}
            >
              {item.type === 'VIDEO' ? (
                <div className="relative w-full h-full bg-gray-900 flex items-center justify-center">
                  <video 
                    src={getMediaUrl(item.url)} 
                    muted 
                    playsInline 
                    preload="metadata" 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
                    <div className="w-6 h-6 rounded-full bg-white/90 backdrop-blur-xs flex items-center justify-center shadow-xs">
                      <Play className="w-3 h-3 text-[#FF5A36] fill-[#FF5A36] ml-0.5" />
                    </div>
                  </div>
                </div>
              ) : (
                <img 
                  src={getMediaUrl(item.url)} 
                  alt={`Thumbnail ${idx + 1}`} 
                  className="w-full h-full object-cover" 
                />
              )}
            </button>
          ))}
        </div>
      )}

      {/* 2. Store Info Header */}
      {store && (
        <Link 
          href={`/store/${store.id}`}
          className="flex items-center justify-between py-3.5 px-4 border-b border-gray-100 bg-[#FAFAFA] hover:bg-gray-100 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full overflow-hidden border border-gray-200 bg-white p-0.5 flex items-center justify-center shrink-0">
              {store.logoUrl ? (
                <img src={getMediaUrl(store.logoUrl)} alt={store.name} className="w-full h-full rounded-full object-cover" />
              ) : (
                <div className="w-full h-full rounded-full bg-orange-100 text-[#FF5A36] font-bold text-xs flex items-center justify-center">
                  {store.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-[#171717] text-[14px] leading-tight">{store.name}</h3>
                {Boolean(store.isVerified) && <CheckCircle className="w-3.5 h-3.5 text-blue-500 fill-blue-500 text-white animate-in zoom-in duration-300" />}
              </div>
              <p className="text-[11px] text-gray-500 mt-0.5">
                {store.city || store.address || 'Local Merchant'} • <span className="font-semibold text-emerald-600">Verified Seller</span>
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-1 text-xs font-bold text-[#FF5A36]">
            <span>Visit Store</span>
            <ChevronRight className="w-4 h-4" />
          </div>
        </Link>
      )}

      {/* 3. Title, Price & Category */}
      <div className="p-4 border-b border-gray-100 space-y-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-orange-50 text-[#FF5A36] uppercase tracking-wider">
            <Tag className="w-3 h-3" />
            {categoryName}
          </span>
          {product.sku && (
            <span className="text-[11px] font-mono text-gray-400">
              SKU: {product.sku}
            </span>
          )}
        </div>

        <h1 className="text-xl md:text-2xl font-black text-[#171717] leading-tight">
          {product.name}
        </h1>

        {/* Customer Rating Summary Badge */}
        <div className="flex items-center gap-2 flex-wrap pt-0.5">
          <button
            type="button"
            onClick={() => {
              const el = document.getElementById('customer-reviews-section');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50/90 hover:bg-amber-100 border border-amber-200/80 transition-all cursor-pointer group shadow-2xs active:scale-98"
          >
            <div className="flex items-center gap-1 text-amber-500">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
              <span className="font-black text-xs text-gray-900 leading-none">
                {averageRating.toFixed(1)}
              </span>
            </div>
            <span className="text-[11px] text-gray-500 font-medium leading-none">
              ({totalReviewsCount} {totalReviewsCount === 1 ? 'review' : 'reviews'})
            </span>
            <span className="text-[10px] font-bold text-amber-700 group-hover:underline ml-0.5 flex items-center">
              See reviews &darr;
            </span>
          </button>

          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
            <CheckCircle className="w-3 h-3 text-emerald-600" />
            Verified Ratings
          </span>
        </div>

        {/* Pricing & Stock Status */}
        <div className="flex items-baseline gap-2.5 pt-1 flex-wrap">
          <span className="text-2xl font-black text-[#171717]">
            {formatPrice(activePrice)}
          </span>
          {activeMrp && activeMrp > activePrice && (
            <span className="text-sm text-gray-400 line-through font-medium">
              {formatPrice(activeMrp)}
            </span>
          )}
          {discountPercent > 0 && (
            <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full uppercase tracking-wide border border-emerald-200/50">
              {discountPercent}% OFF
            </span>
          )}
          {!inStock ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#171717] text-white tracking-wider uppercase border border-white/20 shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
              OUT OF STOCK
            </span>
          ) : isLowStock ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-orange-50 text-[#FF5A36] border border-orange-200">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF5A36] animate-pulse"></span>
              Only {activeStock} left!
            </span>
          ) : null}
        </div>

        <div className="flex items-center gap-1 text-[11px] text-[#208b5e] font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          Inclusive of all applicable local taxes
        </div>
      </div>

      {/* 4. Product Variants (Sizes / Colors / Options) */}
      {variants.length > 0 && (
        <div className="p-4 border-b border-gray-100 space-y-3">
          <h4 className="text-sm font-bold text-gray-900">
            Select Option / Variant: <span className="text-[#FF5A36] ml-1">{selectedVariant?.name || 'Default'}</span>
          </h4>
          <div className="flex flex-wrap gap-2">
            {variants.map((v: any) => {
              const isSelected = (selectedVariant?.id === v.id);
              const variantStock = v.stockCount !== undefined ? Number(v.stockCount) : undefined;
              const isVariantOOS = variantStock !== undefined && variantStock <= 0;
              return (
                <button
                  key={v.id}
                  onClick={() => setSelectedVariantId(v.id)}
                  className={cn(
                    "px-4 py-2 rounded-xl text-xs font-bold transition-all border shadow-sm flex items-center gap-1.5",
                    isSelected 
                      ? "border-[#FF5A36] text-white bg-[#FF5A36] shadow-orange-100" 
                      : isVariantOOS
                      ? "border-gray-200 text-gray-400 bg-gray-50/80"
                      : "border-gray-200 text-gray-700 hover:border-gray-300 bg-white"
                  )}
                >
                  <span className={isVariantOOS ? "line-through opacity-70" : ""}>{v.name}</span>
                  {v.price && <span className={cn("text-[10px] opacity-80", isSelected ? "text-white" : "text-gray-500")}>{formatPrice(v.price)}</span>}
                  {isVariantOOS && (
                    <span className={cn("text-[9px] font-extrabold uppercase px-1 py-0.2 rounded", isSelected ? "bg-black/25 text-white" : "bg-gray-200 text-gray-500")}>
                      Sold out
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. Fulfillment & Delivery Options */}
      <div className="p-4 border-b border-gray-100 space-y-3 bg-[#FAF9F6]">
        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Fulfillment Options</h4>
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-white rounded-xl border border-gray-200 flex items-start gap-2.5 shadow-sm">
            <div className="w-8 h-8 rounded-lg bg-green-50 text-green-600 flex items-center justify-center shrink-0">
              <Truck className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-xs text-gray-900">Home Delivery</p>
              <p className="text-[10px] text-gray-500 mt-0.5">
                {product.isAvailableForDelivery ? 'Available at checkout' : 'Unavailable'}
              </p>
            </div>
          </div>

          <div className="p-3 bg-white rounded-xl border border-gray-200 flex items-start gap-2.5 shadow-sm">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <StoreIcon className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-xs text-gray-900">Store Pickup</p>
              <p className="text-[10px] text-gray-500 mt-0.5">
                {product.isAvailableForPickup ? 'Instant pickup in store' : 'Unavailable'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 6. Product Description */}
      <div className="p-4 border-b border-gray-100 space-y-2">
        <h3 className="font-bold text-gray-900 text-sm">Product Description</h3>
        <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-line">
          {product.description || 'High quality product available directly from the verified merchant store.'}
        </p>
      </div>

      {/* 7. Trust Badges */}
      <div className="p-4 border-b border-gray-100 grid grid-cols-3 gap-2 text-center bg-gray-50/50">
        <div className="p-3 flex flex-col items-center">
          <ShieldCheck className="w-5 h-5 text-emerald-600 mb-1" />
          <span className="text-[11px] font-bold text-gray-900">100% Genuine</span>
          <span className="text-[9px] text-gray-500">Direct from store</span>
        </div>
        <div className="p-3 flex flex-col items-center border-x border-gray-100">
          <StoreIcon className="w-5 h-5 text-[#FF5A36] mb-1" />
          <span className="text-[11px] font-bold text-gray-900">Local Merchant</span>
          <span className="text-[9px] text-gray-500">Verified seller</span>
        </div>
        <div className="p-3 flex flex-col items-center">
          <RotateCcw className="w-5 h-5 text-blue-600 mb-1" />
          <span className="text-[11px] font-bold text-gray-900">Easy Support</span>
          <span className="text-[9px] text-gray-500">Chat with store</span>
        </div>
      </div>

      {/* 8. Customer Reviews & Ratings Section */}
      <div id="customer-reviews-section" className="p-4 border-b border-gray-100 space-y-5 bg-white scroll-mt-4">
        {/* Section Title & Write Review Button */}
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base md:text-lg font-black text-gray-900 tracking-tight">Customer Reviews</h2>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200">
                {totalReviewsCount}
              </span>
            </div>
            <p className="text-[11px] text-gray-500 mt-0.5">Real verified ratings & comments</p>
          </div>
          
          <Button
            size="sm"
            onClick={() => {
              if (!user) {
                toast.error('Please sign in to write a review');
                router.push('/login');
                return;
              }
              setIsReviewBottomSheetOpen(true);
            }}
            className="rounded-xl bg-[#FF5A36] hover:bg-[#E04B28] text-white text-xs font-bold shadow-xs flex items-center gap-1.5 h-9 px-3.5 transition-transform active:scale-95 cursor-pointer"
          >
            <PenLine className="w-3.5 h-3.5" />
            <span>Write a Review</span>
          </Button>
        </div>

        {/* Rating Overview Scorecard */}
        <div className="p-4 rounded-2xl bg-[#FAF9F6] border border-gray-100/90 flex flex-col sm:flex-row gap-4 items-center">
          {/* Big Score Card */}
          <div className="flex flex-col items-center justify-center sm:pr-5 sm:border-r border-gray-200/80 min-w-[130px] text-center">
            <span className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight leading-none">
              {averageRating.toFixed(1)}
            </span>
            <div className="mt-2 flex items-center gap-0.5">
              {renderStars(averageRating, "w-4 h-4")}
            </div>
            <span className="text-[11px] text-gray-500 font-medium mt-1.5">
              Based on {totalReviewsCount} {totalReviewsCount === 1 ? 'review' : 'reviews'}
            </span>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full mt-1.5 border border-emerald-200/60">
              100% Recommended
            </span>
          </div>

          {/* Star Breakdown Bars */}
          <div className="flex-1 w-full space-y-2">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = (ratingDistribution as any)?.[star] || 0;
              const percent = totalReviewsCount > 0 ? Math.round((count / totalReviewsCount) * 100) : 0;
              return (
                <div key={star} className="flex items-center gap-2 text-xs">
                  <div className="flex items-center gap-1 w-8 text-gray-700 font-semibold shrink-0">
                    <span>{star}</span>
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  </div>
                  <div className="flex-1 h-2 bg-gray-200/70 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-400 rounded-full transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <span className="text-[11px] text-gray-400 w-8 text-right font-medium shrink-0">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Filter Chips */}
        {reviewsList.length > 0 && (
          <div className="flex gap-2 overflow-x-auto no-scrollbar py-0.5">
            <button
              onClick={() => setSelectedFilter('all')}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-bold transition-all whitespace-nowrap shrink-0 border cursor-pointer",
                selectedFilter === 'all'
                  ? "bg-gray-900 text-white border-gray-900"
                  : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
              )}
            >
              All ({reviewsList.length})
            </button>
            {[5, 4, 3, 2, 1].map((star) => {
              const count = (ratingDistribution as any)?.[star] || 0;
              if (count === 0 && selectedFilter !== star) return null;
              return (
                <button
                  key={star}
                  onClick={() => setSelectedFilter(selectedFilter === star ? 'all' : star)}
                  className={cn(
                    "px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1 whitespace-nowrap shrink-0 border cursor-pointer",
                    selectedFilter === star
                      ? "bg-amber-500 text-white border-amber-500 shadow-xs"
                      : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                  )}
                >
                  <span>{star}</span>
                  <Star className={cn("w-3 h-3", selectedFilter === star ? "fill-white text-white" : "fill-amber-400 text-amber-400")} />
                  <span>({count})</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Reviews List */}
        <div className="space-y-3 pt-1">
          {filteredReviews.length > 0 ? (
            filteredReviews.map((rev: any) => {
              const helpfulCount = (helpfulReviews[rev.id] || 0);
              const authorName = rev.user?.name || 'Verified Customer';
              const authorAvatar = rev.user?.avatarUrl;
              const formattedDate = rev.createdAt 
                ? new Date(rev.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                : 'Recently';

              return (
                <div 
                  key={rev.id} 
                  className="p-4 rounded-2xl border border-gray-100 bg-[#FAFAFA] space-y-2.5 shadow-2xs hover:border-gray-200 transition-colors"
                >
                  {/* Reviewer Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-tr from-orange-400 to-amber-500 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                        {authorAvatar ? (
                          <img src={getMediaUrl(authorAvatar)} alt={authorName} className="w-full h-full object-cover" />
                        ) : (
                          authorName.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-bold text-gray-900 leading-none">{authorName}</span>
                          <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded-full border border-emerald-200/60">
                            <CheckCircle className="w-2.5 h-2.5 text-emerald-600" />
                            Verified Buyer
                          </span>
                        </div>
                        <span className="text-[10px] text-gray-400 font-medium">{formattedDate}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-0.5 shrink-0">
                      {renderStars(rev.rating, "w-3 h-3")}
                    </div>
                  </div>

                  {/* Review Text */}
                  {rev.comment && (
                    <p className="text-xs text-gray-700 leading-relaxed pl-0.5">
                      {rev.comment}
                    </p>
                  )}

                  {/* Helpful Action */}
                  <div className="flex items-center justify-between pt-1.5 border-t border-gray-100/80 text-[11px] text-gray-500">
                    <span className="text-[10px] text-gray-400">Direct Store Purchase</span>
                    <button
                      type="button"
                      onClick={() => handleToggleHelpful(rev.id)}
                      className={cn(
                        "flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer active:scale-95",
                        helpfulCount > 0
                          ? "text-emerald-700 bg-emerald-50 border border-emerald-200/50"
                          : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                      )}
                    >
                      <ThumbsUp className="w-3 h-3" />
                      <span>Helpful {helpfulCount > 0 ? `(${helpfulCount})` : ''}</span>
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200 space-y-2">
              <MessageSquare className="w-8 h-8 text-gray-400 mx-auto stroke-[1.5]" />
              <p className="text-xs font-bold text-gray-700">No reviews found for this filter</p>
              <p className="text-[11px] text-gray-500">Try selecting 'All' or be the first to leave a review!</p>
            </div>
          )}
        </div>
      </div>

      {/* 9. Sticky Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-white border-t border-gray-200 px-4 py-3 flex items-center justify-between z-50 shadow-[0_-4px_16px_rgba(0,0,0,0.08)]">
        <div className="flex flex-col pr-3">
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Total Price</span>
          <span className="text-xl font-black text-[#171717]">
            {formatPrice(activePrice)}
          </span>
        </div>

        <div className="flex gap-2 flex-1 justify-end">
          <Button 
            variant="outline" 
            onClick={handleAddToCart}
            disabled={!inStock || isMaxInCart}
            className={cn(
              "h-12 px-4 rounded-xl border-gray-300 font-bold transition-transform",
              (!inStock || isMaxInCart)
                ? "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200"
                : "text-gray-800 hover:bg-gray-50 active:scale-95"
            )}
          >
            <ShoppingCart className="w-4 h-4 mr-1.5" />
            <span>{!inStock ? 'Out of Stock' : isMaxInCart ? 'Max in Bag' : 'Add'}</span>
          </Button>
          <Button 
            onClick={handleBuyNow}
            disabled={!inStock}
            className={cn(
              "h-12 px-6 rounded-xl font-bold shadow-md transition-transform flex items-center gap-1.5",
              !inStock
                ? "bg-gray-300 text-gray-500 cursor-not-allowed shadow-none"
                : "bg-[#FF5A36] hover:bg-[#E04B28] text-white shadow-orange-200 active:scale-95"
            )}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>{inStock ? 'Buy Now' : 'Out of Stock'}</span>
          </Button>
        </div>
      </div>

      {/* Review Bottom Sheet Drawer */}
      {product && (
        <ReviewBottomSheet
          isOpen={isReviewBottomSheetOpen}
          onClose={() => setIsReviewBottomSheetOpen(false)}
          productId={product.id}
          productName={product.name}
          productImage={galleryMedia[0]?.url || product.imageUrl}
          storeId={product.storeId}
          storeName={product.store?.name}
          onReviewSubmitted={() => {
            if (refetchProduct) refetchProduct();
          }}
        />
      )}
    </div>
  );
}
