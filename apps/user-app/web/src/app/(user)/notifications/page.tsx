'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, Bell } from 'lucide-react';

export default function NotificationsPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Header */}
      <div className="flex items-center gap-3 px-3 py-4 border-b border-gray-100">
        <button onClick={() => router.back()} className="p-2 -ml-2 rounded-full hover:bg-gray-50 text-gray-800 shrink-0 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-bold text-lg text-gray-900">Notifications</h1>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-4">
          <Bell className="w-10 h-10 text-indigo-300" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">No new notifications</h2>
        <p className="text-gray-500 text-sm max-w-[250px]">
          We'll let you know when there are updates about your orders or account.
        </p>
      </div>
    </div>
  );
}

