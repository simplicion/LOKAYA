'use client';

import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/lib/store';
import { removeFromCart, updateQuantity, clearCart } from '@/lib/features/cartSlice';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Trash2 } from 'lucide-react';
import Link from 'next/link';

export default function CartPage() {
  const cart = useSelector((state: RootState) => state.cart);
  const dispatch = useDispatch();
  const router = useRouter();
  
  const totalAmount = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleCheckout = () => {
    router.push('/home/checkout/time');
  };

  if (cart.items.length === 0) {
    return (
      <div className="flex flex-col min-h-screen bg-white">
        <div className="flex items-center gap-4 py-4 px-2">
          <button onClick={() => router.back()} className="p-2 -ml-2 rounded-full hover:bg-gray-50 text-gray-700">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-bold text-lg text-gray-900">Your Cart</h1>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center -mt-20">
          <div className="text-6xl mb-4 opacity-50">🛒</div>
          <h2 className="text-xl font-bold mb-2 text-gray-800">Your Cart is Empty</h2>
          <p className="text-gray-500 mb-6 text-sm">Looks like you haven't added anything yet.</p>
          <Link href="/home">
            <Button className="rounded-full bg-indigo-600 hover:bg-indigo-700 h-12 px-8 shadow-md">Browse Stores</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-white pb-32 -mt-2">
      {/* Header */}
      <div className="flex items-center gap-4 py-4 sticky top-0 bg-white z-50">
        <button onClick={() => router.back()} className="p-2 -ml-2 rounded-full hover:bg-gray-50 text-gray-700">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-bold text-[17px] text-gray-900">Your Cart</h1>
      </div>

      {/* Cart Items */}
      <div className="flex flex-col gap-4">
        {cart.items.map((item) => {
          // Let's guess emoji based on name if available since it's not stored in cart normally
          let emoji = '🛒';
          if (item.name.toLowerCase().includes('banana')) emoji = '🍌';
          if (item.name.toLowerCase().includes('milk')) emoji = '🥛';
          if (item.name.toLowerCase().includes('bread')) emoji = '🍞';
          if (item.name.toLowerCase().includes('egg')) emoji = '🥚';

          return (
            <div key={item.id} className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-2xl border border-gray-100">
                  {emoji}
                </div>
                <div className="flex flex-col">
                  <h4 className="font-bold text-gray-900 text-[15px]">{item.name}</h4>
                  <span className="text-gray-700 font-bold text-sm mt-1">₹{item.price}</span>
                </div>
              </div>
              
              <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg overflow-hidden h-9">
                <button 
                  onClick={() => {
                    if (item.quantity > 1) {
                      dispatch(updateQuantity({ id: item.id, quantity: item.quantity - 1 }));
                    } else {
                      dispatch(removeFromCart(item.id));
                    }
                  }}
                  className="w-9 h-full flex items-center justify-center text-gray-600 font-medium hover:bg-gray-100"
                >
                  -
                </button>
                <div className="w-8 text-center text-sm font-semibold">{item.quantity}</div>
                <button 
                  onClick={() => dispatch(updateQuantity({ id: item.id, quantity: item.quantity + 1 }))}
                  className="w-9 h-full flex items-center justify-center text-indigo-600 font-medium hover:bg-gray-100"
                >
                  +
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="mt-8 pt-6 border-t border-gray-100 flex flex-col gap-6">
        <button className="text-indigo-600 font-bold text-[15px] self-start hover:underline">
          Apply Coupon
        </button>
        <div className="flex justify-between items-center">
          <span className="text-gray-500 font-medium text-[15px]">Subtotal</span>
          <span className="font-bold text-gray-900 text-[17px]">₹{totalAmount}</span>
        </div>
      </div>

      {/* Checkout Button */}
      <div className="fixed bottom-[80px] left-4 right-4 z-40">
        <Button 
          onClick={handleCheckout} 
          className="w-full h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-lg shadow-[0_8px_30px_rgb(79,70,229,0.2)] transition-all active:scale-[0.98]"
        >
          Proceed to Checkout
        </Button>
      </div>
    </div>
  );
}

