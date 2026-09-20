'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { 
  useGetMyStoreQuery, 
  useGetStoreProductsQuery,
  useGetSellerDashboardStatsQuery,
  useGetSellerRecentOrdersQuery,
  useGetSellerSalesTrendQuery
} from '@/lib/api';
import { 
  Package, TrendingUp, PlusCircle, Settings, BarChart3, 
  ChevronRight, Store, ChevronDown, Bell, Loader2, Clock, 
  CheckCircle2, AlertTriangle, RefreshCw, FileText, ArrowRight, ShieldCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { SellerHeader } from '@/components/seller/SellerHeader';
import { DateRangeModal } from '@/components/seller/DateRangeModal';
import { useCurrency } from '@/context/CurrencyContext';

export default function SellerDashboardPage() {
  const router = useRouter();
  const { formatPrice } = useCurrency();
  const [searchQuery, setSearchQuery] = useState('');
  const [isDateSelectorOpen, setIsDateSelectorOpen] = useState(false);
  const [activeDateFilter, setActiveDateFilter] = useState('Today');
  const { data: store, isLoading, error, refetch, isFetching } = useGetMyStoreQuery();
  const { data: products } = useGetStoreProductsQuery(store?.id || '', { skip: !store?.id || store?.status !== 'VERIFIED' });
  const { data: statsData } = useGetSellerDashboardStatsQuery(activeDateFilter, { skip: !store?.id || store?.status !== 'VERIFIED' });
  const { data: liveRecentOrders = [] } = useGetSellerRecentOrdersQuery(10, { skip: !store?.id || store?.status !== 'VERIFIED' });
  const { data: liveSalesData = [] } = useGetSellerSalesTrendQuery(activeDateFilter, { skip: !store?.id || store?.status !== 'VERIFIED' });

  useEffect(() => {
    if (!isLoading && (!store || (error && (error as any).status === 404))) {
      router.push('/seller/onboarding');
    }
  }, [isLoading, store, error, router]);

  if (isLoading) {
    return (
      <div className="flex h-full min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#FF5A36]" />
      </div>
    );
  }

  if (!store) return null;

  // 1. Pending Verification Holding Screen
  if (store.status === 'PENDING') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 md:py-16">
        <div className="bg-white rounded-3xl p-6 md:p-10 shadow-sm border border-[#E5E2DC] text-center space-y-6">
          {/* Icon Header */}
          <div className="w-16 h-16 rounded-3xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mx-auto">
            <Clock className="w-8 h-8 animate-pulse" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
              KYC Under Review
            </span>
            <h1 className="text-2xl md:text-3xl font-bold text-[#171717] pt-1">
              {store.name} is Pending Verification
            </h1>
            <p className="text-[#6B6B6B] text-sm max-w-md mx-auto">
              Your store details and identification documents have been submitted and are currently being reviewed by our verification team.
            </p>
          </div>

          {/* Timeline */}
          <div className="bg-[#FAF9F6] rounded-2xl p-5 border border-[#E5E2DC] text-left space-y-4 max-w-lg mx-auto">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0 mt-0.5">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-gray-900">Application & Documents Submitted</h4>
                <p className="text-[11px] text-gray-500">Owner identity, photograph & store details received.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 shrink-0 mt-0.5 animate-pulse">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-amber-900">Admin Document Verification</h4>
                <p className="text-[11px] text-amber-700">Verification in progress. Typically takes 1-4 hours.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 opacity-50">
              <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 shrink-0 mt-0.5">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-gray-700">Store Activated</h4>
                <p className="text-[11px] text-gray-500">Start listing products and receiving customer orders.</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={() => refetch()}
              disabled={isFetching}
              className="rounded-2xl bg-[#FF5A36] hover:bg-[#e04d2d] text-white font-bold h-12 px-6 gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
              Check Verification Status
            </Button>
            <Link href="/home">
              <Button variant="outline" className="rounded-2xl h-12 px-6 w-full sm:w-auto">
                Back to Shopping
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 2. Rejected Screen
  if (store.status === 'REJECTED') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 md:py-16">
        <div className="bg-white rounded-3xl p-6 md:p-10 shadow-sm border border-red-200 text-center space-y-6">
          <div className="w-16 h-16 rounded-3xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600 mx-auto">
            <AlertTriangle className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-red-700 bg-red-50 px-3 py-1 rounded-full border border-red-200">
              Verification Unsuccessful
            </span>
            <h1 className="text-2xl md:text-3xl font-bold text-[#171717] pt-1">
              Store Verification Needs Attention
            </h1>
            <p className="text-[#6B6B6B] text-sm max-w-md mx-auto">
              Your application could not be approved. Please review your documents and resubmit your KYC verification.
            </p>
          </div>

          <div className="pt-2 flex justify-center">
            <Link href="/seller/onboarding">
              <Button className="rounded-2xl bg-[#FF5A36] hover:bg-[#e04d2d] text-white font-bold h-12 px-8 gap-2">
                Resubmit KYC Documents <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 3. Verified Seller Dashboard Data Calculation
  const dashboardStats = {
    todayOrders: statsData?.todayOrders ?? 0,
    todayRevenue: statsData?.todayRevenue ?? 0,
    activeProducts: statsData?.activeProducts ?? (products?.length || 0),
    lowStockItems: statsData?.lowStockItems ?? 0
  };

  const recentOrders = liveRecentOrders.map(order => ({
    rawId: order.id,
    id: `#${order.id.slice(0, 8).toUpperCase()}`,
    customerName: order.customerName || 'Customer',
    productImage: order.firstItemImage || order.items?.[0]?.image || null,
    productName: order.firstItemName || order.items?.[0]?.name || 'Ordered Product',
    itemsCount: order.itemsCount || 1,
    total: order.total || 0,
    status: order.status || 'NEW',
    pickupTime: order.pickupTime || 'Today',
    statusColor: order.statusColor || 'text-green-600',
    statusBg: order.statusBg || 'bg-green-50'
  }));

  const filteredRecentOrders = recentOrders.filter(order => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      order.id.toLowerCase().includes(query) ||
      order.customerName.toLowerCase().includes(query) ||
      order.productName.toLowerCase().includes(query) ||
      order.pickupTime.toLowerCase().includes(query) ||
      order.status.toLowerCase().includes(query)
    );
  });

  const salesData = liveSalesData.length > 0 ? liveSalesData : [
    { name: 'Mon', value: 0 },
    { name: 'Tue', value: 0 },
    { name: 'Wed', value: 0 },
    { name: 'Thu', value: 0 },
    { name: 'Fri', value: 0 },
    { name: 'Sat', value: 0 },
    { name: 'Sun', value: 0 },
  ];

  const quickLinks = [
    {
      icon: Package,
      label: 'Manage Orders',
      href: '/seller/orders',
      badge: dashboardStats.todayOrders > 0 ? `${dashboardStats.todayOrders} New` : undefined,
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
            <span className="text-base font-bold text-[#171717] leading-tight">{store.name}</span>
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
      
      <DateRangeModal
        isOpen={isDateSelectorOpen}
        onClose={() => setIsDateSelectorOpen(false)}
        selectedRange={activeDateFilter}
        onSelectRange={(range) => {
          setActiveDateFilter(range);
          setIsDateSelectorOpen(false);
        }}
      />

      <div className="max-w-7xl mx-auto w-full px-4 pt-4">
        {/* Subtitle */}
        <p className="text-sm text-[#6B6B6B] mb-6 font-medium">
          Here's how your store is doing today
        </p>

        {/* 2x2 Grid Stats */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          <div className="bg-white border border-[#E5E2DC] rounded-[1.25rem] p-4 flex flex-col justify-between">
            <div>
              <p className="text-xl font-bold text-[#171717]">{formatPrice(dashboardStats.todayRevenue)}</p>
              <p className="text-[10px] text-[#6B6B6B] mt-1 font-medium">Today's Sales</p>
            </div>
            <div className="flex justify-end mt-2">
              <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-md tracking-wide">
                {statsData?.revenueGrowth || '+0.0%'}
              </span>
            </div>
          </div>
          
          <div className="bg-white border border-[#E5E2DC] rounded-[1.25rem] p-4 flex flex-col justify-between">
            <div>
              <p className="text-xl font-bold text-[#171717]">{dashboardStats.todayOrders}</p>
              <p className="text-[10px] text-[#6B6B6B] mt-1 font-medium">Orders</p>
            </div>
            <div className="flex justify-end mt-2">
              <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-md tracking-wide">
                {statsData?.ordersGrowth || '+0.0%'}
              </span>
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
          
          <div className="bg-white rounded-[1.25rem] border border-[#E5E2DC] overflow-hidden divide-y divide-[#E5E2DC]">
            {filteredRecentOrders.map((order) => (
              <div 
                key={order.id} 
                onClick={() => router.push(`/seller/orders/details?id=${order.rawId}`)}
                className="p-4 hover:bg-gray-50 transition-colors cursor-pointer flex flex-col gap-3"
              >
                <div className="flex justify-between items-center">
                  <span className="font-mono font-bold text-[#171717] text-sm">{order.id}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${order.statusColor} ${order.statusBg}`}>
                    {order.status}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-[#E5E2DC] bg-[#FAF9F6] flex items-center justify-center">
                    {order.productImage ? (
                      <Image 
                        src={order.productImage} 
                        alt={order.productName} 
                        fill 
                        className="object-cover"
                        sizes="48px"
                      />
                    ) : (
                      <Package className="w-5 h-5 text-gray-300" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-[#171717] text-sm leading-tight line-clamp-1">
                      {order.productName}
                    </h3>
                    <p className="text-xs text-[#6B6B6B] mt-0.5 font-medium">
                      {order.customerName} • {order.itemsCount} {order.itemsCount > 1 ? 'items' : 'item'}
                    </p>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-1 text-xs">
                  <span className="font-black text-[#FF5A36] text-sm">
                    {formatPrice(typeof order.total === 'number' ? order.total : parseFloat(String(order.total).replace(/[^0-9.]/g, '')) || 0)}
                  </span>
                  <span className="text-[10px] text-[#999999] font-medium">{order.pickupTime}</span>
                </div>
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
               <div className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md inline-block">
                 {formatPrice(dashboardStats.todayRevenue)}
               </div>
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
