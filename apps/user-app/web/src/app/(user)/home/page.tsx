'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ProductCard } from '@/components/ProductCard';
import Link from 'next/link';
import { MapPin, ChevronDown, Bell, Search, Mic, User } from 'lucide-react';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store';

const categories = [
  { name: 'Monsoon', icon: '☔' },
  { name: 'Electronics', icon: '🎧' },
  { name: 'Beauty', icon: '💄' },
  { name: 'Pharmacy', icon: '💊' },
  { name: 'Snacks', icon: '🥨' },
];

const mockStores = [
  { id: '1', name: 'FreshMart', rating: 4.5, distance: '0.3 km', pickupTime: '10 mins', icon: 'FM' },
  { id: '2', name: 'Daily Needs', rating: 4.2, distance: '0.5 km', pickupTime: '12 mins', icon: 'DN' },
  { id: '3', name: 'GreenGrocer', rating: 4.6, distance: '0.7 km', pickupTime: '15 mins', icon: 'GG' },
];

const initialProducts = [
  { id: '1', name: 'Organic Bananas', price: '$2.99', image: '🍌', store: 'FreshMart' },
  { id: '2', name: 'Whole Milk', price: '$4.49', image: '🥛', store: 'Daily Needs' },
  { id: '3', name: 'Sourdough Bread', price: '$5.99', image: '🍞', store: 'GreenGrocer' },
  { id: '4', name: 'Avocados', price: '$3.99', image: '🥑', store: 'FreshMart' },
  { id: '5', name: 'Orange Juice', price: '$4.99', image: '🧃', store: 'Daily Needs' },
  { id: '6', name: 'Eggs (Dozen)', price: '$3.49', image: '🥚', store: 'GreenGrocer' },
];

export default function BuyerDashboard() {
  const [locationName, setLocationName] = useState('Fetching Location...');
  const [locationCoords, setLocationCoords] = useState<{lat: number, lng: number} | null>(null);
  const [hasLocationPermission, setHasLocationPermission] = useState<boolean | null>(null);
  
  const [products, setProducts] = useState(initialProducts);
  const [loadingMore, setLoadingMore] = useState(false);

  const user = useSelector((state: RootState) => state.auth.user);
  const cart = useSelector((state: RootState) => state.cart);
  const cartTotalItems = Object.values(cart.items).reduce((sum, item) => sum + item.quantity, 0);
  const cartTotalAmount = Object.values(cart.items).reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationName('Geolocation not supported');
      setHasLocationPermission(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        setHasLocationPermission(true);
        const { latitude, longitude } = position.coords;
        setLocationCoords({ lat: latitude, lng: longitude });
        
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
          const data = await res.json();
          // Try to get a neighborhood/suburb and city
          const area = data.address?.suburb || data.address?.neighbourhood || data.address?.city_district || '';
          const city = data.address?.city || data.address?.town || data.address?.county || 'Unknown';
          const displayLocation = area ? `${area}, ${city}` : city;
          setLocationName(displayLocation);
        } catch (error) {
          console.error("Failed to fetch location name:", error);
          setLocationName('Location found, name unavailable');
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        setLocationName('Location Required');
        setHasLocationPermission(false);
      }
    );
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 100 && !loadingMore) {
        setLoadingMore(true);
        setTimeout(() => {
          setProducts(prev => [
            ...prev,
            ...initialProducts.map(p => ({ ...p, id: Math.random().toString() }))
          ]);
          setLoadingMore(false);
        }, 1000);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loadingMore]);

  const requestLocation = () => {
    alert("Please enable location services in your browser settings to see nearby stores.");
  };

  return (
    <div className="flex flex-col pb-20 bg-white">
      {/* Header (Non-sticky) */}
      <div className="px-3 pt-1 pb-2">
        <div className="flex items-start justify-between">
          <div className="flex flex-col">
            <span className="text-3xl font-black tracking-tight mb-1">
              <span className="text-indigo-600">Sna</span>pick
            </span>
            <div className="flex items-center gap-1 cursor-pointer">
              <span className="text-sm font-medium text-gray-700 truncate max-w-[200px]">{locationName}</span>
              <ChevronDown className="w-4 h-4 text-gray-600 shrink-0" />
            </div>
          </div>
          {user ? (
            <Link href="/notifications" className="p-3 bg-gray-50 rounded-full border border-gray-100 hover:bg-gray-100 transition-colors">
              <Bell className="w-6 h-6 text-gray-800" />
            </Link>
          ) : (
            <Link href="/login">
              <Button variant="default" size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-bold px-4">
                Login
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Sticky Search & Categories */}
      <div className="sticky top-0 z-50 bg-white px-3 pt-2 pb-3 shadow-sm flex flex-col gap-4">
        {/* Search */}
        <Link href="/home/search" className="block relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-gray-500">
            <Search className="w-5 h-5" />
          </div>
          <div className="w-full pl-11 pr-11 h-14 rounded-2xl bg-gray-50 border border-gray-100 flex items-center text-gray-500 font-medium text-[15px]">
            Search "power bank"
          </div>
          <div className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-500">
            <Mic className="w-5 h-5" />
          </div>
        </Link>

        {/* Categories */}
        <div className="flex gap-4 overflow-x-auto pb-1 -mx-3 px-3 snap-x no-scrollbar">
          <div className="flex flex-col items-center gap-1 snap-start shrink-0 cursor-pointer">
            <div className="w-[56px] h-[56px] bg-gray-50 rounded-2xl flex items-center justify-center text-2xl border border-gray-100 hover:bg-indigo-50 transition-colors">
              🛍️
            </div>
            <span className="text-[11px] font-bold text-gray-900 text-center w-14 leading-tight">
              All
            </span>
          </div>
          {categories.map((cat, i) => (
            <div key={i} className="flex flex-col items-center gap-1 snap-start shrink-0 cursor-pointer">
              <div className="w-[56px] h-[56px] bg-gray-50 rounded-2xl flex items-center justify-center text-2xl border border-gray-100 hover:bg-indigo-50 transition-colors">
                {cat.icon}
              </div>
              <span className="text-[11px] font-medium text-gray-600 text-center w-16 leading-tight">
                {cat.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Banner */}
      <div className="mt-6 w-full h-40 md:h-48 overflow-hidden relative">
        <img 
          src="/promo-ad.png" 
          alt="Promotional Ad" 
          className="absolute inset-0 w-full h-full object-cover scale-[1.12]" 
        />
      </div>


      {/* Nearby Stores */}
      <div className="px-3 mt-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg text-gray-900">Nearby Stores</h3>
          {hasLocationPermission && (
            <Link href="/home/search" className="text-indigo-600 text-sm font-semibold hover:underline">
              See all
            </Link>
          )}
        </div>
        
        {hasLocationPermission === null ? (
          <div className="flex gap-4 overflow-x-auto pb-2 -mx-2 px-2 snap-x no-scrollbar">
            {[1, 2, 3].map(i => (
              <div key={i} className="min-w-[140px] h-[160px] bg-gray-100 rounded-2xl animate-pulse snap-start" />
            ))}
          </div>
        ) : hasLocationPermission === true ? (
          <div className="flex gap-4 overflow-x-auto pb-4 -mx-3 px-3 snap-x no-scrollbar">
            {mockStores.map((store) => (
              <Link href={`/home/store?id=${store.id}`} key={store.id} className="snap-start shrink-0">
                <Card className="w-[140px] h-[160px] flex flex-col items-center justify-center p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow rounded-2xl">
                  <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mb-3">
                    <span className="text-2xl font-bold text-emerald-600 text-center uppercase tracking-tighter">
                      {store.icon}
                    </span>
                  </div>
                  <h4 className="font-bold text-gray-900 text-[15px] truncate w-full text-center mb-1">
                    {store.name}
                  </h4>
                  <div className="flex items-center text-xs text-gray-500 font-medium">
                    <span className="text-yellow-500 mr-1">★</span>
                    <span className="mr-1">{store.rating}</span>
                    <span className="mx-1">•</span>
                    <span>{store.distance}</span>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 bg-indigo-50/50 rounded-2xl border border-indigo-100">
            <MapPin className="w-8 h-8 text-indigo-300 mb-2" />
            <p className="text-gray-700 text-sm font-medium mb-3 text-center px-3">
              Location access is required to show nearby stores.
            </p>
            <Button variant="outline" size="sm" onClick={requestLocation} className="rounded-full">
              Allow Location
            </Button>
          </div>
        )}
      </div>

      {/* Products Feed */}
      <div className="px-3 mt-8">
        <div className="flex items-center justify-between mb-4 mt-2">
          <h3 className="font-bold text-lg text-gray-900">Recommended for You</h3>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          {products.map((product) => (
            <ProductCard 
              key={product.id}
              id={product.id}
              name={product.name}
              price={product.price}
              image={product.image}
              storeName={product.store}
              storeId="1"
              variant="grid"
            />
          ))}
        </div>
        
        {loadingMore && (
          <div className="flex justify-center py-6">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
          </div>
        )}
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

