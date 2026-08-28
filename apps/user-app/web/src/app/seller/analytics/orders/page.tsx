'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ChevronDown, TrendingUp } from 'lucide-react';
import { SellerHeader } from '@/components/seller/SellerHeader';
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
  const [isDateSelectorOpen, setIsDateSelectorOpen] = useState(false);
  const [activeDateFilter, setActiveDateFilter] = useState('This Month');

  return (
    <div className="min-h-screen bg-[#FFFFFF] pb-20">
      <SellerHeader 
        title="Order Analytics"
        showBack={true}
        onBack={() => router.back()}
        hideSearchIcon={true}
        rightAction={
          <button 
            onClick={() => setIsDateSelectorOpen(true)}
            className="flex items-center gap-1.5 bg-[#F9F9F9] pl-3 pr-2 py-1 rounded-full border border-[#E5E2DC]"
          >
            <span className="text-xs font-semibold text-[#171717]">{activeDateFilter}</span>
            <ChevronDown className="w-3.5 h-3.5 text-[#6B6B6B]" />
          </button>
        }
      />
      
      {/* Date Selector Modal */}
      {isDateSelectorOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-[#FFFFFF] w-full max-w-sm rounded-t-3xl sm:rounded-[1.25rem] p-6 animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-0 sm:fade-in">
            <h3 className="text-xl font-bold text-[#171717] mb-4">Select Date Range</h3>
            
            <div className="grid grid-cols-2 gap-3 mb-4">
              {['Today', 'Yesterday', 'This Week', 'This Month', 'Last Month', 'This Year'].map((range) => (
                <button
                  key={range}
                  onClick={() => {
                    setActiveDateFilter(range);
                    setIsDateSelectorOpen(false);
                  }}
                  className={`py-3 px-4 rounded-[1.25rem] border text-sm font-semibold text-center transition-colors ${
                    activeDateFilter === range 
                      ? 'bg-[#171717] text-white border-[#171717]' 
                      : 'bg-[#FFFFFF] text-[#6B6B6B] border-[#E5E2DC] hover:border-[#171717]'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
            
            <button 
              className="w-full h-12 bg-[#FF5A36] hover:bg-[#E04B2A] text-white font-bold rounded-[1.25rem]"
              onClick={() => setIsDateSelectorOpen(false)}
            >
              Apply Filter
            </button>
          </div>
        </div>
      )}

      <div className="p-4 space-y-6">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#FFFFFF] p-4 rounded-[1.25rem] border border-[#E5E2DC]">
            <p className="text-xs text-[#6B6B6B] mb-1 font-medium">Total Orders</p>
            <div className="flex flex-col">
              <p className="text-xl font-bold text-[#171717]">256</p>
              <div className="flex mt-1.5">
                <span className="text-[10px] font-bold text-[#00B960] bg-[#E5F7ED] px-1.5 py-0.5 rounded-md flex items-center">
                  <TrendingUp className="w-3 h-3 mr-0.5" /> 18.6%
                </span>
              </div>
            </div>
          </div>
          
          <div className="bg-[#FFFFFF] p-4 rounded-[1.25rem] border border-[#E5E2DC]">
            <p className="text-xs text-[#6B6B6B] mb-1 font-medium">Completed</p>
            <div className="flex flex-col">
              <p className="text-xl font-bold text-[#171717]">240</p>
            </div>
          </div>
          
          <div className="bg-[#FFFFFF] p-4 rounded-[1.25rem] border border-[#E5E2DC]">
            <p className="text-xs text-[#6B6B6B] mb-1 font-medium">Cancelled</p>
            <div className="flex flex-col">
              <p className="text-xl font-bold text-[#171717]">16</p>
            </div>
          </div>
          
          <div className="bg-[#FFFFFF] p-4 rounded-[1.25rem] border border-[#E5E2DC]">
            <p className="text-xs text-[#6B6B6B] mb-1 font-medium">Pending</p>
            <div className="flex flex-col">
              <p className="text-xl font-bold text-[#171717]">6</p>
            </div>
          </div>
        </div>

        <div className="bg-[#FFFFFF] p-4 rounded-[1.25rem] border border-[#E5E2DC]">
          <h2 className="text-sm font-bold text-[#171717] mb-4">Order vs Revenue</h2>
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
                  contentStyle={{ borderRadius: '1.25rem', border: '1px solid #E5E2DC', boxShadow: 'none' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="revenue" 
                  name="Revenue (k)"
                  stroke="#FF5A36" 
                  strokeWidth={2}
                  dot={{ r: 4, strokeWidth: 2 }}
                  activeDot={{ r: 6 }}
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="orders" 
                  name="Orders"
                  stroke="#171717" 
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
