'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  useGetMyStoreQuery,
  useGetStorePartnerRequestsQuery,
  useRespondStorePartnerRequestMutation,
  useGetStoreConnectedPartnersQuery,
  useDisconnectStorePartnerMutation
} from '@/lib/api';
import { 
  ArrowLeft, 
  Bike, 
  Check, 
  X, 
  Phone, 
  Clock, 
  Star, 
  ShieldCheck, 
  Loader2, 
  Users, 
  UserCheck, 
  Store,
  ExternalLink,
  Zap,
  Trash2,
  UserPlus,
  Compass,
  Search
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { getMediaUrl } from '@/lib/utils';

export default function SellerDeliveryPartnersPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'requests' | 'roster'>('requests');

  const { data: store, isLoading: isStoreLoading } = useGetMyStoreQuery();
  const { data: requests = [], isLoading: isRequestsLoading, refetch: refetchRequests } = useGetStorePartnerRequestsQuery(
    store?.id || '',
    { skip: !store?.id }
  );
  const { data: connectedPartners = [], isLoading: isPartnersLoading, refetch: refetchPartners } = useGetStoreConnectedPartnersQuery(
    store?.id || '',
    { skip: !store?.id }
  );

  const [respondRequest, { isLoading: isResponding }] = useRespondStorePartnerRequestMutation();
  const [disconnectPartner, { isLoading: isDisconnecting }] = useDisconnectStorePartnerMutation();

  const handleRespond = async (requestId: string, status: 'ACCEPTED' | 'REJECTED') => {
    try {
      await respondRequest({ requestId, status }).unwrap();
      toast.success(status === 'ACCEPTED' ? 'Rider added to your partner network!' : 'Request declined.');
      refetchRequests();
      refetchPartners();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to update request');
    }
  };

  const handleDisconnect = async (deliveryPartnerId: string, riderName: string) => {
    if (!store?.id) return;
    if (!confirm(`Remove ${riderName} from your store delivery roster?`)) return;
    try {
      await disconnectPartner({ storeId: store.id, deliveryPartnerId }).unwrap();
      toast.success(`${riderName} removed from partner roster.`);
      refetchPartners();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to remove partner rider');
    }
  };

  if (isStoreLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#FAF9F6]">
        <Loader2 className="w-8 h-8 animate-spin text-[#FF5A36]" />
      </div>
    );
  }

  const pendingRequests = requests.filter((r: any) => r.status === 'PENDING');

  return (
    <div className="min-h-screen bg-[#FAF9F6] pb-24">
      {/* Top Header */}
      <div className="bg-white border-b border-[#E5E2DC] sticky top-0 z-20 px-4 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.back()}
            className="p-1.5 -ml-1.5 rounded-full hover:bg-gray-100 text-gray-800 transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-bold text-gray-900">Delivery Partner Network</h1>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => router.push('/seller/delivery-partners/find')}
            className="h-8 px-3 rounded-xl bg-[#FF5A36] hover:bg-[#e04f2f] text-white text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>+ Find Partners</span>
          </Button>
        </div>
      </div>

      <div className="p-4 max-w-lg mx-auto space-y-4">
        {/* Find Delivery Partners Quick Discovery Banner */}
        <div className="bg-gradient-to-r from-orange-500 via-amber-500 to-[#FF5A36] rounded-3xl p-4 text-white shadow-xs flex items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-white" />
              <h3 className="text-sm font-black tracking-tight">Expand Your Delivery Fleet</h3>
            </div>
            <p className="text-xs text-white/90">
              Browse nearby riders ranked by nearest distance to your store. Search by location like Lalbandi.
            </p>
          </div>

          <Button
            size="sm"
            onClick={() => router.push('/seller/delivery-partners/find')}
            className="bg-white text-gray-900 hover:bg-gray-100 font-black text-xs rounded-2xl shrink-0 shadow-xs h-9 px-3.5 cursor-pointer"
          >
            Explore Riders &rarr;
          </Button>
        </div>
        {/* Tab Toggle */}
        <div className="grid grid-cols-2 bg-[#ECE9E2] p-1 rounded-2xl text-xs font-bold">
          <button
            onClick={() => setActiveTab('requests')}
            className={`py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'requests' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-600'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Pending Requests ({pendingRequests.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('roster')}
            className={`py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'roster' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-600'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Connected Riders ({connectedPartners.length})</span>
          </button>
        </div>

        {/* TAB 1: PENDING REQUESTS */}
        {activeTab === 'requests' && (
          <div className="space-y-3">
            {isRequestsLoading ? (
              <div className="flex h-36 items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-[#FF5A36]" />
              </div>
            ) : pendingRequests.length === 0 ? (
              <div className="bg-white rounded-3xl p-8 border border-[#E5E2DC] text-center space-y-2">
                <Users className="w-10 h-10 text-gray-300 mx-auto" />
                <h3 className="font-bold text-sm text-gray-800">No Pending Requests</h3>
                <p className="text-xs text-gray-500">
                  When local delivery riders request to partner with your store, their applications will appear here.
                </p>
              </div>
            ) : (
              pendingRequests.map((req: any) => {
                const partner = req.deliveryPartner;
                const user = partner?.user;

                return (
                  <div
                    key={req.id}
                    className="bg-white rounded-3xl p-4 border border-[#E5E2DC] shadow-xs space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center overflow-hidden shrink-0">
                          {partner?.selfieUrl ? (
                            <img src={partner.selfieUrl} alt="Rider" className="w-full h-full object-cover" />
                          ) : (
                            user?.name?.charAt(0).toUpperCase()
                          )}
                        </div>

                        <div>
                          <div className="flex items-center gap-1.5">
                            <h4 className="font-bold text-sm text-gray-900">{user?.name}</h4>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700">
                              ★ {partner?.rating || 5.0}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 font-mono mt-0.5">
                            {partner?.vehicleType} • {partner?.vehicleNumber}
                          </p>
                          {user?.phone && (
                            <p className="text-[11px] text-gray-400 mt-0.5">{user.phone}</p>
                          )}
                        </div>
                      </div>

                      {req.initiatedBy === 'STORE' ? (
                        <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full shrink-0">
                          Invite Sent
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full shrink-0">
                          Rider Applied
                        </span>
                      )}
                    </div>

                    {req.notes && (
                      <div className="p-2.5 bg-gray-50 rounded-xl text-xs text-gray-600 italic">
                        "{req.notes}"
                      </div>
                    )}

                    {req.initiatedBy === 'STORE' ? (
                      <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                        <span className="inline-flex items-center gap-1.5 text-amber-700 font-medium">
                          <Clock className="w-3.5 h-3.5 animate-spin text-amber-500" />
                          <span>Waiting for rider to accept</span>
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRespond(req.id, 'REJECTED')}
                          disabled={isResponding}
                          className="h-7 text-xs text-gray-400 hover:text-rose-600"
                        >
                          Cancel Invite
                        </Button>
                      </div>
                    ) : (
                      <div className="flex gap-2 pt-1 border-t border-gray-100">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRespond(req.id, 'REJECTED')}
                          disabled={isResponding}
                          className="flex-1 h-10 rounded-xl text-xs font-bold text-red-600 border-red-200 hover:bg-red-50"
                        >
                          <X className="w-3.5 h-3.5 mr-1" />
                          <span>Decline</span>
                        </Button>

                        <Button
                          size="sm"
                          onClick={() => handleRespond(req.id, 'ACCEPTED')}
                          disabled={isResponding}
                          className="flex-1 h-10 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                        >
                          <Check className="w-3.5 h-3.5 mr-1" />
                          <span>Accept Partner</span>
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* TAB 2: CONNECTED PARTNER ROSTER */}
        {activeTab === 'roster' && (
          <div className="space-y-3">
            {isPartnersLoading ? (
              <div className="flex h-36 items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-[#FF5A36]" />
              </div>
            ) : connectedPartners.length === 0 ? (
              <div className="bg-white rounded-3xl p-8 border border-[#E5E2DC] text-center space-y-2">
                <Bike className="w-10 h-10 text-gray-300 mx-auto" />
                <h3 className="font-bold text-sm text-gray-800">No Partnered Riders Yet</h3>
                <p className="text-xs text-gray-500">
                  Accept incoming rider requests to build your store's dedicated delivery team.
                </p>
              </div>
            ) : (
              connectedPartners.map((rider: any) => (
                <div
                  key={rider.id}
                  className="bg-white rounded-3xl p-4 border border-[#E5E2DC] shadow-xs flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center overflow-hidden shrink-0">
                      {rider.avatarUrl ? (
                        <img src={getMediaUrl(rider.avatarUrl)} alt={rider.name} className="w-full h-full object-cover" />
                      ) : (
                        rider.name?.charAt(0).toUpperCase()
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-bold text-sm text-gray-900">{rider.name}</h4>
                        <span className={`w-2 h-2 rounded-full ${rider.isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'}`} />
                      </div>
                      <p className="text-xs text-gray-500 font-mono">
                        {rider.vehicleType} • {rider.vehicleNumber}
                      </p>
                      <p className="text-[10px] text-emerald-600 font-bold mt-0.5">
                        {rider.totalDeliveries} total deliveries completed
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {rider.phone && (
                      <a
                        href={`tel:${rider.phone}`}
                        className="p-2.5 rounded-xl bg-orange-50 text-[#FF5A36] hover:bg-orange-100 transition-colors"
                        title="Call Partner Rider"
                      >
                        <Phone className="w-4 h-4" />
                      </a>
                    )}

                    <button
                      onClick={() => handleDisconnect(rider.id, rider.name)}
                      disabled={isDisconnecting}
                      className="p-2.5 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                      title="Remove from Store Fleet"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

      </div>
    </div>
  );
}
