'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ChevronDown, TrendingUp } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { SellerHeader } from '@/components/seller/SellerHeader';

const mockPieData = [
  { name: 'Returning', value: 74 },
  { name: 'New', value: 24 },
];
const COLORS = ['#FF5A36', '#FFEBEE'];

const mockTopCustomers = [
  { id: 1, name: 'Priya Sharma', orders: 12, spent: 4250, initials: 'PS', color: 'bg-rose-100 text-rose-700' },
  { id: 2, name: 'Rahul Verma', orders: 9, spent: 3150, initials: 'RV', color: 'bg-blue-100 text-blue-700' },
  { id: 3, name: 'Ankit Kumar', orders: 8, spent: 2785, initials: 'AK', color: 'bg-emerald-100 text-emerald-700' },
  { id: 4, name: 'Neha Singh', orders: 7, spent: 2450, initials: 'NS', color: 'bg-amber-100 text-amber-700' },
  { id: 5, name: 'Vikas Patel', orders: 6, spent: 2100, initials: 'VP', color: 'bg-purple-100 text-purple-700' },
];

export default function CustomerAnalyticsPage() {
  const router = useRouter();
  const [activeDateFilter, setActiveDateFilter] = useState('This Month');
  const [isDateSelectorOpen, setIsDateSelectorOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#FFFFFF] pb-20">
      <SellerHeader 
        title="Customer Analytics"
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
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-[#FFFFFF] p-3 rounded-[1.25rem] border border-[#E5E2DC] shadow-sm text-center">
            <p className="text-xs text-[#6B6B6B] mb-1">Total</p>
            <p className="text-lg font-bold text-[#171717]">98</p>
            <span className="inline-flex items-center justify-center mt-1 px-1.5 py-0.5 rounded-full bg-[#E5F7ED] text-[#00B960] text-[10px] font-bold">
              <TrendingUp className="w-2.5 h-2.5 mr-0.5" /> 16.2%
            </span>
          </div>
          
          <div className="bg-[#FFFFFF] p-3 rounded-[1.25rem] border border-[#E5E2DC] shadow-sm text-center">
            <p className="text-xs text-[#6B6B6B] mb-1">New</p>
            <p className="text-lg font-bold text-[#171717]">24</p>
            <span className="inline-flex items-center justify-center mt-1 px-1.5 py-0.5 rounded-full bg-[#E5F7ED] text-[#00B960] text-[10px] font-bold">
              <TrendingUp className="w-2.5 h-2.5 mr-0.5" /> 28.6%
            </span>
          </div>
          
          <div className="bg-[#FFFFFF] p-3 rounded-[1.25rem] border border-[#E5E2DC] shadow-sm text-center">
            <p className="text-xs text-[#6B6B6B] mb-1">Repeat</p>
            <p className="text-lg font-bold text-[#171717]">74</p>
            <span className="inline-flex items-center justify-center mt-1 px-1.5 py-0.5 rounded-full bg-[#E5F7ED] text-[#00B960] text-[10px] font-bold">
              <TrendingUp className="w-2.5 h-2.5 mr-0.5" /> 14.5%
            </span>
          </div>
        </div>

        <div className="bg-[#FFFFFF] p-4 rounded-[1.25rem] border border-[#E5E2DC] shadow-sm">
          <h2 className="text-sm font-bold text-[#171717] mb-4">New vs Returning Customers</h2>
          <div className="h-[200px] w-full flex justify-center items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={mockPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {mockPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} verticalAlign="middle" align="right" layout="vertical" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[#FFFFFF] rounded-[1.25rem] border border-[#E5E2DC] shadow-sm overflow-hidden">
          <div className="p-4 border-b border-[#E5E2DC]">
            <h2 className="text-sm font-bold text-[#171717]">Top Customers</h2>
          </div>
          
          <div className="px-4 py-2 bg-[#F9F9F9] border-b border-[#E5E2DC] grid grid-cols-12 gap-2 text-xs font-semibold text-[#6B6B6B]">
            <div className="col-span-6">Customer</div>
            <div className="col-span-3 text-center">Orders</div>
            <div className="col-span-3 text-right">Spent</div>
          </div>
          
          {mockTopCustomers.map((customer) => (
            <div 
              key={customer.id}
              className="px-4 py-3 border-b border-[#E5E2DC] flex items-center justify-between"
            >
              <div className="flex items-center gap-3 w-1/2">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${customer.color}`}>
                  {customer.initials}
                </div>
                <p className="font-semibold text-[#171717] text-sm truncate">{customer.name}</p>
              </div>
              
              <div className="w-1/4 text-center">
                <p className="font-medium text-[#6B6B6B] text-sm">{customer.orders}</p>
              </div>
              
              <div className="w-1/4 text-right">
                <p className="font-bold text-[#171717] text-sm">₹{customer.spent.toLocaleString()}</p>
              </div>
            </div>
          ))}
          
          <div className="p-4 bg-[#F9F9F9]/50">
            <button className="w-full py-2.5 rounded-[1.25rem] border border-[#FF5A36]/30 text-[#FF5A36] font-semibold text-sm hover:bg-[#FFEBEE] transition-colors">
              View All Customers
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
