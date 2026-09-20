'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ChevronDown, TrendingUp, Users } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { SellerHeader } from '@/components/seller/SellerHeader';
import { DateRangeModal } from '@/components/seller/DateRangeModal';
import { useGetAnalyticsCustomersQuery } from '@/lib/api';
import { useCurrency } from '@/context/CurrencyContext';

const COLORS = ['#FF5A36', '#FFEBEE'];

export default function CustomerAnalyticsPage() {
  const router = useRouter();
  const { formatPrice } = useCurrency();
  const [activeDateFilter, setActiveDateFilter] = useState('This Month');
  const [isDateSelectorOpen, setIsDateSelectorOpen] = useState(false);

  const { data, isLoading } = useGetAnalyticsCustomersQuery(activeDateFilter);

  const totalCustomers = data?.totalCustomers ?? 0;
  const newCustomers = (data as any)?.newCount ?? 0;
  const repeatCustomers = (data as any)?.returningCount ?? 0;
  const pieData = data?.pieData && (data.pieData[0]?.value > 0 || data.pieData[1]?.value > 0)
    ? data.pieData
    : [{ name: 'Returning', value: repeatCustomers }, { name: 'New', value: newCustomers }];
  const topCustomers = data?.topCustomers || [];

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

      <DateRangeModal
        isOpen={isDateSelectorOpen}
        onClose={() => setIsDateSelectorOpen(false)}
        selectedRange={activeDateFilter}
        onSelectRange={(range) => {
          setActiveDateFilter(range);
          setIsDateSelectorOpen(false);
        }}
      />

      <div className="p-4 space-y-6">
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-[#FFFFFF] p-3 rounded-[1.25rem] border border-[#E5E2DC] shadow-sm text-center">
            <p className="text-xs text-[#6B6B6B] mb-1">Total</p>
            <p className="text-lg font-bold text-[#171717]">{isLoading ? '...' : totalCustomers}</p>
            <span className="inline-flex items-center justify-center mt-1 px-1.5 py-0.5 rounded-full bg-[#E5F7ED] text-[#00B960] text-[10px] font-bold">
              <TrendingUp className="w-2.5 h-2.5 mr-0.5" /> +{totalCustomers > 0 ? '100%' : '0%'}
            </span>
          </div>
          
          <div className="bg-[#FFFFFF] p-3 rounded-[1.25rem] border border-[#E5E2DC] shadow-sm text-center">
            <p className="text-xs text-[#6B6B6B] mb-1">New</p>
            <p className="text-lg font-bold text-[#171717]">{isLoading ? '...' : newCustomers}</p>
            <span className="inline-flex items-center justify-center mt-1 px-1.5 py-0.5 rounded-full bg-[#E5F7ED] text-[#00B960] text-[10px] font-bold">
              <TrendingUp className="w-2.5 h-2.5 mr-0.5" /> {totalCustomers > 0 ? `${Math.round((newCustomers / totalCustomers) * 100)}%` : '0%'}
            </span>
          </div>
          
          <div className="bg-[#FFFFFF] p-3 rounded-[1.25rem] border border-[#E5E2DC] shadow-sm text-center">
            <p className="text-xs text-[#6B6B6B] mb-1">Repeat</p>
            <p className="text-lg font-bold text-[#171717]">{isLoading ? '...' : repeatCustomers}</p>
            <span className="inline-flex items-center justify-center mt-1 px-1.5 py-0.5 rounded-full bg-[#E5F7ED] text-[#00B960] text-[10px] font-bold">
              <TrendingUp className="w-2.5 h-2.5 mr-0.5" /> {totalCustomers > 0 ? `${Math.round((repeatCustomers / totalCustomers) * 100)}%` : '0%'}
            </span>
          </div>
        </div>

        <div className="bg-[#FFFFFF] p-4 rounded-[1.25rem] border border-[#E5E2DC] shadow-sm">
          <h2 className="text-sm font-bold text-[#171717] mb-4">New vs Returning Customers</h2>
          <div className="h-[200px] w-full flex justify-center items-center">
            {pieData.every(d => d.value === 0) ? (
              <div className="text-center text-xs text-stone-400 py-10">
                <Users className="w-8 h-8 mx-auto mb-2 text-stone-300" />
                No customer orders recorded yet for this period
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} verticalAlign="middle" align="right" layout="vertical" />
                </PieChart>
              </ResponsiveContainer>
            )}
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
          
          {topCustomers.length === 0 ? (
            <div className="p-8 text-center text-xs text-stone-400">
              No top customer records found for this period
            </div>
          ) : (
            topCustomers.map((customer) => (
              <div 
                key={customer.id}
                className="px-4 py-3 border-b border-[#E5E2DC] flex items-center justify-between"
              >
                <div className="flex items-center gap-3 w-1/2">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${customer.color || 'bg-rose-100 text-rose-700'}`}>
                    {customer.initials || 'CU'}
                  </div>
                  <p className="font-semibold text-[#171717] text-sm truncate">{customer.name || 'Customer'}</p>
                </div>
                
                <div className="w-1/4 text-center">
                  <p className="font-medium text-[#6B6B6B] text-sm">{customer.orders}</p>
                </div>
                
                <div className="w-1/4 text-right">
                  <p className="font-bold text-[#171717] text-sm">{formatPrice(customer.spent)}</p>
                </div>
              </div>
            ))
          )}
          
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
