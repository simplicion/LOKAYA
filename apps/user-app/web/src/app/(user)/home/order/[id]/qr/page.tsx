'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, QrCode } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function PickupQRCodePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const orderId = params.id || 'ORD12345';
  
  const [validUntil, setValidUntil] = useState('');

  useEffect(() => {
    // Generate a validity time 2 hours from now for the prototype
    const date = new Date();
    date.setHours(date.getHours() + 2);
    
    const timeString = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    const dateString = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    
    setValidUntil(`${timeString} - ${dateString}`);
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50/50 items-center pt-8 pb-12 px-4">
      {/* Header */}
      <div className="w-full flex items-center relative mb-8">
        <button onClick={() => router.back()} className="absolute left-0 p-2 -ml-2 rounded-full hover:bg-gray-100 text-gray-700 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="w-full text-center font-bold text-[17px] text-gray-900">Pickup QR Code</h1>
      </div>

      <p className="text-gray-600 font-medium text-[15px] mb-6">Show this QR at the store</p>

      {/* QR Code Card */}
      <div className="w-full max-w-sm bg-white rounded-[32px] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 mb-8 flex flex-col items-center">
        
        <div className="w-full flex items-center justify-between mb-8">
          <span className="text-gray-500 text-[13px] font-medium">Order ID</span>
          <span className="font-bold text-gray-900 text-[14px]">#{orderId}</span>
        </div>

        <div className="bg-white p-4 border border-gray-100 rounded-2xl shadow-sm mb-8">
          <QrCode className="w-48 h-48 text-gray-900" strokeWidth={1.5} />
        </div>

        <p className="text-gray-500 text-[13px] font-medium mb-1">Pickup Code</p>
        <h2 className="text-3xl font-black text-gray-900 tracking-wider mb-6">A1B2C3D4</h2>

        <p className="text-gray-400 text-[13px] font-medium text-center">
          Show this code to the store staff
        </p>
      </div>

      <p className="text-gray-500 text-[14px] font-medium">
        Valid till {validUntil || '12:30 PM - 21 May 2024'}
      </p>
    </div>
  );
}
