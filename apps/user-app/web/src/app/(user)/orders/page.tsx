'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Package, Search, Filter } from 'lucide-react';
import { MOCK_ORDERS, OrderStatus } from '@/lib/mock/checkout';
import Image from 'next/image';
import { cn } from '@/lib/utils';

const TABS = [
  { id: 'all', label: 'All Orders' },
  { id: 'ongoing', label: 'Ongoing' },
  { id: 'delivered', label: 'Delivered' },
  { id: 'cancelled', label: 'Cancelled' },
  { id: 'returned', label: 'Returned' },
];

export default function OrderHistoryPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('all');

  // Filter orders based on tab
  const filteredOrders = MOCK_ORDERS.filter(order => {
    if (activeTab === 'all') return true;
    if (activeTab === 'ongoing') return ['CONFIRMED', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY'].includes(order.status);
    if (activeTab === 'delivered') return order.status === 'DELIVERED';
    if (activeTab === 'cancelled') return order.status === 'CANCELLED';
    if (activeTab === 'returned') return ['RETURN_REQUESTED', 'RETURNED'].includes(order.status);
    return true;
  });

  const getStatusColor = (status: OrderStatus) => {
    switch(status) {
      case 'DELIVERED': return 'bg-green-100 text-green-700 border-green-200';
      case 'CANCELLED': return 'bg-red-100 text-red-700 border-red-200';
      case 'RETURNED': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'RETURN_REQUESTED': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default: return 'bg-blue-100 text-blue-700 border-blue-200';
    }
  };

  const getStatusText = (status: OrderStatus) => {
    return status.replace(/_/g, ' ');
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-safe flex flex-col max-w-md mx-auto relative shadow-2xl">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="flex items-center justify-between px-4 py-4">
          <div className="flex items-center">
            <button onClick={() => router.back()} className="mr-4 text-gray-800">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-bold text-gray-900">My Orders</h1>
          </div>
          <div className="flex items-center gap-3 text-gray-600">
            <button><Search className="w-5 h-5" /></button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex overflow-x-auto no-scrollbar px-4 pb-0 pt-2 gap-6">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "pb-3 text-sm font-semibold whitespace-nowrap transition-colors relative",
                activeTab === tab.id ? "text-[#FF6B00]" : "text-gray-500 hover:text-gray-700"
              )}
            >
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#FF6B00] rounded-t-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        {filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Package className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">No Orders Found</h3>
            <p className="text-gray-500 text-sm">You haven't placed any orders in this category.</p>
          </div>
        ) : (
          filteredOrders.map(order => (
            <div 
              key={order.id} 
              onClick={() => router.push(`/orders/${order.id}`)}
              className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm cursor-pointer hover:border-gray-200 transition-all"
            >
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-bold text-gray-400">{order.id}</span>
                <span className={cn(
                  "text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md border",
                  getStatusColor(order.status)
                )}>
                  {getStatusText(order.status)}
                </span>
              </div>
              
              <div className="flex gap-4">
                <div className="relative w-16 h-20 rounded-lg overflow-hidden shrink-0 border border-gray-100 bg-gray-50 flex items-center justify-center">
                  {order.items.length > 0 ? (
                    <Image src={order.items[0].image} alt={order.items[0].title} fill className="object-cover" />
                  ) : (
                    <Package className="w-6 h-6 text-gray-300" />
                  )}
                </div>
                <div className="flex-1 flex flex-col justify-center">
                  <h3 className="font-bold text-gray-900 text-sm leading-tight line-clamp-2">
                    {order.items.map(i => i.title).join(', ')}
                  </h3>
                  {order.items.length > 1 && (
                    <p className="text-xs text-gray-500 font-medium mt-1">
                      + {order.items.length - 1} more item{order.items.length - 1 > 1 ? 's' : ''}
                    </p>
                  )}
                  <div className="flex justify-between items-end mt-2">
                    <p className="text-xs text-gray-400">{order.date.split(',')[0]}</p>
                    <span className="font-black text-gray-900 text-sm">₹{order.totalAmount.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
