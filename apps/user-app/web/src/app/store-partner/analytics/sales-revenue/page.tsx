'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  ChevronDown, 
  IndianRupee, 
  TrendingUp, 
  Package, 
  TrendingDown,
  PieChart,
  ShoppingCart
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import Image from 'next/image';

const mockChartData = [
  { name: '01 May', gross: 12000, net: 3000 },
  { name: '08 May', gross: 18000, net: 4500 },
  { name: '15 May', gross: 14000, net: 3800 },
  { name: '22 May', gross: 23000, net: 6200 },
  { name: '29 May', gross: 19000, net: 5100 },
  { name: '31 May', gross: 30000, net: 8500 },
];

const mockProducts = [
  { 
    id: 1, 
    name: 'Fortune Sunlite Refined Sunflower Oil', 
    sold: 145, 
    cp: 145, 
    sp: 165,
    image: 'https://images.unsplash.com/photo-1625937286074-9ca519d5d9df?auto=format&fit=crop&q=80&w=100&h=100'
  },
  { 
    id: 2, 
    name: 'Aashirvaad Superior MP Sharbati Atta', 
    sold: 89, 
    cp: 260, 
    sp: 295,
    image: 'https://images.unsplash.com/photo-1574316071802-0d684efa7ab5?auto=format&fit=crop&q=80&w=100&h=100'
  },
  { 
    id: 3, 
    name: 'Tata Salt Iodized', 
    sold: 312, 
    cp: 20, 
    sp: 25,
    image: 'https://images.unsplash.com/photo-1626815340656-3c0762cf0508?auto=format&fit=crop&q=80&w=100&h=100'
  },
  { 
    id: 4, 
    name: 'Maggi 2-Minute Noodles Masala', 
    sold: 450, 
    cp: 11, 
    sp: 14,
    image: 'https://images.unsplash.com/photo-1605631248404-e51c8535a0ce?auto=format&fit=crop&q=80&w=100&h=100'
  },
];

export default function SalesRevenueAnalyticsPage() {
  const router = useRouter();
  const [dateRange, setDateRange] = useState('This Month');
  const [isDateSelectorOpen, setIsDateSelectorOpen] = useState(false);

  // Derived calculations for the overview cards based on mockProducts
  const totalItemsSold = mockProducts.reduce((acc, curr) => acc + curr.sold, 0);
  const grossSales = mockProducts.reduce((acc, curr) => acc + (curr.sold * curr.sp), 0);
  const totalCost = mockProducts.reduce((acc, curr) => acc + (curr.sold * curr.cp), 0);
  const netRevenue = grossSales - totalCost;
  const overallMargin = grossSales > 0 ? ((netRevenue / grossSales) * 100).toFixed(1) : '0.0';

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white px-4 py-4 sticky top-0 z-10 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 -ml-2 rounded-full hover:bg-gray-100 text-gray-600 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-gray-900">Sales & Revenue</h1>
        </div>
        
        <button 
          onClick={() => setIsDateSelectorOpen(!isDateSelectorOpen)}
          className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-200"
        >
          <span className="text-sm font-medium text-gray-700">{dateRange}</span>
          <ChevronDown className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      {/* Date Selector Modal */}
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
              className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 rounded-xl"
              onClick={() => setIsDateSelectorOpen(false)}
            >
              Apply Filter
            </Button>
          </div>
        </div>
      )}

      <div className="p-4 space-y-6">
        {/* Overview Metric Cards */}
        <div>
          <h2 className="text-sm font-bold text-gray-900 mb-3">Financial Overview</h2>
          <div className="grid grid-cols-2 gap-3">
            {/* Gross Sales */}
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Gross Sales</span>
                <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center">
                  <IndianRupee className="w-3.5 h-3.5 text-blue-600" />
                </div>
              </div>
              <div>
                <p className="text-xl font-black text-gray-900">₹{grossSales.toLocaleString()}</p>
                <p className="text-[10px] text-gray-500 mt-1 flex items-center">
                  <TrendingUp className="w-3 h-3 text-emerald-500 mr-1" />
                  <span className="text-emerald-500 font-medium mr-1">+12.5%</span> vs last month
                </p>
              </div>
            </div>
            
            {/* Net Revenue */}
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Net Revenue</span>
                <div className="w-6 h-6 rounded-full bg-emerald-50 flex items-center justify-center">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                </div>
              </div>
              <div>
                <p className="text-xl font-black text-emerald-600">₹{netRevenue.toLocaleString()}</p>
                <p className="text-[10px] text-gray-500 mt-1 flex items-center">
                  Margin: <span className="font-bold text-gray-700 ml-1">{overallMargin}%</span>
                </p>
              </div>
            </div>

            {/* Total Cost */}
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Total Cost</span>
                <div className="w-6 h-6 rounded-full bg-orange-50 flex items-center justify-center">
                  <TrendingDown className="w-3.5 h-3.5 text-orange-600" />
                </div>
              </div>
              <div>
                <p className="text-xl font-black text-gray-900">₹{totalCost.toLocaleString()}</p>
                <p className="text-[10px] text-gray-500 mt-1">Cost of Goods Sold (COGS)</p>
              </div>
            </div>

            {/* Items Sold */}
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Items Sold</span>
                <div className="w-6 h-6 rounded-full bg-purple-50 flex items-center justify-center">
                  <ShoppingCart className="w-3.5 h-3.5 text-purple-600" />
                </div>
              </div>
              <div>
                <p className="text-xl font-black text-gray-900">{totalItemsSold.toLocaleString()}</p>
                <p className="text-[10px] text-gray-500 mt-1 flex items-center">
                  <TrendingUp className="w-3 h-3 text-emerald-500 mr-1" />
                  <span className="text-emerald-500 font-medium mr-1">+5.2%</span> vs last month
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Revenue vs Cost Chart */}
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
          <h2 className="text-sm font-bold text-gray-900 mb-4">Gross vs Net Revenue</h2>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockChartData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
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
                  formatter={(value: number, name: string) => [`₹${value}`, name === 'gross' ? 'Gross Sales' : 'Net Revenue']}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="gross" name="Gross Sales" fill="#93c5fd" radius={[4, 4, 0, 0]} />
                <Bar dataKey="net" name="Net Revenue" fill="#4f46e5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Product Breakdown Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <PieChart className="w-4 h-4 text-indigo-600" />
              Product Revenue Breakdown
            </h2>
          </div>
          
          <div className="divide-y divide-gray-50">
            {mockProducts.map((product) => {
              const productGross = product.sold * product.sp;
              const productCost = product.sold * product.cp;
              const productNet = productGross - productCost;
              const productMargin = ((productNet / productGross) * 100).toFixed(1);

              return (
                <div key={product.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex gap-3 items-center mb-3">
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 shrink-0 relative border border-gray-200">
                      <Image src={product.image} alt={product.name} fill className="object-cover" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 text-sm line-clamp-1">{product.name}</h3>
                      <p className="text-xs text-gray-500">{product.sold} units sold</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 mt-2 bg-gray-50 p-2 rounded-xl">
                    <div className="text-center">
                      <p className="text-[10px] text-gray-500 font-medium mb-0.5">Avg CP</p>
                      <p className="text-xs font-semibold text-gray-900">₹{product.cp}</p>
                    </div>
                    <div className="text-center border-l border-r border-gray-200">
                      <p className="text-[10px] text-gray-500 font-medium mb-0.5">Avg SP</p>
                      <p className="text-xs font-semibold text-gray-900">₹{product.sp}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-gray-500 font-medium mb-0.5">Margin</p>
                      <p className="text-xs font-bold text-emerald-600">{productMargin}%</p>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center mt-3 pt-2 border-t border-gray-100">
                    <span className="text-xs text-gray-500 font-medium">Total Gross: <span className="text-gray-900">₹{productGross.toLocaleString()}</span></span>
                    <span className="text-xs text-gray-500 font-medium">Net Profit: <span className="text-emerald-600 font-bold">₹{productNet.toLocaleString()}</span></span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
