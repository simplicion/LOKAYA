'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ChevronLeft, 
  Package, 
  Search, 
  Loader2, 
  ArrowRight, 
  Star, 
  MapPin, 
  CreditCard, 
  Banknote, 
  Truck, 
  Store as StoreIcon, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  RotateCcw,
  Sparkles,
  ReceiptText
} from 'lucide-react';
import { useGetUserOrdersQuery } from '@/lib/api';
import { useCurrency } from '@/context/CurrencyContext';
import Image from 'next/image';
import { cn, getMediaUrl } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const TABS = [
  { id: 'all', label: 'All Orders' },
  { id: 'ongoing', label: 'Ongoing' },
  { id: 'delivered', label: 'Delivered' },
  { id: 'cancelled', label: 'Cancelled' },
  { id: 'returned', label: 'Returned' },
];

function formatOrderDate(dateStr: string | null | undefined): string {
  if (!dateStr) return 'Recent Order';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const isToday = d.toDateString() === new Date().toDateString();
    if (isToday) {
      return `Today, ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return 'Recent Order';
  }
}

function formatAddressSnippet(addr: string | null | undefined): string | null {
  if (!addr) return null;
  const clean = addr.replace(/\(Ph:[^)]*\)/g, '').trim();
  const parts = clean.split(',').map(s => s.trim()).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]}, ${parts[parts.length - 1]}`;
  }
  return clean || null;
}

export default function OrderHistoryPage() {
  const router = useRouter();
  const { formatPrice } = useCurrency();
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const { data: orders = [], isLoading } = useGetUserOrdersQuery();

  // Tab counters
  const tabCounts = useMemo(() => {
    return {
      all: orders.length,
      ongoing: orders.filter((o: any) => {
        const s = (o.status || 'PENDING').toUpperCase();
        return ['PENDING', 'CONFIRMED', 'PROCESSING', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY'].includes(s);
      }).length,
      delivered: orders.filter((o: any) => (o.status || '').toUpperCase() === 'DELIVERED').length,
      cancelled: orders.filter((o: any) => (o.status || '').toUpperCase() === 'CANCELLED').length,
      returned: orders.filter((o: any) => ['RETURN_REQUESTED', 'RETURN_APPROVED', 'RETURNED', 'REFUNDED'].includes((o.status || '').toUpperCase())).length,
    };
  }, [orders]);

  // Filter orders based on active tab and optional search query
  const filteredOrders = useMemo(() => {
    return orders.filter((order: any) => {
      const rawStatus = (order.status || 'PENDING').toUpperCase();

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesId = (order.id || '').toLowerCase().includes(q);
        const matchesStore = (order.storeName || order.store?.name || '').toLowerCase().includes(q);
        const matchesItem = order.items?.some((i: any) => 
          (i.productName || i.title || i.name || i.product?.name || '').toLowerCase().includes(q)
        );
        if (!matchesId && !matchesStore && !matchesItem) return false;
      }

      if (activeTab === 'all') return true;
      if (activeTab === 'ongoing') {
        return ['PENDING', 'CONFIRMED', 'PROCESSING', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY'].includes(rawStatus);
      }
      if (activeTab === 'delivered') return rawStatus === 'DELIVERED';
      if (activeTab === 'cancelled') return rawStatus === 'CANCELLED';
      if (activeTab === 'returned') {
        return ['RETURN_REQUESTED', 'RETURN_APPROVED', 'RETURNED', 'REFUNDED'].includes(rawStatus);
      }
      return true;
    });
  }, [orders, activeTab, searchQuery]);

  const getStatusMeta = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'DELIVERED':
        return {
          label: 'Delivered',
          badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          Icon: CheckCircle2,
        };
      case 'CANCELLED':
        return {
          label: 'Cancelled',
          badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
          Icon: XCircle,
        };
      case 'RETURNED':
      case 'REFUNDED':
        return {
          label: status?.toUpperCase() === 'REFUNDED' ? 'Refunded' : 'Returned',
          badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
          Icon: RotateCcw,
        };
      case 'RETURN_REQUESTED':
      case 'RETURN_APPROVED':
        return {
          label: 'Return Requested',
          badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
          Icon: Clock,
        };
      case 'SHIPPED':
        return {
          label: 'Shipped',
          badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
          Icon: Truck,
        };
      case 'OUT_FOR_DELIVERY':
        return {
          label: 'Out for Delivery',
          badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
          Icon: Truck,
        };
      case 'PROCESSING':
      case 'PACKED':
        return {
          label: status?.toUpperCase() === 'PACKED' ? 'Packed' : 'Processing',
          badgeClass: 'bg-sky-50 text-sky-700 border-sky-200',
          Icon: Package,
        };
      case 'CONFIRMED':
        return {
          label: 'Confirmed',
          badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
          Icon: CheckCircle2,
        };
      default:
        return {
          label: 'Pending',
          badgeClass: 'bg-orange-50 text-[#FF6B00] border-orange-200',
          Icon: Clock,
        };
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/70 pb-24 flex flex-col max-w-md mx-auto relative shadow-2xl">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-20">
        <div className="flex items-center justify-between px-4 py-3.5">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => router.back()} 
              className="p-1.5 -ml-1.5 rounded-full hover:bg-gray-100 text-gray-800 transition-colors"
              aria-label="Back"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <h1 className="text-lg font-black text-gray-900 tracking-tight">My Orders</h1>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <button 
              onClick={() => setShowSearch(!showSearch)} 
              className={cn(
                "p-2 rounded-full transition-colors",
                showSearch ? "bg-orange-50 text-[#FF6B00]" : "hover:bg-gray-100 text-gray-600"
              )}
              aria-label="Search Orders"
            >
              <Search className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search Bar Collapsible */}
        {showSearch && (
          <div className="px-4 pb-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by order ID, product, or store..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                className="w-full bg-gray-100 rounded-xl pl-9 pr-8 py-2 text-xs text-gray-900 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-[#FF6B00]/40 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex overflow-x-auto no-scrollbar px-4 pt-1 gap-2 border-t border-gray-100">
          {TABS.map((tab) => {
            const count = (tabCounts as any)[tab.id] ?? 0;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "pb-2.5 pt-1 text-xs font-bold whitespace-nowrap transition-all relative flex items-center gap-1.5 px-1",
                  isActive ? "text-[#FF6B00]" : "text-gray-500 hover:text-gray-800"
                )}
              >
                <span>{tab.label}</span>
                <span className={cn(
                  "text-[10px] font-semibold px-1.5 py-0.2 rounded-full",
                  isActive ? "bg-orange-100 text-[#FF6B00]" : "bg-gray-100 text-gray-500"
                )}>
                  {count}
                </span>
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FF6B00] rounded-full animate-in fade-in duration-200" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Orders List Container */}
      <div className="flex-1 p-3.5 space-y-3.5 overflow-y-auto">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-[#FF6B00] mb-2" />
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Loading Your Orders...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-4 bg-white rounded-3xl border border-gray-100 shadow-sm my-4">
            <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center mb-3 text-[#FF6B00]">
              <Package className="w-8 h-8" />
            </div>
            <h3 className="text-base font-extrabold text-gray-900 mb-1">
              {searchQuery ? 'No Matching Orders' : 'No Orders Found'}
            </h3>
            <p className="text-xs text-gray-500 max-w-xs mb-5 leading-relaxed">
              {searchQuery 
                ? `No orders matching "${searchQuery}". Try searching with a different term.`
                : activeTab === 'all' 
                  ? "You haven't placed any orders yet. Discover unique handcrafted items from local sellers."
                  : `No orders currently found in the "${TABS.find(t => t.id === activeTab)?.label}" tab.`}
            </p>
            <Button
              onClick={() => router.push('/')}
              className="h-10 px-6 rounded-xl bg-[#FF6B00] hover:bg-[#ff7a1f] text-white font-bold text-xs shadow-md shadow-orange-500/20"
            >
              Explore Local Products
            </Button>
          </div>
        ) : (
          filteredOrders.map((order: any) => {
            const firstItem = order.items?.[0];
            const displayImage = firstItem?.image || 
              firstItem?.imageUrl || 
              firstItem?.product?.imageUrl || 
              firstItem?.product?.media?.[0]?.url || 
              '';
            const resolvedImgSrc = getMediaUrl(displayImage);

            const productTitle = firstItem?.productName || 
              firstItem?.title || 
              firstItem?.name || 
              firstItem?.product?.name || 
              'Artisan Item';

            const storeName = order.store?.name || order.storeName || 'Local Artisan Store';
            const storeLogo = order.store?.logoUrl ? getMediaUrl(order.store.logoUrl) : null;
            
            const totalItemsCount = order.itemsCount || 
              order.items?.reduce((s: number, i: any) => s + (i.quantity || 1), 0) || 
              order.items?.length || 
              1;

            const orderDateFormatted = formatOrderDate(order.createdAt || order.date);
            const addressSnippet = formatAddressSnippet(order.deliveryAddress);
            const statusMeta = getStatusMeta(order.status);
            const StatusIcon = statusMeta.Icon;

            const isDelivered = (order.status || '').toUpperCase() === 'DELIVERED';
            const isCOD = (order.rawPaymentMethod || order.paymentMethod || '').toUpperCase().includes('COD');

            return (
              <div 
                key={order.id} 
                onClick={() => router.push(`/orders/${order.id}`)}
                className="bg-white rounded-2xl border border-gray-150/80 p-4 shadow-sm hover:shadow-md hover:border-gray-300 transition-all cursor-pointer space-y-3.5 group"
              >
                {/* 1. Header: Order ID + Date & Status Badge */}
                <div className="flex justify-between items-start gap-2">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-gray-900 text-xs tracking-tight">
                        #{order.id.slice(0, 8)}
                      </span>
                      <span className="text-[10px] text-gray-400 font-semibold">•</span>
                      <span className="text-[11px] text-gray-500 font-medium">
                        {orderDateFormatted}
                      </span>
                    </div>
                    {/* Store Name Badge */}
                    <div className="flex items-center gap-1.5 mt-1">
                      {storeLogo ? (
                        <div className="relative w-3.5 h-3.5 rounded-full overflow-hidden shrink-0 border border-gray-100">
                          <Image 
                            src={storeLogo} 
                            alt={storeName} 
                            fill 
                            className="object-cover" 
                            sizes="14px"
                            unoptimized
                          />
                        </div>
                      ) : (
                        <StoreIcon className="w-3 h-3 text-orange-500 shrink-0" />
                      )}
                      <span className="text-[11px] font-semibold text-gray-600 truncate max-w-[200px]">
                        Sold by <strong className="text-gray-800 font-bold">{storeName}</strong>
                      </span>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <span className={cn(
                    "text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border flex items-center gap-1 shrink-0 shadow-xs",
                    statusMeta.badgeClass
                  )}>
                    <StatusIcon className="w-3 h-3" />
                    <span>{statusMeta.label}</span>
                  </span>
                </div>

                {/* 2. Product Showcase */}
                <div className="flex gap-3.5 items-start bg-gray-50/60 p-2.5 rounded-xl border border-gray-100">
                  {/* Thumbnail */}
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-gray-200 bg-white flex items-center justify-center shadow-xs">
                    {resolvedImgSrc ? (
                      <Image 
                        src={resolvedImgSrc} 
                        alt={productTitle} 
                        fill 
                        className="object-cover group-hover:scale-105 transition-transform duration-200"
                        sizes="64px"
                        unoptimized
                      />
                    ) : (
                      <Package className="w-6 h-6 text-gray-300" />
                    )}
                  </div>

                  {/* Product Meta */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 text-xs leading-snug line-clamp-2">
                      {productTitle}
                    </h3>

                    {/* Variant or Qty breakdown */}
                    <div className="flex flex-wrap items-center gap-1.5 mt-1">
                      <span className="text-[11px] text-gray-600 font-medium">
                        Qty: <strong className="font-bold text-gray-800">{firstItem?.quantity || 1}</strong>
                      </span>
                      {firstItem?.variantName && (
                        <span className="text-[10px] font-semibold text-gray-500 bg-gray-200/70 px-1.5 py-0.5 rounded">
                          {firstItem.variantName}
                        </span>
                      )}
                      <span className="text-[11px] text-gray-400">•</span>
                      <span className="text-[11px] font-semibold text-gray-700">
                        {formatPrice((firstItem?.price || firstItem?.priceAt || 0) * (firstItem?.quantity || 1))}
                      </span>
                    </div>

                    {/* Multiple items banner */}
                    {order.items && order.items.length > 1 && (
                      <div className="mt-1.5 flex items-center gap-1 text-[11px] font-semibold text-[#FF6B00]">
                        <Sparkles className="w-3 h-3 text-[#FF6B00]" />
                        <span>+ {order.items.length - 1} more {(order.items.length - 1) === 1 ? 'item' : 'items'} in package</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. Useful Context Row: Delivery Address & Payment Mode */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5 text-[11px] text-gray-500 border-t border-gray-100/70">
                  {/* Delivery Location */}
                  {addressSnippet ? (
                    <div className="flex items-center gap-1 truncate max-w-[220px]" title={order.deliveryAddress}>
                      <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
                      <span className="truncate">{addressSnippet}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-gray-400">
                      <Truck className="w-3 h-3 shrink-0" />
                      <span>{order.estimatedDelivery || 'Standard Delivery'}</span>
                    </div>
                  )}

                  {/* Payment Pill */}
                  <div className="flex items-center gap-1 shrink-0">
                    {isCOD ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200/60 font-medium text-[10px]">
                        <Banknote className="w-3 h-3 text-amber-600" />
                        <span>Cash on Delivery</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200/60 font-medium text-[10px]">
                        <CreditCard className="w-3 h-3 text-blue-600" />
                        <span>Prepaid</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* 4. Footer: Total Price + Action Buttons */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400">
                      Total ({totalItemsCount} {totalItemsCount === 1 ? 'item' : 'items'})
                    </span>
                    <span className="font-black text-gray-900 text-sm tracking-tight">
                      {formatPrice(order.totalAmount || 0)}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {isDelivered && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/orders/${order.id}/review`);
                        }}
                        className="text-[11px] font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2.5 py-1.5 rounded-xl flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                      >
                        <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                        <span>Rate</span>
                      </button>
                    )}

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/orders/${order.id}`);
                      }}
                      className="text-[11px] font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 px-2.5 py-1.5 rounded-xl flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <ReceiptText className="w-3 h-3 text-gray-500" />
                      <span>Details</span>
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/orders/${order.id}/track`);
                      }}
                      className="text-[11px] font-bold text-white bg-[#FF6B00] hover:bg-[#ff7a1f] px-3 py-1.5 rounded-xl flex items-center gap-1 shadow-sm shadow-orange-500/20 transition-all cursor-pointer active:scale-95"
                    >
                      <Truck className="w-3 h-3" />
                      <span>Track</span>
                      <ArrowRight className="w-3 h-3 ml-0.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
