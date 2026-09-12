'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, GripVertical, Trash2, Plus, X, Minus, Image as ImageIcon, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { 
  useGetMyStoreQuery,
  useGetStoreCategoriesQuery,
  useCreateCategoryMutation, 
  useUpdateCategoryMutation,
  useGetPresignedUrlMutation,
  useUploadMediaMutation,
  useDeleteCategoryMutation
} from '@/lib/api';
import { getMediaUrl } from '@/lib/utils';

export default function ManageCategoriesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const { data: store } = useGetMyStoreQuery();
  const { data: categories = [], isLoading } = useGetStoreCategoriesQuery(store?.id ?? '', {
    skip: !store?.id
  });
  
  const [deleteCategory] = useDeleteCategoryMutation();

  // Bottom Sheet State
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any | null>(null);
  
  // Auto-open if query param exists
  useEffect(() => {
    if (searchParams.get('add') === 'true') {
      handleOpenAdd();
    }
  }, [searchParams]);
  
  // Category Mutations & State
  const [createCategory, { isLoading: isCreating }] = useCreateCategoryMutation();
  const [updateCategory, { isLoading: isUpdating }] = useUpdateCategoryMutation();
  const [uploadMedia] = useUploadMediaMutation();
  const [getPresignedUrl] = useGetPresignedUrlMutation();
  const [name, setName] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [displayOrder, setDisplayOrder] = useState(1);

  const isSaving = isCreating || isUpdating;

  const handleOpenAdd = () => {
    setEditingCategory(null);
    setName('');
    setImageUrl(null);
    setDisplayOrder(categories.length + 1);
    setIsAddSheetOpen(true);
  };

  const handleOpenEdit = (cat: any) => {
    setEditingCategory(cat);
    setName(cat.name || '');
    setImageUrl(cat.imageUrl || null);
    setDisplayOrder(cat.displayOrder || 1);
    setIsAddSheetOpen(true);
  };

  const handleCloseSheet = () => {
    setIsAddSheetOpen(false);
    setEditingCategory(null);
    setName('');
    setImageUrl(null);
    setDisplayOrder(1);
  };

  const incrementOrder = () => setDisplayOrder(prev => prev + 1);
  const decrementOrder = () => setDisplayOrder(prev => (prev > 1 ? prev - 1 : 1));

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    try {
      await deleteCategory(id).unwrap();
      toast.success('Category deleted');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to delete category');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      let finalUrl = '';

      try {
        const formData = new FormData();
        formData.append('file', file);
        const res = await uploadMedia(formData).unwrap();
        finalUrl = res.publicUrl || res.url;
      } catch (directErr) {
        console.warn('Direct upload fallback:', directErr);
        const { uploadUrl, signedUrl, publicUrl, fileKey } = await getPresignedUrl({
          filename: `cat-${Date.now()}-${file.name}`,
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
        toast.success('Image uploaded successfully');
      } else {
        throw new Error('Could not upload image');
      }
    } catch (error) {
      toast.error('Failed to upload image');
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Please enter a category name');
      return;
    }

    if (editingCategory) {
      try {
        await updateCategory({
          categoryId: editingCategory.id,
          body: {
            name: name.trim(),
            imageUrl: imageUrl || null,
            displayOrder,
          }
        }).unwrap();

        toast.success('Category updated successfully!');
        handleCloseSheet();
      } catch (error: any) {
        toast.error(error?.data?.message || 'Failed to update category');
        console.error(error);
      }
    } else {
      if (!store?.id) {
        toast.error("Store not found");
        return;
      }
      
      try {
        await createCategory({
          storeId: store.id,
          name: name.trim(),
          imageUrl: imageUrl || null,
          displayOrder,
        }).unwrap();
        
        toast.success('Category created successfully!');
        handleCloseSheet();
      } catch (error: any) {
        toast.error(error?.data?.message || 'Failed to create category');
        console.error(error);
      }
    }
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
          {isLoading ? (
            <div className="p-8 text-center text-gray-500 text-sm">Loading categories...</div>
          ) : categories.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-sm">
              No categories found. Add one!
            </div>
          ) : (
            categories.map((cat: any, idx: number) => (
              <div
                key={cat.id}
                className={`flex items-center p-4 w-full bg-white transition-colors hover:bg-gray-50 ${
                  idx !== categories.length - 1 ? 'border-b border-gray-100' : ''
                }`}
              >
                <div className="text-gray-300 cursor-grab active:cursor-grabbing mr-3 hover:text-gray-500">
                  <GripVertical className="w-5 h-5" />
                </div>
                
                {/* Clickable Category Info (opens edit) */}
                <div 
                  onClick={() => handleOpenEdit(cat)}
                  className="flex items-center flex-1 min-w-0 cursor-pointer group pr-2"
                >
                  <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center mr-3 text-lg border border-gray-100 shrink-0 overflow-hidden group-hover:border-indigo-200 transition-colors">
                    {cat.imageUrl ? (
                      <img src={getMediaUrl(cat.imageUrl)} alt={cat.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-gray-400 font-bold">{cat.name.charAt(0)}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate group-hover:text-indigo-600 transition-colors">
                      {cat.name}
                    </h3>
                    <p className="text-xs text-gray-400">Order: {cat.displayOrder || idx + 1}</p>
                  </div>
                </div>
                
                {/* Actions: Edit and Delete */}
                <div className="flex items-center gap-1 shrink-0">
                  <button 
                    type="button"
                    onClick={() => handleOpenEdit(cat)}
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-500 hover:bg-indigo-50 hover:text-indigo-600 active:scale-95 transition-all"
                    title="Edit category"
                    aria-label={`Edit ${cat.name}`}
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  <button 
                    type="button"
                    onClick={() => handleDeleteCategory(cat.id)}
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-500 active:scale-95 transition-all"
                    title="Delete category"
                    aria-label={`Delete ${cat.name}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add Button */}
      <div className="fixed bottom-0 left-0 w-full p-4 bg-white border-t border-gray-100 z-20 pb-safe">
        <Button 
          className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-lg font-medium shadow-[0_4px_14px_0_rgba(79,70,229,0.39)]"
          onClick={handleOpenAdd}
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Category
        </Button>
      </div>

      {/* Add Category Bottom Sheet Overlay */}
      {isAddSheetOpen && (
        <div className="fixed inset-0 z-[70] flex justify-center">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={handleCloseSheet}
          />
          
          {/* Sheet */}
          <div className="absolute bottom-0 w-full max-w-md bg-white rounded-t-3xl shadow-2xl animate-in slide-in-from-bottom duration-300 pb-8 sm:pb-6">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">
                {editingCategory ? 'Edit Category' : 'Add Category'}
              </h2>
              <button 
                type="button"
                onClick={handleCloseSheet}
                className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
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
                      <img src={getMediaUrl(imageUrl)} alt="Category" className="w-full h-full object-cover" />
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
                    type="button"
                    onClick={decrementOrder}
                    disabled={displayOrder <= 1}
                    className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center text-gray-600 hover:bg-gray-100 active:bg-gray-200 disabled:opacity-50"
                  >
                    <Minus className="w-5 h-5" />
                  </button>
                  <span className="text-xl font-bold text-gray-900">{displayOrder}</span>
                  <button 
                    type="button"
                    onClick={incrementOrder}
                    className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center text-gray-600 hover:bg-gray-100 active:bg-gray-200"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">Lower numbers appear first on the store page.</p>
              </div>

              {/* Save Button */}
              <div className="pt-4">
                <Button 
                  className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-lg font-medium shadow-[0_4px_14px_0_rgba(79,70,229,0.39)]"
                  onClick={handleSave}
                  disabled={!name.trim() || isUploading || isSaving}
                >
                  {isSaving ? (
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : editingCategory ? (
                    'Update Category'
                  ) : (
                    'Save Category'
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
