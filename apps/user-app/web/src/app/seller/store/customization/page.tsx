'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Search, Moon, Edit2, Bell, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGetMyStoreQuery, useUpdateStoreThemeMutation } from '@/lib/api';
import Image from 'next/image';

const PRIMARY_COLORS = [
  'bg-[#6366f1]', // Indigo (Default)
  'bg-[#8b5cf6]', // Violet
  'bg-[#f43f5e]', // Rose
  'bg-[#f59e0b]', // Amber
  'bg-[#84cc16]', // Lime
  'bg-[#10b981]', // Emerald
  'bg-[#0ea5e9]', // Sky
  'bg-[#3b82f6]', // Blue
];

const SECONDARY_COLORS = [
  'bg-[#fcd34d]', // Yellow/Amber light
  'bg-[#bef264]', // Lime light
  'bg-[#7dd3fc]', // Sky light
  'bg-[#60a5fa]', // Blue light
  'bg-[#a78bfa]', // Violet light
  'bg-[#fb7185]', // Rose light
  'bg-[#1e293b]', // Slate dark
  'bg-[#f3f4f6]', // Gray light (Custom picker placeholder)
];

export default function StoreCustomizationPage() {
  const router = useRouter();
  const { data: storeData } = useGetMyStoreQuery();
  const [updateTheme, { isLoading: isUpdating }] = useUpdateStoreThemeMutation();

  const [primaryColor, setPrimaryColor] = useState(PRIMARY_COLORS[0]);
  const [secondaryColor, setSecondaryColor] = useState(SECONDARY_COLORS[0]);

  React.useEffect(() => {
    if (storeData) {
      if (storeData.themeColor) setPrimaryColor(storeData.themeColor);
      if (storeData.secondaryColor) setSecondaryColor(storeData.secondaryColor);
    }
  }, [storeData]);

  const handleSaveTheme = async () => {
    if (!storeData?.id) return;
    try {
      await updateTheme({
        storeId: storeData.id,
        body: { themeColor: primaryColor, secondaryColor }
      }).unwrap();
      router.back();
    } catch (err) {
      console.error('Failed to save theme:', err);
    }
  };

  // Map Tailwind bg classes to actual hex/rgb for the gradient background
  // For a simple implementation, we can just use tailwind from-X to-Y if we map them,
  // but since we store arbitrary classes, we'll use a trick or just solid background in preview for primary,
  // or use inline styles for true dynamic gradients. For the mockup, we will just use the selected class as a solid background.
  // Wait, the preview in screenshot uses a gradient. We can extract the hex if needed, 
  // but let's just use the selected bg color as the main background of the preview card.

  return (
    <div className="flex flex-col min-h-[100dvh] bg-white pb-32">
      {/* Header */}
      <div className="flex items-center p-4 bg-white sticky top-0 z-10 border-b border-gray-100">
        <button onClick={() => router.back()} className="p-2 -ml-2 rounded-full hover:bg-gray-100 text-gray-600">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="flex-1 text-lg font-bold text-center mr-8 text-gray-900">
          Store Customization
        </h1>
      </div>

      <div className="p-4 space-y-8">
        
        {/* Primary Color Picker */}
        <div>
          <h3 className="text-sm font-bold text-gray-900 mb-3">Primary Color</h3>
          <div className="flex flex-wrap gap-3">
            {PRIMARY_COLORS.map(color => (
              <button
                key={color}
                onClick={() => setPrimaryColor(color)}
                className={`w-10 h-10 rounded-xl ${color} shadow-sm transition-transform active:scale-95 flex items-center justify-center`}
              >
                {primaryColor === color && <div className="w-4 h-4 bg-white rounded-full opacity-30" />}
              </button>
            ))}
          </div>
        </div>

        {/* Secondary Color Picker */}
        <div>
          <h3 className="text-sm font-bold text-gray-900 mb-3">Secondary Color</h3>
          <div className="flex flex-wrap gap-3">
            {SECONDARY_COLORS.map((color, idx) => (
              <button
                key={color}
                onClick={() => setSecondaryColor(color)}
                className={`w-10 h-10 rounded-xl ${color} shadow-sm transition-transform active:scale-95 flex items-center justify-center border ${color === 'bg-[#f3f4f6]' ? 'border-gray-300' : 'border-transparent'}`}
              >
                {secondaryColor === color && <div className="w-4 h-4 bg-black rounded-full opacity-30" />}
                {/* Last item represents custom color picker icon in mockup */}
                {idx === SECONDARY_COLORS.length - 1 && secondaryColor !== color && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Theme Preview */}
        <div>
          <h3 className="text-sm font-bold text-gray-900 mb-3">Theme Preview</h3>
          
          <div className="border border-gray-100 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] overflow-hidden bg-white">
            {/* Store Header Preview */}
            <div className={`p-5 ${primaryColor} transition-colors duration-300`}>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-green-600 border-2 border-white/20 flex items-center justify-center overflow-hidden shrink-0">
                  <span className="text-white font-bold text-xs text-center leading-tight">
                    {storeData?.name ? storeData.name.slice(0, 6).toUpperCase() : 'STORE'}
                  </span>
                </div>
                <div className="flex-1 text-white">
                  <h4 className="font-bold text-base leading-tight">{storeData?.name || 'Your Store'}</h4>
                  <p className="text-xs text-white/80 mt-0.5">{storeData?.description || storeData?.category || 'Neighborhood Store'}</p>
                </div>
                <div className="flex gap-2 text-white/80">
                  <Moon className="w-4 h-4" />
                  <Edit2 className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* Search Bar Preview */}
            <div className="px-4 py-3 -mt-3 relative z-10 bg-white rounded-t-xl">
              <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5">
                <Search className="w-4 h-4 text-gray-400 mr-2" />
                <span className="text-sm text-gray-400 flex-1">Search products...</span>
                <div className={`w-6 h-6 rounded-md ${secondaryColor} flex items-center justify-center transition-colors duration-300`}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={secondaryColor === 'bg-[#1e293b]' ? 'text-white' : 'text-gray-800'}><path d="M3 6h18M6 12h12M10 18h4"/></svg>
                </div>
              </div>
            </div>

            {/* Categories Preview */}
            <div className="flex justify-between px-5 pb-5 pt-2">
              {[
                { name: 'Fruits', emoji: '🍎' },
                { name: 'Veggies', emoji: '🥦' },
                { name: 'Dairy', emoji: '🥛' },
                { name: 'Snacks', emoji: '🍪' },
                { name: 'More', emoji: '🛍️' },
              ].map(cat => (
                <div key={cat.name} className="flex flex-col items-center gap-1.5">
                  <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-lg shadow-sm">
                    {cat.emoji}
                  </div>
                  <span className="text-[10px] font-medium text-gray-600">{cat.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="fixed bottom-0 left-0 w-full p-4 bg-white border-t border-gray-100 z-20 pb-safe">
        <Button 
          className={`w-full h-14 text-white rounded-2xl text-lg font-medium transition-colors ${primaryColor.replace('bg-', 'bg-').replace(']', ']').replace('[', '[')}`}
          style={{ backgroundColor: primaryColor.includes('#') ? primaryColor.match(/#([0-9a-f]{6})/i)?.[0] : undefined }}
          onClick={handleSaveTheme}
          disabled={isUpdating}
        >
          {isUpdating ? 'Saving Theme...' : 'Save Theme'}
        </Button>
      </div>
    </div>
  );
}
