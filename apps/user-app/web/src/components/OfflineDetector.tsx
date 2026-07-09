'use client';

import React, { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function OfflineDetector() {
  const [isOnline, setIsOnline] = useState<boolean>(true);

  useEffect(() => {
    // Set initial state
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRetry = () => {
    if (navigator.onLine) {
      setIsOnline(true);
    } else {
      // Could also trigger a toast here if still offline
    }
  };

  if (isOnline) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-white z-[9999] flex flex-col items-center justify-center px-6 text-center animate-in fade-in duration-300">
      <div className="relative mb-8">
        {/* Background decorative circles */}
        <div className="absolute inset-0 bg-red-50 rounded-full scale-[2] blur-xl opacity-70"></div>
        <div className="absolute inset-0 bg-red-100 rounded-full scale-[1.2] opacity-50"></div>
        
        {/* Icon */}
        <div className="relative z-10 w-28 h-28 bg-red-50 rounded-full flex items-center justify-center border-4 border-white shadow-xl shadow-red-100/50">
          <WifiOff className="w-12 h-12 text-red-500" strokeWidth={2} />
        </div>
      </div>

      <h1 className="text-2xl font-black text-gray-900 tracking-tight mb-3">
        No Internet Connection
      </h1>
      
      <p className="text-gray-500 text-[15px] max-w-[260px] mx-auto mb-10 leading-relaxed font-medium">
        Please check your internet try again
      </p>

      <div className="w-full max-w-sm mt-auto mb-12">
        <Button 
          onClick={handleRetry}
          className="w-full h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[16px] shadow-[0_8px_30px_rgb(79,70,229,0.25)] transition-all active:scale-[0.98]"
        >
          Retry
        </Button>
      </div>
    </div>
  );
}
