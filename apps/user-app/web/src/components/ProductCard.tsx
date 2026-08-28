'use client';

import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/lib/store';
import { addToCart, updateQuantity, removeFromCart } from '@/lib/features/cartSlice';
import { Card } from '@/components/ui/card';
import { MapPin } from 'lucide-react';
import Link from 'next/link';

type ProductCardProps = {
  id: string;
  name: string;
  price: number | string;
  image: string;
  storeName?: string;
  storeId?: string;
  variant?: 'grid' | 'list';
};

export function ProductCard({
  id,
  name,
  price,
  image,
  storeName,
  storeId = '1',
  variant = 'grid'
}: ProductCardProps) {
  const dispatch = useDispatch();
  const cartItems = useSelector((state: RootState) => state.cart.items);
  const qty = cartItems.find(item => item.id === id)?.quantity || 0;

  const numericPrice = typeof price === 'string' ? parseFloat(price.replace(/[^0-9.-]+/g, '')) : price;
  const displayPrice = typeof price === 'string' ? price : `₹${price}`;

  const handleUpdateCart = (e: React.MouseEvent, delta: number) => {
    e.preventDefault();
    e.stopPropagation();
    
    const newQty = qty + delta;
    
    if (newQty > 0) {
      if (qty === 0) {
        dispatch(addToCart({
          id,
          name,
          price: numericPrice,
          quantity: 1,
          storeId,
        }));
      } else {
        dispatch(updateQuantity({ id, quantity: newQty }));
      }
    } else {
      dispatch(removeFromCart(id));
    }
  };

  if (variant === 'list') {
    return (
      <div className="flex items-center justify-between py-1">
        <Link href={`/home/product?id=${id}`} className="flex items-center gap-4 flex-1">
          <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-3xl border border-gray-100 shrink-0 shadow-sm overflow-hidden relative">
            {image.startsWith('http') || image.startsWith('/') ? (
              <img src={image} alt={name} className="w-full h-full object-cover" />
            ) : (
              image
            )}
          </div>
          <div className="flex flex-col">
            <h4 className="font-bold text-gray-900 text-[14px] leading-tight mb-1">{name}</h4>
            <span className="text-gray-600 font-bold text-[13px]">{displayPrice}</span>
          </div>
        </Link>
        
        <div className="ml-2">
          {qty > 0 ? (
            <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl overflow-hidden h-9 shadow-sm">
              <button 
                onClick={(e) => handleUpdateCart(e, -1)}
                className="w-8 h-full flex items-center justify-center text-gray-600 font-bold hover:bg-gray-100"
              >
                -
              </button>
              <div className="w-8 text-center text-[14px] font-bold text-gray-900">{qty}</div>
              <button 
                onClick={(e) => handleUpdateCart(e, 1)}
                className="w-8 h-full flex items-center justify-center text-indigo-600 font-bold hover:bg-gray-100"
              >
                +
              </button>
            </div>
          ) : (
            <button 
              onClick={(e) => handleUpdateCart(e, 1)}
              className="w-9 h-9 rounded-xl border border-gray-200 bg-white flex items-center justify-center text-indigo-600 hover:bg-gray-50 transition-colors shadow-sm"
            >
              <span className="font-bold text-lg leading-none">+</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <Link href={`/home/product?id=${id}`} className="block">
      <Card className="p-3 border border-gray-100 shadow-sm hover:shadow-md transition-shadow rounded-[20px] flex flex-col h-full bg-white">
        <div className="w-full aspect-square bg-gray-50/80 rounded-2xl flex items-center justify-center text-5xl mb-3 relative overflow-hidden">
            {image.startsWith('http') || image.startsWith('/') ? (
              <img src={image} alt={name} className="w-full h-full object-cover" />
            ) : (
              image
            )}
        </div>
        <h4 className="font-bold text-gray-900 text-[14px] leading-tight mb-1">{name}</h4>
        {storeName && (
          <div className="flex items-center gap-1 text-[11px] text-gray-500 font-medium mb-3 truncate">
            <MapPin className="w-3 h-3 text-gray-400" /> {storeName}
          </div>
        )}
        <div className="mt-auto flex items-center justify-between">
          <span className="font-bold text-[15px] text-indigo-600">{displayPrice}</span>
          
          {qty > 0 ? (
            <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl overflow-hidden h-8 shadow-sm">
              <button 
                onClick={(e) => handleUpdateCart(e, -1)}
                className="w-7 h-full flex items-center justify-center text-gray-600 font-bold hover:bg-gray-100 text-sm"
              >
                -
              </button>
              <div className="w-6 text-center text-[12px] font-bold text-gray-900">{qty}</div>
              <button 
                onClick={(e) => handleUpdateCart(e, 1)}
                className="w-7 h-full flex items-center justify-center text-indigo-600 font-bold hover:bg-gray-100 text-sm"
              >
                +
              </button>
            </div>
          ) : (
            <button 
              onClick={(e) => handleUpdateCart(e, 1)}
              className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 shadow-sm transition-transform active:scale-95"
            >
              +
            </button>
          )}
        </div>
      </Card>
    </Link>
  );
}
