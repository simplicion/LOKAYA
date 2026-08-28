'use client';

import { useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/lib/store';
import { addToCart, updateQuantity, removeFromCart } from '@/lib/features/cartSlice';
import { ArrowLeft, Search, Navigation, Store as StoreIcon, AlertCircle } from 'lucide-react';
import { ProductCard } from '@/components/ProductCard';
import Link from 'next/link';
import { useGetStoreQuery, useGetStoreProductsQuery, useGetStoreCategoriesQuery } from '@/lib/api';

const formatWorkingDays = (days: number[]) => {
  if (!days || days.length === 0) return '';
  if (days.length === 7) return 'Everyday';
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  // Sort days so they appear in standard order (Mon-Sun)
  const sorted = [...days].sort((a, b) => (a === 0 ? 7 : a) - (b === 0 ? 7 : b));
  return sorted.map(d => dayNames[d]).join(', ');
};

export default function StorefrontPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const storeId = searchParams.get('id') || '';
  
  const dispatch = useDispatch();
  const cartItems = useSelector((state: RootState) => state.cart.items);

  const { data: store, isLoading: isStoreLoading } = useGetStoreQuery(storeId, { skip: !storeId });
  const { data: products = [], isLoading: isProductsLoading } = useGetStoreProductsQuery(storeId, { skip: !storeId });
  const { data: categories = [], isLoading: isCategoriesLoading } = useGetStoreCategoriesQuery(storeId, { skip: !storeId });

  const cartTotalAmount = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const cartTotalItems = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  const [activeCategory, setActiveCategory] = useState<string | null>(null);
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

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = activeCategory ? p.categoryId === activeCategory : true;
      return matchesSearch && matchesCategory;
    });
  }, [products, search, activeCategory]);

  if (isStoreLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading store...</div>;
  }

  if (!store) {
    return <div className="min-h-screen flex items-center justify-center">Store not found.</div>;
  }

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
      <div className={`w-full h-36 relative bg-indigo-600`}>
        {store.bannerUrl ? (
          <img 
            src={store.bannerUrl} 
            className="w-full h-full object-cover opacity-70" 
            alt="Store Cover" 
          />
        ) : (
          <div className="w-full h-full opacity-70" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 to-transparent" />
      </div>

      <div className="px-3">
        {/* Store Info Card */}
        <div className={`rounded-[24px] shadow-sm border border-gray-100 bg-white p-4 -mt-12 relative z-10 mx-1`}>
          <div className="flex items-start">
            <div className="flex items-center gap-3">
              <div className={`w-16 h-16 bg-white rounded-2xl flex items-center justify-center shrink-0 border-[3px] border-white shadow-sm -mt-8 overflow-hidden`}>
                {store.logoUrl ? (
                  <img src={store.logoUrl} className="w-full h-full object-cover" alt="Logo" />
                ) : (
                  <StoreIcon className="w-8 h-8 text-gray-400" />
                )}
              </div>
              <div className="flex flex-col -mt-2">
                <h1 className={`font-bold text-gray-900 text-[19px] leading-tight mb-0.5`}>{store.title || store.name}</h1>
                <div className={`flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-gray-500 font-medium`}>
                  <div className="flex items-center">
                    <span className="text-yellow-400 mr-1">★</span>
                    <span className={`font-bold mr-1 text-gray-900`}>4.6</span>
                    <span>(230)</span>
                  </div>
                  <span className="text-gray-300">•</span>
                  <span>Pick up in 10 mins</span>
                  {store.address && (
                    <>
                      <span className="text-gray-300">•</span>
                      <span className="truncate max-w-[150px]" title={store.address}>{store.address}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div className={`flex flex-wrap gap-2 mt-4 text-[11px] text-gray-700 bg-gray-50/50 p-2.5 rounded-xl border border-gray-100 shadow-sm`}>
            {store.openingTime && store.closingTime && (
              <div className="flex items-center gap-1.5 w-full">
                <span className="text-indigo-500">🕒</span>
                <span className="font-semibold text-gray-800">Hours: {store.openingTime} - {store.closingTime}</span>
              </div>
            )}
            {store.workingDays && store.workingDays.length > 0 && (
              <div className="flex items-center gap-1.5 w-full mb-1">
                <span className="text-indigo-500">📅</span>
                <span className="font-semibold text-gray-800">Days: {formatWorkingDays(store.workingDays)}</span>
              </div>
            )}
            {store.minimumOrder > 0 && (
              <div className="flex items-center gap-1 font-semibold bg-gray-100/80 px-2 py-1 rounded">
                <span className="text-emerald-600">✔️</span> Min ₹{store.minimumOrder}
              </div>
            )}
            {store.acceptedPayments?.includes('CASH') && (
              <div className="flex items-center gap-1 font-semibold bg-gray-100/80 px-2 py-1 rounded">
                <span className="text-emerald-600">💵</span> Cash
              </div>
            )}
            {store.acceptedPayments?.includes('ONLINE PAYMENT') && (
              <div className="flex items-center gap-1 font-semibold bg-gray-100/80 px-2 py-1 rounded">
                <span className="text-blue-600">💳</span> Online
              </div>
            )}
          </div>
          
          <div className="flex items-center justify-between mt-4">
            <button className={`flex items-center justify-center w-full h-10 bg-gray-100 text-gray-900 hover:bg-gray-200 rounded-xl font-bold transition-colors gap-2`}>
               <Navigation className="w-4.5 h-4.5" />
               Get Directions
            </button>
          </div>
          
          {store.isCurrentlyOpen === false && (
            <div className={`mt-4 flex items-start gap-2 bg-red-500/10 p-3 rounded-xl border border-red-500/20 text-xs font-medium backdrop-blur-md text-red-800`}>
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <p>Store is currently closed and not accepting new orders. Opens at {store.openingTime}.</p>
            </div>
          )}
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
              className="w-full pl-11 pr-12 h-12 rounded-2xl bg-white border border-gray-100 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/5 transition-all text-[14px] font-medium placeholder:text-gray-400 shadow-sm"
            />
            <div className="absolute inset-y-0 right-2 flex items-center">
              <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center transition-colors duration-300">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-gray-600"><path d="M3 6h18M6 12h12M10 18h4"/></svg>
              </div>
            </div>
          </div>
        </div>

        {/* Categories */}
        {categories.length > 0 && (
          <div className="mt-6 bg-white rounded-[24px] p-4 border border-gray-100 shadow-sm">
            <h3 className="font-bold text-[15px] text-gray-900 mb-4">Categories</h3>
            <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 snap-x no-scrollbar">
              <button
                onClick={() => setActiveCategory(null)}
                className="flex flex-col items-center gap-1.5 snap-start shrink-0 group"
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl transition-all ${
                  activeCategory === null
                    ? 'bg-indigo-50 border border-indigo-100 scale-105 shadow-sm'
                    : 'bg-gray-50 border border-gray-100 group-hover:bg-gray-100'
                }`}>
                  🛍️
                </div>
                <span className={`text-[11px] font-semibold transition-colors ${
                  activeCategory === null ? 'text-gray-900' : 'text-gray-600'
                }`}>
                  All
                </span>
              </button>
              {categories.map((cat: any) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className="flex flex-col items-center gap-1.5 snap-start shrink-0 group"
                >
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl transition-all ${
                    activeCategory === cat.id 
                      ? 'bg-indigo-50 border border-indigo-100 scale-105 shadow-sm'
                      : 'bg-gray-50 border border-gray-100 group-hover:bg-gray-100'
                  }`}>
                    {cat.imageUrl ? (
                      <img src={cat.imageUrl} alt={cat.name} className="w-10 h-10 object-contain" />
                    ) : (
                      '🛒'
                    )}
                  </div>
                  <span className={`text-[11px] font-semibold transition-colors ${
                    activeCategory === cat.id ? 'text-gray-900' : 'text-gray-600'
                  }`}>
                    {cat.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Best Selling / Product List */}
        <div className="mt-4 bg-white rounded-[24px] p-4 border border-gray-100 shadow-sm mb-6">
          <h3 className="font-bold text-[15px] text-gray-900 mb-4">
            {activeCategory ? 'Products' : 'Best Selling'}
          </h3>
          <div className="flex flex-col gap-1">
            {filteredProducts.map((product) => (
              <ProductCard 
                key={product.id}
                id={product.id}
                name={product.name}
                price={product.sellingPrice}
                image={product.imageUrl}
                storeId={storeId}
                variant="list"
              />
            ))}
            {filteredProducts.length === 0 && (
              <p className="text-gray-500 text-sm text-center py-4">No products found.</p>
            )}
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
