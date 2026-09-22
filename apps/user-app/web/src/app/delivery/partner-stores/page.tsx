'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
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
  Sparkles,
  ShieldCheck,
  Building2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { getMediaUrl } from '@/lib/utils';

export default function PartnerStoresPage() {
  const [search, setSearch] = useState('');
  const { data: stores = [], isLoading, refetch } = useGetNearbyStoresForPartnerQuery();
  const [sendPartnerRequest, { isLoading: isSending }] = useSendStorePartnerRequestMutation();

  const [selectedStore, setSelectedStore] = useState<any | null>(null);
  const [notes, setNotes] = useState('');

  const handleSendRequest = async (storeId: string) => {
    try {
      await sendPartnerRequest({ storeId, notes }).unwrap();
      toast.success('Partnership request sent to store owner!');
      setSelectedStore(null);
      setNotes('');
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to send partner request');
    }
  };

  const filteredStores = stores.filter((s: any) =>
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.category?.toLowerCase().includes(search.toLowerCase()) ||
    s.city?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 space-y-4">
      
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-lg font-black text-[#171717] flex items-center gap-2">
          <Store className="w-5 h-5 text-[#FF5A36]" />
          <span>Partner Merchant Stores</span>
        </h1>
        <p className="text-xs text-[#6B6B6B]">
          Partner with local neighborhood stores to receive priority delivery assignments and recurring orders.
        </p>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search nearby stores, categories, areas..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-11 pl-10 pr-4 rounded-2xl border border-[#E5E2DC] bg-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#FF5A36] shadow-xs"
        />
      </div>

      {/* Stores List */}
      {isLoading ? (
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="w-7 h-7 animate-spin text-[#FF5A36]" />
        </div>
      ) : filteredStores.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 border border-[#E5E2DC] text-center space-y-2 shadow-sm">
          <Building2 className="w-10 h-10 text-gray-300 mx-auto" />
          <h3 className="font-bold text-xs text-[#171717]">No stores found</h3>
          <p className="text-[11px] text-[#6B6B6B]">Try adjusting your search query.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredStores.map((store: any) => {
            const status = store.partnershipStatus || 'NOT_REQUESTED';
            const isConnected = status === 'ACCEPTED';
            const isPending = status === 'PENDING';

            return (
              <div
                key={store.id}
                className="bg-white rounded-3xl p-4.5 border border-[#E5E2DC] shadow-xs hover:shadow-md transition-all space-y-3"
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
                        <span>{store.address || store.city || 'Local Merchant'}</span>
                      </p>
                    </div>
                  </div>

                  <Link
                    href={`/store/${store.id}`}
                    target="_blank"
                    className="p-2 rounded-xl bg-gray-50 hover:bg-gray-100 text-[#6B6B6B] hover:text-[#171717] transition-colors shrink-0"
                    title="View Store Front"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                </div>

                {/* Status & Action */}
                <div className="border-t border-gray-100 pt-3 flex items-center justify-between">
                  <div>
                    {isConnected && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Connected Store Partner</span>
                      </span>
                    )}

                    {isPending && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 bg-amber-50 px-3 py-1 rounded-xl border border-amber-200">
                        <Clock className="w-4 h-4" />
                        <span>Partner Request Pending</span>
                      </span>
                    )}

                    {!isConnected && !isPending && (
                      <span className="text-[11px] text-[#6B6B6B] font-medium">
                        Open for delivery partnership
                      </span>
                    )}
                  </div>

                  {!isConnected && !isPending && (
                    <Button
                      size="sm"
                      onClick={() => setSelectedStore(store)}
                      className="h-9 px-3.5 rounded-xl bg-[#FF5A36] hover:bg-[#e04d2d] text-white font-bold text-xs flex items-center gap-1.5 shadow-xs"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Send Partner Request</span>
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Partner Request Modal */}
      {selectedStore && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl border border-[#E5E2DC] animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-orange-100 text-[#FF5A36] flex items-center justify-center font-bold">
                <Store className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-[#171717]">Partner with {selectedStore.name}</h3>
                <p className="text-[11px] text-[#6B6B6B]">Send an invitation to the store owner</p>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-[#171717] block mb-1">Optional Message / Note</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Hi, I am an active delivery partner operating in your market area with a scooter..."
                className="w-full h-24 p-3 rounded-2xl border border-[#E5E2DC] text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#FF5A36]"
              />
            </div>

            <div className="flex gap-2.5">
              <Button
                variant="outline"
                onClick={() => { setSelectedStore(null); setNotes(''); }}
                className="flex-1 h-11 rounded-xl text-xs font-bold text-[#6B6B6B] border-[#E5E2DC]"
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleSendRequest(selectedStore.id)}
                disabled={isSending}
                className="flex-1 h-11 rounded-xl bg-[#FF5A36] hover:bg-[#e04d2d] text-white text-xs font-bold shadow-md flex items-center justify-center gap-1.5"
              >
                {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span>Send Request</span>
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
