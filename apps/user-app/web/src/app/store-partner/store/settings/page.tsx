'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { 
  Palette, 
  Clock, 
  Wallet, 
  CreditCard, 
  ListTree, 
  ChevronRight,
  ArrowLeft
} from 'lucide-react';

export default function StoreSettingsMenuPage() {
  const router = useRouter();

  const settingsLinks = [
    {
      title: 'Store Customization',
      description: 'Colors, themes, and branding',
      icon: <Palette className="w-6 h-6 text-indigo-500" />,
      href: '/store-partner/store/customization',
    },
    {
      title: 'Store Hours',
      description: 'Opening, closing, and working days',
      icon: <Clock className="w-6 h-6 text-green-500" />,
      href: '/store-partner/store/hours',
    },
    {
      title: 'Minimum Order',
      description: 'Order amounts and delivery options',
      icon: <Wallet className="w-6 h-6 text-blue-500" />,
      href: '/store-partner/store/minimum-order',
    },
    {
      title: 'Payment Methods',
      description: 'Online payments, cash, and refunds',
      icon: <CreditCard className="w-6 h-6 text-purple-500" />,
      href: '/store-partner/store/payment-methods',
    },
    {
      title: 'Manage Categories',
      description: 'Add, reorder, and organize categories',
      icon: <ListTree className="w-6 h-6 text-orange-500" />,
      href: '/store-partner/store/categories',
    },
  ];

  return (
    <div className="flex flex-col min-h-[100dvh] bg-gray-50 pb-20">
      {/* Header */}
      <div className="flex items-center p-4 bg-white sticky top-0 z-10 border-b border-gray-100">
        <button onClick={() => router.back()} className="p-2 -ml-2 rounded-full hover:bg-gray-100 text-gray-600">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="flex-1 text-lg font-bold text-center mr-8 text-gray-900">
          Store Settings Menu
        </h1>
      </div>

      <div className="p-4 space-y-4">
        <p className="text-sm font-medium text-gray-500 mb-2">Configuration</p>
        
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
          {settingsLinks.map((link, idx) => (
            <button
              key={link.title}
              onClick={() => router.push(link.href)}
              className={`flex items-center p-4 w-full text-left transition-colors active:bg-gray-50 hover:bg-gray-50 ${
                idx !== settingsLinks.length - 1 ? 'border-b border-gray-100' : ''
              }`}
            >
              <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mr-4 shrink-0">
                {link.icon}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{link.title}</h3>
                <p className="text-sm text-gray-500">{link.description}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
