'use client';

import React, { useState, useRef } from 'react';
import { X, Camera, Film, Image as ImageIcon, Tag, Loader2, Check, ShoppingBag } from 'lucide-react';
import { useUploadMediaMutation, useCreateStoryMutation, useGetStoreProductsQuery } from '@/lib/api';
import { toast } from 'sonner';

interface StoryUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  storeId: string;
  storeName?: string;
  storeLogo?: string;
}

export function StoryUploadModal({
  isOpen,
  onClose,
  storeId,
  storeName = 'My Store',
  storeLogo
}: StoryUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'IMAGE' | 'VIDEO'>('IMAGE');
  const [caption, setCaption] = useState('');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uploadMedia] = useUploadMediaMutation();
  const [createStory] = useCreateStoryMutation();
  const { data: storeProducts, isLoading: isProductsLoading } = useGetStoreProductsQuery(storeId, { skip: !storeId });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (selectedFile.size > 25 * 1024 * 1024) {
      toast.error('File size must be under 25MB');
      return;
    }

    const isVideo = selectedFile.type.startsWith('video/');
    setMediaType(isVideo ? 'VIDEO' : 'IMAGE');
    setFile(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));
  };

  const resetForm = () => {
    setFile(null);
    setPreviewUrl(null);
    setCaption('');
    setSelectedProductId(null);
    setShowProductPicker(false);
    setIsSubmitting(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleUploadAndPost = async () => {
    if (!file) {
      toast.error('Please select a photo or video for your story');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Direct multipart upload to Cloudflare R2
      const formData = new FormData();
      formData.append('file', file);
      const uploadRes = await uploadMedia(formData).unwrap();
      const mediaUrl = uploadRes.publicUrl || uploadRes.url;
      const fileKey = uploadRes.fileKey;

      if (!mediaUrl) {
        throw new Error('Failed to retrieve uploaded media URL');
      }

      // 2. Create story record in backend
      await createStory({
        storeId,
        mediaUrl,
        fileKey,
        mediaType,
        caption: caption.trim() || undefined,
        productId: selectedProductId || undefined,
      }).unwrap();

      toast.success('Story uploaded successfully! It is now active for 24 hours.');
      handleClose();
    } catch (err: any) {
      console.error('Failed to upload story:', err);
      toast.error(err?.data?.message || err?.message || 'Failed to post story. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const selectedProduct = storeProducts?.find(p => p.id === selectedProductId);

  return (
    <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base text-[#171717]">Create Story</h3>
            <p className="text-xs text-gray-500">Active for 24 hours on Home feed</p>
          </div>
          <button 
            onClick={handleClose}
            disabled={isSubmitting}
            className="p-1 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-4 flex-1 overflow-y-auto flex flex-col gap-4">
          {/* 9:16 Canvas / Media Preview */}
          <div className="relative aspect-[9/16] w-full max-h-[380px] mx-auto bg-gray-950 rounded-2xl overflow-hidden flex items-center justify-center border border-gray-200 shadow-inner group">
            {previewUrl ? (
              <>
                {mediaType === 'VIDEO' ? (
                  <video src={previewUrl} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                ) : (
                  <img src={previewUrl} alt="Story Preview" className="w-full h-full object-cover" />
                )}
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-3 right-3 bg-black/60 text-white text-xs font-bold px-3 py-1.5 rounded-full backdrop-blur-md hover:bg-black/80 transition-colors"
                >
                  Change Media
                </button>
              </>
            ) : (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center text-center p-6 cursor-pointer hover:bg-gray-900/40 transition-colors w-full h-full"
              >
                <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#FF6B00] to-[#FF0000] flex items-center justify-center text-white mb-3 shadow-lg group-hover:scale-105 transition-transform">
                  <Camera className="w-8 h-8" />
                </div>
                <span className="text-sm font-bold text-white">Select Photo or Video</span>
                <span className="text-xs text-gray-400 mt-1 max-w-[200px]">Supports vertical photos and videos up to 25MB</span>
              </div>
            )}
            <input 
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {/* Caption Input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-gray-700">Story Caption (Optional)</label>
            <input 
              type="text"
              placeholder="Add a short caption or announcement..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              maxLength={120}
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-[#FF5A36] transition-colors"
            />
          </div>

          {/* Tag Product Selector */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-[#FF5A36]" />
                Tag a Product (Optional)
              </label>
              {selectedProductId && (
                <button 
                  onClick={() => setSelectedProductId(null)}
                  className="text-xs text-red-500 font-semibold hover:underline"
                >
                  Remove Tag
                </button>
              )}
            </div>

            {selectedProduct ? (
              <div className="flex items-center justify-between p-2.5 rounded-xl border border-orange-200 bg-orange-50/50">
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-white border border-gray-200 flex-shrink-0">
                    <img src={selectedProduct.imageUrl || selectedProduct.images?.[0] || ''} alt={selectedProduct.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="truncate">
                    <p className="text-xs font-bold text-gray-900 truncate">{selectedProduct.name}</p>
                    <p className="text-xs font-semibold text-[#FF5A36]">₹{selectedProduct.sellingPrice}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowProductPicker(true)}
                  className="text-xs font-bold text-gray-600 hover:text-gray-900 shrink-0 ml-2"
                >
                  Change
                </button>
              </div>
            ) : (
              <button 
                type="button"
                onClick={() => setShowProductPicker(!showProductPicker)}
                className="w-full py-2.5 px-3 border border-dashed border-gray-300 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
              >
                <ShoppingBag className="w-4 h-4 text-gray-400" />
                Choose a product to link in story
              </button>
            )}

            {/* Product Picker Drawer */}
            {showProductPicker && (
              <div className="border border-gray-200 rounded-xl p-2 max-h-48 overflow-y-auto flex flex-col gap-1.5 bg-gray-50 shadow-inner">
                {isProductsLoading ? (
                  <div className="flex items-center justify-center py-4 text-xs text-gray-500">
                    <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> Loading products...
                  </div>
                ) : storeProducts && storeProducts.length > 0 ? (
                  storeProducts.map((p: any) => (
                    <div 
                      key={p.id}
                      onClick={() => {
                        setSelectedProductId(p.id);
                        setShowProductPicker(false);
                      }}
                      className="flex items-center justify-between p-2 rounded-lg bg-white border border-gray-100 cursor-pointer hover:border-orange-300 transition-colors"
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <img src={p.imageUrl || p.images?.[0] || ''} alt={p.name} className="w-8 h-8 rounded object-cover" />
                        <span className="text-xs font-medium text-gray-800 truncate max-w-[200px]">{p.name}</span>
                      </div>
                      <span className="text-xs font-bold text-[#FF5A36] shrink-0">₹{p.sellingPrice}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-500 text-center py-3">No products available in this store.</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-100 flex items-center gap-3">
          <button 
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="flex-1 py-3 rounded-xl font-bold text-sm text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button 
            type="button"
            onClick={handleUploadAndPost}
            disabled={!file || isSubmitting}
            className="flex-1 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-[#FF6B00] to-[#FF0000] text-white shadow-md hover:opacity-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Posting...</span>
              </>
            ) : (
              <span>Share to Story</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
