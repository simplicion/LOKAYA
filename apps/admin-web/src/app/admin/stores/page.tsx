'use client';

import { useEffect, useState } from 'react';
import { useGetAllStoresQuery, useVerifyStoreMutation, useRejectStoreMutation } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { 
  Store, FileText, CheckCircle2, XCircle, Clock, Search, 
  ExternalLink, ShieldCheck, Eye, MapPin, Phone, Mail, 
  AlertCircle, Building2, RefreshCw, X, Sparkles
} from 'lucide-react';

export default function VerificationCenter() {
  const [selectedStatus, setSelectedStatus] = useState<string>('PENDING');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStore, setSelectedStore] = useState<any | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);

  const { data: stores, isLoading, refetch, isFetching } = useGetAllStoresQuery(
    selectedStatus === 'ALL' ? undefined : { status: selectedStatus }
  );

  const [verifyStore, { isLoading: isVerifying }] = useVerifyStoreMutation();
  const [rejectStore, { isLoading: isRejecting }] = useRejectStoreMutation();

  const handleVerify = async (storeId: string) => {
    try {
      await verifyStore(storeId).unwrap();
      toast.success('Store verified & activated successfully!');
      setSelectedStore(null);
      refetch();
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to verify store');
    }
  };

  const handleReject = async (storeId: string) => {
    try {
      await rejectStore({ storeId, reason: rejectReason }).unwrap();
      toast.success('Store application rejected');
      setShowRejectModal(false);
      setSelectedStore(null);
      setRejectReason('');
      refetch();
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to reject store');
    }
  };

  const filteredStores = stores?.filter((s) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      (s.contactPhone && s.contactPhone.toLowerCase().includes(q)) ||
      (s.users?.[0]?.user?.email && s.users[0].user.email.toLowerCase().includes(q)) ||
      (s.address && s.address.toLowerCase().includes(q))
    );
  }) || [];

  const pendingCount = stores?.filter((s) => s.status === 'PENDING' || s.verificationStatus === 'PENDING').length ?? 0;

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-[#FF5A36]">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Seller Verification Center</h1>
              <p className="text-sm text-gray-500">Review KYC identification documents and grant store access</p>
            </div>
          </div>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => refetch()} 
          disabled={isFetching}
          className="self-start sm:self-auto gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-gray-200">
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'PENDING', label: 'Pending Verification', icon: Clock, color: 'text-amber-600' },
            { id: 'VERIFIED', label: 'Verified Stores', icon: CheckCircle2, color: 'text-emerald-600' },
            { id: 'REJECTED', label: 'Rejected', icon: XCircle, color: 'text-rose-600' },
            { id: 'ALL', label: 'All Applications', icon: Store, color: 'text-gray-600' },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = selectedStatus === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedStatus(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-gray-900 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : tab.color}`} />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            placeholder="Search store, email, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>
      </div>

      {/* Stores Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-5 py-3.5">Store & Owner</th>
                <th className="px-5 py-3.5">Contact</th>
                <th className="px-5 py-3.5">Location</th>
                <th className="px-5 py-3.5">KYC Documents</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-gray-400">
                    Loading seller verification queue...
                  </td>
                </tr>
              ) : filteredStores.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-gray-400">
                    No applications found in this filter.
                  </td>
                </tr>
              ) : (
                filteredStores.map((store) => {
                  const owner = store.users?.[0]?.user;
                  return (
                    <tr key={store.id} className="hover:bg-gray-50/80 transition-colors">
                      {/* Store & Owner */}
                      <td className="px-5 py-4 font-medium text-gray-900">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-orange-50 border border-orange-200 flex items-center justify-center text-[#FF5A36] font-bold">
                            {store.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-semibold text-gray-900">{store.name}</span>
                            <div className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
                              <Mail className="w-3 h-3" />
                              {owner?.email || 'No email attached'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="px-5 py-4 text-gray-600">
                        <div className="flex items-center gap-1.5 font-mono text-xs">
                          <Phone className="w-3 h-3 text-gray-400" />
                          {store.contactPhone || 'N/A'}
                        </div>
                      </td>

                      {/* Location */}
                      <td className="px-5 py-4 text-gray-500">
                        <div className="max-w-[180px] truncate flex items-center gap-1" title={store.address}>
                          <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
                          {store.address || 'Not specified'}
                        </div>
                      </td>

                      {/* KYC Documents */}
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-1.5">
                          {store.aadhaarFrontUrl && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-orange-50 text-orange-700 text-[11px] font-medium border border-orange-200">
                              Owner ID (Front)
                            </span>
                          )}
                          {store.aadhaarBackUrl && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-orange-50 text-orange-700 text-[11px] font-medium border border-orange-200">
                              Owner ID (Back)
                            </span>
                          )}
                          {store.panCardUrl && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-[11px] font-medium border border-blue-200">
                              Owner Photo
                            </span>
                          )}
                          {store.gstOrLicenseUrl && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[11px] font-medium border border-emerald-200">
                              Business License
                            </span>
                          )}
                          {(!store.aadhaarFrontUrl && !store.panCardUrl && store.aadharPanUrl) && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-purple-50 text-purple-700 text-[11px] font-medium border border-purple-200">
                              Universal ID
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        {store.verificationStatus === 'PENDING' ? (
                          <div className="flex flex-col gap-1">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                              <Sparkles className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
                              Blue Tick Requested
                            </span>
                            {store.verificationRequestedAt && (
                              <span className="text-[10px] text-gray-400">
                                Applied {new Date(store.verificationRequestedAt).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        ) : store.isVerified ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                            Blue Tick Verified
                          </span>
                        ) : store.status === 'VERIFIED' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Active Store
                          </span>
                        ) : store.status === 'PENDING' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock className="w-3.5 h-3.5" />
                            Pending Review
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                            <XCircle className="w-3.5 h-3.5" />
                            Rejected
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedStore(store)}
                            className="text-xs h-8 px-2.5 gap-1.5"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Review
                          </Button>
                          {(!store.isVerified || store.status !== 'VERIFIED') && (
                            <Button
                              size="sm"
                              onClick={() => handleVerify(store.id)}
                              disabled={isVerifying}
                              className="text-xs h-8 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                            >
                              {store.verificationStatus === 'PENDING' ? 'Approve Blue Tick' : 'Approve'}
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Document Review Modal */}
      {selectedStore && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-gray-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center text-[#FF5A36]">
                  <Store className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{selectedStore.name}</h2>
                  <p className="text-xs text-gray-500">Store Verification & KYC Inspection</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedStore(null)}
                className="p-1 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm">
              {/* Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-[#FAF9F6] p-4 rounded-xl border border-gray-200 text-xs">
                <div>
                  <span className="text-gray-500">Owner Contact</span>
                  <div className="font-semibold text-gray-900 mt-0.5">{selectedStore.contactPhone || 'N/A'}</div>
                  <div className="text-gray-500 mt-0.5">{selectedStore.users?.[0]?.user?.email || 'N/A'}</div>
                </div>
                <div>
                  <span className="text-gray-500">Address & Landmark</span>
                  <div className="font-semibold text-gray-900 mt-0.5">{selectedStore.address || 'N/A'}</div>
                  {selectedStore.landmark && <div className="text-gray-500 mt-0.5">Near: {selectedStore.landmark}</div>}
                </div>
                <div>
                  <span className="text-gray-500">Current Status</span>
                  <div className="mt-1">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-bold ${
                      selectedStore.status === 'VERIFIED' ? 'bg-emerald-100 text-emerald-800' :
                      selectedStore.status === 'PENDING' ? 'bg-amber-100 text-amber-800' :
                      'bg-rose-100 text-rose-800'
                    }`}>
                      {selectedStore.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* KYC Document Previews */}
              <div className="space-y-4">
                <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#FF5A36]" />
                  Uploaded Verification Documents
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Location & Country Metadata */}
                  {(selectedStore.landmark || selectedStore.state || (selectedStore.latitude && selectedStore.longitude)) && (
                    <div className="sm:col-span-2 p-3 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-between text-xs text-gray-700">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-[#FF5A36] shrink-0" />
                        <div>
                          <span className="font-semibold text-gray-900">Detected Location: </span>
                          <span>{selectedStore.landmark || [selectedStore.city, selectedStore.state].filter(Boolean).join(', ')}</span>
                        </div>
                      </div>
                      {selectedStore.latitude && selectedStore.longitude && (
                        <span className="font-mono text-[11px] text-gray-500 bg-white border px-2 py-0.5 rounded">
                          {selectedStore.latitude.toFixed(4)}°, {selectedStore.longitude.toFixed(4)}°
                        </span>
                      )}
                    </div>
                  )}

                  {/* Owner ID Front */}
                  <div className="border rounded-xl p-4 bg-white flex flex-col justify-between space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-800">Government Identity (Front / Info Page)</span>
                      {selectedStore.aadhaarFrontUrl ? (
                        <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded font-semibold">Available</span>
                      ) : (
                        <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded">Not Uploaded</span>
                      )}
                    </div>
                    {selectedStore.aadhaarFrontUrl ? (
                      <div className="space-y-2">
                        <div className="aspect-[16/10] bg-gray-100 rounded-lg overflow-hidden border border-gray-200 flex items-center justify-center">
                          {selectedStore.aadhaarFrontUrl.endsWith('.pdf') ? (
                            <div className="flex flex-col items-center text-gray-500 gap-1">
                              <FileText className="w-8 h-8 text-red-500" />
                              <span className="text-[11px]">PDF Document</span>
                            </div>
                          ) : (
                            <img src={selectedStore.aadhaarFrontUrl} alt="Aadhaar Front" className="w-full h-full object-contain" />
                          )}
                        </div>
                        <a
                          href={selectedStore.aadhaarFrontUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-semibold text-[#FF5A36] hover:underline flex items-center justify-center gap-1 pt-1"
                        >
                          View Full Document <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    ) : (
                      <div className="aspect-[16/10] bg-gray-50 rounded-lg flex items-center justify-center text-gray-400 text-xs">
                        No File
                      </div>
                    )}
                  </div>

                  {/* Owner ID Back */}
                  <div className="border rounded-xl p-4 bg-white flex flex-col justify-between space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-800">Government Identity (Back / Address Page)</span>
                      {selectedStore.aadhaarBackUrl ? (
                        <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded font-semibold">Available</span>
                      ) : (
                        <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded">Not Uploaded</span>
                      )}
                    </div>
                    {selectedStore.aadhaarBackUrl ? (
                      <div className="space-y-2">
                        <div className="aspect-[16/10] bg-gray-100 rounded-lg overflow-hidden border border-gray-200 flex items-center justify-center">
                          {selectedStore.aadhaarBackUrl.endsWith('.pdf') ? (
                            <div className="flex flex-col items-center text-gray-500 gap-1">
                              <FileText className="w-8 h-8 text-red-500" />
                              <span className="text-[11px]">PDF Document</span>
                            </div>
                          ) : (
                            <img src={selectedStore.aadhaarBackUrl} alt="Aadhaar Back" className="w-full h-full object-contain" />
                          )}
                        </div>
                        <a
                          href={selectedStore.aadhaarBackUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-semibold text-[#FF5A36] hover:underline flex items-center justify-center gap-1 pt-1"
                        >
                          View Full Document <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    ) : (
                      <div className="aspect-[16/10] bg-gray-50 rounded-lg flex items-center justify-center text-gray-400 text-xs">
                        No File
                      </div>
                    )}
                  </div>

                  {/* Owner Photo */}
                  <div className="border rounded-xl p-4 bg-white flex flex-col justify-between space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-800">Owner Identity Photograph (Portrait/Selfie)</span>
                      {selectedStore.panCardUrl ? (
                        <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded font-semibold">Available</span>
                      ) : (
                        <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded">Not Uploaded</span>
                      )}
                    </div>
                    {selectedStore.panCardUrl ? (
                      <div className="space-y-2">
                        <div className="aspect-[16/10] bg-gray-100 rounded-lg overflow-hidden border border-gray-200 flex items-center justify-center">
                          {selectedStore.panCardUrl.endsWith('.pdf') ? (
                            <div className="flex flex-col items-center text-gray-500 gap-1">
                              <FileText className="w-8 h-8 text-red-500" />
                              <span className="text-[11px]">PDF Document</span>
                            </div>
                          ) : (
                            <img src={selectedStore.panCardUrl} alt="PAN Card" className="w-full h-full object-contain" />
                          )}
                        </div>
                        <a
                          href={selectedStore.panCardUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-semibold text-[#FF5A36] hover:underline flex items-center justify-center gap-1 pt-1"
                        >
                          View Full Document <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    ) : (
                      <div className="aspect-[16/10] bg-gray-50 rounded-lg flex items-center justify-center text-gray-400 text-xs">
                        No File
                      </div>
                    )}
                  </div>

                  {/* Business License / Certificate */}
                  <div className="border rounded-xl p-4 bg-white flex flex-col justify-between space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-800">Business Registration / Commercial License</span>
                      {selectedStore.gstOrLicenseUrl ? (
                        <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded font-semibold">Provided (Optional)</span>
                      ) : (
                        <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded">Not Provided</span>
                      )}
                    </div>
                    {selectedStore.gstOrLicenseUrl ? (
                      <div className="space-y-2">
                        <div className="aspect-[16/10] bg-gray-100 rounded-lg overflow-hidden border border-gray-200 flex items-center justify-center">
                          {selectedStore.gstOrLicenseUrl.endsWith('.pdf') ? (
                            <div className="flex flex-col items-center text-gray-500 gap-1">
                              <FileText className="w-8 h-8 text-red-500" />
                              <span className="text-[11px]">PDF Document</span>
                            </div>
                          ) : (
                            <img src={selectedStore.gstOrLicenseUrl} alt="GST / License" className="w-full h-full object-contain" />
                          )}
                        </div>
                        <a
                          href={selectedStore.gstOrLicenseUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-semibold text-[#FF5A36] hover:underline flex items-center justify-center gap-1 pt-1"
                        >
                          View Full Document <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    ) : (
                      <div className="aspect-[16/10] bg-gray-50 rounded-lg flex items-center justify-center text-gray-400 text-xs">
                        Optional Document Not Provided
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
              <Button
                variant="ghost"
                onClick={() => setSelectedStore(null)}
                className="text-xs"
              >
                Close
              </Button>

              <div className="flex items-center gap-3">
                {selectedStore.status !== 'REJECTED' && (
                  <Button
                    variant="outline"
                    onClick={() => setShowRejectModal(true)}
                    className="text-xs text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                  >
                    Reject Application
                  </Button>
                )}

                {(!selectedStore.isVerified || selectedStore.status !== 'VERIFIED') && (
                  <Button
                    onClick={() => handleVerify(selectedStore.id)}
                    disabled={isVerifying}
                    className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5"
                  >
                    {isVerifying ? 'Approving...' : selectedStore.verificationStatus === 'PENDING' ? 'Approve Blue Tick Verification' : 'Approve & Activate Store'}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Prompt Modal */}
      {showRejectModal && selectedStore && (
        <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-gray-200">
            <div className="flex items-center gap-3 text-red-600">
              <AlertCircle className="w-6 h-6" />
              <h3 className="font-bold text-gray-900 text-base">Reject Store Application</h3>
            </div>
            <p className="text-xs text-gray-600">
              Are you sure you want to reject <strong>{selectedStore.name}</strong>? The seller will be able to re-submit their KYC details.
            </p>
            <div>
              <label className="text-xs font-semibold text-gray-700">Reason (Optional)</label>
              <Input
                placeholder="e.g. Blurry Aadhaar card image, please re-upload"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="mt-1 text-xs"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" size="sm" onClick={() => setShowRejectModal(false)} className="text-xs">
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => handleReject(selectedStore.id)}
                disabled={isRejecting}
                className="text-xs bg-red-600 hover:bg-red-700 text-white font-semibold"
              >
                {isRejecting ? 'Rejecting...' : 'Confirm Reject'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
