'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/lib/store';
import { addToCart, updateQuantity, removeFromCart } from '@/lib/features/cartSlice';
import { ArrowLeft, Search, Navigation } from 'lucide-react';
import { ProductCard } from '@/components/ProductCard';
import Link from 'next/link';

const categories = [
  { name: 'Fruits', icon: '🍌' },
  { name: 'Vegetables', icon: '🍅' },
  { name: 'Dairy', icon: '🥛' },
  { name: 'Snacks', icon: '🥨' },
  { name: 'Beverages', icon: '🧃' },
];

const mockProducts = [
  { id: 'p1', name: 'Banana (1kg)', price: 40, emoji: '🍌' },
  { id: 'p2', name: 'Apple (1kg)', price: 130, emoji: '🍎' },
  { id: 'p3', name: 'Fresh Milk (1L)', price: 60, emoji: '🥛' },
  { id: 'p4', name: 'Bread (Brown)', price: 35, emoji: '🍞' },
];

export default function StorefrontPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const cartItems = useSelector((state: RootState) => state.cart.items);
  const storeId = '1'; // Mock store ID

  const cartTotalAmount = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const cartTotalItems = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  const [activeCategory, setActiveCategory] = useState('Fruits');
  const [search, setSearch] = useState('');

  const getProductQuantity = (productId: string) => {
    return cartItems.find(item => item.id === productId)?.quantity || 0;
  };

  const handleUpdateCart = (product: any, delta: number) => {
    const currentQty = getProductQuantity(product.id);
    const newQty = currentQty + delta;
    
    if (newQty > 0) {
      if (currentQty === 0) {
        dispatch(addToCart({
          id: product.id,
          name: product.name,
          price: product.price,
          quantity: 1,
          storeId,
        }));
      } else {
        dispatch(updateQuantity({ id: product.id, quantity: newQty }));
      }
    } else {
      dispatch(removeFromCart(product.id));
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-32">
      {/* Top Header */}
      <div className="flex items-center px-4 pt-4 pb-2 sticky top-0 bg-white/90 backdrop-blur-md z-50">
        <button onClick={() => router.back()} className="p-2 -ml-2 rounded-full hover:bg-gray-100 text-gray-700 shrink-0 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-bold text-gray-900 text-[17px] mx-auto pr-7 tracking-tight">Store Details</h1>
      </div>

      {/* Banner */}
      <div className="w-full h-36 bg-gray-900 relative">
        <img 
          src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=1200" 
          className="w-full h-full object-cover opacity-70" 
          alt="Store Cover" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 to-transparent" />
      </div>

      <div className="px-3">
        {/* Store Info Card */}
        <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 p-4 -mt-12 relative z-10 mx-1">
          <div className="flex items-start">
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 bg-emerald-700 rounded-2xl flex items-center justify-center shrink-0 border-[3px] border-white shadow-sm -mt-8">
                <span className="text-white font-black text-xl tracking-tighter">FM</span>
              </div>
              <div className="flex flex-col -mt-2">
                <h1 className="font-bold text-gray-900 text-[19px] leading-tight mb-0.5">FreshMart</h1>
                <div className="flex items-center text-[12px] text-gray-500 font-medium">
                  <span className="text-yellow-500 mr-1">★</span>
                  <span className="text-gray-700 font-bold mr-1">4.6</span>
                  <span>(230)</span>
                  <span className="mx-1.5">•</span>
                  <span>Pick up in 10 mins</span>
                  <span className="mx-1.5">•</span>
                  <span>0.3 km</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between mt-5">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50/80 px-2.5 py-1.5 rounded-lg border border-emerald-100/50">
                 <span className="text-[13px]">✔️</span> Minimum order ₹199
              </div>
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50/80 px-2.5 py-1.5 rounded-lg border border-emerald-100/50">
                 <span className="text-[13px]">📦</span> Free pickup
              </div>
            </div>
            
            <button className="flex items-center justify-center w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl shrink-0 transition-colors hover:bg-indigo-100">
               <Navigation className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>

        {/* Search Products */}
        <div className="mt-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-gray-400">
              <Search className="w-[18px] h-[18px]" />
            </div>
            <input
              type="text"
              placeholder="Search in FreshMart..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 h-12 rounded-2xl bg-white border border-gray-100 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/5 transition-all text-[14px] font-medium placeholder:text-gray-400 shadow-sm"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="mt-6 bg-white rounded-[24px] p-4 border border-gray-100 shadow-sm">
          <h3 className="font-bold text-[15px] text-gray-900 mb-4">Categories</h3>
          <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 snap-x no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat.name}
                onClick={() => setActiveCategory(cat.name)}
                className="flex flex-col items-center gap-1.5 snap-start shrink-0 group"
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl transition-all ${
                  activeCategory === cat.name 
                    ? 'bg-indigo-50 border-2 border-indigo-100 scale-105' 
                    : 'bg-gray-50 border border-gray-100 group-hover:bg-gray-100'
                }`}>
                  {cat.icon}
                </div>
                <span className={`text-[11px] font-semibold transition-colors ${
                  activeCategory === cat.name ? 'text-indigo-600' : 'text-gray-600'
                }`}>
                  {cat.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Best Selling List */}
        <div className="mt-4 bg-white rounded-[24px] p-4 border border-gray-100 shadow-sm mb-6">
          <h3 className="font-bold text-[15px] text-gray-900 mb-4">Best Selling</h3>
          <div className="flex flex-col gap-1">
            {mockProducts.map((product) => (
              <ProductCard 
                key={product.id}
                id={product.id}
                name={product.name}
                price={product.price}
                image={product.emoji}
                storeId={storeId}
                variant="list"
              />
            ))}
          </div>
        </div>
      </div>

      {/* Floating Cart Bar */}
      {cartTotalItems > 0 && (
        <div className="fixed bottom-[80px] left-3 right-3 z-40 bg-indigo-600 text-white rounded-2xl p-4 flex items-center justify-between shadow-xl shadow-indigo-600/30 border border-indigo-500">
          <div className="flex items-center font-bold text-sm tracking-tight">
            <span className="bg-white/20 w-7 h-7 rounded-full flex items-center justify-center mr-3 text-[13px] border border-white/10">
              {cartTotalItems}
            </span>
            {cartTotalItems} {cartTotalItems === 1 ? 'item' : 'items'} | ₹{cartTotalAmount}
          </div>
          <Link href="/home/cart">
            <span className="text-[13px] font-bold flex items-center bg-white text-indigo-600 px-4 py-2 rounded-xl shadow-sm hover:bg-indigo-50 transition-colors">
              View Cart
            </span>
          </Link>
        </div>
      )}
    </div>
  );
}
