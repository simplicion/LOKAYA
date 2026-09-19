'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  UploadCloud, 
  Trash2, 
  Plus, 
  Minus, 
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { 
  useGetMyStoreQuery,
  useCreateCategoryMutation, 
  useUploadMediaMutation,
  useGetPresignedUrlMutation 
} from '@/lib/api';
import { getMediaUrl } from '@/lib/utils';

export default function AddCategoryPage() {
  const router = useRouter();
  const { data: store, isLoading: isStoreLoading } = useGetMyStoreQuery();
  const [createCategory, { isLoading: isSaving }] = useCreateCategoryMutation();
  const [uploadMedia] = useUploadMediaMutation();
  const [getPresignedUrl] = useGetPresignedUrlMutation();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [displayOrder, setDisplayOrder] = useState(1);
  const [isActive, setIsActive] = useState(true);

  const incrementOrder = () => setDisplayOrder(prev => prev + 1);
  const decrementOrder = () => setDisplayOrder(prev => (prev > 1 ? prev - 1 : 1));

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload a valid image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image size must be less than 10MB');
      return;
    }

    setIsUploading(true);
    try {
      let finalUrl = '';

      try {
        // Direct upload to backend /api/v1/media/upload
        const formData = new FormData();
        formData.append('file', file);
        const res = await uploadMedia(formData).unwrap();
        finalUrl = res.publicUrl || res.url;
      } catch (directErr) {
        console.warn('Direct upload fallback:', directErr);
        // Presigned URL fallback
        const { uploadUrl, signedUrl, publicUrl, fileKey } = await getPresignedUrl({
          filename: `category-${Date.now()}-${file.name}`,
          contentType: file.type,
        }).unwrap();

        const targetUrl = uploadUrl || signedUrl;
        if (targetUrl) {
          await fetch(targetUrl, {
            method: 'PUT',
            body: file,
            headers: { 'Content-Type': file.type },
          });
          finalUrl = getMediaUrl(publicUrl || (fileKey ? `/media/view?key=${encodeURIComponent(fileKey)}` : ''));
        }
      }

      if (finalUrl) {
        setImageUrl(finalUrl);
        toast.success('Category icon uploaded!');
      } else {
        throw new Error('Image upload failed');
      }
    } catch (error) {
      toast.error('Failed to upload image. Please try again.');
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleCreateCategory = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!name.trim()) {
      toast.error('Please enter a category name');
      return;
    }

    if (!store?.id) {
      toast.error('Store profile not found. Please reload.');
      return;
    }

    try {
      await createCategory({
        storeId: store.id,
        name: name.trim(),
        description: description.trim() || undefined,
        imageUrl: imageUrl || null,
        displayOrder,
        isActive,
      }).unwrap();

      toast.success(`Category "${name.trim()}" created successfully!`);

      // Return back to previous page (e.g. Add Product or Manage Categories)
      if (window.history.length > 1) {
        router.back();
      } else {
        router.push('/seller/store/categories');
      }
    } catch (error: any) {
      const msg = error?.data?.message || error?.message || 'Failed to create category';
      toast.error(msg);
      console.error('Create category error:', error);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F8FAFC] pb-32">
      {/* Sticky Navigation Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-200/80 px-4 py-3.5 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full flex items-center justify-center text-gray-700 hover:bg-gray-100 active:scale-95 transition-all"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-base font-bold text-gray-900 leading-tight">Create Category</h1>
            <p className="text-xs text-gray-500 font-medium">Add to your catalog taxonomy</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-100 animate-pulse" />
          <span className="text-xs font-semibold text-gray-600 hidden sm:inline">Active</span>
        </div>
      </header>

      {/* Main Content Form */}
      <main className="max-w-2xl w-full mx-auto p-4 sm:p-6 space-y-6">
        
        {/* Card: Basic Info & Image */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.03)] space-y-5">
          {/* Category Image Upload */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
              Category Icon / Image <span className="text-gray-400 font-normal normal-case">(Optional)</span>
            </label>
            
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <input 
                type="file" 
                id="cat-image-upload" 
                className="hidden" 
                accept="image/*"
                onChange={handleImageUpload}
                disabled={isUploading}
              />
              
              {imageUrl ? (
                <div className="relative group w-28 h-28 rounded-2xl overflow-hidden border-2 border-indigo-500 bg-gray-50 shrink-0 shadow-sm">
                  <img 
                    src={getMediaUrl(imageUrl)} 
                    alt="Category icon" 
                    className="w-full h-full object-cover" 
                  />
                  <button
                    type="button"
                    onClick={() => setImageUrl(null)}
                    className="absolute top-1.5 right-1.5 p-1.5 bg-black/60 hover:bg-red-600 text-white rounded-full transition-colors backdrop-blur-sm"
                    title="Remove image"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <label 
                  htmlFor="cat-image-upload" 
                  className={`w-28 h-28 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all shrink-0
                    ${isUploading ? 'border-indigo-400 bg-indigo-50/50' : 'border-gray-300 hover:border-indigo-500 hover:bg-indigo-50/20 bg-gray-50/60'}`}
                >
                  {isUploading ? (
                    <div className="flex flex-col items-center gap-1.5 text-indigo-600">
                      <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                      <span className="text-[11px] font-semibold">Uploading...</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-gray-500 hover:text-indigo-600">
                      <UploadCloud className="w-7 h-7 stroke-[1.5]" />
                      <span className="text-[11px] font-semibold">Upload Icon</span>
                    </div>
                  )}
                </label>
              )}

              {imageUrl && (
                <div className="text-xs text-gray-500 text-center sm:text-left">
                  <label 
                    htmlFor="cat-image-upload" 
                    className="inline-block text-xs font-bold text-indigo-600 hover:underline cursor-pointer"
                  >
                    Change photo
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* Category Name */}
          <div className="space-y-1.5">
            <label htmlFor="category-name" className="block text-xs font-bold uppercase tracking-wider text-gray-700">
              Category Name <span className="text-red-500">*</span>
            </label>
            <input 
              id="category-name"
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Handcrafted Shawls, Herbal Teas"
              className="w-full px-4 py-3.5 bg-gray-50/50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white text-sm font-semibold text-gray-900 transition-all placeholder:text-gray-400 placeholder:font-normal"
              autoFocus
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label htmlFor="category-desc" className="block text-xs font-bold uppercase tracking-wider text-gray-700">
              Description <span className="text-gray-400 font-normal normal-case">(Optional)</span>
            </label>
            <textarea 
              id="category-desc"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Briefly describe what items fall under this category..."
              className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white text-sm text-gray-900 transition-all placeholder:text-gray-400"
            />
          </div>
        </div>

        {/* Card: Display Order & Status */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.03)] space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Display Sequence</h3>
              <p className="text-xs text-gray-500">Lower numbers appear first in the customer store.</p>
            </div>
            <div className="flex items-center gap-3 bg-gray-50 p-1.5 rounded-xl border border-gray-200">
              <button 
                type="button"
                onClick={decrementOrder}
                disabled={displayOrder <= 1}
                className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-gray-700 hover:bg-gray-100 active:scale-95 disabled:opacity-40 transition-all"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-8 text-center text-base font-bold text-gray-900">{displayOrder}</span>
              <button 
                type="button"
                onClick={incrementOrder}
                className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-gray-700 hover:bg-gray-100 active:scale-95 transition-all"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* Visibility Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Immediate Store Visibility</h3>
              <p className="text-xs text-gray-500">When active, products under this category appear live in store.</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={isActive}
              onClick={() => setIsActive(!isActive)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                isActive ? 'bg-indigo-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  isActive ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

      </main>

      {/* Sticky Bottom Action Bar */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200/80 p-4 z-40 shadow-lg">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSaving}
            className="flex-1 h-13 rounded-xl border-gray-200 text-gray-700 font-semibold hover:bg-gray-50"
          >
            Cancel
          </Button>

          <Button
            type="button"
            onClick={handleCreateCategory}
            disabled={!name.trim() || isUploading || isSaving || isStoreLoading}
            className="flex-[2] h-13 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white rounded-xl font-bold shadow-md shadow-indigo-600/20 transition-all disabled:opacity-50"
          >
            {isSaving ? (
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Creating Category...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5" />
                <span>Create Category</span>
              </div>
            )}
          </Button>
        </div>
      </footer>
    </div>
  );
}
