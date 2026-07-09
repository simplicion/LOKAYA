'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Upload, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Shared mock data for demonstration
const MOCK_PRODUCTS: Record<string, any> = {
  '1': {
    name: 'Fortune Sunlite Oil (1L)',
    category: 'Edible Oil',
    mrp: 185,
    price: 165,
    stock: 5,
    image: 'https://images.unsplash.com/photo-1625937286074-9ca519d5d9df?auto=format&fit=crop&q=80&w=200&h=200'
  },
  '2': {
    name: 'Aashirvaad Atta (5kg)',
    category: 'Flour',
    mrp: 320,
    price: 295,
    stock: 20,
    image: 'https://images.unsplash.com/photo-1574316071802-0d684efa7ab5?auto=format&fit=crop&q=80&w=200&h=200'
  }
};

export default function EditProductClient({ params }: { params: { id: string } }) {
  const router = useRouter();
  const product = MOCK_PRODUCTS[params.id] || MOCK_PRODUCTS['1'];

  const [saved, setSaved] = useState(false);
  const [formData, setFormData] = useState({
    name: product.name,
    category: product.category,
    mrp: product.mrp,
    price: product.price,
    stock: product.stock,
  });

  const handleSave = () => {
    // In a real app, make API call here
    setSaved(true);
    setTimeout(() => {
      router.back();
    }, 1500);
  };

  if (saved) {
    return (
      <div className="flex flex-col h-[100dvh] bg-white items-center justify-center p-6 text-center">
        <CheckCircle2 className="w-16 h-16 text-green-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Product Updated!</h2>
        <p className="text-gray-500">Changes to {formData.name} have been saved successfully.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[100dvh] bg-white pb-24 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center p-4 bg-white sticky top-0 z-10 border-b border-gray-100">
        <button onClick={() => router.back()} className="p-2 -ml-2 rounded-full hover:bg-gray-100 text-gray-600 transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="flex-1 text-lg font-bold text-center mr-8 text-gray-900">
          Edit Product
        </h1>
      </div>

      {/* Content Area */}
      <div className="flex-1 p-4 flex flex-col">
        <div className="space-y-4 pt-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
            <input 
              type="text" 
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" 
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select 
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
              className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option>Flour</option>
              <option>Edible Oil</option>
              <option>Pulses & Dals</option>
              <option>Snacks</option>
              <option>Grocery</option>
            </select>
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">MRP</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">₹</span>
                <input 
                  type="number" 
                  value={formData.mrp}
                  onChange={(e) => setFormData({...formData, mrp: Number(e.target.value)})}
                  className="w-full pl-8 p-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" 
                />
              </div>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Selling Price</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">₹</span>
                <input 
                  type="number" 
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: Number(e.target.value)})}
                  className="w-full pl-8 p-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" 
                />
              </div>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Stock Quantity</label>
            <input 
              type="number" 
              value={formData.stock}
              onChange={(e) => setFormData({...formData, stock: Number(e.target.value)})}
              className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" 
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Product Image</label>
            <div className="w-full h-40 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center text-gray-500 bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors relative overflow-hidden">
              {product.image ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={product.image} alt="Preview" className="absolute inset-0 w-full h-full object-contain p-2" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                     <span className="text-white font-medium flex items-center gap-2"><Upload className="w-4 h-4" /> Change Image</span>
                  </div>
                </>
              ) : (
                <>
                  <Upload className="w-6 h-6 mb-2 text-blue-500" />
                  <span className="text-sm font-medium text-blue-600">Upload Image</span>
                </>
              )}
            </div>
          </div>

          <div className="fixed bottom-0 left-0 w-full p-4 bg-white border-t border-gray-100 z-10 pb-safe">
            <Button 
              className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-lg font-medium shadow-md shadow-blue-200"
              onClick={handleSave}
            >
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
