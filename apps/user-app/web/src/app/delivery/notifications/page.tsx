'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Bell, 
  Bike, 
  Package, 
  AlertCircle, 
  Clock, 
  CheckCheck, 
  ChevronRight, 
  Wallet,
  Loader2
} from 'lucide-react';
import { 
  useGetUserNotificationsQuery, 
  useMarkUserNotificationReadMutation, 
  useMarkAllUserNotificationsReadMutation 
} from '@/lib/api';

export default function DeliveryNotificationsPage() {
  const router = useRouter();
  const [filter, setFilter] = useState<'ALL' | 'DISPATCH' | 'SYSTEM'>('ALL');

  const { data, isLoading, refetch } = useGetUserNotificationsQuery(
    undefined,
    { pollingInterval: 20000 }
  );
  const [markRead] = useMarkUserNotificationReadMutation();
  const [markAllRead, { isLoading: isMarkingAll }] = useMarkAllUserNotificationsReadMutation();

  const allItems = data?.items || [];
  const unreadCount = data?.unreadCount || 0;

  const filteredItems = allItems.filter((item: any) => {
    if (filter === 'ALL') return true;
    if (filter === 'DISPATCH') {
      return item.type === 'DELIVERY_DISPATCH' || item.type === 'ORDER_UPDATE';
    }
    if (filter === 'SYSTEM') {
      return item.type === 'SYSTEM' || item.type === 'MARKETING';
    }
    return true;
  });

  const handleNotificationClick = async (item: any) => {
    if (!item.isRead) {
      markRead(item.id).catch(() => {});
    }
    if (item.deepLink && item.deepLink !== '/') {
      router.push(item.deepLink);
    } else if (item.data?.orderId) {
      router.push(`/delivery/orders/${item.data.orderId}`);
    }
  };

  const handleMarkAllRead = async () => {
    if (unreadCount > 0 && !isMarkingAll) {
      await markAllRead();
      refetch();
    }
  };

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'DELIVERY_DISPATCH':
        return <Bike className="w-5 h-5 text-emerald-600" />;
      case 'ORDER_UPDATE':
        return <Package className="w-5 h-5 text-indigo-600" />;
      case 'PAYOUT':
        return <Wallet className="w-5 h-5 text-amber-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-blue-600" />;
    }
  };

  const getIconBg = (type: string) => {
    switch (type) {
      case 'DELIVERY_DISPATCH':
        return 'bg-emerald-50 border-emerald-200';
      case 'ORDER_UPDATE':
        return 'bg-indigo-50 border-indigo-200';
      case 'PAYOUT':
        return 'bg-amber-50 border-amber-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#FAF9F6]">
      {/* Top Header */}
      <div className="sticky top-0 z-20 bg-white border-b border-[#E5E2DC] px-4 py-3.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-1.5 -ml-1 rounded-full hover:bg-gray-100 text-[#171717] transition-colors cursor-pointer"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-[#171717]">Rider Notifications</h1>
            <p className="text-[11px] text-[#6B6B6B]">Dispatch updates and delivery alerts</p>
          </div>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            disabled={isMarkingAll}
            className="text-xs font-bold text-[#FF5A36] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            Mark all read
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="bg-white border-b border-[#E5E2DC] px-4 py-2.5 flex items-center gap-2">
        <button
          onClick={() => setFilter('ALL')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-colors cursor-pointer ${
            filter === 'ALL'
              ? 'bg-[#171717] text-white'
              : 'bg-[#F9F9F9] text-[#6B6B6B] hover:bg-gray-200'
          }`}
        >
          All ({allItems.length})
        </button>
        <button
          onClick={() => setFilter('DISPATCH')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-colors cursor-pointer ${
            filter === 'DISPATCH'
              ? 'bg-[#171717] text-white'
              : 'bg-[#F9F9F9] text-[#6B6B6B] hover:bg-gray-200'
          }`}
        >
          Delivery Tasks
        </button>
        <button
          onClick={() => setFilter('SYSTEM')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-colors cursor-pointer ${
            filter === 'SYSTEM'
              ? 'bg-[#171717] text-white'
              : 'bg-[#F9F9F9] text-[#6B6B6B] hover:bg-gray-200'
          }`}
        >
          Alerts
        </button>
      </div>

      {/* Notifications List */}
      <div className="p-4 space-y-3">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#FF5A36]" />
            <span className="text-xs font-semibold text-[#6B6B6B]">Loading updates...</span>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-20 bg-white rounded-2xl border border-[#E5E2DC] p-8">
            <div className="w-14 h-14 rounded-full bg-orange-50 border border-orange-200 flex items-center justify-center mb-3">
              <Bell className="w-7 h-7 text-[#FF5A36]" />
            </div>
            <h3 className="font-bold text-base text-[#171717]">No alerts yet</h3>
            <p className="text-xs text-[#6B6B6B] mt-1 max-w-xs">
              When new delivery orders are assigned or stores request fulfillment, they will appear here instantly.
            </p>
          </div>
        ) : (
          filteredItems.map((item: any) => {
            const dateStr = item.createdAt ? new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
            return (
              <div
                key={item.id}
                onClick={() => handleNotificationClick(item)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5 active:scale-[0.99] ${
                  !item.isRead 
                    ? 'bg-white border-[#FF5A36]/40 shadow-xs ring-1 ring-[#FF5A36]/10' 
                    : 'bg-white border-[#E5E2DC] opacity-90'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${getIconBg(item.type)}`}>
                  {getItemIcon(item.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h4 className="font-bold text-sm text-[#171717] truncate">
                      {item.title}
                    </h4>
                    <span className="text-[10px] font-semibold text-[#999999] whitespace-nowrap flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {dateStr}
                    </span>
                  </div>

                  <p className="text-xs text-[#6B6B6B] leading-relaxed line-clamp-2">
                    {item.body}
                  </p>

                  {item.deepLink && item.deepLink !== '/' && (
                    <div className="mt-2.5 flex items-center gap-1 text-[11px] font-bold text-[#FF5A36]">
                      <span>Open Task</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>

                {!item.isRead && (
                  <span className="w-2.5 h-2.5 rounded-full bg-[#FF5A36] shrink-0 mt-1 animate-pulse" />
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
