'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

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

  const filteredOrders = MOCK_ORDERS.filter(order => {
    if (activeTab === 'All') return true;
    return order.status === activeTab;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'New':
        return <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-xs font-bold rounded-lg">New</span>;
      case 'Preparing':
        return <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded-lg">Preparing</span>;
      case 'Completed':
        return <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-lg">Completed</span>;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-gray-50 pb-20">
      {/* Header */}
      <div className="flex items-center p-4 bg-white sticky top-0 z-10 border-b border-gray-100">
        <button onClick={() => router.back()} className="p-2 -ml-2 rounded-full hover:bg-gray-100 text-gray-600">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="flex-1 text-lg font-bold text-center mr-8 text-gray-900">
          Orders
        </h1>
      </div>

      {/* Tabs */}
      <div className="px-4 py-3 bg-white border-b border-gray-100 overflow-x-auto hide-scrollbar">
        <div className="flex gap-2 min-w-max">
          {['All', 'New', 'Preparing', 'Completed'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-5 py-2 rounded-xl text-sm font-semibold transition-colors ${
                activeTab === tab 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {filteredOrders.map(order => (
          <div 
            key={order.id} 
            className="bg-white p-4 rounded-2xl cursor-pointer active:scale-[0.99] transition-transform shadow-sm border border-gray-100 flex flex-col gap-3"
            onClick={() => router.push(`/store-partner/orders/details?id=${order.id}`)}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-gray-900">#{order.id}</span>
              {getStatusBadge(order.status)}
            </div>
            
            <div className="flex items-end justify-between">
              <div>
                <p className="font-semibold text-gray-900">{order.customerName}</p>
                <p className="text-sm text-gray-500 mt-1">{order.itemsCount} {order.itemsCount > 1 ? 'items' : 'item'} - ₹{order.total}</p>
              </div>
              <p className="text-sm text-gray-400 font-medium">{order.timeLabel}</p>
            </div>
          </div>
        ))}

        {filteredOrders.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No orders found in this category.
          </div>
        )}
      </div>
    </div>
  );
}
