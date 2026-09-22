'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  useGetRiderPartnerStoresQuery,
  useRiderRespondStorePartnerRequestMutation,
  useRiderDisconnectStoreMutation,
  useGetNearbyStoresForPartnerQuery, 
  useSendStorePartnerRequestMutation 
} from '@/lib/api';
import { 
  Store, 
  Search, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  Send, 
  Loader2, 
  ExternalLink,
  ShieldCheck,
  Building2,
  Plus,
  Check,
  X,
  Phone,
  Users,
  UserCheck,
  AlertCircle,
  Trash2,
  ArrowRight,
  Handshake,
  Compass
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AnimatedBottomSheet } from '@/components/ui/AnimatedBottomSheet';
import { toast } from 'sonner';
import { getMediaUrl } from '@/lib/utils';

export default function PartnerStoresPage() {
  const [activeTab, setActiveTab] = useState<'current' | 'requests'>('current');
  const [isAddStoresOpen, setIsAddStoresOpen] = useState(false);
  const [storeSearch, setStoreSearch] = useState('');
  const [inviteNotes, setInviteNotes] = useState('');
  const [sendingStoreId, setSendingStoreId] = useState<string | null>(null);

  // Rider Partner Stores & Requests
  const { 
    data: partnerData, 
    isLoading: isPartnerLoading, 
    refetch: refetchPartners 
  } = useGetRiderPartnerStoresQuery();

  // All Nearby Stores for Exploration
  const { 
    data: nearbyStores = [], 
    isLoading: isNearbyLoading, 
    refetch: refetchNearby 
  } = useGetNearbyStoresForPartnerQuery();

  // Mutations
  const [respondToRequest, { isLoading: isResponding }] = useRiderRespondStorePartnerRequestMutation();
  const [disconnectStore, { isLoading: isDisconnecting }] = useRiderDisconnectStoreMutation();
  const [sendPartnerRequest] = useSendStorePartnerRequestMutation();

  const connectedStores = partnerData?.connectedStores || [];
  const incomingRequests = partnerData?.incomingRequests || [];
  const outgoingRequests = partnerData?.outgoingRequests || [];

  const totalPendingRequests = incomingRequests.length + outgoingRequests.length;

  // Handle Accept / Decline store request
  const handleRespond = async (requestId: string, status: 'ACCEPTED' | 'REJECTED', storeName: string) => {
    try {
      await respondToRequest({ requestId, status }).unwrap();
      if (status === 'ACCEPTED') {
        toast.success(`🎉 You are now partnered with ${storeName}! Added to Current Partners.`);
        setActiveTab('current');
      } else {
        toast.success(`Partnership request from ${storeName} declined.`);
      }
      refetchPartners();
      refetchNearby();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to respond to request');
    }
  };

  // Handle Disconnect from Store
  const handleDisconnect = async (storeId: string, storeName: string) => {
    if (!confirm(`Are you sure you want to disconnect from ${storeName}? You will stop receiving priority orders from this store.`)) {
      return;
    }
    try {
      await disconnectStore(storeId).unwrap();
      toast.success(`Disconnected from ${storeName}`);
      refetchPartners();
      refetchNearby();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to disconnect store');
    }
  };

  // Handle Send Partner Request to Store
  const handleSendRequest = async (storeId: string, storeName: string) => {
    setSendingStoreId(storeId);
    try {
      await sendPartnerRequest({ storeId, notes: inviteNotes.trim() || undefined }).unwrap();
      toast.success(`Partnership request sent to ${storeName}! It is now awaiting store approval.`);
      setInviteNotes('');
      refetchPartners();
      refetchNearby();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to send partner request');
    } finally {
      setSendingStoreId(null);
    }
  };

  // Filter nearby stores for Add Store sheet
  const filteredNearbyStores = nearbyStores.filter((s: any) =>
    s.name?.toLowerCase().includes(storeSearch.toLowerCase()) ||
    s.category?.toLowerCase().includes(storeSearch.toLowerCase()) ||
    s.city?.toLowerCase().includes(storeSearch.toLowerCase()) ||
    s.address?.toLowerCase().includes(storeSearch.toLowerCase())
  );

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto pb-12">
      
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-0.5">
          <h1 className="text-xl font-black text-[#171717] flex items-center gap-2">
            <Handshake className="w-5 h-5 text-[#FF5A36]" />
            <span>Store Partners</span>
          </h1>
          <p className="text-xs text-[#6B6B6B]">
            Partner with local merchants for priority delivery orders and consistent earnings.
          </p>
        </div>

        <Button
          size="sm"
          onClick={() => setIsAddStoresOpen(true)}
          className="bg-[#FF5A36] hover:bg-[#e04b2b] text-white font-bold rounded-2xl text-xs h-9 px-3.5 shadow-xs flex items-center gap-1.5 shrink-0 transition-transform active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Add Stores</span>
        </Button>
      </div>

      {/* Main Tabs: Current Partners & Requests */}
      <div className="grid grid-cols-2 bg-[#ECE9E2] p-1 rounded-2xl text-xs font-bold shadow-xs">
        <button
          onClick={() => setActiveTab('current')}
          className={`py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'current'
              ? 'bg-white text-gray-900 shadow-xs'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <UserCheck className="w-4 h-4 text-emerald-600" />
          <span>Current Partners ({connectedStores.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('requests')}
          className={`py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'requests'
              ? 'bg-white text-gray-900 shadow-xs'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Clock className="w-4 h-4 text-amber-600" />
          <span>Requested Partners</span>
          {incomingRequests.length > 0 && (
            <span className="text-[10px] font-black bg-[#FF5A36] text-white px-1.5 py-0.2 rounded-full">
              {incomingRequests.length}
            </span>
          )}
        </button>
      </div>

      {/* ============================================================ */}
      {/* TAB 1: CURRENT PARTNERS                                      */}
      {/* ============================================================ */}
      {activeTab === 'current' && (
        <div className="space-y-3">
          {isPartnerLoading ? (
            <div className="flex h-48 items-center justify-center">
              <Loader2 className="w-7 h-7 animate-spin text-[#FF5A36]" />
            </div>
          ) : connectedStores.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 border border-[#E5E2DC] text-center space-y-3 shadow-xs">
              <Building2 className="w-12 h-12 text-gray-300 mx-auto" />
              <div>
                <h3 className="font-bold text-sm text-[#171717]">No Partnered Stores Yet</h3>
                <p className="text-xs text-[#6B6B6B] mt-1 max-w-xs mx-auto">
                  Partner with neighborhood stores to receive direct order dispatches, recurring business, and guaranteed payouts.
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => setIsAddStoresOpen(true)}
                className="bg-[#FF5A36] hover:bg-[#e04b2b] text-white font-bold rounded-xl text-xs h-9 px-4"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Find & Add Stores
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {connectedStores.map((item: any) => {
                const store = item.store;
                return (
                  <div
                    key={item.requestId}
                    className="bg-white rounded-3xl p-4.5 border border-[#E5E2DC] shadow-xs hover:shadow-sm transition-all space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-12 h-12 rounded-2xl bg-[#171717] text-white font-black text-base flex items-center justify-center overflow-hidden shrink-0 border border-gray-100">
                          {store.logoUrl ? (
                            <img src={getMediaUrl(store.logoUrl)} alt={store.name} className="w-full h-full object-cover" />
                          ) : (
                            store.name?.charAt(0).toUpperCase()
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h3 className="font-bold text-sm text-[#171717] truncate">{store.name}</h3>
                            {store.category && (
                              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-gray-100 text-[#6B6B6B]">
                                {store.category}
                              </span>
                            )}
                          </div>

                          <p className="text-[11px] text-[#6B6B6B] truncate flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 text-[#FF5A36] shrink-0" />
                            <span>{store.address || store.city || 'Local Store'}</span>
                          </p>

                          {store.contactPhone && (
                            <p className="text-[10px] text-gray-500 flex items-center gap-1 mt-0.5">
                              <Phone className="w-2.5 h-2.5 text-gray-400" />
                              <span>{store.contactPhone}</span>
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <Link
                          href={`/store/${store.id}`}
                          target="_blank"
                          className="p-2 rounded-xl bg-gray-50 hover:bg-gray-100 text-[#6B6B6B] hover:text-[#171717] transition-colors"
                          title="View Storefront"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>

                    <div className="border-t border-gray-100 pt-3 flex items-center justify-between text-xs">
                      <span className="inline-flex items-center gap-1.5 font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Active Partner</span>
                      </span>

                      <button
                        onClick={() => handleDisconnect(store.id, store.name)}
                        disabled={isDisconnecting}
                        className="text-[11px] text-gray-400 hover:text-rose-600 transition-colors flex items-center gap-1 font-semibold"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Disconnect</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 2: REQUESTED PARTNERS (Incoming & Outgoing)             */}
      {/* ============================================================ */}
      {activeTab === 'requests' && (
        <div className="space-y-4">
          
          {/* SECTION A: Incoming Requests from Stores (Store runners invited you) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
                <Store className="w-4 h-4 text-[#FF5A36]" />
                <span>Store Requests to Partner with You</span>
              </h3>
              {incomingRequests.length > 0 && (
                <span className="text-[10px] font-black bg-orange-100 text-[#FF5A36] px-2 py-0.5 rounded-full">
                  {incomingRequests.length} Pending
                </span>
              )}
            </div>

            {incomingRequests.length === 0 ? (
              <div className="bg-white rounded-2xl p-5 border border-[#E5E2DC] text-center space-y-1">
                <p className="text-xs font-semibold text-gray-700">No incoming store requests</p>
                <p className="text-[11px] text-gray-400">
                  When local stores invite you to partner with their shop, their requests will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {incomingRequests.map((req: any) => {
                  const store = req.store;
                  return (
                    <div
                      key={req.requestId}
                      className="bg-white rounded-3xl p-4.5 border-2 border-orange-200/80 bg-gradient-to-br from-white via-white to-orange-50/40 shadow-xs space-y-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-12 h-12 rounded-2xl bg-[#171717] text-white font-black text-base flex items-center justify-center overflow-hidden shrink-0 border border-gray-100">
                            {store.logoUrl ? (
                              <img src={getMediaUrl(store.logoUrl)} alt={store.name} className="w-full h-full object-cover" />
                            ) : (
                              store.name?.charAt(0).toUpperCase()
                            )}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h3 className="font-bold text-sm text-[#171717] truncate">{store.name}</h3>
                              {store.category && (
                                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-orange-100 text-[#FF5A36]">
                                  {store.category}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-[#6B6B6B] truncate flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3 h-3 text-[#FF5A36] shrink-0" />
                              <span>{store.address || store.city || 'Local Store'}</span>
                            </p>
                          </div>
                        </div>

                        <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 shrink-0">
                          Store Invited You
                        </span>
                      </div>

                      {req.notes && (
                        <div className="p-2.5 bg-gray-50 rounded-xl text-xs text-gray-600 italic border border-gray-100">
                          "{req.notes}"
                        </div>
                      )}

                      {/* Accept / Decline Action Buttons */}
                      <div className="flex gap-2 pt-1 border-t border-gray-100">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRespond(req.requestId, 'REJECTED', store.name)}
                          disabled={isResponding}
                          className="flex-1 h-9 rounded-xl text-xs font-bold text-rose-600 border-rose-200 hover:bg-rose-50"
                        >
                          <X className="w-3.5 h-3.5 mr-1" />
                          <span>Decline</span>
                        </Button>

                        <Button
                          size="sm"
                          onClick={() => handleRespond(req.requestId, 'ACCEPTED', store.name)}
                          disabled={isResponding}
                          className="flex-1 h-9 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                        >
                          <Check className="w-3.5 h-3.5 mr-1" />
                          <span>Accept Partner</span>
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* SECTION B: Outgoing Requests (Sent by Delivery Partner) */}
          <div className="space-y-2.5 pt-2 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
                <Send className="w-4 h-4 text-gray-500" />
                <span>Requests Sent by You</span>
              </h3>
              {outgoingRequests.length > 0 && (
                <span className="text-[10px] font-semibold text-gray-500">
                  {outgoingRequests.length} Sent
                </span>
              )}
            </div>

            {outgoingRequests.length === 0 ? (
              <div className="bg-white rounded-2xl p-5 border border-[#E5E2DC] text-center space-y-1">
                <p className="text-xs font-semibold text-gray-700">No outgoing requests</p>
                <p className="text-[11px] text-gray-400">
                  Use "Add Stores" above to search and request partnerships with stores you want to deliver for.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {outgoingRequests.map((req: any) => {
                  const store = req.store;
                  return (
                    <div
                      key={req.requestId}
                      className="bg-white rounded-2xl p-3.5 border border-[#E5E2DC] flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center font-bold text-gray-700 overflow-hidden shrink-0">
                          {store.logoUrl ? (
                            <img src={getMediaUrl(store.logoUrl)} alt={store.name} className="w-full h-full object-cover" />
                          ) : (
                            store.name?.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-gray-900 truncate">{store.name}</p>
                          <p className="text-[11px] text-gray-500 truncate">{store.city || store.address}</p>
                        </div>
                      </div>

                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold shrink-0">
                        <Clock className="w-2.5 h-2.5 animate-spin text-amber-500" />
                        <span>Awaiting Store Acceptance</span>
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      )}

      {/* ============================================================ */}
      {/* BOTTOM SHEET: Find & Add New Partner Stores                  */}
      {/* ============================================================ */}
      <AnimatedBottomSheet
        isOpen={isAddStoresOpen}
        onClose={() => setIsAddStoresOpen(false)}
        title="Find & Request Stores"
        subtitle="Search local stores in your area to request a delivery partnership"
        icon={<Compass className="w-5 h-5 text-[#FF5A36]" />}
      >
        <div className="space-y-4 pb-6">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <Input
              type="text"
              placeholder="Search store name, category, or city..."
              value={storeSearch}
              onChange={(e) => setStoreSearch(e.target.value)}
              className="pl-10 h-11 rounded-xl border-gray-300 text-xs font-medium"
            />
          </div>

          {/* Stores List */}
          <div className="space-y-2.5 max-h-[55vh] overflow-y-auto pr-0.5">
            {isNearbyLoading ? (
              <div className="p-8 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-[#FF5A36]" />
              </div>
            ) : filteredNearbyStores.length === 0 ? (
              <div className="p-8 text-center text-gray-400 space-y-1">
                <Building2 className="w-8 h-8 mx-auto text-gray-300" />
                <p className="text-xs font-semibold text-gray-700">No stores found</p>
                <p className="text-[11px] text-gray-400">Try changing your search terms.</p>
              </div>
            ) : (
              filteredNearbyStores.map((store: any) => {
                const isAlreadyPartner = connectedStores.some((c: any) => c.store.id === store.id);
                const isAlreadyPending = outgoingRequests.some((o: any) => o.store.id === store.id);
                const hasStoreInvited = incomingRequests.some((i: any) => i.store.id === store.id);

                return (
                  <div
                    key={store.id}
                    className="p-3.5 rounded-2xl border border-gray-200 bg-white hover:bg-gray-50/70 transition-all flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-xl bg-gray-100 flex items-center justify-center font-bold text-gray-800 overflow-hidden shrink-0 border border-gray-200">
                        {store.logoUrl ? (
                          <img src={getMediaUrl(store.logoUrl)} alt={store.name} className="w-full h-full object-cover" />
                        ) : (
                          store.name?.charAt(0).toUpperCase()
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="font-bold text-xs text-gray-900 truncate">{store.name}</h4>
                          {store.category && (
                            <span className="text-[9px] font-bold uppercase px-1.5 py-0.2 rounded bg-gray-100 text-gray-600">
                              {store.category}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-gray-500 truncate flex items-center gap-1 mt-0.5">
                          <MapPin className="w-2.5 h-2.5 text-[#FF5A36] shrink-0" />
                          <span>{store.address || store.city || 'Local Store'}</span>
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0">
                      {isAlreadyPartner ? (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                          Partnered
                        </span>
                      ) : isAlreadyPending ? (
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                          Requested
                        </span>
                      ) : hasStoreInvited ? (
                        <Button
                          size="sm"
                          onClick={() => {
                            setIsAddStoresOpen(false);
                            setActiveTab('requests');
                          }}
                          className="h-8 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                          Review Invite
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleSendRequest(store.id, store.name)}
                          disabled={sendingStoreId === store.id}
                          className="h-8 text-xs font-bold rounded-xl bg-[#FF5A36] hover:bg-[#e04b2b] text-white shadow-xs"
                        >
                          {sendingStoreId === store.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <>
                              <Send className="w-3 h-3 mr-1" />
                              <span>Request</span>
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </AnimatedBottomSheet>

    </div>
  );
}
