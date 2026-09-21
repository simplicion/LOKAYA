'use client';

import React from 'react';
import Link from 'next/link';
import { Bell } from 'lucide-react';
import { useGetUserNotificationsQuery } from '@/lib/api';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store';

interface NotificationBellProps {
  className?: string;
  iconClassName?: string;
}

export function NotificationBell({ className = '', iconClassName = 'w-6 h-6' }: NotificationBellProps) {
  const user = useSelector((state: RootState) => state.auth.user);
  const { data } = useGetUserNotificationsQuery(undefined, {
    skip: !user,
    pollingInterval: 45000,
  });

  const unreadCount = data?.unreadCount || 0;

  return (
    <Link
      href="/notifications"
      prefetch={false}
      aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
      className={`relative text-[#171717] hover:opacity-80 transition-opacity p-0.5 inline-flex items-center justify-center ${className}`}
    >
      <Bell className={iconClassName} />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[1.125rem] h-[1.125rem] px-1 bg-[#FF5A36] text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white tabular-nums shadow-sm animate-pulse">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </Link>
  );
}
