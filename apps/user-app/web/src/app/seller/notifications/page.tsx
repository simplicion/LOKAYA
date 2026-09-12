'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { SellerHeader } from '@/components/seller/SellerHeader';
import { Bell, Package, CheckCircle2, AlertCircle, MessageSquare, Loader2, Check } from 'lucide-react';
import { useGetSellerNotificationsQuery, useMarkNotificationReadMutation, useMarkAllNotificationsReadMutation } from '@/lib/api';

export default function NotificationsPage() {
  const router = useRouter();
  const { data: response, isLoading, refetch } = useGetSellerNotificationsQuery();
  const [markRead] = useMarkNotificationReadMutation();
  const [markAllRead] = useMarkAllNotificationsReadMutation();

  const notifications = response?.notifications || [];
  const unreadCount = response?.unreadCount || 0;

  const handleNotificationClick = async (notification: any) => {
    if (!notification.read) {
      await markRead(notification.id);
      refetch();
    }
    if (notification.linkUrl) {
      router.push(notification.linkUrl);
    }
  };

  const handleMarkAllRead = async () => {
    await markAllRead();
    refetch();
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'order':
        return <Package className="w-5 h-5 text-indigo-600" />;
      case 'alert':
        return <AlertCircle className="w-5 h-5 text-orange-600" />;
      case 'system':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      default:
        return <MessageSquare className="w-5 h-5 text-blue-600" />;
    }
  };

  const getBg = (type: string) => {
    switch (type) {
      case 'order':
        return 'bg-indigo-50';
      case 'alert':
        return 'bg-orange-50';
      case 'system':
        return 'bg-green-50';
      default:
        return 'bg-blue-50';
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#FFFFFF] pb-24">
      <SellerHeader 
        title="Notifications" 
        showBack={true} 
        onBack={() => router.back()} 
        hideSearchIcon={true}
        rightAction={
          unreadCount > 0 ? (
            <button 
              onClick={handleMarkAllRead}
              className="text-xs font-semibold text-[#FF5A36] hover:underline"
            >
              Mark all read
            </button>
          ) : undefined
        }
      />

      <div className="flex-1 p-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-[#FF5A36]" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center mt-20">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <Bell className="w-8 h-8 text-gray-300" />
            </div>
            <h3 className="text-lg font-bold text-[#171717]">No notifications yet</h3>
            <p className="text-sm text-[#6B6B6B] mt-2">When you get customer orders or alerts, they'll show up here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification: any) => (
              <div 
                key={notification.id} 
                onClick={() => handleNotificationClick(notification)}
                className={`flex gap-4 p-4 rounded-[1.25rem] border transition-colors cursor-pointer active:scale-[0.99] ${
                  !notification.read ? 'bg-[#F9F9F9] border-[#E5E2DC]' : 'bg-white border-transparent hover:bg-gray-50'
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${getBg(notification.type)}`}>
                  {getIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className={`text-sm font-semibold text-[#171717] truncate pr-2`}>
                      {notification.title}
                    </h4>
                    <span className="text-xs font-medium text-[#6B6B6B] whitespace-nowrap">
                      {notification.time}
                    </span>
                  </div>
                  <p className="text-sm text-[#6B6B6B] line-clamp-2 leading-snug">
                    {notification.message}
                  </p>
                </div>
                {!notification.read && (
                  <div className="w-2 h-2 rounded-full bg-[#FF5A36] mt-1.5 shrink-0" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
