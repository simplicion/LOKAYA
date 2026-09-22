'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Plus, MapPin, Check, Loader2, Home, Briefcase, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGetAddressesQuery, useAddAddressMutation } from '@/lib/api';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function SelectAddressPage() {
  const router = useRouter();
  const { data: addresses = [], isLoading, refetch } = useGetAddressesQuery();
  const [addAddress, { isLoading: isAdding }] = useAddAddressMutation();

  const [selectedId, setSelectedId] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New address form state
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    pincode: '',
    type: 'HOME',
    isDefault: true,
  });

  const activeSelectedId = selectedId || addresses.find((a: any) => a.isDefault)?.id || addresses[0]?.id || '';

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.addressLine1 || !formData.city || !formData.pincode) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const created = await addAddress(formData).unwrap();
      toast.success('New address added successfully!');
      setSelectedId(created.id);
      setIsModalOpen(false);
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to save address');
    }
  };

  const handleSelectAndProceed = () => {
    if (!activeSelectedId && addresses.length === 0) {
      setIsModalOpen(true);
      return;
    }
    router.push(`/checkout?addressId=${activeSelectedId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-28 flex flex-col max-w-md mx-auto relative shadow-2xl">
      {/* Header */}
      <div className="flex items-center px-4 py-3.5 border-b border-gray-100 sticky top-0 bg-white z-20">
        <button 
          onClick={() => router.back()} 
          className="p-1.5 -ml-1.5 rounded-full hover:bg-gray-100 text-gray-800 transition-colors"
          aria-label="Back"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-base font-black text-gray-900 ml-2">Select Delivery Address</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
        {isLoading ? (
          <div className="py-24 flex flex-col items-center justify-center text-center gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-[#FF6B00]" />
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Loading saved addresses...</span>
          </div>
        ) : addresses.length === 0 ? (
          <div className="bg-white rounded-3xl p-6 border border-gray-100 text-center space-y-3 my-6">
            <div className="w-14 h-14 bg-orange-50 text-[#FF6B00] rounded-2xl flex items-center justify-center mx-auto">
              <MapPin className="w-7 h-7" />
            </div>
            <h3 className="font-extrabold text-gray-900 text-sm">No Saved Addresses Found</h3>
            <p className="text-xs text-gray-500 max-w-xs mx-auto">
              Please add your delivery address to proceed with lightning-fast doorstep shipping.
            </p>
            <Button
              onClick={() => setIsModalOpen(true)}
              className="h-10 px-5 rounded-xl bg-[#FF6B00] hover:bg-[#ff7a1f] text-white font-bold text-xs"
            >
              Add Your Address
            </Button>
          </div>
        ) : (
          addresses.map((address: any) => {
            const isSelected = activeSelectedId === address.id;
            return (
              <div 
                key={address.id}
                onClick={() => setSelectedId(address.id)}
                className={cn(
                  "border-2 rounded-2xl p-4 transition-all cursor-pointer bg-white relative space-y-2 shadow-sm",
                  isSelected ? "border-[#FF6B00] ring-2 ring-[#FF6B00]/10" : "border-gray-100 hover:border-gray-200"
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-gray-100 text-gray-700 flex items-center justify-center">
                      {address.type === 'WORK' ? <Briefcase className="w-3.5 h-3.5" /> : <Home className="w-3.5 h-3.5" />}
                    </div>
                    <h3 className="font-bold text-gray-900 text-xs flex items-center gap-1.5">
                      <span>{address.name}</span>
                      {address.isDefault && (
                        <span className="text-[10px] uppercase font-extrabold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Default
                        </span>
                      )}
                    </h3>
                  </div>

                  <div className={cn(
                    "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                    isSelected ? "border-[#FF6B00] bg-[#FF6B00]" : "border-gray-300"
                  )}>
                    {isSelected && <Check className="w-3 h-3 text-white stroke-[3]" />}
                  </div>
                </div>

                <p className="text-xs text-gray-600 leading-relaxed pl-8">
                  {address.addressLine1}
                  {address.addressLine2 ? `, ${address.addressLine2}` : ''}
                  <br />
                  {address.city}, {address.state} - {address.pincode}
                </p>

                <p className="text-[11px] font-medium text-gray-900 pl-8">
                  Phone: <span className="font-bold">{address.phone}</span>
                </p>
              </div>
            );
          })
        )}

        <button 
          onClick={() => setIsModalOpen(true)}
          className="w-full flex items-center justify-center gap-2 py-3.5 border-2 border-dashed border-gray-200 hover:border-[#FF6B00] rounded-2xl text-gray-600 hover:text-[#FF6B00] font-bold text-xs transition-colors bg-white/50"
        >
          <Plus className="w-4 h-4" />
          Add New Delivery Address
        </button>
      </div>

      {/* Sticky Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-gray-200 p-3.5 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] z-20">
        <Button 
          onClick={handleSelectAndProceed}
          className="w-full h-11 rounded-xl bg-[#FF6B00] hover:bg-[#ff7a1f] text-white font-bold text-xs tracking-wide uppercase shadow-md flex items-center justify-center gap-2"
        >
          <span>Deliver to this Address</span>
        </Button>
      </div>

      {/* Add Address Bottom Sheet */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-xs transition-opacity duration-300"
          onClick={() => setIsModalOpen(false)}
        >
          <div 
            className="bg-white rounded-t-[28px] w-full max-w-md p-5 pb-8 space-y-4 max-h-[88vh] overflow-y-auto animate-in slide-in-from-bottom duration-300 ease-out border-t border-[#E5E2DC]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drag Handle Indicator */}
            <div className="w-12 h-1 bg-[#E5E2DC] rounded-full mx-auto -mt-1 mb-1" />

            <div className="flex justify-between items-center pb-2 border-b border-gray-100">
              <h3 className="font-black text-gray-900 text-sm">Add New Delivery Address</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAddress} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Recipient's Name"
                    className="w-full h-9 px-3 rounded-xl border border-gray-200 bg-gray-50 text-xs outline-none focus:border-[#FF6B00]"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="10-digit mobile"
                    className="w-full h-9 px-3 rounded-xl border border-gray-200 bg-gray-50 text-xs outline-none focus:border-[#FF6B00]"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Flat / House No. / Street *</label>
                <input
                  type="text"
                  required
                  value={formData.addressLine1}
                  onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
                  placeholder="Address Line 1"
                  className="w-full h-9 px-3 rounded-xl border border-gray-200 bg-gray-50 text-xs outline-none focus:border-[#FF6B00]"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Area / Landmark (Optional)</label>
                <input
                  type="text"
                  value={formData.addressLine2}
                  onChange={(e) => setFormData({ ...formData, addressLine2: e.target.value })}
                  placeholder="Near Landmark / Colony"
                  className="w-full h-9 px-3 rounded-xl border border-gray-200 bg-gray-50 text-xs outline-none focus:border-[#FF6B00]"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">City *</label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="City"
                    className="w-full h-9 px-3 rounded-xl border border-gray-200 bg-gray-50 text-xs outline-none focus:border-[#FF6B00]"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">State *</label>
                  <input
                    type="text"
                    required
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    placeholder="State"
                    className="w-full h-9 px-3 rounded-xl border border-gray-200 bg-gray-50 text-xs outline-none focus:border-[#FF6B00]"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">PIN Code *</label>
                  <input
                    type="text"
                    required
                    value={formData.pincode}
                    onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                    placeholder="6-digit PIN"
                    className="w-full h-9 px-3 rounded-xl border border-gray-200 bg-gray-50 text-xs outline-none focus:border-[#FF6B00]"
                  />
                </div>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={isAdding}
                  className="w-full h-10 rounded-xl bg-[#FF6B00] hover:bg-[#ff7a1f] text-white font-bold text-xs shadow-md"
                >
                  {isAdding ? 'Saving Address...' : 'Save & Select Address'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
