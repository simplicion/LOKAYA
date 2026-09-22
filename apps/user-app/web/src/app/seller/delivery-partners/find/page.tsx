'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  useGetMyStoreQuery,
  useFindDeliveryPartnersForStoreQuery,
  useSellerInviteDeliveryPartnerMutation
} from '@/lib/api';
import { 
  ArrowLeft, 
  Bike, 
  Search, 
  MapPin, 
  Phone, 
  Star, 
  ShieldCheck, 
  Loader2, 
  UserPlus, 
  CheckCircle2, 
  Clock, 
  SlidersHorizontal, 
  X, 
  Filter, 
  Sparkles,
  Zap,
  Navigation,
  Compass
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { getMediaUrl } from '@/lib/utils';

export default function FindDeliveryPartnersPage() {
  const router = useRouter();
  const { data: store, isLoading: isStoreLoading } = useGetMyStoreQuery();

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState<string>('ALL');
  const [onlyOnline, setOnlyOnline] = useState<boolean>(false);
  const [invitingId, setInvitingId] = useState<string | null>(null);

  const { 
    data: partners = [], 
    isLoading: isPartnersLoading, 
    refetch: refetchPartners,
    isFetching 
  } = useFindDeliveryPartnersForStoreQuery(
    {
      storeId: store?.id || '',
      search: searchTerm.trim() || undefined,
      location: locationFilter.trim() || undefined,
      vehicleType: selectedVehicle !== 'ALL' ? selectedVehicle : undefined,
      onlyOnline: onlyOnline ? true : undefined
    },
    { skip: !store?.id }
  );

  const [invitePartner] = useSellerInviteDeliveryPartnerMutation();

  const handleConnect = async (partnerId: string, partnerName: string) => {
    if (!store?.id) return;
    setInvitingId(partnerId);
    try {
      await invitePartner({
        storeId: store.id,
        deliveryPartnerId: partnerId,
        notes: `Direct seller partnership connection from ${store.name}`
      }).unwrap();
      toast.success(`🎉 ${partnerName} has been connected to your delivery network!`);
      refetchPartners();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to connect with delivery partner');
    } finally {
      setInvitingId(null);
    }
  };

  const vehicleOptions = [
    { id: 'ALL', label: 'All Fleets' },
    { id: 'MOTORCYCLE', label: 'Motorcycle' },
    { id: 'SCOOTER', label: 'Scooter' },
    { id: 'EV', label: 'Electric EV' },
    { id: 'BICYCLE', label: 'Bicycle' },
    { id: 'VAN', label: 'Van / Mini Truck' }
  ];

  const quickLocations = useMemo(() => {
    const list = new Set<string>();
    if (store?.city) list.add(store.city);
    list.add('Lalbandi');
    list.add('Kathmandu');
    list.add('Janakpur');
    return Array.from(list).filter(Boolean);
  }, [store]);

  if (isStoreLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#FAF9F6]">
        <Loader2 className="w-8 h-8 animate-spin text-[#FF5A36]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] pb-28">
      {/* Top App Bar */}
      <div className="bg-white border-b border-[#E5E2DC] sticky top-0 z-30 px-4 py-3.5 shadow-2xs">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => router.back()}
              className="p-1.5 -ml-1.5 rounded-full hover:bg-gray-100 text-gray-800 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-lg font-black text-gray-900 leading-tight">
                Find Delivery Partners
              </h1>
              <p className="text-[11px] text-gray-500 flex items-center gap-1 font-medium">
                <Compass className="w-3 h-3 text-[#FF5A36]" />
                Sorted by nearest to <strong className="text-gray-700">{store?.name || 'Store'}</strong>
              </p>
            </div>
          </div>

          {store?.city && (
            <span className="text-[11px] font-bold text-gray-700 bg-gray-100 px-2.5 py-1 rounded-full flex items-center gap-1">
              <MapPin className="w-3 h-3 text-emerald-600" />
              {store.city}
            </span>
          )}
        </div>
      </div>

      <div className="p-4 max-w-xl mx-auto space-y-4">
        {/* Search & Location Bar */}
        <div className="bg-white rounded-3xl p-4 border border-[#E5E2DC] shadow-xs space-y-3">
          {/* General Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search rider name, vehicle plate, phone..."
              className="pl-10 pr-9 h-11 bg-gray-50/70 border-gray-200 rounded-2xl text-xs focus-visible:ring-1 focus-visible:ring-[#FF5A36]"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Location Specific Search Input */}
          <div className="relative">
            <MapPin className="w-4 h-4 text-emerald-600 absolute left-3.5 top-3.5" />
            <Input
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              placeholder="Filter by area / town (e.g. Lalbandi, Ward 4)..."
              className="pl-10 pr-9 h-11 bg-emerald-50/40 border-emerald-200 rounded-2xl text-xs text-emerald-950 placeholder:text-emerald-700/60 focus-visible:ring-1 focus-visible:ring-emerald-500"
            />
            {locationFilter && (
              <button
                onClick={() => setLocationFilter('')}
                className="absolute right-3 top-3.5 text-emerald-600 hover:text-emerald-800"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quick Location Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
            <span className="text-[11px] font-bold text-gray-400 shrink-0 mr-1">Locations:</span>
            {quickLocations.map((loc) => {
              const active = locationFilter.toLowerCase() === loc.toLowerCase();
              return (
                <button
                  key={loc}
                  onClick={() => setLocationFilter(active ? '' : loc)}
                  className={`px-3 py-1 rounded-full text-[11px] font-bold shrink-0 transition-colors cursor-pointer ${
                    active
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  📍 {loc}
                </button>
              );
            })}
          </div>

          {/* Vehicle Type Filter Chips & Online Toggle */}
          <div className="pt-2 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 overflow-x-auto py-1 no-scrollbar">
              {vehicleOptions.map((opt) => {
                const active = selectedVehicle === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => setSelectedVehicle(opt.id)}
                    className={`px-3 py-1.5 rounded-xl text-[11px] font-bold shrink-0 transition-all cursor-pointer ${
                      active
                        ? 'bg-gray-900 text-white shadow-xs'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setOnlyOnline(!onlyOnline)}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
                onlyOnline 
                  ? 'bg-emerald-500 text-white border-emerald-600 shadow-2xs' 
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${onlyOnline ? 'bg-white' : 'bg-emerald-500'}`} />
              Online Only
            </button>
          </div>
        </div>

        {/* Results Header */}
        <div className="flex items-center justify-between px-1 text-xs text-gray-500 font-semibold">
          <div className="flex items-center gap-1.5">
            <span>Available Delivery Partners</span>
            <span className="bg-gray-200 text-gray-800 text-[10px] font-black px-2 py-0.5 rounded-full">
              {partners.length}
            </span>
          </div>

          {isFetching && (
            <div className="flex items-center gap-1 text-[#FF5A36] text-[11px]">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Updating...</span>
            </div>
          )}
        </div>

        {/* Partners List */}
        {isPartnersLoading ? (
          <div className="flex flex-col items-center justify-center h-48 bg-white rounded-3xl border border-[#E5E2DC] space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#FF5A36]" />
            <p className="text-xs text-gray-500 font-medium">Scanning delivery fleet around your store...</p>
          </div>
        ) : partners.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 border border-[#E5E2DC] text-center space-y-3">
            <Bike className="w-12 h-12 text-gray-300 mx-auto" />
            <h3 className="font-bold text-sm text-gray-800">No Delivery Partners Match Your Filter</h3>
            <p className="text-xs text-gray-500 max-w-xs mx-auto">
              Try clearing location keywords like "{locationFilter}" or expand vehicle filters to see all available riders.
            </p>
            {(locationFilter || searchTerm || selectedVehicle !== 'ALL' || onlyOnline) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchTerm('');
                  setLocationFilter('');
                  setSelectedVehicle('ALL');
                  setOnlyOnline(false);
                }}
                className="rounded-xl text-xs font-bold"
              >
                Reset All Filters
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {partners.map((partner: any) => {
              const isConnected = partner.partnershipStatus === 'ACCEPTED';
              const isPending = partner.partnershipStatus === 'PENDING';
              const isInviting = invitingId === partner.id;

              return (
                <div
                  key={partner.id}
                  className="bg-white rounded-3xl p-4 border border-[#E5E2DC] shadow-xs space-y-3 transition-all hover:border-gray-300"
                >
                  {/* Card Top: Rider Avatar, Info, Distance Badge */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-13 h-13 rounded-2xl bg-slate-900 text-white font-bold flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
                          {partner.avatarUrl ? (
                            <img src={getMediaUrl(partner.avatarUrl)} alt={partner.name} className="w-full h-full object-cover" />
                          ) : partner.selfieUrl ? (
                            <img src={partner.selfieUrl} alt={partner.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-base">{partner.name?.charAt(0).toUpperCase()}</span>
                          )}
                        </div>

                        {/* Online Status Bubble */}
                        <span 
                          className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white ${
                            partner.isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'
                          }`} 
                          title={partner.isOnline ? 'Online and ready' : 'Offline'}
                        />
                      </div>

                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="font-bold text-sm text-gray-900">{partner.name}</h3>
                          <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
                            ★ {Number(partner.rating || 5).toFixed(1)}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-gray-500 font-mono mt-0.5">
                          <span className="font-bold text-gray-700">{partner.vehicleType}</span>
                          {partner.vehicleNumber && <span>&bull; {partner.vehicleNumber}</span>}
                        </div>

                        {/* Location Tag */}
                        <div className="flex items-center gap-1 text-[11px] text-gray-500 mt-1">
                          <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span className="truncate max-w-[200px]">{partner.locationArea}</span>
                        </div>
                      </div>
                    </div>

                    {/* Nearest Distance Pill */}
                    <div className="text-right shrink-0">
                      {partner.distanceKm != null ? (
                        <div className="px-2.5 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-black inline-flex items-center gap-1 shadow-2xs">
                          <Navigation className="w-3 h-3 fill-emerald-600 text-emerald-600" />
                          <span>{partner.distanceKm.toFixed(1)} km away</span>
                        </div>
                      ) : (
                        <div className="px-2.5 py-1 rounded-xl bg-gray-100 text-gray-500 text-[10px] font-bold">
                          Nearby Fleet
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Middle: Rate & Delivery Metrics */}
                  <div className="grid grid-cols-3 gap-2 bg-gray-50 p-2.5 rounded-2xl text-[11px] border border-gray-100">
                    <div>
                      <span className="text-gray-400 block text-[10px]">Rate</span>
                      <span className="font-black text-gray-800">
                        {partner.perKmRate ? `₹${partner.perKmRate}/km` : 'Standard'}
                      </span>
                    </div>

                    <div>
                      <span className="text-gray-400 block text-[10px]">Base Fare</span>
                      <span className="font-black text-gray-800">
                        {partner.baseFare ? `₹${partner.baseFare}` : '₹40'}
                      </span>
                    </div>

                    <div>
                      <span className="text-gray-400 block text-[10px]">Trips Done</span>
                      <span className="font-black text-gray-800">
                        {partner.totalDeliveries} orders
                      </span>
                    </div>
                  </div>

                  {/* Card Bottom: Action Buttons */}
                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-gray-100">
                    {partner.phone ? (
                      <a
                        href={`tel:${partner.phone}`}
                        className="h-10 px-3 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-1.5 text-xs font-bold"
                        title="Call Rider"
                      >
                        <Phone className="w-3.5 h-3.5 text-gray-600" />
                        <span>Call</span>
                      </a>
                    ) : <div />}

                    {isConnected ? (
                      <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 border border-emerald-200 px-3.5 py-2 rounded-xl text-xs font-black">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Connected to Your Store</span>
                      </div>
                    ) : isPending ? (
                      <div className="flex items-center gap-1.5 text-amber-800 bg-amber-50 border border-amber-200 px-3.5 py-2 rounded-xl text-xs font-bold">
                        <Clock className="w-4 h-4 text-amber-600" />
                        <span>Connection Pending</span>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleConnect(partner.id, partner.name)}
                        disabled={isInviting}
                        className="h-10 px-4 rounded-xl text-xs font-bold bg-[#FF5A36] hover:bg-[#e04f2f] text-white shadow-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        {isInviting ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Connecting...</span>
                          </>
                        ) : (
                          <>
                            <UserPlus className="w-3.5 h-3.5" />
                            <span>+ Connect Partner</span>
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
