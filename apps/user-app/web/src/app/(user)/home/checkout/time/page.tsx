'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ChoosePickupTimePage() {
  const router = useRouter();
  const [selectedTime, setSelectedTime] = useState('asap');

  const timeSlots = [
    { id: 'asap', label: 'ASAP (10-15 mins)', tag: 'FREE' },
    { id: 'today-1', label: 'Today, 1:00 PM - 2:00 PM' },
    { id: 'today-2', label: 'Today, 2:00 PM - 3:00 PM' },
    { id: 'today-3', label: 'Today, 3:00 PM - 4:00 PM' },
    { id: 'tomorrow-1', label: 'Tomorrow, 10:00 AM - 11:00 AM' },
  ];

  const handleConfirm = () => {
    // In a real app we'd save this to global state or context
    // For now we just proceed to the checkout screen
    router.push('/home/checkout');
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Header */}
      <div className="flex items-center justify-center py-4 relative px-4 sticky top-0 bg-white z-50">
        <button onClick={() => router.back()} className="absolute left-4 p-2 -ml-2 rounded-full hover:bg-gray-50 text-gray-700">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-bold text-[17px] text-gray-900">Choose Pickup Time</h1>
      </div>

      <div className="px-5 mt-6 pb-32">
        <h2 className="text-xl font-bold text-gray-900 text-center mb-2">Select Pickup Time</h2>
        <p className="text-gray-500 text-sm text-center mb-8">Choose a convenient time to pick up your order</p>

        <div className="flex flex-col gap-4">
          {timeSlots.map((slot) => (
            <label 
              key={slot.id} 
              className={`flex items-center justify-between p-4 rounded-2xl border transition-colors cursor-pointer ${
                selectedTime === slot.id 
                  ? 'border-indigo-600 bg-indigo-50/30' 
                  : 'border-gray-100 hover:border-gray-200 bg-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-full border-[6px] flex-shrink-0 ${
                  selectedTime === slot.id 
                    ? 'border-indigo-600 bg-white' 
                    : 'border-gray-200 bg-white'
                }`} />
                <span className={`text-[15px] ${selectedTime === slot.id ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>
                  {slot.label}
                </span>
              </div>
              {slot.tag && (
                <span className="font-bold text-gray-900 text-[13px]">{slot.tag}</span>
              )}
              <input 
                type="radio" 
                name="pickupTime" 
                value={slot.id}
                checked={selectedTime === slot.id}
                onChange={() => setSelectedTime(slot.id)}
                className="hidden"
              />
            </label>
          ))}
        </div>
      </div>

      {/* Fixed Bottom Button */}
      <div className="fixed bottom-[20px] left-4 right-4 z-40">
        <Button 
          onClick={handleConfirm} 
          className="w-full h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-lg shadow-[0_8px_30px_rgb(79,70,229,0.2)] transition-all active:scale-[0.98]"
        >
          Confirm Time
        </Button>
      </div>
    </div>
  );
}
