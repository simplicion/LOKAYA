'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MOCK_ADDRESSES, Address } from '@/lib/mock/checkout';
import { ChevronLeft, Plus, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function SelectAddressPage() {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string>(
    MOCK_ADDRESSES.find(a => a.isDefault)?.id || MOCK_ADDRESSES[0].id
  );

  return (
    <div className="min-h-screen bg-white pb-safe flex flex-col max-w-md mx-auto relative shadow-2xl">
      {/* Header */}
      <div className="flex items-center px-4 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
        <button onClick={() => router.back()} className="mr-4 text-gray-800">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-bold text-gray-900">Select Delivery Address</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {MOCK_ADDRESSES.map((address) => (
          <div 
            key={address.id}
            onClick={() => setSelectedId(address.id)}
            className={cn(
              "border-2 rounded-2xl p-4 transition-all cursor-pointer relative",
              selectedId === address.id ? "border-[#FF6B00] bg-[#FF6B00]/5" : "border-gray-200 hover:border-gray-300"
            )}
          >
            <div className="flex items-start gap-3">
              <div className="mt-1">
                {selectedId === address.id ? (
                  <div className="w-5 h-5 rounded-full border-2 border-[#FF6B00] flex items-center justify-center">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#FF6B00]" />
                  </div>
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                )}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    {address.name}
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-sm bg-gray-100 text-gray-600">
                      {address.type}
                    </span>
                  </h3>
                  <button className="text-sm font-semibold text-[#FF6B00]">EDIT</button>
                </div>
                
                <p className="text-sm text-gray-600 leading-relaxed mb-2">
                  {address.addressLine1}
                  {address.addressLine2 && <>, {address.addressLine2}</>}
                  <br />
                  {address.city}, {address.state} - {address.pincode}
                </p>
                <p className="text-sm font-medium text-gray-900">{address.phone}</p>
              </div>
            </div>
          </div>
        ))}

        <button className="w-full flex items-center justify-center gap-2 py-4 border-2 border-dashed border-gray-300 rounded-2xl text-gray-600 font-semibold hover:border-gray-400 hover:text-gray-800 transition-colors">
          <Plus className="w-5 h-5" />
          Add New Address
        </button>
      </div>

      <div className="sticky bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
        <Button 
          onClick={() => router.push('/checkout/delivery')}
          className="w-full h-12 rounded-xl bg-[#FF6B00] hover:bg-[#E66000] text-white font-bold text-lg"
        >
          Deliver to this Address
        </Button>
      </div>
    </div>
  );
}
