'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  X, 
  Bike, 
  UserCheck, 
  Star, 
  Phone, 
  Check, 
  ExternalLink, 
  Loader2, 
  Sparkles,
  Users,
  ShieldCheck,
  TrendingUp,
  Banknote,
  Footprints
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCurrency } from '@/context/CurrencyContext';

export interface PartnerRider {
  id: string;
  name: string;
  phone?: string;
  avatarUrl?: string;
  vehicleType?: string;
  vehicleNumber?: string;
  vehiclePhotoUrl?: string;
  perKmRate?: number;
  baseFare?: number;
  isOnline?: boolean;
  isBusy?: boolean;
  rating?: number;
  totalDeliveries?: number;
}

interface PartnerSelectionBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onBack: () => void;
  partners: PartnerRider[];
  selectedPartnerId: string | null;
  onSelectPartner: (id: string) => void;
  onConfirmAssign: () => void;
  isSubmitting: boolean;
  customerPaidShipping?: number;
  orderDistanceKm?: number;
  fuelPricePerLiter?: number;
  standardBikeMileage?: number;
}

export function PartnerSelectionBottomSheet({
  isOpen,
  onClose,
  onBack,
  partners,
  selectedPartnerId,
  onSelectPartner,
  onConfirmAssign,
  isSubmitting,
  customerPaidShipping = 150,
  orderDistanceKm = 5,
  fuelPricePerLiter,
  standardBikeMileage = 50
}: PartnerSelectionBottomSheetProps) {
  const router = useRouter();
  const { formatPrice, currency } = useCurrency();

  if (!isOpen) return null;

  const effectivePetrolRate = fuelPricePerLiter || (currency === 'NPR' ? 175.0 : 102.0);
  const effectiveBikeMileage = standardBikeMileage || (currency === 'NPR' ? 45.0 : 50.0);
  const fuelCostPerKm = Math.round((effectivePetrolRate / effectiveBikeMileage) * 100) / 100;

  const onlineCount = partners.filter(p => p.isOnline).length;
  const offlineCount = partners.length - onlineCount;
  const selectedPartner = partners.find(p => p.id === selectedPartnerId);

  const twoWayDistanceKm = Math.round(orderDistanceKm * 2 * 10) / 10;
  const estimatedFuelExpense = Math.round(twoWayDistanceKm * fuelCostPerKm * 10) / 10;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-300 overflow-hidden"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-b from-slate-50/80 to-white">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onBack}
              className="p-2 -ml-1 rounded-xl hover:bg-gray-200/70 text-gray-700 transition-colors"
              title="Back to Dispatch Options"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-base text-gray-900 leading-tight">
                  Select Delivery Partner
                </h3>
                <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 rounded-md">
                  {partners.length} {partners.length === 1 ? 'Rider' : 'Riders'}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Distance: {orderDistanceKm} km ({twoWayDistanceKm} km round trip) • Customer Paid: {formatPrice(customerPaidShipping)}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Roster Quick Status Banner */}
        {partners.length > 0 && (
          <div className="px-4 py-2.5 bg-slate-50 border-b border-gray-100 flex items-center justify-between text-xs">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 font-bold text-emerald-700">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>{onlineCount} Online</span>
              </span>
              <span className="text-gray-300">•</span>
              <span className="flex items-center gap-1.5 font-medium text-gray-500">
                <span className="w-2 h-2 rounded-full bg-gray-300" />
                <span>{offlineCount} Offline</span>
              </span>
            </div>

            <button
              type="button"
              onClick={() => router.push('/seller/delivery-partners')}
              className="text-[11px] font-bold text-[#FF5A36] hover:text-orange-700 flex items-center gap-1 hover:underline"
            >
              <span>Manage Roster</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Content Area */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-3">
          {partners.length === 0 ? (
            <div className="py-10 px-4 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-orange-50 text-[#FF5A36] mx-auto flex items-center justify-center border border-orange-100">
                <Users className="w-8 h-8" />
              </div>
              <div className="space-y-1 max-w-xs mx-auto">
                <h4 className="font-bold text-sm text-gray-900">No Connected Partner Riders</h4>
                <p className="text-xs text-gray-500 leading-relaxed">
                  You haven't added any partner delivery riders to your store roster yet. Connect with local delivery boys to dispatch directly.
                </p>
              </div>
              <Button
                onClick={() => router.push('/seller/delivery-partners')}
                className="bg-[#FF5A36] hover:bg-orange-600 text-white rounded-xl text-xs font-bold px-4 h-10 shadow-sm"
              >
                Open Delivery Partner Network
              </Button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {partners.map((rider) => {
                const isSelected = selectedPartnerId === rider.id;
                const riderRate = rider.perKmRate || 8.0;
                const riderBaseFare = 50.0;
                const riderQuote = Math.max(riderBaseFare, Math.round(twoWayDistanceKm * riderRate));
                const profitDiff = customerPaidShipping - riderQuote;
                const isProfit = profitDiff >= 0;

                return (
                  <div
                    key={rider.id}
                    onClick={() => onSelectPartner(rider.id)}
                    className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50/60 shadow-sm ring-2 ring-emerald-500/20'
                        : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {/* Avatar / Vehicle Photo */}
                      <div className="relative shrink-0">
                        {rider.vehiclePhotoUrl || rider.avatarUrl ? (
                          <img
                            src={rider.vehiclePhotoUrl || rider.avatarUrl}
                            alt={rider.name}
                            className="w-12 h-12 rounded-xl object-cover border border-gray-200"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-slate-900 to-slate-700 text-white font-black text-sm flex items-center justify-center">
                            {rider.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span 
                          className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white ${
                            rider.isOnline ? 'bg-emerald-500' : 'bg-gray-400'
                          }`}
                          title={rider.isOnline ? 'Online' : 'Offline'}
                        />
                      </div>

                      {/* Rider Details */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <h4 className="font-bold text-sm text-gray-900 truncate">
                            {rider.name}
                          </h4>
                          <span className="font-black text-xs text-[#171717]">
                            {formatPrice(riderQuote)} <span className="text-[10px] font-normal text-gray-500">quote</span>
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5 flex-wrap">
                          <span className="font-mono font-medium text-slate-700 flex items-center gap-1">
                            {rider.vehicleType === 'WALKER' ? <Footprints className="w-3 h-3 text-slate-400" /> : <Bike className="w-3 h-3 text-slate-400" />}
                            {rider.vehicleType || 'Bike'} • {formatPrice(riderRate)}/km
                          </span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${rider.isOnline ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                            {rider.isOnline ? '● Online' : '○ Offline (Queued)'}
                          </span>
                        </div>

                        {/* Merchant Profit / Subsidy Difference Badge */}
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          {isProfit ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black">
                              <TrendingUp className="w-3 h-3 text-emerald-600" />
                              +{formatPrice(profitDiff)} Store Shipping Profit
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-black">
                              -{formatPrice(Math.abs(profitDiff))} Merchant Subsidy
                            </span>
                          )}

                          <span className="font-bold text-amber-600 flex items-center gap-0.5 text-[11px]">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                            <span>{(rider.rating || 4.9).toFixed(1)}</span>
                          </span>
                        </div>
                      </div>
                    </div>


                    {/* Radio / Selection Indicator */}
                    <div className="shrink-0 pl-1">
                      <div
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                          isSelected
                            ? 'border-emerald-600 bg-emerald-600 text-white'
                            : 'border-gray-300 bg-white'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Bottom Sticky Action Footer */}
        {partners.length > 0 && (
          <div className="p-4 sm:p-5 border-t border-gray-100 bg-white space-y-2">
            <Button
              disabled={!selectedPartnerId || isSubmitting}
              onClick={onConfirmAssign}
              className="w-full h-13 py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-black text-sm rounded-2xl shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Assigning Order to Partner Rider...</span>
                </>
              ) : (
                <>
                  <UserCheck className="w-4 h-4" />
                  <span>
                    {selectedPartner
                      ? `Proceed & Assign to ${selectedPartner.name}`
                      : 'Select a Partner Rider to Proceed'}
                  </span>
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
