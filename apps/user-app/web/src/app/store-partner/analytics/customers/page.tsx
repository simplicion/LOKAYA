'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ChevronDown, TrendingUp } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const mockPieData = [
  { name: 'Returning', value: 74 },
  { name: 'New', value: 24 },
];
const COLORS = ['#4f46e5', '#a5b4fc'];

const mockTopCustomers = [
  { id: 1, name: 'Priya Sharma', orders: 12, spent: 4250, initials: 'PS', color: 'bg-rose-100 text-rose-700' },
  { id: 2, name: 'Rahul Verma', orders: 9, spent: 3150, initials: 'RV', color: 'bg-blue-100 text-blue-700' },
  { id: 3, name: 'Ankit Kumar', orders: 8, spent: 2785, initials: 'AK', color: 'bg-emerald-100 text-emerald-700' },
  { id: 4, name: 'Neha Singh', orders: 7, spent: 2450, initials: 'NS', color: 'bg-amber-100 text-amber-700' },
  { id: 5, name: 'Vikas Patel', orders: 6, spent: 2100, initials: 'VP', color: 'bg-purple-100 text-purple-700' },
];

export default function CustomerAnalyticsPage() {
  const router = useRouter();
  const [dateRange, setDateRange] = useState('This Month');

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white px-4 py-4 sticky top-0 z-10 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="text-gray-900">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-gray-900">Customer Analytics</h1>
        </div>
        
        <button className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-200">
          <span className="text-sm font-medium text-gray-700">{dateRange}</span>
          <ChevronDown className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      <div className="p-4 space-y-6">
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm text-center">
            <p className="text-xs text-gray-500 mb-1">Total</p>
            <p className="text-lg font-bold text-gray-900">98</p>
            <span className="text-[10px] font-medium text-emerald-600 flex items-center justify-center mt-1">
              <TrendingUp className="w-3 h-3 mr-0.5" /> 16.2%
            </span>
          </div>
          
          <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm text-center">
            <p className="text-xs text-gray-500 mb-1">New</p>
            <p className="text-lg font-bold text-gray-900">24</p>
            <span className="text-[10px] font-medium text-emerald-600 flex items-center justify-center mt-1">
              <TrendingUp className="w-3 h-3 mr-0.5" /> 28.6%
            </span>
          </div>
          
          <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm text-center">
            <p className="text-xs text-gray-500 mb-1">Repeat</p>
            <p className="text-lg font-bold text-gray-900">74</p>
            <span className="text-[10px] font-medium text-emerald-600 flex items-center justify-center mt-1">
              <TrendingUp className="w-3 h-3 mr-0.5" /> 14.5%
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
          <h2 className="text-sm font-bold text-gray-900 mb-4">New vs Returning Customers</h2>
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

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-50">
            <h2 className="text-sm font-bold text-gray-900">Top Customers</h2>
          </div>
          
          <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 grid grid-cols-12 gap-2 text-xs font-semibold text-gray-500">
            <div className="col-span-6">Customer</div>
            <div className="col-span-3 text-center">Orders</div>
            <div className="col-span-3 text-right">Spent</div>
          </div>
          
          {mockTopCustomers.map((customer) => (
            <div 
              key={customer.id}
              className="px-4 py-3 border-b border-gray-50 flex items-center justify-between"
            >
              <div className="flex items-center gap-3 w-1/2">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${customer.color}`}>
                  {customer.initials}
                </div>
                <p className="font-semibold text-gray-900 text-sm truncate">{customer.name}</p>
              </div>
              
              <div className="w-1/4 text-center">
                <p className="font-medium text-gray-700 text-sm">{customer.orders}</p>
              </div>
              
              <div className="w-1/4 text-right">
                <p className="font-bold text-gray-900 text-sm">₹{customer.spent.toLocaleString()}</p>
              </div>
            </div>
          ))}
          
          <div className="p-4 bg-gray-50/50">
            <button className="w-full py-2.5 rounded-xl border border-indigo-200 text-indigo-600 font-semibold text-sm hover:bg-indigo-50 transition-colors">
              View All Customers
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
