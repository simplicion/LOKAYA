'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ChevronDown, TrendingUp } from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';

const mockOrderData = [
  { name: '01 May', orders: 15, revenue: 8 },
  { name: '08 May', orders: 28, revenue: 18 },
  { name: '15 May', orders: 20, revenue: 14 },
  { name: '22 May', orders: 35, revenue: 23 },
  { name: '29 May', orders: 25, revenue: 19 },
  { name: '31 May', orders: 45, revenue: 30 },
];

export default function OrderAnalyticsPage() {
  const router = useRouter();
  const [dateRange, setDateRange] = useState('This Month');

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white px-4 py-4 sticky top-0 z-10 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="text-gray-900">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-gray-900">Order Analytics</h1>
        </div>
        
        <button className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-200">
          <span className="text-sm font-medium text-gray-700">{dateRange}</span>
          <ChevronDown className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      <div className="p-4 space-y-6">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-xs text-gray-500 mb-1">Total Orders</p>
            <div className="flex flex-col">
              <p className="text-xl font-bold text-gray-900">256</p>
              <span className="text-xs font-medium text-emerald-600 flex items-center mt-1">
                <TrendingUp className="w-3 h-3 mr-0.5" /> 18.6%
              </span>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-xs text-gray-500 mb-1">Completed</p>
            <div className="flex flex-col">
              <p className="text-xl font-bold text-gray-900">240</p>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-xs text-gray-500 mb-1">Cancelled</p>
            <div className="flex flex-col">
              <p className="text-xl font-bold text-gray-900">16</p>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-xs text-gray-500 mb-1">Pending</p>
            <div className="flex flex-col">
              <p className="text-xl font-bold text-gray-900">6</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
          <h2 className="text-sm font-bold text-gray-900 mb-4">Order vs Revenue</h2>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mockOrderData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#6b7280' }} 
                  dy={10}
                />
                <YAxis 
                  yAxisId="left"
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#6b7280' }}
                  tickFormatter={(value) => `${value}k`}
                />
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#6b7280' }}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="revenue" 
                  name="Revenue (k)"
                  stroke="#10b981" 
                  strokeWidth={2}
                  dot={{ r: 4, strokeWidth: 2 }}
                  activeDot={{ r: 6 }}
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="orders" 
                  name="Orders"
                  stroke="#4f46e5" 
                  strokeWidth={2}
                  dot={{ r: 4, strokeWidth: 2 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
