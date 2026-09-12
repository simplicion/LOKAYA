'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Check, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useGetMyStoreQuery, useUpdateStoreProfileMutation } from '@/lib/api';

const DAY_INDICES: { [key: string]: number } = {
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
  Sunday: 0
};

export default function StoreHoursPage() {
  const router = useRouter();
  const { data: storeData } = useGetMyStoreQuery();
  const [updateStoreProfile, { isLoading: isSaving }] = useUpdateStoreProfileMutation();
  
  const [openTime, setOpenTime] = useState('07:00');
  const [closeTime, setCloseTime] = useState('22:00');
  
  const [days, setDays] = useState({
    Monday: true,
    Tuesday: true,
    Wednesday: true,
    Thursday: true,
    Friday: true,
    Saturday: true,
    Sunday: true,
  });

  useEffect(() => {
    if (storeData) {
      if (storeData.openingTime) setOpenTime(storeData.openingTime);
      if (storeData.closingTime) setCloseTime(storeData.closingTime);
      if (Array.isArray(storeData.workingDays) && storeData.workingDays.length > 0) {
        const workingSet = new Set(storeData.workingDays);
        setDays({
          Monday: workingSet.has(1),
          Tuesday: workingSet.has(2),
          Wednesday: workingSet.has(3),
          Thursday: workingSet.has(4),
          Friday: workingSet.has(5),
          Saturday: workingSet.has(6),
          Sunday: workingSet.has(0),
        });
      }
    }
  }, [storeData]);

  const toggleDay = (day: keyof typeof days) => {
    setDays(prev => ({ ...prev, [day]: !prev[day] }));
  };

  const handleSave = async () => {
    if (!storeData?.id) {
      toast.error('Store information not found');
      return;
    }

    const workingDaysArray = Object.entries(days)
      .filter(([_, isActive]) => isActive)
      .map(([dayName]) => DAY_INDICES[dayName]);

    try {
      await updateStoreProfile({
        storeId: storeData.id,
        body: {
          openingTime: openTime,
          closingTime: closeTime,
          workingDays: workingDaysArray
        }
      }).unwrap();

      toast.success('Store hours updated successfully!');
      router.back();
    } catch (err: any) {
      console.error('Failed to update store hours:', err);
      toast.error(err?.data?.message || 'Failed to update store hours');
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white pb-32">
      {/* Header */}
      <div className="flex items-center p-4 bg-white sticky top-0 z-20 border-b border-gray-100">
        <button 
          onClick={() => router.back()} 
          className="p-2 -ml-2 rounded-full hover:bg-gray-100 text-gray-600 transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="flex-1 text-lg font-bold text-center mr-8 text-gray-900">
          Store Hours
        </h1>
      </div>

      <div className="max-w-lg w-full mx-auto p-4 sm:p-6 space-y-8">
        
        {/* Store Timings */}
        <div className="bg-gray-50/60 p-5 rounded-2xl border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-indigo-600" />
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Store Timings</h3>
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-gray-600 mb-2">Opening Time</label>
              <input 
                type="time" 
                value={openTime}
                onChange={(e) => setOpenTime(e.target.value)}
                className="w-full p-3.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-semibold text-gray-900 bg-white shadow-sm"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-semibold text-gray-600 mb-2">Closing Time</label>
              <input 
                type="time" 
                value={closeTime}
                onChange={(e) => setCloseTime(e.target.value)}
                className="w-full p-3.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-semibold text-gray-900 bg-white shadow-sm"
              />
            </div>
          </div>
        </div>

        {/* Working Days */}
        <div>
          <h3 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wider">Working Days</h3>
          <div className="space-y-1.5 border border-gray-100 rounded-2xl p-2 bg-white shadow-sm">
            {Object.entries(days).map(([day, isActive]) => (
              <label 
                key={day} 
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 cursor-pointer active:bg-gray-100 transition-colors"
              >
                <div 
                  className={`w-6 h-6 rounded-md flex items-center justify-center transition-all ${
                    isActive ? 'bg-indigo-600 border-indigo-600 shadow-sm' : 'bg-white border-2 border-gray-300'
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
                <span className={`font-semibold text-sm ${isActive ? 'text-gray-900' : 'text-gray-500'}`}>
                  {day}
                </span>
              </label>
            ))}
          </div>
        </div>

      </div>

      {/* Save Button - Positioned unobstructed without bottom nav interference */}
      <div className="fixed bottom-0 left-0 right-0 md:left-64 p-4 bg-white/95 backdrop-blur-md border-t border-gray-100 z-30 pb-safe shadow-lg flex justify-center">
        <div className="w-full max-w-lg">
          <Button 
            className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white rounded-2xl text-lg font-bold shadow-md shadow-indigo-500/20 transition-all disabled:opacity-50"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Saving Changes...</span>
              </div>
            ) : (
              'Save Changes'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
