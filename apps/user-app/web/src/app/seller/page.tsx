'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useGetMyStoreQuery, useGetStoreProductsQuery } from '@/lib/api';
import { 
  Package, TrendingUp, PlusCircle, Settings, BarChart3, 
  ChevronRight, Store, AlertCircle, CheckCircle2, Clock, ArrowLeft, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function SellerDashboardPage() {
  const router = useRouter();
  const { data: store, isLoading, error } = useGetMyStoreQuery();
  const { data: products } = useGetStoreProductsQuery(store?.id || '', { skip: !store?.id });

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
    todayOrders: 0,
    todayRevenue: 0,
    activeProducts: products?.length || 0,
    lowStockItems: 0
  };

  // Mock data for recent orders
  const recentOrders = [
    {
      id: 'ORD1345',
      customerName: 'Rohit Kumar',
      itemsCount: 2,
      total: 245,
      status: 'New',
      pickupTime: 'Today, 12:00 PM',
    },
    {
      id: 'ORD1344',
      customerName: 'Neha Singh',
      itemsCount: 4,
      total: 560,
      status: 'Preparing',
      pickupTime: 'Today, 02:00 PM',
    }
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
    <div className="flex flex-col min-h-screen bg-[#FAF9F6] pb-20 md:pb-0">
      {/* Header & Stats */}
      <div className="bg-[#FF5A36] text-white p-6 pt-10 rounded-b-[2.5rem] shadow-sm">
        <button 
          onClick={() => router.push('/home')} 
          className="flex items-center text-white/80 hover:text-white transition-colors mb-6 group w-fit"
        >
          <ArrowLeft className="w-5 h-5 mr-1.5 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-medium">Back to App</span>
        </button>

        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Good Morning!</h1>
            <p className="text-white/80 mt-1">{store.name}</p>
          </div>
          <button onClick={() => router.push('/seller/store')} className="w-12 h-12 bg-white/20 hover:bg-white/30 transition-colors rounded-full flex items-center justify-center cursor-pointer">
            <Store className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* 2x2 Grid Stats */}
        <div className="grid grid-cols-2 gap-3 mb-2">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4">
            <div className="flex items-center text-white/90 mb-2">
              <TrendingUp className="w-4 h-4 mr-2" />
              <span className="text-sm font-medium">Today's Sales</span>
            </div>
            <p className="text-2xl font-bold text-white">₹{dashboardStats.todayRevenue.toLocaleString()}</p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4">
            <div className="flex items-center text-white/90 mb-2">
              <Package className="w-4 h-4 mr-2" />
              <span className="text-sm font-medium">Today's Orders</span>
            </div>
            <p className="text-2xl font-bold text-white">{dashboardStats.todayOrders}</p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4">
            <div className="flex items-center text-white/90 mb-2">
              <CheckCircle2 className="w-4 h-4 mr-2" />
              <span className="text-sm font-medium">Active Products</span>
            </div>
            <p className="text-2xl font-bold text-white">{dashboardStats.activeProducts}</p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4">
            <div className="flex items-center text-white/90 mb-2">
              <AlertCircle className="w-4 h-4 mr-2 text-white/90" />
              <span className="text-sm font-medium">Low Stock Alerts</span>
            </div>
            <p className="text-2xl font-bold text-white">{dashboardStats.lowStockItems}</p>
          </div>
        </div>
      </div>

      {/* Content Body */}
      <div className="p-4 mt-2 space-y-6 max-w-7xl mx-auto w-full">
        
        {/* Verification Warnings */}
        {store.status === 'PENDING' && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl p-4 flex items-start gap-3">
            <Store className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-amber-900">Verification in Progress</h3>
              <p className="text-sm mt-1">Your store KYC is currently under review. Some features may be restricted until your account is fully verified.</p>
            </div>
          </div>
        )}

        {store.status === 'REJECTED' && (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-2xl p-4 flex items-start justify-between gap-4">
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

        {/* Recent / Upcoming Orders Section */}
        <div>
          <div className="flex justify-between items-center mb-4 px-2">
            <h2 className="text-lg font-bold text-[#171717]">Recent Orders</h2>
            <button 
              onClick={() => router.push('/seller/orders')}
              className="text-sm font-medium text-[#FF5A36] hover:text-[#e04d2d]"
            >
              View All
            </button>
          </div>
          
          <div className="space-y-3">
            {recentOrders.map((order) => (
              <div key={order.id} className="bg-white p-4 rounded-3xl shadow-sm border border-[#E5E2DC]">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className="text-xs font-bold text-[#FF5A36] bg-[#FF5A36]/10 px-2 py-1 rounded-md mb-2 inline-block">
                      {order.id}
                    </span>
                    <h3 className="font-bold text-[#171717]">{order.customerName}</h3>
                    <p className="text-sm text-[#6B6B6B]">{order.itemsCount} Items • ₹{order.total}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-full">
                      {order.status}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#E5E2DC]">
                  <div className="flex items-center text-xs font-medium text-[#999999]">
                    <Clock className="w-3.5 h-3.5 mr-1" />
                    Pickup: {order.pickupTime}
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-8 rounded-full border-[#FF5A36] text-[#FF5A36] bg-[#FF5A36]/5 hover:bg-[#FF5A36]/10 text-xs px-4"
                    onClick={() => router.push('/seller/orders')}
                  >
                    Manage
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Links Section */}
        <div>
          <h2 className="text-lg font-bold text-[#171717] mb-4 px-2">Quick Actions</h2>
          <div className="bg-white rounded-3xl shadow-sm border border-[#E5E2DC] overflow-hidden">
            {quickLinks.map((item, index) => {
              const Icon = item.icon;
              return (
                <div key={index} className="flex flex-col">
                  <div 
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-[#FAF9F6] active:bg-[#F2F0EA] transition-colors"
                    onClick={() => router.push(item.href)}
                  >
                    <div className="flex items-center">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mr-4 ${item.bgColor}`}>
                        <Icon className={`w-5 h-5 ${item.color}`} />
                      </div>
                      <span className="font-medium text-[#171717]">{item.label}</span>
                    </div>
                    <div className="flex items-center">
                      {item.badge && (
                        <span className="bg-[#FF5A36] text-white text-xs font-bold px-2 py-1 rounded-full mr-3">
                          {item.badge}
                        </span>
                      )}
                      <ChevronRight className="w-5 h-5 text-[#999999]" />
                    </div>
                  </div>
                  {index < quickLinks.length - 1 && (
                    <div className="h-px bg-[#E5E2DC] mx-4"></div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        
      </div>
    </div>
  );
}
