'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

const PRESET_ICONS = [
  '🍎', '🥦', '🥛', '🍪', '🥤', '🍞', '🥩', '🥚',
  '🧴', '🧼', '🧹', '🪴', '🎁', '🐶', '👶', '🛍️',
];

export default function AddCategoryPage() {
  const router = useRouter();
  
  const [name, setName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('🍎');
  const [displayOrder, setDisplayOrder] = useState(1);
  const [isActive, setIsActive] = useState(true);

  const incrementOrder = () => setDisplayOrder(prev => prev + 1);
  const decrementOrder = () => setDisplayOrder(prev => (prev > 1 ? prev - 1 : 1));

  return (
    <div className="flex flex-col min-h-[100dvh] bg-white pb-24">
      {/* Header */}
      <div className="flex items-center p-4 bg-white sticky top-0 z-10 border-b border-gray-100">
        <button onClick={() => router.back()} className="p-2 -ml-2 rounded-full hover:bg-gray-100 text-gray-600">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="flex-1 text-lg font-bold text-center mr-8 text-gray-900">
          Add Category
        </h1>
      </div>

      <div className="p-4 space-y-6">
        
        {/* Category Name */}
        <div>
          <label className="block text-sm font-bold text-gray-900 mb-2">Category Name</label>
          <input 
            type="text" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Fresh Fruits"
            className="w-full p-4 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-gray-900 bg-white shadow-sm"
          />
        </div>

        {/* Category Icon */}
        <div>
          <label className="block text-sm font-bold text-gray-900 mb-2">Category Icon</label>
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 p-4 border border-gray-100 rounded-2xl bg-gray-50 shadow-inner">
            {PRESET_ICONS.map(icon => (
              <button
                key={icon}
                onClick={() => setSelectedIcon(icon)}
                className={`w-12 h-12 rounded-xl text-2xl flex items-center justify-center transition-all ${
                  selectedIcon === icon 
                    ? 'bg-white shadow-[0_4px_10px_rgb(0,0,0,0.1)] border-2 border-indigo-500 scale-110 z-10' 
                    : 'bg-transparent border-2 border-transparent hover:bg-gray-200 opacity-60'
                }`}
              >
                {icon}
              </button>
            ))}
          </div>
        </div>

        {/* Display Order */}
        <div>
          <label className="block text-sm font-bold text-gray-900 mb-2">Display Order</label>
          <div className="flex items-center justify-between p-2 border border-gray-200 rounded-xl shadow-sm max-w-[200px]">
            <button 
              onClick={decrementOrder}
              disabled={displayOrder <= 1}
              className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center text-gray-600 hover:bg-gray-100 active:bg-gray-200 disabled:opacity-50"
            >
              <Minus className="w-5 h-5" />
            </button>
            <span className="text-xl font-bold text-gray-900">{displayOrder}</span>
            <button 
              onClick={incrementOrder}
              className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center text-gray-600 hover:bg-gray-100 active:bg-gray-200"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">Lower numbers appear first on the store page.</p>
        </div>

        {/* Status Toggle */}
        <div className="flex items-center justify-between p-4 border border-gray-100 rounded-xl shadow-[0_2px_10px_rgb(0,0,0,0.02)]">
          <div>
            <h3 className="text-sm font-bold text-gray-900">Category Status</h3>
            <p className="text-xs text-gray-500 mt-0.5">{isActive ? 'Visible to customers' : 'Hidden from customers'}</p>
          </div>
          <div 
            className={`w-12 h-6 rounded-full flex items-center p-1 cursor-pointer transition-colors ${isActive ? 'bg-indigo-600' : 'bg-gray-300'}`}
            onClick={() => setIsActive(!isActive)}
          >
            <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${isActive ? 'translate-x-6' : 'translate-x-0'}`} />
          </div>
        </div>

      </div>

      {/* Save Button */}
      <div className="fixed bottom-0 left-0 w-full p-4 bg-white border-t border-gray-100 z-20 pb-safe">
        <Button 
          className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-lg font-medium shadow-[0_4px_14px_0_rgba(79,70,229,0.39)]"
          onClick={() => router.back()}
          disabled={!name.trim()}
        >
          Save Category
        </Button>
      </div>
    </div>
  );
}
