'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Minus, Plus, Upload, X, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useCreateCategoryMutation, useGetPresignedUrlMutation, useGetMyStoreQuery } from '@/lib/api';

export default function AddCategoryPage() {
  const router = useRouter();
  const { data: store } = useGetMyStoreQuery();
  const [createCategory, { isLoading: isSaving }] = useCreateCategoryMutation();
  const [getPresignedUrl] = useGetPresignedUrlMutation();
  
  const [name, setName] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [displayOrder, setDisplayOrder] = useState(1);

  const incrementOrder = () => setDisplayOrder(prev => prev + 1);
  const decrementOrder = () => setDisplayOrder(prev => (prev > 1 ? prev - 1 : 1));

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const presignedResponse = await getPresignedUrl({
        filename: file.name,
        contentType: file.type,
      }).unwrap();
      
      await fetch(presignedResponse.uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });
      
      setImageUrl(presignedResponse.publicUrl);
    } catch (error) {
      toast.error('Failed to upload image');
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    if (!store?.id) {
      toast.error("Store not found");
      return;
    }
    
    try {
      await createCategory({
        storeId: store.id,
        name,
        imageUrl,
        displayOrder,
      }).unwrap();
      
      toast.success('Category created successfully!');
      router.back();
    } catch (error) {
      toast.error('Failed to create category');
      console.error(error);
    }
  };

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
        
        {/* Category Input Area with Image Upload */}
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <input 
              type="file" 
              id="category-image" 
              className="hidden" 
              accept="image/*"
              onChange={handleImageUpload}
              disabled={isUploading}
            />
            <label 
              htmlFor="category-image"
              className={`w-16 h-16 rounded-xl border-2 flex items-center justify-center cursor-pointer overflow-hidden transition-all
                ${imageUrl ? 'border-indigo-500' : 'border-dashed border-gray-300 hover:border-indigo-400 bg-gray-50'}`}
            >
              {isUploading ? (
                <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              ) : imageUrl ? (
                <img src={imageUrl} alt="Category" className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center justify-center text-gray-400">
                  <ImageIcon className="w-6 h-6 mb-1" />
                </div>
              )}
            </label>
          </div>
          
          <div className="flex-1">
            <label className="block text-sm font-bold text-gray-900 mb-2">Category Name</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Fresh Fruits"
              className="w-full p-4 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-gray-900 bg-white shadow-sm h-16"
            />
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

      </div>

      {/* Save Button */}
      <div className="fixed bottom-0 left-0 w-full p-4 bg-white border-t border-gray-100 z-20 pb-safe">
        <Button 
          className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-lg font-medium shadow-[0_4px_14px_0_rgba(79,70,229,0.39)]"
          onClick={handleSave}
          disabled={!name.trim() || isUploading || isSaving}
        >
          {isSaving ? (
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            'Save Category'
          )}
        </Button>
      </div>
    </div>
  );
}
