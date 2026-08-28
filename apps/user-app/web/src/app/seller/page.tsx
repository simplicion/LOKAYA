'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useGetMyStoreQuery, useGetStoreProductsQuery } from '@/lib/api';
import { 
  Package, TrendingUp, PlusCircle, Settings, BarChart3, 
  ChevronRight, Store, ChevronDown, Bell, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { SellerHeader } from '@/components/seller/SellerHeader';

export default function SellerDashboardPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const { data: store, isLoading, error } = useGetMyStoreQuery();
  const { data: products } = useGetStoreProductsQuery(store?.id || '', { skip: !store?.id });
  
  // Date Filter State
  const [isDateSelectorOpen, setIsDateSelectorOpen] = useState(false);
  const [activeDateFilter, setActiveDateFilter] = useState('Today');

  useEffect(() => {
    if (!isLoading && error && (error as any).status === 404) {
      router.push('/seller/onboarding');
    }
  }, [isLoading, error, router]);

  if (isLoading) {
    return (
      <div className="flex h-full min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#FF5A36]" />
      </div>
    );
  }

  if (!store) return null;

  // Real + Mock data for top level stats
  const dashboardStats = {
    todayOrders: 24,
    todayRevenue: 12450,
    activeProducts: products?.length || 128,
    lowStockItems: 7
  };

  // Mock data for recent orders
  
  const recentOrders = [
    {
      id: '#ORD1345',
      customerName: 'Rohit Kumar',
      itemsCount: 2,
      total: 245,
      status: 'NEW',
      pickupTime: 'Today, 10:30 AM',
      statusColor: 'text-green-600',
      statusBg: 'bg-green-50'
    },
    {
      id: '#ORD1344',
      customerName: 'Neha Singh',
      itemsCount: 4,
      total: 560,
      status: 'PREPARING',
      pickupTime: 'Yesterday',
      statusColor: 'text-blue-600',
      statusBg: 'bg-blue-50'
    }
  ];

  const filteredRecentOrders = recentOrders.filter(order => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      order.id.toLowerCase().includes(query) ||
      order.customerName.toLowerCase().includes(query) ||
      order.pickupTime.toLowerCase().includes(query) ||
      order.status.toLowerCase().includes(query)
    );
  });

  const salesData = [
    { name: 'Mon', value: 4000 },
    { name: 'Tue', value: 3000 },
    { name: 'Wed', value: 5500 },
    { name: 'Thu', value: 4500 },
    { name: 'Fri', value: 7000 },
    { name: 'Sat', value: 6500 },
    { name: 'Sun', value: 8000 },
  ];

  const quickLinks = [
    {
      icon: Package,
      label: 'Manage Orders',
      href: '/seller/orders',
      badge: '3 New',
      color: 'text-[#FF5A36]',
      bgColor: 'bg-[#FF5A36]/10'
    },
    {
      icon: Store,
      label: 'Inventory',
      href: '/seller/products',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      icon: PlusCircle,
      label: 'Add Product',
      href: '/seller/products/add',
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      icon: BarChart3,
      label: 'Analytics',
      href: '/seller/analytics',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      icon: Settings,
      label: 'Store Settings',
      href: '/seller/store',
      color: 'text-gray-600',
      bgColor: 'bg-gray-100'
    }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#FFFFFF] pb-20 md:pb-0">
      <SellerHeader 
        showBack={true}
        onBack={() => router.push('/profile')}
        hideSearchIcon={true}
        title={
          <div className="flex flex-col ml-1">
            <span className="text-base font-bold text-[#171717] leading-tight">Good morning,</span>
            <span className="text-base font-bold text-[#171717] leading-tight">{store.name} 👋</span>
          </div>
        }
        rightAction={
          <div className="flex items-center gap-1.5">
            <button 
              onClick={() => setIsDateSelectorOpen(true)}
              className="flex items-center gap-1.5 bg-[#F9F9F9] pl-3 pr-2 py-1 rounded-full border border-[#E5E2DC]"
            >
              <span className="text-xs font-semibold text-[#171717]">{activeDateFilter}</span>
              <ChevronDown className="w-3.5 h-3.5 text-[#6B6B6B]" />
            </button>
            <button onClick={() => router.push('/seller/notifications')} className="relative transition-opacity hover:opacity-80 p-2">
              <Bell className="w-6 h-6 text-[#171717]" />
              <div className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-[#FF5A36] rounded-full border-2 border-white"></div>
            </button>
          </div>
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

      <div className="max-w-7xl mx-auto w-full px-4 pt-4">
        {/* Subtitle */}
        <p className="text-sm text-[#6B6B6B] mb-6 font-medium">
          Here's how your store is doing today
        </p>

        {/* 2x2 Grid Stats */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          <div className="bg-white border border-[#E5E2DC] rounded-[1.25rem] p-4 flex flex-col justify-between">
            <div>
              <p className="text-xl font-bold text-[#171717]">₹{dashboardStats.todayRevenue.toLocaleString()}</p>
              <p className="text-[10px] text-[#6B6B6B] mt-1 font-medium">Today's Sales</p>
            </div>
            <div className="flex justify-end mt-2">
              <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-md tracking-wide">+10.6%</span>
            </div>
          </div>
          
          <div className="bg-white border border-[#E5E2DC] rounded-[1.25rem] p-4 flex flex-col justify-between">
            <div>
              <p className="text-xl font-bold text-[#171717]">{dashboardStats.todayOrders}</p>
              <p className="text-[10px] text-[#6B6B6B] mt-1 font-medium">Orders</p>
            </div>
            <div className="flex justify-end mt-2">
              <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-md tracking-wide">+12.3%</span>
            </div>
          </div>
          
          <div className="bg-white border border-[#E5E2DC] rounded-[1.25rem] p-4 flex flex-col justify-between">
            <div>
              <p className="text-xl font-bold text-[#171717]">{dashboardStats.activeProducts}</p>
              <p className="text-[10px] text-[#6B6B6B] mt-1 font-medium">Active Products</p>
            </div>
            <div className="h-5 mt-2"></div>
          </div>
          
          <div className="bg-white border border-[#E5E2DC] rounded-[1.25rem] p-4 flex flex-col justify-between">
            <div>
              <p className="text-xl font-bold text-[#171717]">{dashboardStats.lowStockItems}</p>
              <p className="text-[10px] text-[#6B6B6B] mt-1 font-medium">Low Stock</p>
            </div>
            <div className="flex justify-end mt-2">
              <Link href="/seller/products" className="text-[10px] font-bold text-blue-600 hover:underline tracking-wide">
                View details
              </Link>
            </div>
          </div>
        </div>

        {/* Verification Warnings */}
        {store.status === 'PENDING' && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-[1.25rem] p-4 flex items-start gap-3 mb-8">
            <Store className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-amber-900">Verification in Progress</h3>
              <p className="text-sm mt-1">Your store KYC is currently under review. Some features may be restricted until your account is fully verified.</p>
            </div>
          </div>
        )}

        {store.status === 'REJECTED' && (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-[1.25rem] p-4 flex items-start justify-between gap-4 mb-8">
            <div className="flex gap-3">
              <Store className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-red-900">Verification Rejected</h3>
                <p className="text-sm mt-1">There was an issue with your KYC documents. Please update and resubmit your details.</p>
              </div>
            </div>
            <Button onClick={() => router.push('/seller/onboarding')} variant="destructive" size="sm" className="whitespace-nowrap">
              Resubmit KYC
            </Button>
          </div>
        )}

        {/* Recent Orders Section */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-[#171717]">Recent Orders</h2>
            <Link href="/seller/orders" className="text-sm font-semibold text-[#FF5A36] flex items-center hover:opacity-80 transition-opacity">
              View All <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
          
          <div className="bg-white rounded-[1.25rem] border border-[#E5E2DC] overflow-hidden">
            {filteredRecentOrders.map((order, index) => (
              <div key={order.id} className="flex flex-col">
                <div className="p-4">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="font-bold text-[#171717]">{order.id}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${order.statusColor} ${order.statusBg}`}>
                      {order.status}
                    </span>
                  </div>
                  <h3 className="font-bold text-[#171717] text-[15px] mb-2">{order.customerName}</h3>
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-[#6B6B6B]">{order.itemsCount} items • ₹{order.total}</p>
                    <p className="text-[10px] text-[#999999] font-medium">{order.pickupTime}</p>
                  </div>
                </div>
                {index < filteredRecentOrders.length - 1 && (
                  <div className="h-px bg-[#E5E2DC] mx-4"></div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Sales Overview Section */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-[#171717]">Sales Overview</h2>
            <button className="text-[11px] font-semibold text-[#171717] flex items-center px-3 py-1.5 rounded-full border border-[#E5E2DC]">
              This Week <ChevronDown className="w-3.5 h-3.5 ml-1 text-[#6B6B6B]" />
            </button>
          </div>
          
          <div className="bg-white rounded-[1.25rem] border border-[#E5E2DC] overflow-hidden pt-4 h-[200px] flex flex-col relative">
             <div className="px-4 mb-2 absolute top-4 left-0">
               <div className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md inline-block">₹12,450</div>
             </div>
            <div className="flex-1 w-full mt-6">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSales)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>


        
      </div>
    </div>
  );
}
