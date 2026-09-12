'use client';

import React, { useState, useMemo } from 'react';
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
  ChevronRight,
  PackageCheck,
  RotateCcw,
  Loader2,
  Tag
} from 'lucide-react';
import { useGetProductByIdQuery, useToggleWishlistMutation, useAddToCartMutation } from '@/lib/api';
import { addToCart } from '@/lib/features/cartSlice';
import { getMediaUrl, cn } from '@/lib/utils';
import { HeartPlusIcon } from '@/components/ui/HeartPlusIcon';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import Link from 'next/link';

export default function ProductViewClient({ productId }: { productId: string }) {
  const router = useRouter();
  const dispatch = useDispatch();
  const user = useSelector((state: any) => state.auth.user);
  const { data: product, isLoading, isError } = useGetProductByIdQuery(productId);
  const [toggleWishlist, { isLoading: isTogglingWishlist }] = useToggleWishlistMutation();
  const [addToCartAPI] = useAddToCartMutation();

  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [isWishlisted, setIsWishlisted] = useState(false);

  // Computed media list
  const galleryImages = useMemo(() => {
    if (!product) return [];
    const mediaUrls: string[] = [];
    if (product.media && product.media.length > 0) {
      product.media.forEach((m: any) => {
        if (m.url) mediaUrls.push(getMediaUrl(m.url));
      });
    }
    if (product.imageUrl && !mediaUrls.includes(getMediaUrl(product.imageUrl))) {
      mediaUrls.unshift(getMediaUrl(product.imageUrl));
    }
    if (mediaUrls.length === 0) {
      mediaUrls.push('https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800');
    }
    return mediaUrls;
  }, [product]);

  // Selected variant computation
  const variants = product?.variants || [];
  const selectedVariant = useMemo(() => {
    if (!variants || variants.length === 0) return null;
    if (selectedVariantId) {
      return variants.find((v: any) => v.id === selectedVariantId) || variants[0];
    }
    return variants[0];
  }, [variants, selectedVariantId]);

  // Active pricing & stock
  const activePrice = selectedVariant?.price ?? product?.sellingPrice ?? 0;
  const activeMrp = product?.mrp && product.mrp > activePrice ? product.mrp : undefined;
  const discountPercent = activeMrp ? Math.round(((activeMrp - activePrice) / activeMrp) * 100) : 0;
  const inStock = (selectedVariant?.stockCount ?? product?.stockCount ?? 1) > 0;

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
    const itemPayload = {
      id: selectedVariant ? `${product.id}-${selectedVariant.id}` : product.id,
      productId: product.id,
      variantId: selectedVariant?.id,
      name: product.name,
      price: activePrice,
      quantity: 1,
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
    if (product?.id) {
      router.push(`/checkout?productId=${product.id}${selectedVariant?.id ? `&variantId=${selectedVariant.id}` : ''}&quantity=1`);
    } else {
      toast.info('Proceeding to order...');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] bg-white flex flex-col items-center justify-center p-6 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#FF5A36]" />
        <span className="text-xs font-semibold text-gray-500 tracking-wide uppercase">Loading Product...</span>
      </div>
    );
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
    <div className="min-h-screen bg-white pb-24 flex flex-col max-w-lg mx-auto relative shadow-2xl">
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

        {/* Main Image */}
        <img 
          src={galleryImages[activeMediaIndex]} 
          alt={product.name} 
          className="w-full h-full object-cover select-none"
        />

        {/* Pagination Pill */}
        {galleryImages.length > 1 && (
          <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md text-white px-3 py-1 rounded-full text-[11px] font-bold z-10 shadow-sm">
            {activeMediaIndex + 1} / {galleryImages.length}
          </div>
        )}
      </div>

      {/* Thumbnails Row */}
      {galleryImages.length > 1 && (
        <div className="flex gap-2 p-3 bg-white border-b border-gray-100 overflow-x-auto no-scrollbar">
          {galleryImages.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setActiveMediaIndex(idx)}
              className={cn(
                "relative w-16 h-20 shrink-0 rounded-xl overflow-hidden border-2 transition-all shadow-sm",
                activeMediaIndex === idx ? "border-[#FF5A36] scale-105" : "border-gray-200 opacity-70"
              )}
            >
              <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
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
                {store.status === 'VERIFIED' && <CheckCircle className="w-3.5 h-3.5 text-blue-500 fill-blue-50" />}
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

        {/* Pricing */}
        <div className="flex items-baseline gap-2.5 pt-1">
          <span className="text-2xl font-black text-[#171717]">
            ₹{activePrice.toLocaleString('en-IN')}
          </span>
          {activeMrp && (
            <span className="text-sm text-gray-400 line-through font-medium">
              ₹{activeMrp.toLocaleString('en-IN')}
            </span>
          )}
          {discountPercent > 0 && (
            <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full uppercase tracking-wide border border-emerald-200/50">
              {discountPercent}% OFF
            </span>
          )}
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
              return (
                <button
                  key={v.id}
                  onClick={() => setSelectedVariantId(v.id)}
                  className={cn(
                    "px-4 py-2 rounded-xl text-xs font-bold transition-all border shadow-sm flex items-center gap-1.5",
                    isSelected 
                      ? "border-[#FF5A36] text-white bg-[#FF5A36] shadow-orange-100" 
                      : "border-gray-200 text-gray-700 hover:border-gray-300 bg-white"
                  )}
                >
                  <span>{v.name}</span>
                  {v.price && <span className={cn("text-[10px] opacity-80", isSelected ? "text-white" : "text-gray-500")}>₹{v.price}</span>}
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

      {/* 8. Sticky Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-white border-t border-gray-200 px-4 py-3 flex items-center justify-between z-50 shadow-[0_-4px_16px_rgba(0,0,0,0.08)]">
        <div className="flex flex-col pr-3">
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Total Price</span>
          <span className="text-xl font-black text-[#171717]">
            ₹{activePrice.toLocaleString('en-IN')}
          </span>
        </div>

        <div className="flex gap-2 flex-1 justify-end">
          <Button 
            variant="outline" 
            onClick={handleAddToCart}
            disabled={!inStock}
            className="h-12 px-4 rounded-xl border-gray-300 text-gray-800 font-bold hover:bg-gray-50 active:scale-95 transition-transform"
          >
            <ShoppingCart className="w-4 h-4 mr-1.5" />
            <span>Add</span>
          </Button>
          <Button 
            onClick={handleBuyNow}
            disabled={!inStock}
            className="h-12 px-6 rounded-xl bg-[#FF5A36] hover:bg-[#E04B28] text-white font-bold shadow-md shadow-orange-200 active:scale-95 transition-transform flex items-center gap-1.5"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>{inStock ? 'Buy Now' : 'Out of Stock'}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
