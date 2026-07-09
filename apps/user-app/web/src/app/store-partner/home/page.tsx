'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Package, TrendingUp, PlusCircle, Settings, BarChart3, ChevronRight, Store, AlertCircle, CheckCircle2, Clock, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function StoreHomePage() {
  const router = useRouter();

  // Mock data for top level stats
  const dashboardStats = {
    todayOrders: 24,
    todayRevenue: 4250,
    activeProducts: 156,
    lowStockItems: 3
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
      href: '/store-partner/orders',
      badge: '3 New',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      icon: Store,
      label: 'Inventory',
      href: '/store-partner/products',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      icon: PlusCircle,
      label: 'Add Product',
      href: '/store-partner/products/add',
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      icon: BarChart3,
      label: 'Analytics',
      href: '/store-partner/analytics',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      icon: Settings,
      label: 'Store Settings',
      href: '/store-partner/store',
      color: 'text-gray-600',
      bgColor: 'bg-gray-100'
    }
  ];

  return (
    <div className="flex flex-col min-h-[100dvh] bg-gray-50 pb-20">
      {/* Header & Stats */}
      <div className="bg-blue-600 text-white p-6 pt-10 rounded-b-[2.5rem] shadow-sm">
        <button 
          onClick={() => router.push('/home')} 
          className="flex items-center text-blue-100 hover:text-white transition-colors mb-6 group w-fit"
        >
          <ArrowLeft className="w-5 h-5 mr-1.5 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-medium">Back to App</span>
        </button>

        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Good Morning, Rohit</h1>
            <p className="text-blue-100 mt-1">FreshMart Supermarket</p>
          </div>
          <button onClick={() => router.push('/home/store')} className="w-12 h-12 bg-white/20 hover:bg-white/30 transition-colors rounded-full flex items-center justify-center cursor-pointer">
            <Store className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* 2x2 Grid Stats */}
        <div className="grid grid-cols-2 gap-3 mb-2">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4">
            <div className="flex items-center text-blue-100 mb-2">
              <TrendingUp className="w-4 h-4 mr-2" />
              <span className="text-sm font-medium">Today's Sales</span>
            </div>
            <p className="text-2xl font-bold text-white">₹{dashboardStats.todayRevenue.toLocaleString()}</p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4">
            <div className="flex items-center text-blue-100 mb-2">
              <Package className="w-4 h-4 mr-2" />
              <span className="text-sm font-medium">Today's Orders</span>
            </div>
            <p className="text-2xl font-bold text-white">{dashboardStats.todayOrders}</p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4">
            <div className="flex items-center text-blue-100 mb-2">
              <CheckCircle2 className="w-4 h-4 mr-2" />
              <span className="text-sm font-medium">Active Products</span>
            </div>
            <p className="text-2xl font-bold text-white">{dashboardStats.activeProducts}</p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4">
            <div className="flex items-center text-red-200 mb-2">
              <AlertCircle className="w-4 h-4 mr-2" />
              <span className="text-sm font-medium">Low Stock Alerts</span>
            </div>
            <p className="text-2xl font-bold text-red-100">{dashboardStats.lowStockItems}</p>
          </div>
        </div>
      </div>

      {/* Content Body */}
      <div className="p-4 mt-2 space-y-6">
        
        {/* Recent / Upcoming Orders Section */}
        <div>
          <div className="flex justify-between items-center mb-4 px-2">
            <h2 className="text-lg font-bold text-gray-900">Recent Orders</h2>
            <button 
              onClick={() => router.push('/store-partner/orders')}
              className="text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              View All
            </button>
          </div>
          
          <div className="space-y-3">
            {recentOrders.map((order) => (
              <div key={order.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md mb-2 inline-block">
                      {order.id}
                    </span>
                    <h3 className="font-bold text-gray-900">{order.customerName}</h3>
                    <p className="text-sm text-gray-500">{order.itemsCount} Items • ₹{order.total}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-full">
                      {order.status}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                  <div className="flex items-center text-xs font-medium text-gray-500">
                    <Clock className="w-3.5 h-3.5 mr-1" />
                    Pickup: {order.pickupTime}
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-8 rounded-full border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 text-xs px-4"
                    onClick={() => router.push('/store-partner/orders')}
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
          <h2 className="text-lg font-bold text-gray-900 mb-4 px-2">Quick Actions</h2>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {quickLinks.map((item, index) => {
              const Icon = item.icon;
              return (
                <div key={index} className="flex flex-col">
                  <div 
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 active:bg-gray-100 transition-colors"
                    onClick={() => router.push(item.href)}
                  >
                    <div className="flex items-center">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mr-4 ${item.bgColor}`}>
                        <Icon className={`w-5 h-5 ${item.color}`} />
                      </div>
                      <span className="font-medium text-gray-900">{item.label}</span>
                    </div>
                    <div className="flex items-center">
                      {item.badge && (
                        <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full mr-3">
                          {item.badge}
                        </span>
                      )}
                      <ChevronRight className="w-5 h-5 text-gray-300" />
                    </div>
                  </div>
                  {index < quickLinks.length - 1 && (
                    <div className="h-px bg-gray-100 mx-4"></div>
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
