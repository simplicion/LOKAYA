'use client';

import React from 'react';
import Link from 'next/link';
import { Star } from 'lucide-react';
import { HeartPlusIcon } from '@/components/ui/HeartPlusIcon';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart } from '@/lib/features/cartSlice';
import { useGetWishlistQuery, useToggleWishlistMutation } from '@/lib/api';
import { RootState } from '@/lib/store';
import { getMediaUrl } from '@/lib/utils';

export interface ProductCardProps {
  product: {
    id: string;
    title?: string;
    name?: string;
    brand?: string;
    brandId?: string;
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
    store?: { id?: string; name?: string; isVerified?: boolean };
    rating?: string | number;
    reviews?: string | number;
  };
}

export function ProductCard({ product }: ProductCardProps) {
  const dispatch = useDispatch();
  const cartItems = useSelector((state: RootState) => state.cart.items);
  
  const brandOrStore = product.brand || product.store?.name;
  const rawTitle = product.title || product.name || '';
  const displayTitle = brandOrStore && rawTitle.toLowerCase().startsWith(brandOrStore.toLowerCase())
    ? rawTitle.slice(brandOrStore.length).trim() || rawTitle
    : rawTitle;

  const rawImage = product.image || product.primaryImage || product.imageUrl || '';
  const priceValue = typeof product.price === 'number' 
    ? product.price 
    : (typeof product.sellingPrice === 'number' ? product.sellingPrice : parseFloat(String(product.price || '0').replace(/,/g, '')) || 0);
  const formattedPrice = priceValue.toLocaleString('en-IN');

  const originalPriceValue = typeof product.originalPrice === 'number' 
    ? product.originalPrice 
    : (typeof product.mrp === 'number' ? product.mrp : (product.originalPrice ? parseFloat(String(product.originalPrice).replace(/,/g, '')) : undefined));
  const formattedOriginalPrice = originalPriceValue ? originalPriceValue.toLocaleString('en-IN') : undefined;

  const discount = product.discount || product.discountLabel || (originalPriceValue && originalPriceValue > priceValue ? `${Math.round(((originalPriceValue - priceValue) / originalPriceValue) * 100)}% off` : undefined);
  const rating = product.rating ? String(product.rating) : null;
  const reviewsCount = product.reviews ? String(product.reviews).replace(/[()]/g, '') : null;

  // Find if item is already in cart to show count or just "Add"
  const cartItem = cartItems.find(item => item.id === product.id);
  const quantity = cartItem?.quantity || 0;

  const { data: wishlistData } = useGetWishlistQuery(undefined, { skip: false });
  const [toggleWishlist] = useToggleWishlistMutation();

  const isSaved = wishlistData?.data?.some((item: any) => item.productId === product.id);

  const handleToggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await toggleWishlist({ productId: product.id }).unwrap();
    } catch (error) {
      console.error('Failed to toggle wishlist', error);
    }
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    dispatch(addToCart({
      id: product.id,
      name: rawTitle,
      price: priceValue,
      quantity: 1,
      storeId: product.store?.id || (product as any).storeId || ''
    }));
  };

  return (
    <Link href={`/product/${product.id}`} className="flex flex-col bg-white rounded-2xl p-1.5 border border-gray-100/90 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:shadow-md transition-all duration-300 relative group cursor-pointer">
      {/* 1. Product Image Container with Badges */}
      <div className="relative aspect-square w-full rounded-xl bg-[#F8F8F8] border border-gray-100 overflow-hidden">
        <img 
          src={getMediaUrl(rawImage)} 
          alt={rawTitle} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
        />
        
        {/* Custom Tag (if present) */}
        {product.tag && (
          <div className={`absolute top-2 left-2 ${product.tag.bg || 'bg-[#FF5A36]'} text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded shadow-xs tracking-wider uppercase z-10`}>
            {product.tag.text}
          </div>
        )}
        
        {/* Wishlist Button (Top-Right) */}
        <button 
          onClick={handleToggleWishlist} 
          className="absolute top-2 right-2 w-7 h-7 z-10 bg-white/95 backdrop-blur-xs rounded-full hover:bg-white transition-all shadow-xs flex items-center justify-center text-gray-800 hover:text-rose-500 active:scale-90"
          aria-label="Save to Wishlist"
        >
          <HeartPlusIcon 
            isSaved={isSaved} 
            className={`w-4 h-4 transition-colors ${isSaved ? 'text-rose-500 fill-rose-500' : 'text-gray-800'}`} 
            strokeWidth={1.8} 
          />
        </button>

        {/* Rating Pill (Bottom-Left) - Only show when product has real rating */}
        {rating && (
          <div className="absolute bottom-2 left-2 bg-white/95 backdrop-blur-xs border border-gray-200/80 rounded-md px-1.5 py-0.5 flex items-center gap-1 shadow-2xs z-10 pointer-events-none">
            <span className="font-bold text-gray-900 text-[11px] leading-none">{rating}</span>
            <Star className="w-2.5 h-2.5 fill-emerald-600 text-emerald-600" />
            {reviewsCount && (
              <span className="text-[10px] text-gray-500 font-medium leading-none">({reviewsCount})</span>
            )}
          </div>
        )}
      </div>
      
      {/* 2. Product Details */}
      <div className="pt-2 px-0.5 flex flex-col flex-1">
        {/* Brand & Title (Single Line with bold brand) */}
        <div className="text-xs sm:text-[13px] leading-tight truncate">
          {brandOrStore && (
            <span className="font-bold text-gray-900 mr-1.5 uppercase tracking-tight">{brandOrStore}</span>
          )}
          <span className="text-gray-500 font-normal">{displayTitle}</span>
        </div>

        {/* Price Row (MRP strikethrough, Selling Price, Discount %) */}
        <div className="flex items-baseline gap-1.5 mt-1 flex-wrap">
          {formattedOriginalPrice && (
            <span className="text-[11px] sm:text-xs text-gray-400 line-through font-normal tabular-nums leading-none">
              ₹{formattedOriginalPrice}
            </span>
          )}
          <span className="text-sm sm:text-[15px] font-bold text-gray-900 tabular-nums leading-none">
            ₹{formattedPrice}
          </span>
          {discount && (
            <span className="text-[10px] sm:text-[11px] font-bold text-emerald-600 tracking-tight leading-none">
              {discount}
            </span>
          )}
        </div>

        {/* Add to Cart Stepper / Button */}
        <div className="w-full mt-2.5">
          {quantity > 0 ? (
            <div 
              className="flex items-center justify-between bg-[#FF5A36] text-white rounded-lg h-8 w-full shadow-xs overflow-hidden" 
              onClick={(e) => e.preventDefault()}
            >
              <button 
                className="w-8 h-full flex items-center justify-center hover:bg-black/15 active:bg-black/25 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  if (quantity > 1) {
                    dispatch({ type: 'cart/updateQuantity', payload: { id: product.id, quantity: quantity - 1 }});
                  } else {
                    dispatch({ type: 'cart/removeFromCart', payload: product.id });
                  }
                }}
              >
                <span className="text-base font-bold leading-none mb-0.5">-</span>
              </button>
              <span className="font-bold text-xs">{quantity}</span>
              <button 
                className="w-8 h-full flex items-center justify-center hover:bg-black/15 active:bg-black/25 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  dispatch(addToCart({
                    id: product.id,
                    name: rawTitle,
                    price: priceValue,
                    quantity: 1,
                    storeId: product.store?.id || (product as any).storeId || ''
                  }));
                }}
              >
                <span className="text-base font-bold leading-none mb-0.5">+</span>
              </button>
            </div>
          ) : (
            <button 
              onClick={handleAddToCart}
              className="w-full h-8 px-3 bg-white border border-[#FF5A36] text-[#FF5A36] hover:bg-[#FF5A36] hover:text-white font-bold text-xs rounded-lg transition-all active:scale-95 flex items-center justify-center shadow-2xs"
            >
              ADD
            </button>
          )}
        </div>
      </div>
    </Link>
  );
}
