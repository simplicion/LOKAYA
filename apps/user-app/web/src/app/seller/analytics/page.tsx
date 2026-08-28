'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  ChevronDown, 
  TrendingUp, 
  Package, 
  Users, 
  IndianRupee,
  ChevronRight,
  PieChart,
  Wallet,
  Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

const mockData = [
  { name: '01 May', revenue: 8000 },
  { name: '08 May', revenue: 18000 },
  { name: '15 May', revenue: 14000 },
  { name: '22 May', revenue: 23000 },
  { name: '29 May', revenue: 19000 },
  { name: '31 May', revenue: 30000 },
];

export default function AnalyticsPage() {
  const router = useRouter();
  const [dateRange, setDateRange] = useState('This Month');
  const [isDateSelectorOpen, setIsDateSelectorOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white px-4 py-4 sticky top-0 z-10 border-b border-gray-100 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Analytics Overview</h1>
        
        <button 
          onClick={() => setIsDateSelectorOpen(!isDateSelectorOpen)}
          className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-200"
        >
          <span className="text-sm font-medium text-gray-700">{dateRange}</span>
          <ChevronDown className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      {/* Date Selector Modal (simplified for now) */}
      {isDateSelectorOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-t-3xl sm:rounded-2xl p-6 animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-0 sm:fade-in">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Select Date Range</h3>
            
            <div className="grid grid-cols-2 gap-3 mb-4">
              {['Today', 'Yesterday', 'This Week', 'This Month', 'Last Month', 'This Year'].map((range) => (
                <button
                  key={range}
                  onClick={() => {
                    setDateRange(range);
                    setIsDateSelectorOpen(false);
                  }}
                  className={`py-3 px-4 rounded-xl border text-sm font-medium text-center transition-colors ${
                    dateRange === range 
                      ? 'bg-indigo-600 text-white border-indigo-600' 
                      : 'bg-white text-gray-700 border-gray-200 hover:border-indigo-200'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
            
            <Button 
              variant="outline" 
              className="w-full h-12 rounded-xl mb-4"
              onClick={() => setIsDateSelectorOpen(false)}
            >
              Custom Range
            </Button>
            
            <Button 
              className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 rounded-xl"
              onClick={() => setIsDateSelectorOpen(false)}
            >
              Apply Filter
            </Button>
          </div>
        </div>
      )}

      <div className="p-4 space-y-6">
        {/* Overview Cards */}
        <div>
          <h2 className="text-sm font-bold text-gray-900 mb-3">Overview</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
              <p className="text-xs text-gray-500 mb-1">Total Orders</p>
              <div className="flex items-end justify-between">
                <p className="text-xl font-bold text-gray-900">256</p>
                <span className="text-xs font-medium text-emerald-600 flex items-center">
                  <TrendingUp className="w-3 h-3 mr-0.5" /> 18.6%
                </span>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
              <p className="text-xs text-gray-500 mb-1">Total Revenue</p>
              <div className="flex items-end justify-between">
                <p className="text-xl font-bold text-gray-900">₹45,860</p>
                <span className="text-xs font-medium text-emerald-600 flex items-center">
                  <TrendingUp className="w-3 h-3 mr-0.5" /> 22.3%
                </span>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
              <p className="text-xs text-gray-500 mb-1">Avg. Order Value</p>
              <div className="flex items-end justify-between">
                <p className="text-xl font-bold text-gray-900">₹179</p>
                <span className="text-xs font-medium text-emerald-600 flex items-center">
                  <TrendingUp className="w-3 h-3 mr-0.5" /> 12.3%
                </span>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
              <p className="text-xs text-gray-500 mb-1">Total Customers</p>
              <div className="flex items-end justify-between">
                <p className="text-xl font-bold text-gray-900">98</p>
                <span className="text-xs font-medium text-emerald-600 flex items-center">
                  <TrendingUp className="w-3 h-3 mr-0.5" /> 16.2%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Revenue Overview Chart */}
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
          <h2 className="text-sm font-bold text-gray-900 mb-4">Revenue Overview</h2>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#6b7280' }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#6b7280' }}
                  tickFormatter={(value) => `₹${value/1000}k`}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: any) => [`₹${value}`, 'Revenue']}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#4f46e5" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorRevenue)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Detailed Reports Links */}
        <div>
          <h2 className="text-sm font-bold text-gray-900 mb-3">Detailed Reports</h2>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <button 
              onClick={() => router.push('/seller/analytics/sales-revenue')}
              className="w-full flex items-center justify-between p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <IndianRupee className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-900 text-sm">Sales & Revenue</p>
                  <p className="text-xs text-gray-500">Gross sales, net revenue, and margins</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
            
            <button 
              onClick={() => router.push('/seller/analytics/orders')}
              className="w-full flex items-center justify-between p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                  <Package className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-900 text-sm">Order Analytics</p>
                  <p className="text-xs text-gray-500">Order performance and trends</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
            
            <button 
              onClick={() => router.push('/seller/analytics/products')}
              className="w-full flex items-center justify-between p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-600">
                  <PieChart className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-900 text-sm">Product Analytics</p>
                  <p className="text-xs text-gray-500">Top selling items and categories</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>

            <button 
              onClick={() => router.push('/seller/analytics/customers')}
              className="w-full flex items-center justify-between p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <Users className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-900 text-sm">Customer Analytics</p>
                  <p className="text-xs text-gray-500">Acquisition and top customers</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
            
            <button 
              onClick={() => router.push('/seller/finance')}
              className="w-full flex items-center justify-between p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <Wallet className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-900 text-sm">Finance & Payouts</p>
                  <p className="text-xs text-gray-500">Revenue, balance, and banking</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
            
            <button 
              onClick={() => router.push('/seller/analytics/export')}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-700">
                  <Download className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-900 text-sm">Export Reports</p>
                  <p className="text-xs text-gray-500">Download data in PDF, Excel</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
