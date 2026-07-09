'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

const orders = [
  { id: 'ORD13345', store: 'FreshMart', date: '21 May, 12:00 PM', amount: '₹135', status: 'Completed', statusColor: 'bg-emerald-50 text-emerald-600' },
  { id: 'ORD13344', store: 'Daily Needs', date: '20 May, 3:30 PM', amount: '₹240', status: 'Completed', statusColor: 'bg-emerald-50 text-emerald-600' },
  { id: 'ORD12343', store: 'Super Store', date: '19 May, 11:20 AM', amount: '₹310', status: 'Canceled', statusColor: 'bg-red-50 text-red-500' },
  { id: 'ORD12342', store: 'Green Grocer', date: '18 May, 6:15 PM', amount: '₹180', status: 'Completed', statusColor: 'bg-emerald-50 text-emerald-600' },
];

export default function MyOrdersPage() {
  const router = useRouter();
  
  return (
    <div className="flex flex-col min-h-screen bg-gray-50/50 pb-safe">
      {/* Header */}
      <div className="flex items-center justify-center py-4 relative px-4 sticky top-0 bg-white z-50">
        <button onClick={() => router.back()} className="absolute left-4 p-2 -ml-2 rounded-full hover:bg-gray-50 text-gray-700">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-bold text-[17px] text-gray-900">My Orders</h1>
      </div>

      {/* Tabs */}
      <div className="flex items-center px-4 bg-white border-b border-gray-100 sticky top-[60px] z-40">
        <button className="flex-1 py-3 text-center border-b-2 border-indigo-600 text-indigo-600 font-bold text-[13px]">All</button>
        <button className="flex-1 py-3 text-center text-gray-500 font-medium text-[13px]">Completed</button>
        <button className="flex-1 py-3 text-center text-gray-500 font-medium text-[13px]">Canceled</button>
      </div>

      <div className="flex flex-col gap-3 p-4">
        {orders.map(order => (
          <div 
            key={order.id} 
            onClick={() => router.push(`/home/orders/${order.id}`)}
            className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col cursor-pointer active:scale-[0.98] transition-transform"
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="font-bold text-gray-900 text-[14px] mb-1">#{order.id}</p>
                <p className="font-semibold text-gray-500 text-[14px]">{order.store}</p>
              </div>
              <p className="font-black text-gray-900 text-[16px]">{order.amount}</p>
            </div>
            
            <div className="flex justify-between items-center mt-3">
              <p className="text-gray-400 text-[12px] font-medium">{order.date}</p>
              <div className={`px-2.5 py-0.5 rounded text-[11px] font-bold ${order.statusColor}`}>
                {order.status}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
