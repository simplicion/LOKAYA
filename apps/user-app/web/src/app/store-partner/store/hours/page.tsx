'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function StoreHoursPage() {
  const router = useRouter();
  
  const [openTime, setOpenTime] = useState('07:00');
  const [closeTime, setCloseTime] = useState('22:00'); // 10:00 PM
  
  const [days, setDays] = useState({
    Monday: true,
    Tuesday: true,
    Wednesday: true,
    Thursday: true,
    Friday: true,
    Saturday: true,
    Sunday: true,
  });

  const toggleDay = (day: keyof typeof days) => {
    setDays(prev => ({ ...prev, [day]: !prev[day] }));
  };

  return (
    <div className="flex flex-col min-h-[100dvh] bg-white pb-24">
      {/* Header */}
      <div className="flex items-center p-4 bg-white sticky top-0 z-10 border-b border-gray-100">
        <button onClick={() => router.back()} className="p-2 -ml-2 rounded-full hover:bg-gray-100 text-gray-600">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="flex-1 text-lg font-bold text-center mr-8 text-gray-900">
          Store Hours
        </h1>
      </div>

      <div className="p-4 space-y-8">
        
        {/* Store Timings */}
        <div>
          <h3 className="text-sm font-bold text-gray-900 mb-4">Store Timings</h3>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-500 mb-2">Opening Time</label>
              <input 
                type="time" 
                value={openTime}
                onChange={(e) => setOpenTime(e.target.value)}
                className="w-full p-4 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-gray-900 bg-white"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-500 mb-2">Closing Time</label>
              <input 
                type="time" 
                value={closeTime}
                onChange={(e) => setCloseTime(e.target.value)}
                className="w-full p-4 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-gray-900 bg-white"
              />
            </div>
          </div>
        </div>

        {/* Working Days */}
        <div>
          <h3 className="text-sm font-bold text-gray-900 mb-4">Working Days</h3>
          <div className="space-y-1">
            {Object.entries(days).map(([day, isActive]) => (
              <label 
                key={day} 
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 cursor-pointer active:bg-gray-100 transition-colors"
              >
                <div 
                  className={`w-6 h-6 rounded-md flex items-center justify-center transition-colors ${
                    isActive ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-2 border-gray-300'
                  }`}
                >
                  {isActive && <Check className="w-4 h-4 text-white" />}
                  <input 
                    type="checkbox" 
                    className="hidden" 
                    checked={isActive} 
                    onChange={() => toggleDay(day as keyof typeof days)} 
                  />
                </div>
                <span className={`font-medium ${isActive ? 'text-gray-900' : 'text-gray-500'}`}>
                  {day}
                </span>
              </label>
            ))}
          </div>
        </div>

      </div>

      {/* Save Button */}
      <div className="fixed bottom-0 left-0 w-full p-4 bg-white border-t border-gray-100 z-20 pb-safe">
        <Button 
          className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-lg font-medium"
          onClick={() => router.back()}
        >
          Save Changes
        </Button>
      </div>
    </div>
  );
}
