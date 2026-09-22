'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { 
  ArrowLeft, 
  Bell, 
  Package, 
  Truck, 
  Sparkles, 
  Tag, 
  CheckCheck, 
  ChevronRight, 
  ShoppingBag, 
  Radio, 
  Clock, 
  RefreshCw,
  Info
} from 'lucide-react';
import { 
  useGetUserNotificationsQuery, 
  useMarkUserNotificationReadMutation, 
  useMarkAllUserNotificationsReadMutation 
} from '@/lib/api';
import { getMediaUrl } from '@/lib/utils';

type TabType = 'ALL' | 'ORDERS' | 'SOCIAL' | 'OFFERS';

export default function NotificationsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('ALL');
  
  const { data, isLoading, isFetching, refetch } = useGetUserNotificationsQuery(
    undefined,
    { pollingInterval: 30000 } // Auto refresh every 30 seconds for live updates
  );
  
  const [markRead] = useMarkUserNotificationReadMutation();
  const [markAllRead, { isLoading: isMarkingAll }] = useMarkAllUserNotificationsReadMutation();

  const allItems = data?.items || [];
  const unreadCount = data?.unreadCount || 0;

  // Filter items based on active category tab
  const filteredItems = allItems.filter((item: any) => {
    if (activeTab === 'ALL') return true;
    if (activeTab === 'ORDERS') {
      return item.type === 'ORDER_UPDATE' || item.type === 'DELIVERY_DISPATCH';
    }
    if (activeTab === 'SOCIAL') {
      return item.type === 'NEW_PRODUCT' || item.type === 'NEW_STORY' || item.type === 'NEW_POST';
    }
    if (activeTab === 'OFFERS') {
      return item.type === 'MARKETING' || item.type === 'SYSTEM';
    }
    return true;
  });

  const handleNotificationClick = async (item: any) => {
    if (!item.isRead) {
      markRead(item.id).catch(() => {});
    }
    if (item.deepLink && item.deepLink !== '/') {
      router.push(item.deepLink);
    }
  };

  const handleMarkAllRead = async () => {
    if (unreadCount > 0 && !isMarkingAll) {
      await markAllRead();
    }
  };

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'ORDER_UPDATE':
        return <Package className="w-5 h-5 text-indigo-600" />;
      case 'DELIVERY_DISPATCH':
        return <Truck className="w-5 h-5 text-emerald-600" />;
      case 'NEW_PRODUCT':
        return <ShoppingBag className="w-5 h-5 text-amber-600" />;
      case 'NEW_STORY':
      case 'NEW_POST':
        return <Radio className="w-5 h-5 text-pink-600" />;
      case 'MARKETING':
        return <Tag className="w-5 h-5 text-purple-600" />;
      case 'SYSTEM':
      default:
        return <Info className="w-5 h-5 text-blue-600" />;
    }
  };

  const getIconBackground = (type: string) => {
    switch (type) {
      case 'ORDER_UPDATE':
        return 'bg-indigo-50 border-indigo-100/60';
      case 'DELIVERY_DISPATCH':
        return 'bg-emerald-50 border-emerald-100/60';
      case 'NEW_PRODUCT':
        return 'bg-amber-50 border-amber-100/60';
      case 'NEW_STORY':
      case 'NEW_POST':
        return 'bg-pink-50 border-pink-100/60';
      case 'MARKETING':
        return 'bg-purple-50 border-purple-100/60';
      case 'SYSTEM':
      default:
        return 'bg-blue-50 border-blue-100/60';
    }
  };

  const formatTimestamp = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

      if (diffInSeconds < 60) return 'Just now';
      const diffInMinutes = Math.floor(diffInSeconds / 60);
      if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
      const diffInHours = Math.floor(diffInMinutes / 60);
      if (diffInHours < 24) return `${diffInHours}h ago`;
      const diffInDays = Math.floor(diffInHours / 24);
      if (diffInDays === 1) return 'Yesterday';
      if (diffInDays < 7) return `${diffInDays}d ago`;
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch {
      return 'Recently';
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F8F9FA] text-[#111827]">
      {/* Top App Bar with Safe-Area padding */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-200/80 transition-shadow">
        <div className="flex items-center justify-between px-4 py-3.5 max-w-2xl mx-auto w-full">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => router.back()} 
              aria-label="Go Back"
              className="p-2 -ml-1 rounded-full text-gray-700 hover:bg-gray-100 active:scale-95 transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-lg text-gray-900 tracking-tight">Notifications</h1>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 text-xs font-bold bg-[#FF5A36] text-white rounded-full shadow-sm animate-pulse">
                  {unreadCount}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              title="Refresh feed"
              className="p-2 rounded-full text-gray-500 hover:text-gray-900 hover:bg-gray-100 active:rotate-180 transition-all duration-300"
            >
              <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin text-[#FF5A36]' : ''}`} />
            </button>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                disabled={isMarkingAll}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#FF5A36] hover:bg-[#FF5A36]/10 rounded-full transition-colors active:scale-95"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark all read</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center px-4 gap-2 overflow-x-auto no-scrollbar max-w-2xl mx-auto w-full pb-2.5 pt-1">
          {[
            { id: 'ALL', label: 'All', icon: Bell },
            { id: 'ORDERS', label: 'Orders', icon: Package },
            { id: 'SOCIAL', label: 'Social & Stores', icon: Sparkles },
            { id: 'OFFERS', label: 'Offers', icon: Tag },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 active:scale-95 ${
                  isActive
                    ? 'bg-gray-900 text-white shadow-sm'
                    : 'bg-white text-gray-600 border border-gray-200/80 hover:bg-gray-50'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-gray-500'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-2xl mx-auto w-full p-4 pb-24">
        {isLoading ? (
          // Loading Skeletons
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div 
                key={i} 
                className="flex gap-3.5 p-4 rounded-2xl bg-white border border-gray-100 shadow-sm animate-pulse"
              >
                <div className="w-11 h-11 rounded-2xl bg-gray-200 shrink-0" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-4 bg-gray-200 rounded w-2/3" />
                  <div className="h-3 bg-gray-100 rounded w-full" />
                  <div className="h-3 bg-gray-100 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          // Empty State
          <div className="flex flex-col items-center justify-center text-center py-20 px-6">
            <div className="w-20 h-20 bg-gray-100/80 rounded-3xl flex items-center justify-center mb-4 shadow-inner">
              {activeTab === 'ORDERS' ? (
                <Package className="w-10 h-10 text-gray-400" />
              ) : activeTab === 'SOCIAL' ? (
                <Sparkles className="w-10 h-10 text-gray-400" />
              ) : activeTab === 'OFFERS' ? (
                <Tag className="w-10 h-10 text-gray-400" />
              ) : (
                <Bell className="w-10 h-10 text-gray-400" />
              )}
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">
              {activeTab === 'ALL' ? 'No Notifications Yet' : `No ${activeTab.toLowerCase()} notifications`}
            </h3>
            <p className="text-sm text-gray-500 max-w-xs leading-relaxed mb-6">
              {activeTab === 'ORDERS'
                ? "When you place orders or receive delivery updates, they'll show up here."
                : activeTab === 'SOCIAL'
                ? "Follow stores and creators to get live story and product drops."
                : "You're all caught up! New alerts and updates will appear here."}
            </p>
            {activeTab !== 'ALL' && (
              <button
                onClick={() => setActiveTab('ALL')}
                className="px-4 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded-full shadow-sm hover:bg-gray-50 active:scale-95 transition-all"
              >
                View all notifications
              </button>
            )}
          </div>
        ) : (
          // Notification Cards Feed
          <div className="space-y-3">
            {filteredItems.map((item: any) => {
              const isUnread = !item.isRead;
              const hasImage = Boolean(item.imageUrl);
              const dataObj = typeof item.data === 'object' ? item.data : {};
              const deliveryOtp = dataObj?.deliveryOtp;

              return (
                <div
                  key={item.id}
                  onClick={() => handleNotificationClick(item)}
                  role="button"
                  tabIndex={0}
                  className={`group relative flex items-start gap-3.5 p-4 rounded-2xl border transition-all duration-200 cursor-pointer active:scale-[0.99] ${
                    isUnread
                      ? 'bg-white border-[#FF5A36]/30 shadow-md shadow-[#FF5A36]/5'
                      : 'bg-white/80 border-gray-200/70 hover:bg-white hover:border-gray-300 hover:shadow-sm'
                  }`}
                >
                  {/* Unread Accent Left Bar */}
                  {isUnread && (
                    <div className="absolute left-0 top-3 bottom-3 w-1 bg-[#FF5A36] rounded-r-full" />
                  )}

                  {/* Icon Avatar */}
                  <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border ${getIconBackground(
                      item.type
                    )}`}
                  >
                    {getItemIcon(item.type)}
                  </div>

                  {/* Body Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h4
                        className={`text-sm tracking-tight truncate ${
                          isUnread ? 'font-bold text-gray-900' : 'font-medium text-gray-800'
                        }`}
                      >
                        {item.title}
                      </h4>
                      <span className="flex items-center gap-1 text-[11px] font-medium text-gray-400 whitespace-nowrap shrink-0">
                        <Clock className="w-3 h-3" />
                        {formatTimestamp(item.createdAt)}
                      </span>
                    </div>

                    <p
                      className={`text-xs leading-relaxed line-clamp-2 ${
                        isUnread ? 'text-gray-700 font-normal' : 'text-gray-500'
                      }`}
                    >
                      {item.body}
                    </p>

                    {/* Delivery OTP Tag if applicable */}
                    {deliveryOtp && (
                      <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 border border-amber-200 rounded-lg text-xs font-bold text-amber-900">
                        <span>OTP:</span>
                        <span className="font-mono tracking-wider">{deliveryOtp}</span>
                      </div>
                    )}

                    {/* Image Banner Attachment */}
                    {hasImage && (
                      <div className="relative mt-2.5 w-full h-32 rounded-xl overflow-hidden bg-gray-100 border border-gray-200/80">
                        <Image
                          src={getMediaUrl(item.imageUrl)}
                          alt={item.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}

                    {/* Action Deep Link Prompt */}
                    {item.deepLink && item.deepLink !== '/' && (
                      <div className="flex items-center gap-1 mt-2.5 text-xs font-semibold text-[#FF5A36] group-hover:underline">
                        <span>View details</span>
                        <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    )}
                  </div>

                  {/* Unread Glowing Dot */}
                  {isUnread && (
                    <div className="w-2.5 h-2.5 rounded-full bg-[#FF5A36] ring-4 ring-[#FF5A36]/20 shrink-0 mt-1" />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
