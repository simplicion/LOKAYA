'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Package, Search, Loader2, ArrowRight, Star } from 'lucide-react';
import { useGetUserOrdersQuery } from '@/lib/api';
import { useCurrency } from '@/context/CurrencyContext';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const TABS = [
  { id: 'all', label: 'All Orders' },
  { id: 'ongoing', label: 'Ongoing' },
  { id: 'delivered', label: 'Delivered' },
  { id: 'cancelled', label: 'Cancelled' },
  { id: 'returned', label: 'Returned' },
];

export default function OrderHistoryPage() {
  const router = useRouter();
  const { formatPrice, currencySymbol } = useCurrency();
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const { data: orders = [], isLoading, refetch } = useGetUserOrdersQuery();

  // Filter orders based on active tab and optional search query
  const filteredOrders = orders.filter((order: any) => {
    const rawStatus = (order.status || 'PENDING').toUpperCase();

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchesId = order.id.toLowerCase().includes(q);
      const matchesItem = order.items?.some((i: any) => 
        (i.productName || i.product?.name || '').toLowerCase().includes(q)
      );
      if (!matchesId && !matchesItem) return false;
    }

    if (activeTab === 'all') return true;
    if (activeTab === 'ongoing') {
      return ['PENDING', 'CONFIRMED', 'PROCESSING', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY'].includes(rawStatus);
    }
    if (activeTab === 'delivered') return rawStatus === 'DELIVERED';
    if (activeTab === 'cancelled') return rawStatus === 'CANCELLED';
    if (activeTab === 'returned') {
      return ['RETURN_REQUESTED', 'RETURN_APPROVED', 'RETURNED', 'REFUNDED'].includes(rawStatus);
    }
    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'DELIVERED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'CANCELLED':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'RETURNED':
      case 'REFUNDED':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'RETURN_REQUESTED':
      case 'RETURN_APPROVED':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'SHIPPED':
      case 'OUT_FOR_DELIVERY':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-orange-50 text-[#FF6B00] border-orange-200';
    }
  };

  const getStatusText = (status: string) => {
    return (status || 'PENDING').replace(/_/g, ' ');
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24 flex flex-col max-w-md mx-auto relative shadow-2xl">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-20">
        <div className="flex items-center justify-between px-4 py-3.5">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => router.back()} 
              className="p-1.5 -ml-1.5 rounded-full hover:bg-gray-100 text-gray-800 transition-colors"
              aria-label="Back"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <h1 className="text-lg font-black text-gray-900 tracking-tight">My Orders</h1>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <button 
              onClick={() => setShowSearch(!showSearch)} 
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Search Orders"
            >
              <Search className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Search Bar Collapsible */}
        {showSearch && (
          <div className="px-4 pb-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by order ID or product name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-100 rounded-xl pl-9 pr-4 py-2 text-xs text-gray-900 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-[#FF6B00]/40 transition-all"
              />
            </div>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex overflow-x-auto no-scrollbar px-4 pt-1 gap-5 border-t border-gray-50">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "pb-3 text-xs font-bold whitespace-nowrap transition-all relative",
                activeTab === tab.id ? "text-[#FF6B00]" : "text-gray-500 hover:text-gray-800"
              )}
            >
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FF6B00] rounded-full animate-in fade-in duration-200" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List Container */}
      <div className="flex-1 p-4 space-y-3.5 overflow-y-auto">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-[#FF6B00] mb-2" />
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Loading Orders...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-4">
            <div className="w-16 h-16 bg-white shadow-sm border border-gray-100 rounded-2xl flex items-center justify-center mb-3">
              <Package className="w-8 h-8 text-gray-300" />
            </div>
            <h3 className="text-base font-extrabold text-gray-900 mb-1">No Orders Found</h3>
            <p className="text-xs text-gray-500 max-w-xs mb-5">
              {searchQuery ? 'No matching orders for your search.' : "You haven't placed any orders in this category yet."}
            </p>
            <Button
              onClick={() => router.push('/')}
              className="h-10 px-5 rounded-xl bg-[#FF6B00] hover:bg-[#ff7a1f] text-white font-bold text-xs"
            >
              Explore Products
            </Button>
          </div>
        ) : (
          filteredOrders.map((order: any) => {
            const firstItem = order.items?.[0];
            const displayImage = firstItem?.product?.media?.[0]?.url || firstItem?.product?.imageUrl || '';
            const orderDateStr = order.createdAt 
              ? new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
              : 'Recent Order';

            return (
              <div 
                key={order.id} 
                onClick={() => router.push(`/orders/${order.id}`)}
                className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm hover:shadow-md hover:border-gray-200 transition-all cursor-pointer space-y-3"
              >
                {/* Header info */}
                <div className="flex justify-between items-center text-xs">
                  <div>
                    <span className="font-mono font-bold text-gray-800">#{order.id.slice(0, 10)}</span>
                    <span className="text-[11px] text-gray-400 ml-2 font-medium">{orderDateStr}</span>
                  </div>
                  <span className={cn(
                    "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border",
                    getStatusColor(order.status)
                  )}>
                    {getStatusText(order.status)}
                  </span>
                </div>
                
                {/* Item Preview */}
                <div className="flex gap-3.5 items-center">
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-gray-100 bg-gray-50 flex items-center justify-center">
                    {displayImage ? (
                      <Image 
                        src={displayImage} 
                        alt={firstItem?.productName || 'Order item'} 
                        fill 
                        className="object-cover"
                        sizes="64px"
                      />
                    ) : (
                      <Package className="w-6 h-6 text-gray-300" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 text-xs truncate leading-snug">
                      {order.items?.map((i: any) => i.productName || i.product?.name).filter(Boolean).join(', ') || 'Package Items'}
                    </h3>
                    
                    <p className="text-[11px] text-gray-500 font-medium mt-0.5">
                      {order.items?.length || 1} {(order.items?.length || 1) === 1 ? 'item' : 'items'}
                      {order.store?.name ? ` • Sold by ${order.store.name}` : ''}
                    </p>

                    <div className="flex justify-between items-center mt-2">
                      <span className="font-black text-gray-900 text-sm">
                        {formatPrice(order.totalAmount || 0)}
                      </span>
                      
                      <div className="flex items-center gap-2">
                        {order.status === 'DELIVERED' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/orders/${order.id}/review`);
                            }}
                            className="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded-lg flex items-center gap-1 hover:bg-amber-100 transition-colors cursor-pointer"
                          >
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            <span>Rate</span>
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/orders/${order.id}/track`);
                          }}
                          className="text-[11px] font-bold text-[#FF6B00] hover:underline flex items-center gap-0.5"
                        >
                          Track <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
