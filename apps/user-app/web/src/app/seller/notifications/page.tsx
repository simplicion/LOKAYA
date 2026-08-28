'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { SellerHeader } from '@/components/seller/SellerHeader';
import { Bell, Package, CheckCircle2, AlertCircle, MessageSquare } from 'lucide-react';

const MOCK_NOTIFICATIONS = [
  {
    id: 1,
    type: 'order',
    title: 'New Order #ORD1345',
    message: 'You have received a new order for 2 items.',
    time: '2 mins ago',
    read: false,
    icon: <Package className="w-5 h-5 text-indigo-600" />,
    bg: 'bg-indigo-50',
  },
  {
    id: 2,
    type: 'system',
    title: 'Store Verification Successful',
    message: 'Your store KYC has been verified. You now have full access.',
    time: '1 hour ago',
    read: true,
    icon: <CheckCircle2 className="w-5 h-5 text-green-600" />,
    bg: 'bg-green-50',
  },
  {
    id: 3,
    type: 'alert',
    title: 'Low Stock Alert',
    message: 'Fresh Apples are running low on stock (Only 2 left).',
    time: '3 hours ago',
    read: false,
    icon: <AlertCircle className="w-5 h-5 text-orange-600" />,
    bg: 'bg-orange-50',
  },
  {
    id: 4,
    type: 'message',
    title: 'New message from Rohit',
    message: 'Can I change my delivery time?',
    time: '1 day ago',
    read: true,
    icon: <MessageSquare className="w-5 h-5 text-blue-600" />,
    bg: 'bg-blue-50',
  }
];

export default function NotificationsPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col min-h-screen bg-[#FFFFFF] pb-24">
      <SellerHeader 
        title="Notifications" 
        showBack={true} 
        onBack={() => router.back()} 
        hideSearchIcon={true}
      />

      <div className="flex-1 p-4">
        {MOCK_NOTIFICATIONS.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center mt-20">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <Bell className="w-8 h-8 text-gray-300" />
            </div>
            <h3 className="text-lg font-bold text-[#171717]">No notifications yet</h3>
            <p className="text-sm text-[#6B6B6B] mt-2">When you get notifications, they'll show up here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {MOCK_NOTIFICATIONS.map((notification) => (
              <div 
                key={notification.id} 
                className={`flex gap-4 p-4 rounded-[1.25rem] border transition-colors ${
                  !notification.read ? 'bg-[#F9F9F9] border-[#E5E2DC]' : 'bg-white border-transparent'
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${notification.bg}`}>
                  {notification.icon}
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
