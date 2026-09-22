'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { 
  Bike, 
  Truck, 
  Users, 
  ShoppingBag, 
  Banknote, 
  PlusCircle, 
  ChevronRight, 
  Zap,
  Store
} from 'lucide-react';
import { useGetMyStoreQuery, useGetStorePartnerRequestsQuery } from '@/lib/api';
import { AnimatedBottomSheet } from '@/components/ui/AnimatedBottomSheet';
import { motion } from 'framer-motion';
import { springs } from '@/lib/animations';

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
    <AnimatedBottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Store Operations & Hubs"
      subtitle="Quick access to all merchant operational tools"
      icon={
        <div className="w-9 h-9 rounded-2xl bg-orange-100 text-[#FF5A36] flex items-center justify-center font-bold">
          <Zap className="w-4 h-4" />
        </div>
      }
      footer={
        <div className="p-4 text-center">
          <p className="text-[11px] text-[#6B6B6B]">
            Hyperlocal Delivery, POS & Fleet Management for verified merchants
          </p>
        </div>
      }
    >
      <div className="p-4 sm:p-5 space-y-2.5">
        {actionItems.map((item, idx) => {
          const Icon = item.icon;
          return (
            <motion.button
              key={idx}
              whileTap={{ scale: 0.98 }}
              whileHover={{ scale: 1.01 }}
              transition={springs.snappy}
              onClick={() => handleNavigate(item.href)}
              className={`w-full p-3.5 rounded-2xl border border-[#E5E2DC] bg-white hover:bg-gray-50/80 flex items-center justify-between text-left transition-all group ${item.accentColor} shadow-xs cursor-pointer`}
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
            </motion.button>
          );
        })}
      </div>
    </AnimatedBottomSheet>
  );
}
