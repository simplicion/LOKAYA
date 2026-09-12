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
import { SellerHeader } from '@/components/seller/SellerHeader';
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

import { DateRangeModal } from '@/components/seller/DateRangeModal';
import { useGetAnalyticsOverviewQuery } from '@/lib/api';

export default function AnalyticsPage() {
  const router = useRouter();
  const [dateRange, setDateRange] = useState('This Month');
  const [isDateSelectorOpen, setIsDateSelectorOpen] = useState(false);

  const { data: analyticsData } = useGetAnalyticsOverviewQuery(dateRange);

  const stats = analyticsData?.stats || [
    { label: "Total Orders", value: "0", trend: "+0%", isPositive: true },
    { label: "Total Revenue", value: "₹0", trend: "+0%", isPositive: true },
    { label: "Avg. Order Value", value: "₹0", trend: "+0%", isPositive: true },
    { label: "Total Customers", value: "0", trend: "+0%", isPositive: true },
  ];

  const chartData = analyticsData?.chartData || [
    { name: '01 May', revenue: 0 },
    { name: '15 May', revenue: 0 },
    { name: '31 May', revenue: 0 },
  ];

  return (
    <div className="min-h-screen bg-[#FFFFFF] pb-24 md:pb-0">
      <SellerHeader 
        title="Analytics Overview"
        hideSearchIcon={true}
        rightAction={
          <button 
            onClick={() => setIsDateSelectorOpen(!isDateSelectorOpen)}
            className="flex items-center gap-2 bg-[#F9F9F9] px-3 py-1.5 rounded-full border border-[#E5E2DC]"
          >
            <span className="text-sm font-semibold text-[#171717]">{dateRange}</span>
            <ChevronDown className="w-4 h-4 text-[#6B6B6B]" />
          </button>
        }
      />

      <DateRangeModal
        isOpen={isDateSelectorOpen}
        onClose={() => setIsDateSelectorOpen(false)}
        selectedRange={dateRange}
        onSelectRange={(r) => {
          setDateRange(r);
          setIsDateSelectorOpen(false);
        }}
        showCustomRange={true}
      />

      <div className="p-4 space-y-6">
        {/* Overview Cards */}
        <div>
          <h2 className="text-xl font-bold text-[#171717] mb-4">Overview</h2>
          <div className="grid grid-cols-2 gap-3">
            {stats.map((stat, i) => (
              <div key={i} className="bg-white p-4 rounded-[1.25rem] border border-[#E5E2DC] flex flex-col justify-between">
                <span className="text-xl font-bold text-[#171717]">{stat.value}</span>
                <span className="text-xs text-[#6B6B6B] mt-1">{stat.label}</span>
                <div className="flex justify-end mt-2">
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                    stat.isPositive ? 'bg-[#E5F7ED] text-[#00B960]' : 'bg-[#FFEBEE] text-[#FF5A36]'
                  }`}>
                    {stat.trend}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Revenue Overview Chart */}
        <div className="bg-[#FFFFFF] p-4 rounded-[1.25rem] border border-[#E5E2DC]">
          <h2 className="text-xl font-bold text-[#171717] mb-6">Revenue Overview</h2>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF5A36" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#FF5A36" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E2DC" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#6B6B6B' }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#6B6B6B' }}
                  tickFormatter={(value) => `₹${value/1000}k`}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: '1px solid #E5E2DC', boxShadow: 'none' }}
                  itemStyle={{ color: '#171717', fontWeight: 'bold' }}
                  formatter={(value: any) => [`₹${value}`, 'Revenue']}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#FF5A36" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorRevenue)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Detailed Reports Links */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-[#171717] mb-4">Detailed Reports</h2>
          <div className="bg-[#FFFFFF] rounded-[1.25rem] border border-[#E5E2DC] overflow-hidden">
            {[
              {
                title: "Sales & Revenue",
                desc: "Gross sales, net revenue, and margins",
                icon: <IndianRupee className="w-5 h-5" />,
                href: "/seller/analytics/sales-revenue",
                color: "bg-[#F9F9F9] text-[#171717]"
              },
              {
                title: "Order Analytics",
                desc: "Order performance and trends",
                icon: <Package className="w-5 h-5" />,
                href: "/seller/analytics/orders",
                color: "bg-[#F9F9F9] text-[#171717]"
              },
              {
                title: "Product Analytics",
                desc: "Top selling items and categories",
                icon: <PieChart className="w-5 h-5" />,
                href: "/seller/analytics/products",
                color: "bg-[#F9F9F9] text-[#171717]"
              },
              {
                title: "Customer Analytics",
                desc: "Acquisition and top customers",
                icon: <Users className="w-5 h-5" />,
                href: "/seller/analytics/customers",
                color: "bg-[#F9F9F9] text-[#171717]"
              },
              {
                title: "Finance & Payouts",
                desc: "Revenue, balance, and banking",
                icon: <Wallet className="w-5 h-5" />,
                href: "/seller/finance",
                color: "bg-[#F9F9F9] text-[#171717]"
              },
              {
                title: "Export Reports",
                desc: "Download data in PDF, Excel",
                icon: <Download className="w-5 h-5" />,
                href: "/seller/analytics/export",
                color: "bg-[#F9F9F9] text-[#171717]"
              }
            ].map((report, i) => (
              <button 
                key={i}
                onClick={() => router.push(report.href)}
                className="w-full flex items-center justify-between p-4 border-b border-[#E5E2DC] last:border-0 hover:bg-[#F9F9F9] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${report.color}`}>
                    {report.icon}
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-[#171717] text-sm">{report.title}</p>
                    <p className="text-xs font-medium text-[#6B6B6B] mt-0.5">{report.desc}</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-[#6B6B6B]" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
