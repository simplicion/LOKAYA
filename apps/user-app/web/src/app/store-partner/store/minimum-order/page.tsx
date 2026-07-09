'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function MinimumOrderPage() {
  const router = useRouter();
  
  const [minAmount, setMinAmount] = useState('199');
  
  const [options, setOptions] = useState({
    Pickup: true,
    Delivery: true,
    Both: true,
  });

  const toggleOption = (option: keyof typeof options) => {
    setOptions(prev => ({ ...prev, [option]: !prev[option] }));
  };

  return (
    <div className="flex flex-col min-h-[100dvh] bg-white pb-24">
      {/* Header */}
      <div className="flex items-center p-4 bg-white sticky top-0 z-10 border-b border-gray-100">
        <button onClick={() => router.back()} className="p-2 -ml-2 rounded-full hover:bg-gray-100 text-gray-600">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="flex-1 text-lg font-bold text-center mr-8 text-gray-900">
          Minimum Order
        </h1>
      </div>

      <div className="p-4 space-y-8">
        
        {/* Minimum Order Amount */}
        <div>
          <h3 className="text-sm font-bold text-gray-900 mb-4">Minimum Order Amount</h3>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-900 font-bold">₹</span>
            <input 
              type="number" 
              value={minAmount}
              onChange={(e) => setMinAmount(e.target.value)}
              className="w-full pl-8 pr-4 py-4 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-gray-900 bg-white shadow-sm"
            />
          </div>
          <p className="text-sm text-gray-500 mt-3 leading-relaxed">
            Customers need to add minimum this amount to place an order.
          </p>
        </div>

        {/* Delivery/Pickup Options */}
        <div>
          <h3 className="text-sm font-bold text-gray-900 mb-4">Delivery/Pickup Options</h3>
          <div className="space-y-3">
            {Object.entries(options).map(([option, isActive]) => (
              <label 
                key={option} 
                className="flex items-center gap-3 p-1 cursor-pointer group"
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
                    onChange={() => toggleOption(option as keyof typeof options)} 
                  />
                </div>
                <span className={`font-medium ${isActive ? 'text-gray-900' : 'text-gray-500 group-hover:text-gray-700'}`}>
                  {option}
                </span>
              </label>
            ))}
          </div>
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
