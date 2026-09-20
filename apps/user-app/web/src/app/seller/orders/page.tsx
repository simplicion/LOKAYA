'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SellerHeader } from '@/components/seller/SellerHeader';
import { useGetMyStoreQuery, useGetStoreOrdersQuery } from '@/lib/api';
import { Loader2 } from 'lucide-react';
import { useCurrency } from '@/context/CurrencyContext';

export default function OrdersPage() {
  const router = useRouter();
  const { formatPrice } = useCurrency();
  const [activeTab, setActiveTab] = useState<'All' | 'New' | 'Preparing' | 'Completed'>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: storeData } = useGetMyStoreQuery();
  const { data: ordersResponse, isLoading } = useGetStoreOrdersQuery(
    {
      storeId: storeData?.id || '',
      tab: activeTab,
      search: searchQuery
    },
    { skip: !storeData?.id }
  );

  const orders = ordersResponse?.orders || [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'New':
        return <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-md uppercase tracking-wider">New</span>;
      case 'Preparing':
        return <span className="px-2 py-0.5 bg-orange-50 text-orange-600 text-[10px] font-bold rounded-md uppercase tracking-wider">Preparing</span>;
      case 'Ready':
        return <span className="px-2 py-0.5 bg-purple-50 text-purple-600 text-[10px] font-bold rounded-md uppercase tracking-wider">Ready for Pickup</span>;
      case 'Completed':
        return <span className="px-2 py-0.5 bg-green-50 text-green-600 text-[10px] font-bold rounded-md uppercase tracking-wider">Completed</span>;
      default:
        return <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-[10px] font-bold rounded-md uppercase tracking-wider">{status}</span>;
    }
  };

  return (
    <div className="flex flex-col min-h-[100dvh] bg-white pb-24">
      {/* Top Header */}
      <SellerHeader 
        title="Orders" 
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Category Tags (Tabs) */}
      <div className="bg-white border-b border-[#E5E2DC]">
        <div className="flex overflow-x-auto no-scrollbar px-4 py-3 gap-6">
          {['All', 'New', 'Preparing', 'Completed'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`text-sm font-semibold whitespace-nowrap transition-colors px-5 py-1.5 rounded-full ${
                activeTab === tab 
                  ? 'bg-[#171717] text-white' 
                  : 'text-[#6B6B6B] bg-transparent'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      <div className="flex-1 bg-white">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-[#FF5A36]" />
          </div>
        ) : (
          <>
            {orders.map((order, idx) => (
              <div 
                key={order.id} 
                className={`p-4 flex flex-col gap-3 bg-white cursor-pointer active:bg-gray-50 transition-colors ${idx !== orders.length - 1 ? 'border-b border-[#F2EFE9]' : ''}`}
                onClick={() => router.push(`/seller/orders/details?id=${order.id}`)}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#171717] text-[15px]">#{order.id.slice(0, 8).toUpperCase()}</span>
                  {getStatusBadge(order.status)}
                </div>
                
                <div className="flex items-end justify-between mt-1">
                  <div>
                    <p className="font-bold text-[#171717] text-[15px] leading-tight">{order.customerName}</p>
                    <p className="text-xs text-[#6B6B6B] mt-1 font-medium">{order.itemsCount} {order.itemsCount > 1 ? 'items' : 'item'} • {formatPrice(typeof order.total === 'number' ? order.total : parseFloat(String(order.total).replace(/[^0-9.]/g, '')) || 0)}</p>
                  </div>
                  <p className="text-[11px] text-[#999999] font-medium uppercase tracking-wider">{order.timeLabel}</p>
                </div>
              </div>
            ))}

            {orders.length === 0 && (
              <div className="text-center py-16 text-[#6B6B6B] text-sm">
                No orders found in this category.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
