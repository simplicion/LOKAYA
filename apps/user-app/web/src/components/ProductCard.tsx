'use client';

import React from 'react';
import Link from 'next/link';
import { Bookmark, Star } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart } from '@/lib/features/cartSlice';
import { useGetWishlistQuery, useToggleWishlistMutation } from '@/lib/api';
import { RootState } from '@/lib/store';

export interface ProductCardProps {
  product: {
    id: string;
    title: string;
    image: string;
    price: string;
    originalPrice?: string;
    discount?: string;
    tag?: { text: string; bg: string };
    store: { id?: string; name: string; isVerified: boolean };
    rating: string;
    reviews: string;
  };
}

export function ProductCard({ product }: ProductCardProps) {
  const dispatch = useDispatch();
  const cartItems = useSelector((state: RootState) => state.cart.items);
  
  // Find if item is already in cart to show count or just "Add"
  const cartItem = cartItems.find(item => item.id === product.id);
  const quantity = cartItem?.quantity || 0;

  const { data: wishlistData } = useGetWishlistQuery(undefined, { skip: false }); // Or skip if not logged in
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
      name: product.title,
      price: parseFloat(product.price.replace(/,/g, '')), // Handle comma strings like "1,499"
      quantity: 1,
      storeId: product.store.id || 'unknown-store'
    }));
  };

  return (
    <Link href={`/product/${product.id}`} className="flex flex-col bg-white rounded-[18px] overflow-hidden cursor-pointer border border-gray-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_25px_-5px_rgba(0,0,0,0.1)] transition-all duration-300 relative group">
      {/* Product Image */}
      <div className="relative aspect-[4/5] bg-gray-50 p-4 flex items-center justify-center overflow-hidden">
        <img src={product.image} alt={product.title} className="w-full h-full object-contain mix-blend-multiply transition-transform duration-500 group-hover:scale-105" />
        
        {product.tag && (
          <div className={`absolute top-3 left-3 ${product.tag.bg} text-white text-[10px] font-extrabold px-2 py-1 rounded shadow-sm tracking-wider uppercase`}>
            {product.tag.text}
          </div>
        )}
        
        <button 
          onClick={handleToggleWishlist} 
          className="absolute top-3 right-3 p-2 z-10 bg-white/70 backdrop-blur-md rounded-full hover:bg-white transition-colors shadow-sm text-gray-500 hover:text-black"
        >
          <Bookmark 
            className={`w-[18px] h-[18px] transition-colors ${isSaved ? 'fill-black text-black' : ''}`} 
            strokeWidth={2} 
          />
        </button>
      </div>
      
      {/* Product Details */}
      <div className="p-3.5 flex flex-col flex-1 bg-white">
        {/* Rating */}
        <div className="flex items-center gap-1 mb-1.5">
          <Star className="w-[13px] h-[13px] fill-[#FF9800] text-[#FF9800]" />
          <span className="text-[12px] font-bold text-gray-800 leading-none mt-0.5">{product.rating}</span>
          <span className="text-[11px] text-gray-400 font-medium leading-none mt-0.5">
            ({product.reviews.replace(/[()]/g, '')})
          </span>
        </div>

        {/* Title */}
        <h3 className="text-[14px] font-semibold text-gray-900 leading-[1.3] line-clamp-2 mb-2 min-h-[36px]">
          {product.title}
        </h3>
        
        <div className="mt-auto flex flex-col gap-3">
          {/* Pricing */}
          <div className="flex flex-col gap-1">
            {product.discount && (
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-gray-400 line-through font-medium tabular-nums leading-none">₹{product.originalPrice}</span>
                <span className="text-[9px] font-bold text-[#FF6B00] bg-[#FF6B00]/10 px-1.5 py-0.5 rounded uppercase tracking-wide leading-none">
                  {product.discount}
                </span>
              </div>
            )}
            <span className="text-[17px] font-bold text-gray-900 tabular-nums leading-none">₹{product.price}</span>
          </div>
          
          {/* Add to Cart Button */}
          <div className="w-full">
            {quantity > 0 ? (
              <div className="flex items-center justify-between bg-[#FF6B00] text-white rounded-xl h-9 w-full shadow-sm shadow-[#FF6B00]/20 overflow-hidden" onClick={(e) => e.preventDefault()}>
                <button 
                  className="w-10 h-full flex items-center justify-center hover:bg-black/15 active:bg-black/25 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (quantity > 1) {
                      dispatch({ type: 'cart/updateQuantity', payload: { id: product.id, quantity: quantity - 1 }});
                    } else {
                      dispatch({ type: 'cart/removeFromCart', payload: product.id });
                    }
                  }}
                >
                  <span className="text-[18px] font-bold leading-none mb-0.5">-</span>
                </button>
                <span className="font-bold text-[14px]">{quantity}</span>
                <button 
                  className="w-10 h-full flex items-center justify-center hover:bg-black/15 active:bg-black/25 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    dispatch(addToCart({
                      id: product.id,
                      name: product.title,
                      price: parseFloat(product.price.replace(/,/g, '')),
                      quantity: 1,
                      storeId: product.store.id || 'unknown-store'
                    }));
                  }}
                >
                  <span className="text-[18px] font-bold leading-none mb-0.5">+</span>
                </button>
              </div>
            ) : (
              <button 
                onClick={handleAddToCart}
                className="w-full h-9 px-4 bg-white border border-gray-200 text-[#FF6B00] font-bold text-[13px] tracking-wide rounded-xl hover:border-[#FF6B00] hover:bg-[#FF6B00]/5 hover:shadow-sm transition-all active:scale-95 flex items-center justify-center"
              >
                ADD
              </button>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
