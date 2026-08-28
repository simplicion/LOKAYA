'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, GripVertical, Trash2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ManageCategoriesPage() {
  const router = useRouter();
  
  const [categories, setCategories] = useState([
    { id: '1', name: 'Fruits', order: 1, icon: '🍎' },
    { id: '2', name: 'Vegetables', order: 2, icon: '🥦' },
    { id: '3', name: 'Dairy', order: 3, icon: '🥛' },
    { id: '4', name: 'Snacks', order: 4, icon: '🍪' },
    { id: '5', name: 'Beverages', order: 5, icon: '🥤' },
  ]);

  const deleteCategory = (id: string) => {
    setCategories(prev => prev.filter(c => c.id !== id));
  };

  return (
    <div className="flex flex-col min-h-[100dvh] bg-gray-50 pb-24">
      {/* Header */}
      <div className="flex items-center p-4 bg-white sticky top-0 z-10 border-b border-gray-100">
        <button onClick={() => router.back()} className="p-2 -ml-2 rounded-full hover:bg-gray-100 text-gray-600">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="flex-1 text-lg font-bold text-center mr-8 text-gray-900">
          Manage Categories
        </h1>
      </div>

      <div className="p-4 space-y-4">
        
        {/* Categories List */}
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-gray-100 overflow-hidden flex flex-col">
          {categories.map((cat, idx) => (
            <div
              key={cat.id}
              className={`flex items-center p-4 w-full bg-white transition-colors hover:bg-gray-50 ${
                idx !== categories.length - 1 ? 'border-b border-gray-100' : ''
              }`}
            >
              <div className="text-gray-300 cursor-grab active:cursor-grabbing mr-3 hover:text-gray-500">
                <GripVertical className="w-5 h-5" />
              </div>
              <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center mr-3 text-lg border border-gray-100 shrink-0">
                {cat.icon}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{cat.name}</h3>
                <p className="text-xs text-gray-400">Order: {cat.order}</p>
              </div>
              
              <button 
                onClick={() => deleteCategory(cat.id)}
                className="w-10 h-10 rounded-full flex items-center justify-center text-red-400 hover:bg-red-50 hover:text-red-500 transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ))}
          {categories.length === 0 && (
            <div className="p-8 text-center text-gray-500 text-sm">
              No categories found. Add one!
            </div>
          )}
        </div>
      </div>

      {/* Add Button */}
      <div className="fixed bottom-0 left-0 w-full p-4 bg-white border-t border-gray-100 z-20 pb-safe">
        <Button 
          className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-lg font-medium shadow-[0_4px_14px_0_rgba(79,70,229,0.39)]"
          onClick={() => router.push('/seller/store/categories/add')}
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Category
        </Button>
      </div>
    </div>
  );
}
