'use client';

import React, { useState, useRef, useEffect } from 'react';
import { X, Camera, Film, Image as ImageIcon, Tag, Loader2, Check, ShoppingBag, Scissors } from 'lucide-react';
import { useGetStoreProductsQuery } from '@/lib/api';
import { useUpload } from '@/context/UploadContext';
import { VideoTrimmerModal } from '@/components/media/VideoTrimmerModal';
import { ProductTagSelector } from '@/components/profile/ProductTagSelector';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store';
import { toast } from 'sonner';
import { useCurrency } from '@/context/CurrencyContext';
import { getMediaUrl } from '@/lib/utils';

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
  const { formatPrice } = useCurrency();
  const user = useSelector((state: RootState) => state.auth.user);
  const isAuthenticated = Boolean(user);

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'IMAGE' | 'VIDEO'>('IMAGE');
  const [caption, setCaption] = useState('');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [showTagSelector, setShowTagSelector] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Video trimmer state
  const [isTrimmerOpen, setIsTrimmerOpen] = useState(false);
  const [pendingTrimmerFile, setPendingTrimmerFile] = useState<File | null>(null);
  const [trimData, setTrimData] = useState<{ startTime: number; endTime: number; duration: number } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const { startStoryUpload } = useUpload();
  const { data: storeProducts } = useGetStoreProductsQuery(storeId, { skip: !storeId });

  // Auto close if unauthenticated
  useEffect(() => {
    if (isOpen && (!isAuthenticated || !user)) {
      onClose();
    }
  }, [isOpen, isAuthenticated, user, onClose]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (selectedFile.size > 25 * 1024 * 1024) {
      toast.error('File size must be under 25MB');
      return;
    }

    const isVideo = selectedFile.type.startsWith('video/');
    if (isVideo) {
      const tempUrl = URL.createObjectURL(selectedFile);
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.src = tempUrl;

      video.onloadedmetadata = () => {
        URL.revokeObjectURL(tempUrl);
        const duration = video.duration || 0;
        
        // If story video is longer than recommended 30s, automatically open trimmer
        if (duration > 30) {
          toast.info(`Video is ${Math.round(duration)}s. Let's crop it to 30s for your story.`);
          setPendingTrimmerFile(selectedFile);
          setIsTrimmerOpen(true);
          return;
        }

        setMediaType('VIDEO');
        setFile(selectedFile);
        setPreviewUrl(URL.createObjectURL(selectedFile));
        setPendingTrimmerFile(selectedFile);
        setTrimData(null);
      };

      video.onerror = () => {
        URL.revokeObjectURL(tempUrl);
        toast.error('Unable to load video format');
      };
      return;
    }

    setMediaType('IMAGE');
    setFile(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));
    setTrimData(null);
  };

  const handleTrimComplete = ({ startTime, endTime, duration }: { startTime: number; endTime: number; duration: number; thumbnailDataUrl?: string }) => {
    if (!pendingTrimmerFile) return;

    setMediaType('VIDEO');
    setFile(pendingTrimmerFile);
    setPreviewUrl(URL.createObjectURL(pendingTrimmerFile));
    setTrimData({ startTime, endTime, duration });
    toast.success(`Story video trimmed to ${duration}s!`);
  };

  const resetForm = () => {
    setFile(null);
    setPreviewUrl(null);
    setCaption('');
    setSelectedProductId(null);
    setShowTagSelector(false);
    setIsSubmitting(false);
    setTrimData(null);
    setPendingTrimmerFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleUploadAndPost = () => {
    if (!file || !previewUrl) {
      toast.error('Please select a photo or video for your story');
      return;
    }

    startStoryUpload({
      file,
      storeId,
      mediaType,
      caption: caption.trim() || undefined,
      productId: selectedProductId || undefined,
      previewUrl,
    });

    handleClose();
  };

  if (!isOpen) return null;

  const selectedProduct = storeProducts?.find(p => p.id === selectedProductId);
  const selectedProductImage = selectedProduct ? (selectedProduct.imageUrl || selectedProduct.images?.[0] || selectedProduct.media?.[0]?.url || '') : '';

  return (
    <>
      <div 
        className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-xs flex items-end justify-center transition-opacity"
        onClick={(e) => {
          if (e.target === e.currentTarget) handleClose();
        }}
      >
        <div 
          className="bg-white w-full max-w-md rounded-t-[28px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in slide-in-from-bottom duration-300 ease-out border-t border-[#E5E2DC] font-sans"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Drag Handle Indicator */}
          <div className="w-12 h-1 bg-[#E5E2DC] rounded-full mx-auto mt-3 mb-1 shrink-0" />

          {/* Header */}
          <div className="px-5 py-3 border-b border-[#E5E2DC] flex items-center justify-between shrink-0">
            <div>
              <h3 className="font-extrabold text-base text-[#171717]">Create Story</h3>
              <p className="text-xs text-gray-500">Active for 24 hours on Home feed</p>
            </div>
            <button 
              onClick={handleClose}
              disabled={isSubmitting}
              className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 flex items-center justify-center transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content Area */}
          <div className="p-4 flex-1 overflow-y-auto flex flex-col gap-4">
            {/* 9:16 Canvas / Media Preview */}
            {previewUrl ? (
              <div className="relative aspect-[9/16] w-full max-h-[340px] mx-auto bg-black rounded-2xl overflow-hidden flex items-center justify-center border border-[#E5E2DC] shadow-xs group">
                {mediaType === 'VIDEO' ? (
                  <video src={previewUrl} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                ) : (
                  <img src={previewUrl} alt="Story Preview" className="w-full h-full object-cover" />
                )}

                {/* Video Crop / Trim Action Button */}
                {mediaType === 'VIDEO' && file && (
                  <button 
                    type="button"
                    onClick={() => {
                      setPendingTrimmerFile(file);
                      setIsTrimmerOpen(true);
                    }}
                    className="absolute bottom-3 left-3 bg-black/70 text-white text-xs font-bold px-3 py-1.5 rounded-full backdrop-blur-md hover:bg-black/90 flex items-center gap-1.5 border border-white/20 transition-all shadow-md z-10"
                  >
                    <Scissors className="w-3.5 h-3.5 text-[#FF5A36]" />
                    <span>{trimData ? `Trimmed (${trimData.duration}s)` : 'Trim Video'}</span>
                  </button>
                )}

                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-3 right-3 bg-black/60 text-white text-xs font-bold px-3 py-1.5 rounded-full backdrop-blur-md hover:bg-black/80 transition-colors z-10"
                >
                  Change Media
                </button>
              </div>
            ) : (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="relative aspect-[9/16] w-full max-h-[340px] mx-auto bg-[#FAF9F6] border-2 border-dashed border-[#E5E2DC] hover:border-[#FF5A36] rounded-2xl overflow-hidden flex flex-col items-center justify-center text-center p-6 cursor-pointer hover:bg-orange-50/20 transition-all group shadow-xs"
              >
                <div className="w-16 h-16 rounded-2xl bg-orange-50 text-[#FF5A36] border border-orange-200 flex items-center justify-center mb-3 shadow-xs group-hover:scale-105 transition-transform">
                  <Camera className="w-7 h-7" />
                </div>
                <span className="text-sm font-bold text-[#171717]">Select Photo or Video</span>
                <span className="text-xs text-gray-500 mt-1 max-w-[220px]">Supports vertical photos and videos up to 25MB (Max 30s)</span>
              </div>
            )}
            
            <input 
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              className="hidden"
              onChange={handleFileChange}
            />

            {/* Caption Input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#171717]">Story Caption (Optional)</label>
              <input 
                type="text"
                placeholder="Add a short caption or announcement..."
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                maxLength={120}
                className="w-full text-sm bg-[#FAF9F6] border border-[#E5E2DC] rounded-xl px-3.5 py-2.5 outline-none focus:border-[#FF5A36] focus:ring-2 focus:ring-[#FF5A36]/15 transition-colors placeholder:text-gray-400 font-medium text-[#171717]"
              />
            </div>

            {/* Tag Product Selector (Using standard ProductTagSelector from grid post) */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[#171717] flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-[#FF5A36]" />
                  <span>Tag a Product (Optional)</span>
                </label>
                {selectedProductId && (
                  <button 
                    type="button"
                    onClick={() => setSelectedProductId(null)}
                    className="text-xs text-red-500 font-semibold hover:underline"
                  >
                    Remove Tag
                  </button>
                )}
              </div>

              {selectedProduct ? (
                <div className="flex items-center justify-between p-3 rounded-xl border border-orange-200 bg-orange-50/50">
                  <div className="flex items-center gap-3 overflow-hidden min-w-0">
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-white border border-[#E5E2DC] shrink-0 flex items-center justify-center">
                      {selectedProductImage ? (
                        <img 
                          src={getMediaUrl(selectedProductImage)} 
                          alt={selectedProduct.name} 
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <ShoppingBag className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                    <div className="truncate min-w-0">
                      <p className="text-xs font-bold text-[#171717] truncate">{selectedProduct.name}</p>
                      <p className="text-xs font-bold text-[#FF5A36] mt-0.5">
                        {formatPrice(selectedProduct.sellingPrice ?? selectedProduct.price ?? 0)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    <button 
                      type="button"
                      onClick={() => setShowTagSelector(true)}
                      className="text-xs font-bold text-[#FF5A36] hover:text-[#e04d2d] bg-white border border-orange-200 px-3 py-1.5 rounded-lg shadow-xs transition-colors"
                    >
                      Change
                    </button>
                    <button 
                      type="button"
                      onClick={() => setSelectedProductId(null)}
                      className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-gray-100 transition-colors"
                      title="Remove Tag"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <button 
                  type="button"
                  onClick={() => setShowTagSelector(true)}
                  className="w-full py-3 px-3 border border-dashed border-[#E5E2DC] rounded-xl text-xs font-semibold text-gray-700 hover:border-[#FF5A36] hover:bg-orange-50/30 transition-colors flex items-center justify-center gap-2"
                >
                  <ShoppingBag className="w-4 h-4 text-[#FF5A36]" />
                  <span>Choose a product to link in story</span>
                </button>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t border-[#E5E2DC] flex items-center gap-3 shrink-0 bg-white">
            <button 
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1 py-3 rounded-xl font-bold text-xs text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button 
              type="button"
              onClick={handleUploadAndPost}
              disabled={!file || isSubmitting}
              className="flex-1 py-3 rounded-xl font-bold text-xs bg-[#FF5A36] hover:bg-[#e04d2d] text-white shadow-xs disabled:opacity-50 transition-all flex items-center justify-center gap-2"
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

        {/* Video Trimmer Modal */}
        {isTrimmerOpen && pendingTrimmerFile && (
          <VideoTrimmerModal
            isOpen={isTrimmerOpen}
            onClose={() => {
              setIsTrimmerOpen(false);
              if (!file) setPendingTrimmerFile(null);
            }}
            videoFile={pendingTrimmerFile}
            maxDurationSeconds={30}
            onTrimComplete={handleTrimComplete}
          />
        )}
      </div>

      {/* Standard Product Tag Selector (Exact same screen as grid post) */}
      {showTagSelector && (
        <ProductTagSelector 
          storeId={storeId}
          initialSelected={selectedProductId ? [selectedProductId] : []}
          singleSelect={true}
          title="Tag Product in Story"
          onClose={() => setShowTagSelector(false)}
          onDone={(ids) => {
            setSelectedProductId(ids[0] || null);
            setShowTagSelector(false);
          }}
        />
      )}
    </>
  );
}
