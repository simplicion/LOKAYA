'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  X, 
  Bike, 
  Truck, 
  Users, 
  ShoppingBag, 
  Banknote, 
  PlusCircle, 
  ChevronRight, 
  Sparkles,
  Zap,
  Tag,
  Store
} from 'lucide-react';
import { useGetMyStoreQuery, useGetStorePartnerRequestsQuery } from '@/lib/api';

interface SellerQuickActionsSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SellerQuickActionsSheet({ isOpen, onClose }: SellerQuickActionsSheetProps) {
  const router = useRouter();
  const { data: store } = useGetMyStoreQuery();
  const { data: requests = [] } = useGetStorePartnerRequestsQuery(store?.id || '', {
    skip: !store?.id,
  });

  const pendingRequestsCount = requests.filter((r: any) => r.status === 'PENDING').length;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleNavigate = (path: string) => {
    onClose();
    router.push(path);
  };

  const actionItems = [
    {
      title: 'Store Profile & Settings',
      description: 'Store logo, address, hours & branding',
      icon: Store,
      href: '/seller/store',
      iconBg: 'bg-slate-100 text-slate-800 border-slate-200',
      accentColor: 'hover:border-slate-400'
    },
    {
      title: 'Delivery Fleet & Requests',
      description: 'Manage rider network & incoming requests',
      icon: Bike,
      href: '/seller/delivery-partners',
      badge: pendingRequestsCount > 0 ? `${pendingRequestsCount} Pending` : undefined,
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      accentColor: 'hover:border-emerald-300'
    },
    {
      title: 'Bulk Dispatch Hub',
      description: 'Batch route delivery with 50/50 payout split',
      icon: Truck,
      href: '/seller/dispatch',
      badge: '50/50 Batch',
      badgeColor: 'bg-orange-100 text-orange-800 border-orange-200',
      iconBg: 'bg-orange-50 text-[#FF5A36] border-orange-100',
      accentColor: 'hover:border-orange-300'
    },
    {
      title: 'Customer Insights & Top Buyers',
      description: 'VIP spenders leaderboard & repeat buyers',
      icon: Users,
      href: '/seller/analytics/customers',
      badge: 'CRM',
      badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
      iconBg: 'bg-blue-50 text-blue-600 border-blue-100',
      accentColor: 'hover:border-blue-300'
    },
    {
      title: 'POS Counter Sale',
      description: 'Walk-in customer billing & instant receipt',
      icon: ShoppingBag,
      href: '/seller/orders/manual',
      badge: 'Fast Billing',
      badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
      iconBg: 'bg-purple-50 text-purple-600 border-purple-100',
      accentColor: 'hover:border-purple-300'
    },
    {
      title: 'Finance & Payouts',
      description: 'Revenue, daily balances & bank settlement',
      icon: Banknote,
      href: '/seller/finance',
      iconBg: 'bg-amber-50 text-amber-600 border-amber-100',
      accentColor: 'hover:border-amber-300'
    },
    {
      title: 'Add New Product',
      description: 'List catalog items with variants & photos',
      icon: PlusCircle,
      href: '/seller/products/add',
      badge: 'New Item',
      badgeColor: 'bg-rose-100 text-rose-800 border-rose-200',
      iconBg: 'bg-rose-50 text-rose-600 border-rose-100',
      accentColor: 'hover:border-rose-300'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Sheet Content */}
      <div 
        className="relative w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-[#E5E2DC] z-10 max-h-[88vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200"
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-12 h-1.5 bg-gray-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E5E2DC] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-orange-100 text-[#FF5A36] flex items-center justify-center font-bold">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-black text-[#171717]">Store Operations & Hubs</h3>
              <p className="text-[11px] text-[#6B6B6B] font-medium">Quick access to all merchant operational tools</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-[#171717] flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Actions Grid */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-2.5">
          {actionItems.map((item, idx) => {
            const Icon = item.icon;
            return (
              <button
                key={idx}
                onClick={() => handleNavigate(item.href)}
                className={`w-full p-3.5 rounded-2xl border border-[#E5E2DC] bg-white hover:bg-gray-50/80 flex items-center justify-between text-left transition-all group ${item.accentColor} shadow-xs active:scale-[0.99]`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className={`w-11 h-11 rounded-2xl border flex items-center justify-center shrink-0 ${item.iconBg} transition-transform group-hover:scale-105`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-[#171717] group-hover:text-[#FF5A36] transition-colors truncate">
                        {item.title}
                      </span>
                      {item.badge && (
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${item.badgeColor} tracking-wider`}>
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#6B6B6B] mt-0.5 truncate">
                      {item.description}
                    </p>
                  </div>
                </div>

                <div className="w-7 h-7 rounded-xl bg-gray-50 group-hover:bg-orange-50 flex items-center justify-center shrink-0 text-gray-400 group-hover:text-[#FF5A36] transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </button>
            );
          })}
        </div>

        {/* Bottom Banner */}
        <div className="p-4 bg-[#FAF9F6] border-t border-[#E5E2DC] text-center">
          <p className="text-[11px] text-[#6B6B6B]">
            Hyperlocal Delivery, POS & Fleet Management for verified merchants
          </p>
        </div>
      </div>
    </div>
  );
}
