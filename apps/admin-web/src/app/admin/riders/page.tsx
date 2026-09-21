'use client';

import { useState } from 'react';
import { 
  useGetAllDeliveryPartnersQuery,
  useGetDeliveryPartnerStatsQuery,
  useVerifyDeliveryPartnerMutation, 
  useRejectDeliveryPartnerMutation,
  useSuspendDeliveryPartnerMutation
} from '@/lib/api';
import { useCurrency } from '@/context/CurrencyContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { 
  Bike, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Search, 
  Eye, 
  Phone, 
  Mail, 
  AlertCircle, 
  RefreshCw, 
  X, 
  Truck, 
  ExternalLink,
  ShieldCheck,
  Ban,
  User,
  FileText,
  MapPin,
  Star,
  DollarSign,
  Car
} from 'lucide-react';

export default function RiderVerificationCenter() {
  const { formatPrice } = useCurrency();
  const [selectedStatus, setSelectedStatus] = useState<string>('PENDING');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPartner, setSelectedPartner] = useState<any | null>(null);
  const [activeDocTab, setActiveDocTab] = useState<'selfie' | 'idDoc' | 'vehiclePhoto' | 'vehicleDoc'>('selfie');
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [actionPartnerId, setActionPartnerId] = useState<string | null>(null);

  const { 
    data: partners = [], 
    isLoading, 
    refetch, 
    isFetching 
  } = useGetAllDeliveryPartnersQuery(
    selectedStatus === 'ALL' ? undefined : { status: selectedStatus }
  );

  const { data: stats, refetch: refetchStats } = useGetDeliveryPartnerStatsQuery();

  const [verifyPartner, { isLoading: isVerifying }] = useVerifyDeliveryPartnerMutation();
  const [rejectPartner, { isLoading: isRejecting }] = useRejectDeliveryPartnerMutation();
  const [suspendPartner, { isLoading: isSuspending }] = useSuspendDeliveryPartnerMutation();

  const handleVerify = async (partnerId: string) => {
    try {
      await verifyPartner(partnerId).unwrap();
      toast.success('Rider KYC verified & approved! Partner can now accept deliveries.');
      if (selectedPartner?.id === partnerId) {
        setSelectedPartner(null);
      }
      refetch();
      refetchStats();
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to verify delivery partner');
    }
  };

  const handleRejectSubmit = async () => {
    if (!actionPartnerId) return;
    try {
      await rejectPartner({ 
        id: actionPartnerId, 
        reason: rejectReason.trim() || 'Submitted documents did not meet platform verification guidelines.' 
      }).unwrap();
      toast.success('Rider application rejected with feedback');
      setShowRejectModal(false);
      setActionPartnerId(null);
      setRejectReason('');
      if (selectedPartner?.id === actionPartnerId) {
        setSelectedPartner(null);
      }
      refetch();
      refetchStats();
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to reject delivery partner');
    }
  };

  const handleSuspendSubmit = async () => {
    if (!actionPartnerId) return;
    try {
      await suspendPartner({ 
        id: actionPartnerId, 
        reason: rejectReason.trim() || 'Account suspended by platform compliance review.' 
      }).unwrap();
      toast.success('Rider account suspended');
      setShowSuspendModal(false);
      setActionPartnerId(null);
      setRejectReason('');
      if (selectedPartner?.id === actionPartnerId) {
        setSelectedPartner(null);
      }
      refetch();
      refetchStats();
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to suspend delivery partner');
    }
  };

  const filteredPartners = partners.filter((p) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (p.user?.name && p.user.name.toLowerCase().includes(q)) ||
      (p.user?.phone && p.user.phone.toLowerCase().includes(q)) ||
      (p.user?.email && p.user.email.toLowerCase().includes(q)) ||
      (p.vehicleNumber && p.vehicleNumber.toLowerCase().includes(q)) ||
      (p.locationArea && p.locationArea.toLowerCase().includes(q))
    );
  });

  const getVehicleIcon = (type: string) => {
    switch (type) {
      case 'CAR':
        return <Car className="w-4 h-4 text-blue-600" />;
      case 'BICYCLE':
        return <Bike className="w-4 h-4 text-emerald-600" />;
      default:
        return <Truck className="w-4 h-4 text-orange-600" />;
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-teal-100 flex items-center justify-center text-teal-700 shadow-sm">
              <Bike className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                Rider & Delivery Partner Verification
              </h1>
              <p className="text-sm text-gray-500">
                Review KYC identification, vehicle permits, and grant delivery permissions
              </p>
            </div>
          </div>
        </div>

        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => { refetch(); refetchStats(); }} 
          disabled={isFetching}
          className="self-start sm:self-auto gap-2 border-gray-200 hover:bg-gray-50"
        >
          <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin text-teal-600' : ''}`} />
          <span>Refresh</span>
        </Button>
      </div>

      {/* Metrics Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <User className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Total Riders</span>
            <span className="text-xl font-black text-gray-900">{stats?.total ?? partners.length}</span>
          </div>
        </div>

        <div className="bg-amber-50/70 rounded-2xl p-4 border border-amber-200 shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <span className="text-xs font-bold text-amber-800 uppercase tracking-wider block">Pending Review</span>
            <span className="text-xl font-black text-amber-700">
              {stats?.pending ?? partners.filter(p => p.status === 'PENDING').length}
            </span>
          </div>
        </div>

        <div className="bg-emerald-50/70 rounded-2xl p-4 border border-emerald-200 shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block">Verified & Active</span>
            <span className="text-xl font-black text-emerald-700">
              {stats?.approved ?? partners.filter(p => p.status === 'APPROVED').length}
            </span>
          </div>
        </div>

        <div className="bg-rose-50/70 rounded-2xl p-4 border border-rose-200 shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
            <XCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-rose-800 uppercase tracking-wider block">Rejected / Suspended</span>
            <span className="text-xl font-black text-rose-700">
              {(stats?.rejected ?? 0) + (stats?.suspended ?? 0)}
            </span>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'PENDING', label: 'Pending Verification', icon: Clock, color: 'text-amber-600' },
            { id: 'APPROVED', label: 'Verified Riders', icon: CheckCircle2, color: 'text-emerald-600' },
            { id: 'REJECTED', label: 'Rejected', icon: XCircle, color: 'text-rose-600' },
            { id: 'SUSPENDED', label: 'Suspended', icon: Ban, color: 'text-slate-600' },
            { id: 'ALL', label: 'All Riders', icon: Bike, color: 'text-gray-600' },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = selectedStatus === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedStatus(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-[#0F172A] text-white shadow-sm'
                    : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : tab.color}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search name, phone, plate..."
            className="pl-9 h-9 text-xs bg-gray-50 border-gray-200 focus:bg-white rounded-lg"
          />
        </div>
      </div>

      {/* Partners List / Table */}
      {isLoading ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-200 space-y-3 shadow-sm">
          <RefreshCw className="w-8 h-8 text-teal-600 animate-spin mx-auto" />
          <p className="text-sm text-gray-500 font-semibold">Loading delivery partner applications...</p>
        </div>
      ) : filteredPartners.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-200 space-y-3 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto text-gray-400">
            <Bike className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-gray-900">No delivery partners found</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            {searchQuery 
              ? `No rider records matched your search query "${searchQuery}".`
              : `There are currently no delivery partner applications in ${selectedStatus.toLowerCase()} status.`}
          </p>
          {searchQuery && (
            <Button variant="outline" size="sm" onClick={() => setSearchQuery('')} className="text-xs">
              Clear Search
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredPartners.map((partner) => {
            const user = partner.user;
            const isPending = partner.status === 'PENDING';
            const isApproved = partner.status === 'APPROVED';
            const isRejected = partner.status === 'REJECTED';
            const isSuspended = partner.status === 'SUSPENDED';

            return (
              <div 
                key={partner.id}
                className="bg-white rounded-2xl border border-gray-200 hover:border-gray-300 transition-all p-5 shadow-sm space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3.5">
                  {/* Rider Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-xl bg-gray-100 overflow-hidden shrink-0 border border-gray-200 relative">
                        {partner.selfieUrl || user?.avatarUrl ? (
                          <img 
                            src={partner.selfieUrl || user?.avatarUrl} 
                            alt={user?.name || 'Rider'} 
                            className="w-full h-full object-cover" 
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <User className="w-6 h-6" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-gray-900 text-sm truncate flex items-center gap-1.5">
                          <span>{user?.name || 'Unnamed Partner'}</span>
                        </h3>
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-gray-400" />
                          <span>{user?.phone || 'No phone'}</span>
                        </p>
                        {user?.email && (
                          <p className="text-[11px] text-gray-400 truncate flex items-center gap-1">
                            <Mail className="w-2.5 h-2.5" />
                            <span>{user.email}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div>
                      {isPending && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200">
                          <Clock className="w-3 h-3 animate-pulse" />
                          <span>Needs Review</span>
                        </span>
                      )}
                      {isApproved && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Verified & Active</span>
                        </span>
                      )}
                      {isRejected && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-rose-50 text-rose-700 border border-rose-200">
                          <XCircle className="w-3 h-3" />
                          <span>Rejected</span>
                        </span>
                      )}
                      {isSuspended && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-slate-100 text-slate-700 border border-slate-300">
                          <Ban className="w-3 h-3" />
                          <span>Suspended</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Vehicle & Pricing Badge Box */}
                  <div className="grid grid-cols-2 gap-2 bg-gray-50 rounded-xl p-3 border border-gray-100 text-xs">
                    <div>
                      <span className="text-[10px] font-semibold uppercase text-gray-400 block tracking-wider">
                        Vehicle
                      </span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {getVehicleIcon(partner.vehicleType)}
                        <span className="font-bold text-gray-800 text-[11px]">{partner.vehicleType || 'MOTORCYCLE'}</span>
                        <span className="font-mono font-bold text-[10px] bg-white px-1.5 py-0.5 rounded border border-gray-200 text-gray-700">
                          {partner.vehicleNumber}
                        </span>
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] font-semibold uppercase text-gray-400 block tracking-wider">
                        Custom Rates
                      </span>
                      <p className="font-bold text-gray-800 mt-0.5 text-[11px]">
                        Base: {formatPrice(partner.baseFare || 40)} • {formatPrice(partner.perKmRate || 8)}/km
                      </p>
                    </div>
                  </div>

                  {/* 4 KYC Document Thumbnails Preview */}
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1.5">
                      Submitted KYC Documents (4)
                    </span>
                    <div className="grid grid-cols-4 gap-1.5">
                      {/* 1. Selfie */}
                      <div 
                        onClick={() => { setSelectedPartner(partner); setActiveDocTab('selfie'); }}
                        className="group relative aspect-square rounded-lg bg-gray-100 border border-gray-200 overflow-hidden cursor-pointer hover:border-teal-500 transition-colors"
                      >
                        {partner.selfieUrl ? (
                          <img src={partner.selfieUrl} alt="Selfie" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-400">No Photo</div>
                        )}
                        <span className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[9px] font-bold text-center py-0.5 truncate px-1">
                          Selfie
                        </span>
                      </div>

                      {/* 2. Identity Document */}
                      <div 
                        onClick={() => { setSelectedPartner(partner); setActiveDocTab('idDoc'); }}
                        className="group relative aspect-square rounded-lg bg-gray-100 border border-gray-200 overflow-hidden cursor-pointer hover:border-teal-500 transition-colors"
                      >
                        {partner.identityDocumentUrl ? (
                          <img src={partner.identityDocumentUrl} alt="Gov ID" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-400">No ID</div>
                        )}
                        <span className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[9px] font-bold text-center py-0.5 truncate px-1">
                          Govt ID
                        </span>
                      </div>

                      {/* 3. Vehicle Photo */}
                      <div 
                        onClick={() => { setSelectedPartner(partner); setActiveDocTab('vehiclePhoto'); }}
                        className="group relative aspect-square rounded-lg bg-gray-100 border border-gray-200 overflow-hidden cursor-pointer hover:border-teal-500 transition-colors"
                      >
                        {partner.vehiclePhotoUrl ? (
                          <img src={partner.vehiclePhotoUrl} alt="Vehicle" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-400">No Photo</div>
                        )}
                        <span className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[9px] font-bold text-center py-0.5 truncate px-1">
                          Vehicle
                        </span>
                      </div>

                      {/* 4. Vehicle Registration / RC */}
                      <div 
                        onClick={() => { setSelectedPartner(partner); setActiveDocTab('vehicleDoc'); }}
                        className="group relative aspect-square rounded-lg bg-gray-100 border border-gray-200 overflow-hidden cursor-pointer hover:border-teal-500 transition-colors"
                      >
                        {partner.vehicleDocumentUrl ? (
                          <img src={partner.vehicleDocumentUrl} alt="Vehicle RC" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-400">No Doc</div>
                        )}
                        <span className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[9px] font-bold text-center py-0.5 truncate px-1">
                          RC / Doc
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Rejection / Suspension Notes if any */}
                  {partner.rejectionReason && (
                    <div className="bg-rose-50 border border-rose-200 rounded-xl p-2.5 text-xs text-rose-800 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold block text-[11px]">Reason:</span>
                        <span>{partner.rejectionReason}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Action Buttons */}
                <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => { setSelectedPartner(partner); setActiveDocTab('selfie'); }}
                    className="text-xs h-8 text-gray-700 hover:bg-gray-100 border-gray-200 gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5 text-gray-500" />
                    <span>Inspect KYC</span>
                  </Button>

                  <div className="flex items-center gap-2">
                    {isPending && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setActionPartnerId(partner.id);
                            setShowRejectModal(true);
                          }}
                          className="text-xs h-8 text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700"
                        >
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleVerify(partner.id)}
                          disabled={isVerifying}
                          className="text-xs h-8 bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1 shadow-sm"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Approve & Verify</span>
                        </Button>
                      </>
                    )}

                    {isApproved && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setActionPartnerId(partner.id);
                          setShowSuspendModal(true);
                        }}
                        className="text-xs h-8 text-slate-600 hover:bg-slate-50 border-slate-300"
                      >
                        <Ban className="w-3 h-3 mr-1" />
                        Suspend
                      </Button>
                    )}

                    {(isRejected || isSuspended) && (
                      <Button
                        size="sm"
                        onClick={() => handleVerify(partner.id)}
                        disabled={isVerifying}
                        className="text-xs h-8 bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1 shadow-sm"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Re-Approve</span>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================= */}
      {/* Comprehensive Inspect Full KYC Dossier Modal */}
      {/* ========================================================= */}
      {selectedPartner && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full border border-gray-200 shadow-2xl overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-[#FAF9F6]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-gray-900 text-base flex items-center gap-2">
                    <span>KYC Inspection Dossier</span>
                    <span className="text-[11px] font-mono bg-gray-200 text-gray-700 px-2 py-0.5 rounded font-bold">
                      #{selectedPartner.id.slice(0, 8)}
                    </span>
                  </h3>
                  <p className="text-xs text-gray-500">
                    Submitted by {selectedPartner.user?.name || 'Rider'} • {selectedPartner.vehicleNumber}
                  </p>
                </div>
              </div>

              <button 
                onClick={() => setSelectedPartner(null)}
                className="w-8 h-8 rounded-full hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              {/* Document Selector Tabs */}
              <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-3">
                {[
                  { id: 'selfie', label: '1. Rider Live Selfie', url: selectedPartner.selfieUrl },
                  { id: 'idDoc', label: `2. Govt ID (${selectedPartner.identityDocumentType || 'GOVERNMENT_ID'})`, url: selectedPartner.identityDocumentUrl },
                  { id: 'vehiclePhoto', label: '3. Vehicle Photo', url: selectedPartner.vehiclePhotoUrl },
                  { id: 'vehicleDoc', label: '4. Vehicle RC / Docs', url: selectedPartner.vehicleDocumentUrl },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveDocTab(tab.id as any)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                      activeDocTab === tab.id
                        ? 'bg-teal-700 text-white shadow-xs'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <span>{tab.label}</span>
                    {tab.url && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                  </button>
                ))}
              </div>

              {/* Active Document Viewer */}
              <div className="bg-gray-900 rounded-2xl p-4 flex flex-col items-center justify-center min-h-[320px] relative overflow-hidden border border-gray-800">
                {(() => {
                  let currentUrl = '';
                  let currentTitle = '';
                  if (activeDocTab === 'selfie') {
                    currentUrl = selectedPartner.selfieUrl;
                    currentTitle = 'Live Rider Selfie (Face Verification)';
                  } else if (activeDocTab === 'idDoc') {
                    currentUrl = selectedPartner.identityDocumentUrl;
                    currentTitle = `Government Identity Document (${selectedPartner.identityDocumentType || 'Identity Proof'})`;
                  } else if (activeDocTab === 'vehiclePhoto') {
                    currentUrl = selectedPartner.vehiclePhotoUrl;
                    currentTitle = `Vehicle Exterior Photo (${selectedPartner.vehicleType || 'Vehicle'})`;
                  } else {
                    currentUrl = selectedPartner.vehicleDocumentUrl;
                    currentTitle = 'Vehicle Registration Certificate (RC) / Insurance';
                  }

                  if (!currentUrl) {
                    return (
                      <div className="text-center text-gray-400 p-8 space-y-2">
                        <AlertCircle className="w-8 h-8 mx-auto text-gray-500" />
                        <p className="text-xs font-medium">No document uploaded for this requirement.</p>
                      </div>
                    );
                  }

                  return (
                    <div className="w-full flex flex-col items-center gap-3">
                      <div className="w-full flex items-center justify-between text-xs text-gray-300 px-2">
                        <span className="font-bold">{currentTitle}</span>
                        <a 
                          href={currentUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-teal-400 hover:text-teal-300 flex items-center gap-1 font-semibold underline"
                        >
                          <span>Open Full Resolution</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                      <div className="max-h-[400px] w-full flex items-center justify-center overflow-hidden rounded-xl bg-black/40 p-2">
                        <img 
                          src={currentUrl} 
                          alt={currentTitle} 
                          className="max-h-[380px] max-w-full object-contain rounded-lg shadow-lg" 
                        />
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Rider Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-200 text-xs">
                <div className="space-y-2">
                  <h4 className="font-bold text-gray-900 uppercase tracking-wider text-[11px]">Rider Personal Details</h4>
                  <div className="space-y-1 text-gray-600">
                    <p><span className="font-semibold text-gray-800">Full Name:</span> {selectedPartner.user?.name || 'N/A'}</p>
                    <p><span className="font-semibold text-gray-800">Phone:</span> {selectedPartner.user?.phone || 'N/A'}</p>
                    <p><span className="font-semibold text-gray-800">Email:</span> {selectedPartner.user?.email || 'N/A'}</p>
                    <p><span className="font-semibold text-gray-800">Country:</span> {selectedPartner.operatingCountry || 'IN'}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-bold text-gray-900 uppercase tracking-wider text-[11px]">Vehicle & Operations</h4>
                  <div className="space-y-1 text-gray-600">
                    <p><span className="font-semibold text-gray-800">Vehicle Type:</span> {selectedPartner.vehicleType}</p>
                    <p><span className="font-semibold text-gray-800">Plate Number:</span> {selectedPartner.vehicleNumber}</p>
                    <p><span className="font-semibold text-gray-800">Base Fare:</span> {formatPrice(selectedPartner.baseFare || 40)}</p>
                    <p><span className="font-semibold text-gray-800">Per-Km Rate:</span> {formatPrice(selectedPartner.perKmRate || 8)}/km</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedPartner(null)}
                className="text-xs"
              >
                Close Dossier
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setActionPartnerId(selectedPartner.id);
                    setShowRejectModal(true);
                  }}
                  className="text-xs h-9 text-rose-600 border-rose-200 hover:bg-rose-50"
                >
                  Reject Application
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleVerify(selectedPartner.id)}
                  disabled={isVerifying}
                  className="text-xs h-9 bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1.5 shadow-sm px-4"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Approve & Verify Rider</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* Rejection Reason Modal */}
      {/* ========================================================= */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-gray-200 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-900 text-base flex items-center gap-2 text-rose-600">
                <AlertCircle className="w-5 h-5" />
                <span>Reject Rider Application</span>
              </h3>
              <button onClick={() => setShowRejectModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-gray-600">
              Please specify the reason for rejection. This feedback will be displayed to the rider so they can fix their documents and re-apply.
            </p>

            <div className="space-y-2">
              <div className="flex flex-wrap gap-1.5">
                {[
                  'Blurry or unreadable Government ID',
                  'Vehicle registration (RC) expired or invalid',
                  'Selfie does not match Government ID photo',
                  'Vehicle number plate not clearly visible',
                  'Incomplete vehicle documentation'
                ].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setRejectReason(preset)}
                    className="text-[10px] bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded font-medium text-left"
                  >
                    {preset}
                  </button>
                ))}
              </div>

              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Explain why this application was rejected..."
                rows={3}
                className="w-full text-xs p-2.5 rounded-xl border border-gray-200 focus:outline-hidden focus:border-rose-500 resize-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowRejectModal(false);
                  setActionPartnerId(null);
                  setRejectReason('');
                }}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleRejectSubmit}
                disabled={isRejecting}
                className="text-xs bg-rose-600 hover:bg-rose-700 text-white font-bold"
              >
                {isRejecting ? 'Rejecting...' : 'Confirm Rejection'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* Suspension Reason Modal */}
      {/* ========================================================= */}
      {showSuspendModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-gray-200 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-900 text-base flex items-center gap-2 text-slate-800">
                <Ban className="w-5 h-5 text-slate-600" />
                <span>Suspend Rider Account</span>
              </h3>
              <button onClick={() => setShowSuspendModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-gray-600">
              Suspending this account will immediately disable the rider from receiving order dispatches and going online.
            </p>

            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Reason for suspension (e.g. repeated customer complaints, fraud detection)..."
              rows={3}
              className="w-full text-xs p-2.5 rounded-xl border border-gray-200 focus:outline-hidden focus:border-slate-500 resize-none"
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowSuspendModal(false);
                  setActionPartnerId(null);
                  setRejectReason('');
                }}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSuspendSubmit}
                disabled={isSuspending}
                className="text-xs bg-slate-800 hover:bg-slate-900 text-white font-bold"
              >
                {isSuspending ? 'Suspending...' : 'Suspend Rider'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
