'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/lib/store';
import { addToCart, updateQuantity, removeFromCart } from '@/lib/features/cartSlice';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Mock DB for product lookup
const mockDB: Record<string, any> = {
  'p1': { id: 'p1', name: 'Banana (1kg)', subtitle: 'Fresh & Organic', price: 40, originalPrice: 50, discount: '20% OFF', emoji: '🍌', desc: ['Fresh bananas sourced from local farms.', 'Quality assured.', 'Weight: 1kg'] },
  'p2': { id: 'p2', name: 'Apple (1kg)', subtitle: 'Fresh & Organic', price: 130, originalPrice: 150, discount: '13% OFF', emoji: '🍎', desc: ['Crisp and sweet apples.', 'Directly from orchards.', 'Weight: 1kg'] },
  '1': { id: '1', name: 'Organic Bananas', subtitle: 'Fresh & Organic', price: 40, originalPrice: 50, discount: '20% OFF', emoji: '🍌', desc: ['Fresh bananas sourced from local farms.', 'Quality assured.', 'Weight: 1kg'] },
  '2': { id: '2', name: 'Whole Milk', subtitle: 'Daily Needs', price: 60, originalPrice: 70, discount: '14% OFF', emoji: '🥛', desc: ['Fresh whole milk.', 'Pasteurized.', 'Volume: 1L'] },
};

export default function ProductDetailsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams?.get('id') || 'p1';
  
  const product = mockDB[id] || mockDB['p1'];

  const dispatch = useDispatch();
  const cartItems = useSelector((state: RootState) => state.cart.items);
  const qty = cartItems.find(item => item.id === product.id)?.quantity || 0;
  
  const handleUpdateCart = (delta: number) => {
    const newQty = qty + delta;
    if (newQty > 0) {
      if (qty === 0) {
        dispatch(addToCart({ id: product.id, name: product.name, price: product.price, quantity: 1, storeId: '1' }));
      } else {
        dispatch(updateQuantity({ id: product.id, quantity: newQty }));
      }
    } else {
      dispatch(removeFromCart(product.id));
    }
  };

  const handleAddToCart = () => {
    if (qty === 0) {
      handleUpdateCart(1);
    }
  };

  const handleDelete = () => {
    dispatch(removeFromCart(product.id));
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Top Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2 sticky top-0 bg-white/90 backdrop-blur-md z-50">
        <button onClick={() => router.back()} className="p-2 -ml-2 rounded-full hover:bg-gray-100 text-gray-700 shrink-0 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="bg-indigo-600 text-white font-bold text-xs px-2 py-1 rounded-lg tracking-tight">
          13 MINS
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-32">
        {/* Product Image area */}
        <div className="w-full aspect-square flex items-center justify-center pt-8 pb-12 relative">
           <div className="w-64 h-64 bg-gray-50/50 rounded-full flex items-center justify-center text-[140px] absolute blur-2xl opacity-60">
             {product.emoji}
           </div>
           <div className="text-[160px] relative z-10 drop-shadow-2xl hover:scale-105 transition-transform duration-300">
             {product.emoji}
           </div>
        </div>

        {/* Product Details */}
        <div className="px-6">
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">{product.name}</h1>
          <p className="text-gray-500 font-medium text-[15px] mt-1 mb-4">{product.subtitle}</p>

          <div className="flex items-center gap-3 mb-8">
            <span className="text-2xl font-black text-gray-900">₹{product.price}</span>
            <span className="text-gray-400 font-bold line-through text-lg">₹{product.originalPrice}</span>
            <span className="bg-emerald-50 text-emerald-600 font-bold text-xs px-2.5 py-1 rounded-md">
              {product.discount}
            </span>
          </div>

          <div className="w-full h-[1px] bg-gray-100 mb-6" />

          <h3 className="font-bold text-gray-900 text-[17px] mb-4">About this item</h3>
          <ul className="flex flex-col gap-3">
            {product.desc.map((item: string, index: number) => (
              <li key={index} className="flex items-start text-gray-600 text-[15px] font-medium leading-snug">
                <span className="mr-3 text-gray-400 mt-1">•</span> {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Bottom Sticky Actions */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-50 pb-safe-offset-4">
        {qty > 0 ? (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center bg-gray-50 border border-gray-200 rounded-2xl overflow-hidden h-12 shadow-sm w-36">
                <button 
                  onClick={() => handleUpdateCart(-1)}
                  className="w-12 h-full flex items-center justify-center text-gray-600 font-bold hover:bg-gray-100 text-xl"
                >
                  -
                </button>
                <div className="flex-1 text-center text-[17px] font-black text-gray-900">{qty}</div>
                <button 
                  onClick={() => handleUpdateCart(1)}
                  className="w-12 h-full flex items-center justify-center text-indigo-600 font-bold hover:bg-gray-100 text-xl"
                >
                  +
                </button>
              </div>
              
              <button 
                onClick={handleDelete}
                className="text-gray-400 hover:text-red-500 font-semibold text-sm flex items-center gap-1.5 transition-colors"
              >
                <Trash2 className="w-4 h-4" /> Delete
              </button>
            </div>
            <Button 
              className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-[17px] shadow-lg shadow-indigo-600/20"
              onClick={() => router.push('/home/cart')}
            >
              Go to Cart ({qty})
            </Button>
          </div>
        ) : (
          <Button 
            className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-[17px] shadow-lg shadow-indigo-600/20"
            onClick={handleAddToCart}
          >
            Add to Cart
          </Button>
        )}
      </div>
    </div>
  );
}
