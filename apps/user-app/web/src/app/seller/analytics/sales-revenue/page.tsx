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
import { SellerHeader } from '@/components/seller/SellerHeader';
import { DateRangeModal } from '@/components/seller/DateRangeModal';
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
import { useGetAnalyticsSalesRevenueQuery } from '@/lib/api';

export default function SalesRevenueAnalyticsPage() {
  const router = useRouter();
  const [activeDateFilter, setActiveDateFilter] = useState('This Month');
  const [isDateSelectorOpen, setIsDateSelectorOpen] = useState(false);

  const { data: analyticsData } = useGetAnalyticsSalesRevenueQuery(activeDateFilter);

  const revenueProducts = analyticsData?.products || [];
  const chartData = analyticsData?.chartData || [
    { name: 'Week 1', gross: 0, net: 0 },
    { name: 'Week 2', gross: 0, net: 0 },
    { name: 'Week 3', gross: 0, net: 0 },
    { name: 'Week 4', gross: 0, net: 0 }
  ];

  const totalItemsSold = revenueProducts.reduce((acc: number, curr: any) => acc + curr.sold, 0);
  const grossSales = analyticsData?.grossSales ?? 0;
  const netRevenue = analyticsData?.netRevenue ?? 0;
  const totalCost = revenueProducts.reduce((acc: number, curr: any) => acc + (curr.sold * curr.cp), 0);
  const overallMargin = grossSales > 0 ? ((netRevenue / grossSales) * 100).toFixed(1) : '0.0';

  return (
    <div className="min-h-screen bg-[#FFFFFF] pb-20">
      {/* Header */}
      <SellerHeader 
        title="Sales & Revenue"
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
        {/* Overview Metric Cards */}
        <div>
          <h2 className="text-sm font-bold text-[#171717] mb-3">Financial Overview</h2>
          <div className="grid grid-cols-2 gap-3">
            {/* Gross Sales */}
            <div className="bg-[#FFFFFF] p-4 rounded-[1.25rem] border border-[#E5E2DC] flex flex-col justify-between">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-semibold text-[#6B6B6B] uppercase tracking-wide">Gross Sales</span>
                <div className="w-6 h-6 rounded-full bg-[#F9F9F9] flex items-center justify-center">
                  <IndianRupee className="w-3.5 h-3.5 text-[#FF5A36]" />
                </div>
              </div>
              <div>
                <p className="text-xl font-bold text-[#171717]">₹{grossSales.toLocaleString()}</p>
                <div className="flex mt-1.5">
                  <p className="text-[10px] font-bold text-[#00B960] bg-[#E5F7ED] px-1.5 py-0.5 rounded-md flex items-center">
                    <TrendingUp className="w-3 h-3 mr-0.5" /> +12.5% 
                    <span className="font-medium text-[#6B6B6B] ml-1">vs last month</span>
                  </p>
                </div>
              </div>
            </div>
            
            {/* Net Revenue */}
            <div className="bg-[#FFFFFF] p-4 rounded-[1.25rem] border border-[#E5E2DC] flex flex-col justify-between">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-semibold text-[#6B6B6B] uppercase tracking-wide">Net Revenue</span>
                <div className="w-6 h-6 rounded-full bg-[#E5F7ED] flex items-center justify-center">
                  <TrendingUp className="w-3.5 h-3.5 text-[#00B960]" />
                </div>
              </div>
              <div>
                <p className="text-xl font-bold text-[#00B960]">₹{netRevenue.toLocaleString()}</p>
                <p className="text-[10px] text-[#6B6B6B] mt-1 flex items-center">
                  Margin: <span className="font-bold text-[#171717] ml-1">{overallMargin}%</span>
                </p>
              </div>
            </div>

            {/* Total Cost */}
            <div className="bg-[#FFFFFF] p-4 rounded-[1.25rem] border border-[#E5E2DC] flex flex-col justify-between">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-semibold text-[#6B6B6B] uppercase tracking-wide">Total Cost</span>
                <div className="w-6 h-6 rounded-full bg-[#FFEBEE] flex items-center justify-center">
                  <TrendingDown className="w-3.5 h-3.5 text-[#FF5A36]" />
                </div>
              </div>
              <div>
                <p className="text-xl font-bold text-[#171717]">₹{totalCost.toLocaleString()}</p>
                <p className="text-[10px] text-[#6B6B6B] mt-1">Cost of Goods Sold (COGS)</p>
              </div>
            </div>

            {/* Items Sold */}
            <div className="bg-[#FFFFFF] p-4 rounded-[1.25rem] border border-[#E5E2DC] flex flex-col justify-between">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-semibold text-[#6B6B6B] uppercase tracking-wide">Items Sold</span>
                <div className="w-6 h-6 rounded-full bg-[#F9F9F9] flex items-center justify-center">
                  <ShoppingCart className="w-3.5 h-3.5 text-[#171717]" />
                </div>
              </div>
              <div>
                <p className="text-xl font-bold text-[#171717]">{totalItemsSold.toLocaleString()}</p>
                <div className="flex mt-1.5">
                  <p className="text-[10px] font-bold text-[#00B960] bg-[#E5F7ED] px-1.5 py-0.5 rounded-md flex items-center">
                    <TrendingUp className="w-3 h-3 mr-0.5" /> +5.2% 
                    <span className="font-medium text-[#6B6B6B] ml-1">vs last month</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Revenue vs Cost Chart */}
        <div className="bg-[#FFFFFF] p-4 rounded-[1.25rem] border border-[#E5E2DC]">
          <h2 className="text-sm font-bold text-[#171717] mb-4">Gross vs Net Revenue</h2>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
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
                  contentStyle={{ borderRadius: '1.25rem', border: '1px solid #E5E2DC', boxShadow: 'none' }}
                  formatter={(value: any, name: any) => [`₹${value}`, name === 'gross' ? 'Gross Sales' : 'Net Revenue']}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="gross" name="Gross Sales" fill="#FF5A36" radius={[4, 4, 0, 0]} />
                <Bar dataKey="net" name="Net Revenue" fill="#171717" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Product Breakdown Table */}
        <div className="bg-[#FFFFFF] rounded-[1.25rem] border border-[#E5E2DC] overflow-hidden">
          <div className="p-4 border-b border-[#E5E2DC] flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#171717] flex items-center gap-2">
              <PieChart className="w-4 h-4 text-[#FF5A36]" />
              Product Revenue Breakdown
            </h2>
          </div>
          
          <div className="divide-y divide-[#E5E2DC]">
            {revenueProducts.map((product) => {
              const productGross = product.sold * product.sp;
              const productCost = product.sold * product.cp;
              const productNet = productGross - productCost;
              const productMargin = ((productNet / productGross) * 100).toFixed(1);

              return (
                <div key={product.id} className="p-4 hover:bg-[#F9F9F9] transition-colors">
                  <div className="flex gap-3 items-center mb-3">
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-[#F9F9F9] shrink-0 relative border border-[#E5E2DC]">
                      <Image src={product.image} alt={product.name} fill className="object-cover" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-[#171717] text-sm line-clamp-1">{product.name}</h3>
                      <p className="text-xs text-[#6B6B6B]">{product.sold} units sold</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 mt-2 bg-[#F9F9F9] p-2 rounded-xl">
                    <div className="text-center">
                      <p className="text-[10px] text-[#6B6B6B] font-medium mb-0.5">Avg CP</p>
                      <p className="text-xs font-semibold text-[#171717]">₹{product.cp}</p>
                    </div>
                    <div className="text-center border-l border-r border-[#E5E2DC]">
                      <p className="text-[10px] text-[#6B6B6B] font-medium mb-0.5">Avg SP</p>
                      <p className="text-xs font-semibold text-[#171717]">₹{product.sp}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-[#6B6B6B] font-medium mb-0.5">Margin</p>
                      <p className="text-xs font-bold text-[#00B960]">{productMargin}%</p>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center mt-3 pt-2 border-t border-[#E5E2DC]">
                    <span className="text-xs text-[#6B6B6B] font-medium">Total Gross: <span className="text-[#171717]">₹{productGross.toLocaleString()}</span></span>
                    <span className="text-xs text-[#6B6B6B] font-medium">Net Profit: <span className="text-[#00B960] font-bold">₹{productNet.toLocaleString()}</span></span>
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
