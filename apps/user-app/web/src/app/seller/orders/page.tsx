'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SellerHeader } from '@/components/seller/SellerHeader';

// Shared Mock Data
export const MOCK_ORDERS = [
  {
    id: 'ORD1345',
    customerName: 'Rohit Kumar',
    phone: '+91 98765 43210',
    itemsCount: 2,
    total: 245,
    status: 'New',
    timeLabel: '10:30 AM',
    paymentMethod: 'Cash on Pickup',
    pickupTime: 'Today, 12:00 PM',
    items: [
      { name: 'Fortune Sunlite Oil (1L)', qty: 1, price: 165 },
      { name: 'Tata Salt (1kg)', qty: 1, price: 80 }
    ]
  },
  {
    id: 'ORD1344',
    customerName: 'Neha Singh',
    phone: '+91 98765 43211',
    itemsCount: 4,
    total: 560,
    status: 'Preparing',
    timeLabel: 'Yesterday',
    paymentMethod: 'Prepaid (UPI)',
    pickupTime: 'Today, 02:00 PM',
    items: [
      { name: 'Aashirvaad Atta (5kg)', qty: 1, price: 295 },
      { name: 'Maggi 2-Minute (70g)', qty: 3, price: 42 },
      { name: 'Sugar (1kg)', qty: 1, price: 45 },
      { name: 'Amul Butter (100g)', qty: 2, price: 178 }
    ]
  },
  {
    id: 'ORD1343',
    customerName: 'Amit Verma',
    phone: '+91 98765 43212',
    itemsCount: 3,
    total: 330,
    status: 'Completed',
    timeLabel: 'Yesterday',
    paymentMethod: 'Prepaid (Card)',
    pickupTime: 'Yesterday, 06:00 PM',
    items: [
      { name: 'Parle-G Biscuit', qty: 5, price: 50 },
      { name: 'Thumbs Up (2L)', qty: 2, price: 180 },
      { name: 'Lays Classic Salted', qty: 5, price: 100 }
    ]
  },
  {
    id: 'ORD1342',
    customerName: 'Pooja Mehta',
    phone: '+91 98765 43213',
    itemsCount: 1,
    total: 165,
    status: 'Completed',
    timeLabel: '2 days ago',
    paymentMethod: 'Cash on Pickup',
    pickupTime: '2 days ago',
    items: [
      { name: 'Fortune Sunlite Oil (1L)', qty: 1, price: 165 }
    ]
  }
];

export default function OrdersPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'All' | 'New' | 'Preparing' | 'Completed'>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredOrders = MOCK_ORDERS.filter(order => {
    const matchesTab = activeTab === 'All' || order.status === activeTab;
    const matchesSearch = !searchQuery || 
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
      order.customerName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'New':
        return <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-md uppercase tracking-wider">New</span>;
      case 'Preparing':
        return <span className="px-2 py-0.5 bg-orange-50 text-orange-600 text-[10px] font-bold rounded-md uppercase tracking-wider">Preparing</span>;
      case 'Completed':
        return <span className="px-2 py-0.5 bg-green-50 text-green-600 text-[10px] font-bold rounded-md uppercase tracking-wider">Completed</span>;
      default:
        return null;
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
        {filteredOrders.map((order, idx) => (
          <div 
            key={order.id} 
            className={`p-4 flex flex-col gap-3 bg-white cursor-pointer active:bg-gray-50 transition-colors ${idx !== filteredOrders.length - 1 ? 'border-b border-[#F2EFE9]' : ''}`}
            onClick={() => router.push(`/seller/orders/details?id=${order.id}`)}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#171717] text-[15px]">#{order.id}</span>
              {getStatusBadge(order.status)}
            </div>
            
            <div className="flex items-end justify-between mt-1">
              <div>
                <p className="font-bold text-[#171717] text-[15px] leading-tight">{order.customerName}</p>
                <p className="text-xs text-[#6B6B6B] mt-1 font-medium">{order.itemsCount} {order.itemsCount > 1 ? 'items' : 'item'} • ₹{order.total}</p>
              </div>
              <p className="text-[11px] text-[#999999] font-medium uppercase tracking-wider">{order.timeLabel}</p>
            </div>
          </div>
        ))}

        {filteredOrders.length === 0 && (
          <div className="text-center py-12 text-[#6B6B6B] text-sm">
            No orders found in this category.
          </div>
        )}
      </div>
    </div>
  );
}
