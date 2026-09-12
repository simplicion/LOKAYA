'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Upload, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGetProductByIdQuery, useUpdateProductMutation } from '@/lib/api';

export default function EditProductClient({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { data: productData, isLoading } = useGetProductByIdQuery(params.id);
  const [updateProduct, { isLoading: isSaving }] = useUpdateProductMutation();

  const [saved, setSaved] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    mrp: 0,
    price: 0,
    stock: 0,
  });

  useEffect(() => {
    if (productData) {
      setFormData({
        name: productData.name || '',
        category: productData.categoryModel?.name || productData.category || '',
        mrp: productData.mrp || 0,
        price: productData.sellingPrice || 0,
        stock: productData.stockCount || 0,
      });
    }
  }, [productData]);

  const handleSave = async () => {
    try {
      await updateProduct({
        productId: params.id,
        body: {
          name: formData.name,
          category: formData.category,
          mrp: Number(formData.mrp),
          sellingPrice: Number(formData.price),
          stockCount: Number(formData.stock)
        }
      }).unwrap();
      setSaved(true);
      setTimeout(() => {
        router.back();
      }, 1500);
    } catch (err) {
      console.error('Failed to update product:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[100dvh] bg-white items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#FF5A36]" />
      </div>
    );
  }

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
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <input 
              type="text" 
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">MRP (₹)</label>
              <input 
                type="number" 
                value={formData.mrp}
                onChange={(e) => setFormData({...formData, mrp: Number(e.target.value)})}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Selling Price (₹)</label>
              <input 
                type="number" 
                value={formData.price}
                onChange={(e) => setFormData({...formData, price: Number(e.target.value)})}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Stock Count</label>
            <input 
              type="number" 
              value={formData.stock}
              onChange={(e) => setFormData({...formData, stock: Number(e.target.value)})}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Footer Fixed Action Button */}
      <div className="fixed bottom-0 left-0 w-full p-4 bg-white border-t border-gray-100 z-20 pb-safe">
        <Button 
          className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-lg font-medium"
          onClick={handleSave}
          disabled={isSaving || !formData.name.trim()}
        >
          {isSaving ? 'Saving Changes...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}
