'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Star, Package } from 'lucide-react';
import { HeartPlusIcon } from '@/components/ui/HeartPlusIcon';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart, updateQuantity, removeFromCart } from '@/lib/features/cartSlice';
import { useGetWishlistQuery, useToggleWishlistMutation, useAddToCartMutation } from '@/lib/api';
import { useCurrency } from '@/context/CurrencyContext';
import { RootState } from '@/lib/store';
import { getMediaUrl } from '@/lib/utils';
import { toast } from 'sonner';

export interface ProductCardProps {
  product: {
    id: string;
    title?: string;
    name?: string;
    brand?: string;
    brandId?: string;
    storeId?: string;
    image?: string;
    imageUrl?: string;
    primaryImage?: string;
    price?: string | number;
    sellingPrice?: number;
    originalPrice?: string | number;
    mrp?: number;
    discount?: string;
    discountLabel?: string;
    tag?: { text: string; bg: string };
    store?: { id?: string; name?: string; handle?: string; isVerified?: boolean; logoUrl?: string };
    rating?: string | number;
    reviews?: string | number;
    stockCount?: number;
    variants?: any[];
  };
  isPreview?: boolean;
}

export function ProductCard({ product, isPreview = false }: ProductCardProps) {
  const router = useRouter();
  const dispatch = useDispatch();
  const { formatPrice } = useCurrency();
  const cartItems = useSelector((state: RootState) => state.cart.items);
  const user = useSelector((state: RootState) => (state as any).auth?.user);
  const [addToCartAPI] = useAddToCartMutation();
  const [imageError, setImageError] = useState(false);

  const rawImage = product.image || product.primaryImage || product.imageUrl || '';

  useEffect(() => {
    setImageError(false);
  }, [rawImage]);

  const rawTitle = product.title || product.name || '';

  const variants = product.variants;
  const hasVariantsList = Array.isArray(variants) && variants.length > 0;

  // Selling price (the actual customer price)
  let priceValue = typeof product.sellingPrice === 'number' && product.sellingPrice > 0
    ? product.sellingPrice
    : (typeof product.price === 'number' && product.price > 0
      ? product.price
      : parseFloat(String(product.price || product.sellingPrice || '0').replace(/[^0-9.]/g, '')) || 0);

  if (priceValue <= 0 && hasVariantsList) {
    const firstVariantPrice = Number(variants[0]?.price) || 0;
    if (firstVariantPrice > 0) {
      priceValue = firstVariantPrice;
    }
  }

  // MRP (the showing reference price before discount)
  const mrpValue = typeof product.mrp === 'number' && product.mrp > 0
    ? product.mrp
    : (typeof product.originalPrice === 'number' && product.originalPrice > 0
      ? product.originalPrice
      : (product.originalPrice ? parseFloat(String(product.originalPrice).replace(/[^0-9.]/g, '')) : undefined));

  const hasDiscount = mrpValue !== undefined && mrpValue > priceValue;
  const discountPercent = hasDiscount 
    ? Math.round(((mrpValue - priceValue) / mrpValue) * 100) 
    : 0;
  const displayDiscount = discountPercent > 0 
    ? `${discountPercent}% OFF` 
    : (product.discount || product.discountLabel || undefined);

  // Rating average and review count calculation
  let numericRating = 0;
  if (typeof product.rating === 'number' && !isNaN(product.rating)) {
    numericRating = product.rating;
  } else if (product.rating) {
    numericRating = parseFloat(String(product.rating)) || 0;
  } else if (Array.isArray(product.reviews) && product.reviews.length > 0) {
    const sum = product.reviews.reduce((acc: number, r: any) => acc + (Number(r.rating) || 0), 0);
    numericRating = sum / product.reviews.length;
  }

  let totalReviewsCount = 0;
  if ((product as any).reviewsCount !== undefined && (product as any).reviewsCount !== null) {
    totalReviewsCount = Number((product as any).reviewsCount) || 0;
  } else if (Array.isArray(product.reviews)) {
    totalReviewsCount = product.reviews.length;
  } else if (product.reviews) {
    totalReviewsCount = parseInt(String(product.reviews).replace(/[()]/g, '')) || 0;
  }

  // Stock calculations & edge-case guards (supporting variants fallback)
  let stockCount = (product as any).stockCount !== undefined && (product as any).stockCount !== null && (product as any).stockCount !== ''
    ? Number((product as any).stockCount)
    : undefined;

  if ((stockCount === undefined || isNaN(stockCount) || stockCount <= 0) && hasVariantsList) {
    const totalVariantStock = variants.reduce((sum: number, v: any) => sum + (Number(v?.stockCount) || 0), 0);
    if (totalVariantStock > 0 || stockCount === undefined) {
      stockCount = totalVariantStock;
    }
  }

  const isOutOfStock = stockCount !== undefined && stockCount <= 0;
  const isLowStock = stockCount !== undefined && stockCount > 0 && stockCount <= 5;

  // Find if item is already in cart to show count or just "Add"
  const cartItem = cartItems.find(item => item.id === product.id || item.productId === product.id);
  const quantity = cartItem?.quantity || 0;
  const canIncrease = stockCount === undefined || quantity < stockCount;

  const { data: wishlistData } = useGetWishlistQuery(undefined, { skip: false });
  const [toggleWishlist] = useToggleWishlistMutation();

  const isSaved = wishlistData?.data?.some((item: any) => item.productId === product.id);

  const handleToggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast.error('Please sign in to save items to your wishlist');
      router.push('/login');
      return;
    }

    if (isPreview) {
      toast.info('Preview mode: Wishlist is disabled');
      return;
    }
    try {
      await toggleWishlist({ productId: product.id }).unwrap();
    } catch (error) {
      console.error('Failed to toggle wishlist', error);
    }
  };

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast.error('Please sign in to add items to your cart');
      router.push('/login');
      return;
    }

    if (isPreview) {
      toast.info('Preview mode: Add to bag is disabled');
      return;
    }

    if (isOutOfStock) {
      toast.error('This product is currently out of stock');
      return;
    }

    if (!canIncrease) {
      toast.info(`Maximum available stock reached (${stockCount} in bag)`);
      return;
    }
    
    dispatch(addToCart({
      id: product.id,
      productId: product.id,
      name: rawTitle,
      price: priceValue,
      originalPrice: mrpValue,
      quantity: 1,
      storeId: product.store?.id || (product as any).storeId || '',
      storeName: product.store?.name || '',
      image: rawImage,
      stockCount: stockCount,
    } as any));
    toast.success(`${rawTitle} added to bag!`);

    if (user && product.id) {
      try {
        await addToCartAPI({
          productId: product.id,
          quantity: 1,
        }).unwrap();
      } catch (err: any) {
        console.warn('[ProductCard] Failed to sync addToCart with backend:', err);
      }
    }
  };

  return (
    <Link 
      href={isPreview ? '#' : `/product/${product.id}`} 
      onClick={(e) => {
        if (isPreview) {
          e.preventDefault();
          e.stopPropagation();
        }
      }}
      className="flex flex-col bg-white rounded-2xl p-2 border border-[#E5E2DC] shadow-xs hover:shadow-md hover:border-gray-300 transition-all duration-300 relative group cursor-pointer"
    >
      {/* 1. Product Image Container with Badges */}
      <div className="relative aspect-square w-full rounded-xl bg-[#FAF9F6] border border-[#E5E2DC] overflow-hidden">
        {rawImage && !imageError ? (
          <img 
            src={getMediaUrl(rawImage)} 
            alt={rawTitle || 'Product'} 
            onError={() => setImageError(true)}
            className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${isOutOfStock ? 'grayscale-[25%] opacity-85' : ''}`}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 text-gray-400 select-none">
            <Package className="w-10 h-10 stroke-[1.2] opacity-40 mb-1" />
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">No Image</span>
          </div>
        )}
        
        {/* Out of stock or low stock badge */}
        {isOutOfStock ? (
          <div className="absolute top-2 left-2 bg-[#171717]/95 backdrop-blur-md text-white text-[9px] font-black px-2 py-0.5 rounded shadow-sm tracking-wider uppercase z-10 border border-white/20">
            OUT OF STOCK
          </div>
        ) : isLowStock ? (
          <div className="absolute top-2 left-2 bg-[#FF5A36] text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow-xs tracking-wider uppercase z-10">
            Only {stockCount} left
          </div>
        ) : product.tag ? (
          <div className={`absolute top-2 left-2 ${product.tag.bg || 'bg-[#FF5A36]'} text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded shadow-xs tracking-wider uppercase z-10`}>
            {product.tag.text}
          </div>
        ) : null}
        
        {/* Wishlist Button (Top-Right) */}
        <button 
          onClick={handleToggleWishlist} 
          className="absolute top-2 right-2 w-7 h-7 z-10 bg-white/95 backdrop-blur-xs rounded-full hover:bg-white transition-all shadow-xs flex items-center justify-center text-gray-800 hover:text-rose-500 active:scale-90 border border-gray-100"
          aria-label="Save to Wishlist"
        >
          <HeartPlusIcon 
            isSaved={isSaved} 
            className={`w-4 h-4 transition-colors ${isSaved ? 'text-rose-500 fill-rose-500' : 'text-gray-800'}`} 
            strokeWidth={1.8} 
          />
        </button>

        {/* Rating Pill (Bottom-Left) - Shows rating average and total number of ratings */}
        <div className="absolute bottom-2 left-2 bg-white/95 backdrop-blur-xs border border-[#E5E2DC] rounded-md px-1.5 py-0.5 flex items-center gap-1 shadow-2xs z-10 pointer-events-none">
          <span className="font-extrabold text-[#171717] text-[11px] leading-none tabular-nums">
            {numericRating > 0 ? numericRating.toFixed(1) : '0.0'}
          </span>
          <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-500" />
          <span className="text-[10px] text-gray-500 font-medium leading-none">
            ({totalReviewsCount})
          </span>
        </div>

      </div>
      
      {/* 2. Product Details */}
      <div className="pt-2 px-0.5 flex flex-col flex-1">
        {/* Product Title */}
        <p className="text-xs sm:text-[13px] leading-tight text-gray-800 font-medium truncate group-hover:text-[#FF5A36] transition-colors">
          {rawTitle}
        </p>

        {/* Price Row: Selling Price (actual), MRP (showing price strikethrough), Discount % */}
        <div className="flex items-baseline gap-1.5 mt-1.5 flex-wrap">
          <span className="text-sm sm:text-[15px] font-extrabold text-[#171717] tabular-nums leading-none">
            {formatPrice(priceValue)}
          </span>
          {hasDiscount && mrpValue && (
            <span className="text-[11px] sm:text-xs text-gray-400 line-through font-normal tabular-nums leading-none">
              {formatPrice(mrpValue)}
            </span>
          )}
          {displayDiscount && (
            <span className="text-[10px] sm:text-[11px] font-extrabold text-[#FF5A36] tracking-tight leading-none bg-orange-50 px-1.5 py-0.5 rounded border border-orange-100">
              {displayDiscount}
            </span>
          )}
        </div>

        {/* Add to Cart Stepper / Button */}
        <div className="w-full mt-2.5">
          {isOutOfStock ? (
            <button 
              disabled
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              className="w-full h-8 px-3 bg-gray-100/90 border border-[#E5E2DC] text-gray-400 font-bold text-xs rounded-xl cursor-not-allowed flex items-center justify-center select-none shadow-2xs"
            >
              Out of Stock
            </button>
          ) : isPreview ? (
            <div 
              className="w-full h-8 px-3 bg-white border border-[#FF5A36] text-[#FF5A36] font-bold text-xs rounded-xl flex items-center justify-center shadow-2xs select-none"
            >
              ADD
            </div>
          ) : quantity > 0 ? (
            <div 
              className="flex items-center justify-between bg-[#FF5A36] text-white rounded-xl h-8 w-full shadow-xs overflow-hidden" 
              onClick={(e) => e.preventDefault()}
            >
              <button 
                className="w-8 h-full flex items-center justify-center hover:bg-black/15 active:bg-black/25 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  if (quantity > 1) {
                    dispatch(updateQuantity({ id: product.id, quantity: quantity - 1 }));
                  } else {
                    dispatch(removeFromCart(product.id));
                  }
                }}
              >
                <span className="text-base font-bold leading-none mb-0.5">-</span>
              </button>
              <span className="font-bold text-xs">{quantity}</span>
              <button 
                disabled={!canIncrease}
                className={`w-8 h-full flex items-center justify-center transition-colors ${
                  !canIncrease 
                    ? 'opacity-30 cursor-not-allowed bg-black/20' 
                    : 'hover:bg-black/15 active:bg-black/25'
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!canIncrease) {
                    toast.info(`Maximum available stock reached (${stockCount} in bag)`);
                    return;
                  }
                  handleAddToCart(e);
                }}
                title={!canIncrease ? `Max stock reached (${stockCount})` : 'Add one more'}
              >
                <span className="text-base font-bold leading-none mb-0.5">+</span>
              </button>
            </div>
          ) : (
            <button 
              onClick={handleAddToCart}
              className="w-full h-8 px-3 bg-white border border-[#FF5A36] text-[#FF5A36] hover:bg-[#FF5A36] hover:text-white font-bold text-xs rounded-xl transition-all active:scale-95 flex items-center justify-center shadow-xs"
            >
              ADD
            </button>
          )}
        </div>
      </div>
    </Link>
  );
}
