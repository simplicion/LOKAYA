'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { SellerHeader } from '@/components/seller/SellerHeader';
import { useGetMyStoreQuery, useGetStoreOrdersQuery } from '@/lib/api';
import { 
  Loader2, 
  Package, 
  ShoppingBag, 
  ChevronRight, 
  Clock, 
  Truck, 
  Store, 
  CreditCard, 
  Banknote,
  Sparkles
} from 'lucide-react';
import { useCurrency } from '@/context/CurrencyContext';

export default function OrdersPage() {
  const router = useRouter();
  const { formatPrice } = useCurrency();
  const [activeTab, setActiveTab] = useState<'All' | 'New' | 'Preparing' | 'Completed'>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: storeData } = useGetMyStoreQuery();
  const { data: ordersResponse, isLoading } = useGetStoreOrdersQuery(
    {
      storeId: storeData?.id || '',
      tab: activeTab,
      search: searchQuery
    },
    { skip: !storeData?.id }
  );

  const orders = ordersResponse?.orders || [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'New':
        return <span className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-black rounded-lg uppercase tracking-wider">New</span>;
      case 'Preparing':
        return <span className="px-2.5 py-1 bg-orange-50 text-orange-700 border border-orange-200 text-[11px] font-black rounded-lg uppercase tracking-wider">Preparing</span>;
      case 'Ready':
        return <span className="px-2.5 py-1 bg-purple-50 text-purple-700 border border-purple-200 text-[11px] font-black rounded-lg uppercase tracking-wider">Ready for Pickup</span>;
      case 'Completed':
        return <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-black rounded-lg uppercase tracking-wider">Completed</span>;
      default:
        return <span className="px-2.5 py-1 bg-gray-100 text-gray-700 border border-gray-200 text-[11px] font-black rounded-lg uppercase tracking-wider">{status}</span>;
    }
  };

  return (
    <div className="flex flex-col min-h-[100dvh] bg-[#FAF9F6] pb-28">
      {/* Top Header */}
      <SellerHeader 
        title="Orders" 
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Category Tabs */}
      <div className="bg-white border-b border-[#E5E2DC] sticky top-0 z-10">
        <div className="flex overflow-x-auto no-scrollbar px-4 py-3 gap-3">
          {['All', 'New', 'Preparing', 'Completed'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`text-xs font-bold whitespace-nowrap transition-all px-4 py-2 rounded-full border ${
                activeTab === tab 
                  ? 'bg-[#171717] text-white border-[#171717] shadow-sm' 
                  : 'text-[#6B6B6B] bg-white border-[#E5E2DC] hover:border-gray-400'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      <div className="flex-1 p-4 space-y-3.5">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-[#FF5A36] mb-2" />
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Loading Orders...</p>
          </div>
        ) : orders.length > 0 ? (
          orders.map((order) => {
            const firstItem = order.items?.[0];
            const productImage = order.firstItemImage || firstItem?.image || firstItem?.product?.imageUrl || null;
            const productName = order.firstItemName || firstItem?.name || firstItem?.productName || 'Ordered Product';
            const productVariant = order.firstItemVariant || firstItem?.variantName || null;
            const productSku = order.firstItemSku || firstItem?.sku || null;
            const itemsCount = order.itemsCount || order.items?.length || 1;
            const isCod = order.paymentMethod?.toLowerCase().includes('cash') || order.paymentMethod?.toLowerCase().includes('cod');
            const isDelivery = Boolean(order.deliveryAddress);

            return (
              <div 
                key={order.id} 
                onClick={() => router.push(`/seller/orders/details?id=${order.id}`)}
                className="bg-white rounded-2xl border border-[#E5E2DC] p-4 shadow-sm hover:shadow-md hover:border-gray-300 transition-all cursor-pointer active:scale-[0.99] space-y-3"
              >
                {/* Top Row: Order ID, Status, and Timestamp */}
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-sm text-[#171717] tracking-tight">
                      #{order.id.slice(0, 8).toUpperCase()}
                    </span>
                    <span className="text-[11px] font-medium text-gray-400 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-gray-400" />
                      {order.timeLabel}
                    </span>
                  </div>
                  {getStatusBadge(order.status)}
                </div>
                
                {/* Middle Row: 1st Product Visual & Product Details */}
                <div className="flex gap-3.5 items-start">
                  {/* Product Thumbnail */}
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-[#E5E2DC] bg-[#FAF9F6] flex items-center justify-center">
                    {productImage ? (
                      <Image 
                        src={productImage} 
                        alt={productName} 
                        fill 
                        className="object-cover"
                        sizes="64px"
                      />
                    ) : (
                      <Package className="w-6 h-6 text-gray-300" />
                    )}
                    {itemsCount > 1 && (
                      <div className="absolute bottom-0 right-0 bg-black/75 text-white text-[9px] font-black px-1.5 py-0.5 rounded-tl-md">
                        +{itemsCount - 1}
                      </div>
                    )}
                  </div>

                  {/* Product Description & Information */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 text-sm leading-snug line-clamp-1">
                      {productName}
                    </h3>

                    {/* Variant and SKU Badges */}
                    <div className="flex flex-wrap items-center gap-1.5 mt-1">
                      {productVariant && (
                        <span className="inline-block text-[10px] font-semibold bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md">
                          Variant: {productVariant}
                        </span>
                      )}
                      {productSku && (
                        <span className="inline-block font-mono text-[10px] font-semibold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md">
                          SKU: {productSku}
                        </span>
                      )}
                    </div>

                    {/* Customer Name */}
                    <p className="text-xs text-gray-500 font-medium mt-1">
                      Customer: <span className="font-bold text-gray-800">{order.customerName}</span>
                    </p>
                  </div>
                </div>

                {/* Bottom Row: Price, Payment Method, Delivery Type, and Details link */}
                <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {/* Payment Mode Tag */}
                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      isCod 
                        ? 'bg-amber-50 text-amber-700 border-amber-200' 
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}>
                      {isCod ? <Banknote className="w-3 h-3" /> : <CreditCard className="w-3 h-3" />}
                      {isCod ? 'Cash / COD' : 'Prepaid (UPI)'}
                    </span>

                    {/* Delivery / Pickup Tag */}
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-gray-600 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-full">
                      {isDelivery ? <Truck className="w-3 h-3 text-gray-500" /> : <Store className="w-3 h-3 text-gray-500" />}
                      {isDelivery ? 'Delivery' : 'Store Pickup'}
                    </span>
                  </div>

                  {/* Total Amount */}
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-black text-[#FF5A36]">
                      {formatPrice(typeof order.total === 'number' ? order.total : parseFloat(String(order.total).replace(/[^0-9.]/g, '')) || 0)}
                    </span>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="bg-white rounded-2xl border border-[#E5E2DC] p-12 text-center space-y-3 my-6">
            <div className="w-14 h-14 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-400 mx-auto">
              <ShoppingBag className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-gray-900">No Orders Found</h3>
            <p className="text-xs text-gray-500 max-w-xs mx-auto">
              There are no orders matching the selected filter ({activeTab}).
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
