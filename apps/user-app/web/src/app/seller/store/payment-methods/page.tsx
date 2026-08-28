'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PaymentMethodsPage() {
  const router = useRouter();
  
  const [acceptOnline, setAcceptOnline] = useState(true);
  const [cashOnPickup, setCashOnPickup] = useState(true);
  
  const [onlineMethods, setOnlineMethods] = useState({
    'UPI': true,
    'Cards': true,
    'Net Banking': true,
    'Wallets': true,
  });

  const [refundPolicy, setRefundPolicy] = useState('Refunds are only applicable for damaged or incorrect items.');

  const toggleMethod = (method: keyof typeof onlineMethods) => {
    setOnlineMethods(prev => ({ ...prev, [method]: !prev[method] }));
  };

  return (
    <div className="flex flex-col min-h-[100dvh] bg-white pb-24">
      {/* Header */}
      <div className="flex items-center p-4 bg-white sticky top-0 z-10 border-b border-gray-100">
        <button onClick={() => router.back()} className="p-2 -ml-2 rounded-full hover:bg-gray-100 text-gray-600">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="flex-1 text-lg font-bold text-center mr-8 text-gray-900">
          Payment Methods
        </h1>
      </div>

      <div className="p-4 space-y-8">
        
        {/* Online Payments Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-gray-900">Accept Online Payments</h3>
            {/* Custom Toggle */}
            <div 
              className={`w-12 h-6 rounded-full flex items-center p-1 cursor-pointer transition-colors ${acceptOnline ? 'bg-indigo-600' : 'bg-gray-300'}`}
              onClick={() => setAcceptOnline(!acceptOnline)}
            >
              <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${acceptOnline ? 'translate-x-6' : 'translate-x-0'}`} />
            </div>
          </div>

          {/* Sub-options for Online Payments */}
          <div className={`transition-all duration-300 overflow-hidden ${acceptOnline ? 'opacity-100 max-h-64' : 'opacity-0 max-h-0'}`}>
            <div className="border border-gray-100 rounded-2xl p-4 space-y-4 shadow-[0_2px_10px_rgb(0,0,0,0.02)]">
              {Object.entries(onlineMethods).map(([method, isActive]) => (
                <label 
                  key={method} 
                  className="flex items-center gap-3 cursor-pointer group"
                >
                  <div 
                    className={`w-6 h-6 rounded-md flex items-center justify-center transition-colors ${
                      isActive ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-2 border-gray-300 group-hover:border-indigo-400'
                    }`}
                  >
                    {isActive && <Check className="w-4 h-4 text-white" />}
                    <input 
                      type="checkbox" 
                      className="hidden" 
                      checked={isActive} 
                      onChange={() => toggleMethod(method as keyof typeof onlineMethods)} 
                    />
                  </div>
                  <span className={`font-medium ${isActive ? 'text-gray-900' : 'text-gray-500 group-hover:text-gray-700'}`}>
                    {method}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="w-full h-px bg-gray-100" />

        {/* Offline Payments Section */}
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-900">Cash on Pickup</h3>
          <div 
            className={`w-12 h-6 rounded-full flex items-center p-1 cursor-pointer transition-colors ${cashOnPickup ? 'bg-indigo-600' : 'bg-gray-300'}`}
            onClick={() => setCashOnPickup(!cashOnPickup)}
          >
            <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${cashOnPickup ? 'translate-x-6' : 'translate-x-0'}`} />
          </div>
        </div>

        {/* Refund Policy */}
        <div>
          <h3 className="text-sm font-bold text-gray-900 mb-2">Refund Policy</h3>
          <textarea
            value={refundPolicy}
            onChange={(e) => setRefundPolicy(e.target.value)}
            placeholder="Enter your refund policy here..."
            className="w-full h-32 p-4 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-gray-700 resize-none"
          />
        </div>

      </div>

      {/* Save Button */}
      <div className="fixed bottom-0 left-0 w-full p-4 bg-white border-t border-gray-100 z-20 pb-safe">
        <Button 
          className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-lg font-medium shadow-[0_4px_14px_0_rgba(79,70,229,0.39)]"
          onClick={() => router.back()}
        >
          Save Changes
        </Button>
      </div>
    </div>
  );
}
