'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { 
  ArrowLeft, 
  Bike, 
  MapPin, 
  Package, 
  CheckSquare, 
  Square, 
  Sparkles, 
  Users, 
  TrendingUp, 
  ChevronRight, 
  Loader2, 
  CheckCircle2, 
  Layers, 
  Clock, 
  DollarSign, 
  Store,
  Share2,
  RefreshCw,
  ShoppingBag,
  Tag
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SellerHeader } from '@/components/seller/SellerHeader';
import { 
  useGetMyStoreQuery, 
  useGetStoreReadyOrdersForDispatchQuery,
  usePreviewBatchEconomicsMutation,
  useDispatchBatchMutation,
  useGetStoreConnectedPartnersQuery 
} from '@/lib/api';
import { PartnerSelectionBottomSheet } from '@/components/seller/PartnerSelectionBottomSheet';
import { ParcelRecognitionSlipModal } from '@/components/seller/ParcelRecognitionSlip';
import { useCurrency } from '@/context/CurrencyContext';
import { toast } from 'sonner';

export default function SellerBatchDispatchPage() {
  const router = useRouter();
  const { formatPrice, currencySymbol } = useCurrency();
  const { data: storeData } = useGetMyStoreQuery();
  const storeId = storeData?.id || '';

  const { 
    data: readyData, 
    isLoading, 
    refetch 
  } = useGetStoreReadyOrdersForDispatchQuery(storeId, { skip: !storeId });

  const { data: connectedPartners = [] } = useGetStoreConnectedPartnersQuery(storeId, { skip: !storeId });

  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null);
  const [viewingSlipOrder, setViewingSlipOrder] = useState<any | null>(null);

  const [dispatchBatch, { isLoading: isDispatching }] = useDispatchBatchMutation();

  const clusters = readyData?.clusters || [];
  const totalReadyOrders = readyData?.totalReadyOrders || 0;

  // Toggle single order
  const handleToggleOrder = (orderId: string) => {
    setSelectedOrderIds(prev => 
      prev.includes(orderId) ? prev.filter(id => id !== orderId) : [...prev, orderId]
    );
  };

  // Toggle entire zone cluster
  const handleToggleZone = (zoneOrderIds: string[]) => {
    const allSelected = zoneOrderIds.every(id => selectedOrderIds.includes(id));
    if (allSelected) {
      setSelectedOrderIds(prev => prev.filter(id => !zoneOrderIds.includes(id)));
    } else {
      setSelectedOrderIds(prev => Array.from(new Set([...prev, ...zoneOrderIds])));
    }
  };

  // 50/50 Multi-Drop Batch Financial Calculation
  const selectedCount = selectedOrderIds.length;
  const batchCalculation = React.useMemo(() => {
    if (selectedCount === 0) {
      return { totalCollected: 0, riderPayout: 0, merchantProfit: 0, drop1: 0, extraDrops: 0 };
    }

    // Find all selected order objects across clusters
    const selectedObjs: any[] = [];
    for (const c of clusters) {
      for (const o of c.orders) {
        if (selectedOrderIds.includes(o.id)) {
          selectedObjs.push(o);
        }
      }
    }

    // Sort descending by shipping fee
    selectedObjs.sort((a, b) => (b.shippingFee || 50) - (a.shippingFee || 50));

    let totalCollected = 0;
    let riderPayout = 0;
    let merchantProfit = 0;

    selectedObjs.forEach((o, idx) => {
      const fee = o.shippingFee || 50;
      totalCollected += fee;
      if (idx === 0) {
        // Drop 1: 100% to Rider
        riderPayout += fee;
      } else {
        // Drops 2..N: 50% to Rider, 50% to Merchant
        const half = Math.round(fee * 0.50);
        riderPayout += half;
        merchantProfit += (fee - half);
      }
    });

    const drop1Fee = selectedObjs[0]?.shippingFee || 50;

    return {
      totalCollected,
      riderPayout,
      merchantProfit,
      drop1: drop1Fee,
      extraDrops: selectedObjs.length - 1
    };
  }, [selectedOrderIds, clusters, selectedCount]);

  // Execute Dispatch Assignment
  const handleConfirmBatchDispatch = async (fulfillmentType: 'LOKAYA_AUTO' | 'LOKAYA_PARTNER' | 'SELF_DELIVERY') => {
    if (selectedOrderIds.length === 0) {
      toast.error('Please select at least one order to dispatch');
      return;
    }

    try {
      await dispatchBatch({
        storeId,
        orderIds: selectedOrderIds,
        fulfillmentType,
        deliveryPartnerId: selectedPartnerId || undefined
      }).unwrap();

      toast.success(`🚀 Bulk Dispatch Created for ${selectedCount} Orders!`);
      setSelectedOrderIds([]);
      setIsDispatchModalOpen(false);
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to dispatch batch');
    }
  };

  return (
    <div className="flex flex-col min-h-[100dvh] bg-[#FAF9F6] pb-40">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-white sticky top-0 z-20 border-b border-[#E5E2DC]">
        <div className="flex items-center gap-2.5">
          <button 
            onClick={() => router.back()} 
            className="p-2 -ml-2 rounded-full hover:bg-gray-100 text-gray-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black text-[#171717]">Batch Dispatch Hub</h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-orange-100 text-[#FF5A36]">
                {totalReadyOrders} Ready
              </span>
            </div>
            <p className="text-[11px] text-[#6B6B6B]">Bundle orders in the same zone & earn 50% multi-drop profit</p>
          </div>
        </div>

        <button
          onClick={() => refetch()}
          className="p-2 rounded-xl bg-gray-50 border border-[#E5E2DC] hover:bg-gray-100 text-gray-600 transition-colors"
          title="Refresh orders"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Main Content Area */}
      <div className="p-4 space-y-4 max-w-3xl mx-auto w-full">
        
        {/* Explanation Card */}
        <div className="bg-gradient-to-r from-orange-50 via-amber-50 to-orange-50/50 border border-orange-200 rounded-2xl p-4 flex items-start gap-3 shadow-2xs">
          <div className="p-2 rounded-xl bg-[#FF5A36] text-white shrink-0 mt-0.5">
            <Layers className="w-5 h-5" />
          </div>
          <div className="text-xs space-y-1">
            <h4 className="font-black text-[#171717]">How Multi-Drop Profit Sharing Works</h4>
            <p className="text-[#6B6B6B] leading-relaxed">
              When you bundle multiple orders into a single rider pickup:
              <br />
              • <strong>1st Drop</strong>: Rider receives 100% of the customer shipping fee.
              <br />
              • <strong>Drops 2+ (Multi-Stops)</strong>: Shipping fee is split <strong>50% to Rider</strong> and <strong>50% retained by your Store</strong> as extra bundling profit!
            </p>
          </div>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-[#FF5A36] mb-2" />
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Scanning Ready Packages...</p>
          </div>
        ) : clusters.length === 0 ? (
          <div className="bg-white rounded-3xl border border-[#E5E2DC] p-12 text-center space-y-3 my-4">
            <div className="w-16 h-16 rounded-2xl bg-orange-50 text-[#FF5A36] flex items-center justify-center mx-auto border border-orange-100">
              <Package className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-gray-900">No Orders Waiting for Dispatch</h3>
            <p className="text-xs text-gray-500 max-w-xs mx-auto">
              All placed customer orders are either already in transit or completed.
            </p>
            <Button
              variant="outline"
              onClick={() => router.push('/seller/orders')}
              className="mt-2 text-xs rounded-xl"
            >
              Go to Orders Manager
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {clusters.map((cluster: any, cIdx: number) => {
              const zoneOrderIds = cluster.orders.map((o: any) => o.id);
              const allZoneSelected = zoneOrderIds.every((id: string) => selectedOrderIds.includes(id));
              const someZoneSelected = zoneOrderIds.some((id: string) => selectedOrderIds.includes(id));

              return (
                <div key={cIdx} className="bg-white rounded-3xl border border-[#E5E2DC] shadow-xs overflow-hidden">
                  {/* Zone Cluster Header */}
                  <div className="p-4 bg-slate-50/80 border-b border-[#E5E2DC] flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-[#FF5A36]" />
                      <div>
                        <h3 className="font-black text-xs text-[#171717]">{cluster.zone}</h3>
                        <p className="text-[10px] text-[#6B6B6B]">
                          {cluster.ordersCount} {cluster.ordersCount === 1 ? 'Package' : 'Packages'} • Total Shipping: {formatPrice(cluster.totalShippingCollected)}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleZone(zoneOrderIds)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        allZoneSelected 
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-white text-gray-700 border border-[#E5E2DC] hover:border-gray-400'
                      }`}
                    >
                      {allZoneSelected ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
                      <span>{allZoneSelected ? 'Deselect Zone' : 'Select All Zone'}</span>
                    </button>
                  </div>

                  {/* Cluster Orders List */}
                  <div className="divide-y divide-gray-100 p-2">
                    {cluster.orders.map((order: any) => {
                      const isSelected = selectedOrderIds.includes(order.id);

                      return (
                        <div
                          key={order.id}
                          onClick={() => handleToggleOrder(order.id)}
                          className={`p-3.5 rounded-2xl transition-all cursor-pointer flex items-center justify-between gap-3 ${
                            isSelected 
                              ? 'bg-orange-50/60 border border-orange-300 ring-1 ring-orange-400/20'
                              : 'hover:bg-gray-50/80 border border-transparent'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            {/* Checkbox */}
                            <div className="shrink-0">
                              {isSelected ? (
                                <div className="w-5 h-5 rounded-lg bg-[#FF5A36] text-white flex items-center justify-center">
                                  <CheckSquare className="w-4 h-4" />
                                </div>
                              ) : (
                                <div className="w-5 h-5 rounded-lg border-2 border-gray-300 bg-white" />
                              )}
                            </div>

                            {/* Thumbnail */}
                            <div className="w-12 h-12 rounded-xl bg-gray-100 overflow-hidden shrink-0 border border-gray-200 relative flex items-center justify-center">
                              {order.firstItemImage ? (
                                <img src={order.firstItemImage} alt={order.firstItemName} className="w-full h-full object-cover" />
                              ) : (
                                <Package className="w-5 h-5 text-gray-400" />
                              )}
                              {order.itemsCount > 1 && (
                                <div className="absolute bottom-0 right-0 bg-black/75 text-white text-[8px] font-black px-1 rounded-tl">
                                  +{order.itemsCount - 1}
                                </div>
                              )}
                            </div>

                            {/* Order Details */}
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-black text-xs text-[#171717]">
                                  #{order.id.slice(0, 8).toUpperCase()}
                                </span>
                                <span className="text-[10px] font-bold text-gray-500 truncate">
                                  {order.customerName}
                                </span>
                              </div>
                              <p className="text-[11px] text-gray-600 truncate mt-0.5">
                                {order.deliveryAddress}
                              </p>
                            </div>
                          </div>

                          {/* Shipping Fee & Parcel Slip */}
                          <div className="text-right shrink-0 flex flex-col items-end gap-1">
                            <span className="font-black text-xs text-[#171717] block">
                              {formatPrice(order.shippingFee)}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setViewingSlipOrder({
                                  id: order.id,
                                  orderNumber: order.id,
                                  timeLabel: 'Ready for Dispatch',
                                  paymentMethod: order.paymentMethod || 'COD',
                                  totalAmount: order.totalAmount || order.total || order.shippingFee,
                                  customerName: order.customerName,
                                  phone: order.customerPhone || order.phone,
                                  deliveryAddress: order.deliveryAddress,
                                  storeName: storeData?.name,
                                  items: [{
                                    name: order.firstItemName || 'Packed Item',
                                    quantity: order.itemsCount || 1,
                                    image: order.firstItemImage
                                  }]
                                });
                              }}
                              className="px-2 py-0.5 rounded-md bg-gray-100 hover:bg-orange-100 text-gray-700 hover:text-[#FF5A36] text-[10px] font-bold flex items-center gap-1 transition-colors"
                              title="Print Parcel Slip"
                            >
                              <Tag className="w-3 h-3 text-[#FF5A36]" />
                              <span>Slip</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* Floating Sticky Batch Dispatch Summary Action Bar */}
      {selectedCount > 0 && (
        <div className="fixed bottom-0 left-0 w-full p-4 bg-white/95 backdrop-blur-md border-t border-[#E5E2DC] z-30 shadow-xl animate-in slide-in-from-bottom duration-200">
          <div className="max-w-3xl mx-auto space-y-3">
            
            {/* Live Financial Breakdown Bar */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs p-3 rounded-2xl bg-gradient-to-r from-orange-50 via-amber-50 to-emerald-50 border border-orange-200">
              <div>
                <span className="text-[10px] font-bold text-gray-500 uppercase block">Total Collected</span>
                <span className="font-black text-sm text-[#171717]">{formatPrice(batchCalculation.totalCollected)}</span>
                <span className="text-[9px] text-gray-400 block">{selectedCount} Drops</span>
              </div>

              <div>
                <span className="text-[10px] font-bold text-blue-600 uppercase block">Rider Payout</span>
                <span className="font-black text-sm text-blue-700">{formatPrice(batchCalculation.riderPayout)}</span>
                <span className="text-[9px] text-blue-500 block">1st full + 50% multi</span>
              </div>

              <div>
                <span className="text-[10px] font-bold text-emerald-700 uppercase block">Store Profit</span>
                <span className="font-black text-sm text-emerald-700">+{formatPrice(batchCalculation.merchantProfit)}</span>
                <span className="text-[9px] text-emerald-600 font-bold block">50% Multi-Drop</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setSelectedOrderIds([])}
                className="h-12 px-3 rounded-xl text-xs font-bold border-[#E5E2DC]"
              >
                Clear
              </Button>

              <Button
                variant="outline"
                onClick={() => {
                  for (const c of clusters) {
                    for (const o of c.orders) {
                      if (selectedOrderIds.includes(o.id)) {
                        setViewingSlipOrder({
                          id: o.id,
                          orderNumber: o.id,
                          timeLabel: 'Ready for Dispatch',
                          paymentMethod: o.paymentMethod || 'COD',
                          totalAmount: o.totalAmount || o.total || o.shippingFee,
                          customerName: o.customerName,
                          phone: o.customerPhone || o.phone,
                          deliveryAddress: o.deliveryAddress,
                          storeName: storeData?.name,
                          items: [{
                            name: o.firstItemName || 'Packed Item',
                            quantity: o.itemsCount || 1,
                            image: o.firstItemImage
                          }]
                        });
                        return;
                      }
                    }
                  }
                }}
                className="h-12 px-3.5 rounded-xl text-xs font-bold border-[#E5E2DC] text-gray-800 hover:bg-gray-100 flex items-center gap-1.5 shadow-xs"
              >
                <Tag className="w-4 h-4 text-[#FF5A36]" />
                <span>Parcel Slip</span>
              </Button>

              <Button
                onClick={() => setIsDispatchModalOpen(true)}
                disabled={isDispatching}
                className="flex-1 h-12 rounded-xl bg-[#FF5A36] hover:bg-[#e04d2d] text-white font-black text-sm shadow-md shadow-orange-500/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Bike className="w-5 h-5" />
                <span>Dispatch {selectedCount} {selectedCount === 1 ? 'Order' : 'Orders'}</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* PARTNER SELECTION DRAWER FOR BULK BATCH DISPATCH */}
      <PartnerSelectionBottomSheet
        isOpen={isDispatchModalOpen}
        onClose={() => setIsDispatchModalOpen(false)}
        onBack={() => setIsDispatchModalOpen(false)}
        partners={connectedPartners}
        selectedPartnerId={selectedPartnerId}
        onSelectPartner={(riderId) => setSelectedPartnerId(riderId)}
        onConfirmAssign={() => handleConfirmBatchDispatch('LOKAYA_PARTNER')}
        isSubmitting={isDispatching}
        customerPaidShipping={batchCalculation.totalCollected}
        orderDistanceKm={5}
      />

      {/* Parcel Recognition Slip Modal */}
      {viewingSlipOrder && (
        <ParcelRecognitionSlipModal
          isOpen={Boolean(viewingSlipOrder)}
          onClose={() => setViewingSlipOrder(null)}
          order={viewingSlipOrder}
        />
      )}

    </div>
  );
}
