'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Image as ImageIcon, Film, Tag, ChevronRight, X, Plus } from 'lucide-react';
import Image from 'next/image';
import { 
  useGetMyStoreQuery, 
  useGetStoreProductsQuery, 
  useCreatePostMutation, 
  useCreateReelMutation, 
  useGetPresignedUrlMutation, 
  useProcessMediaMutation,
  useUploadMediaMutation 
} from '@/lib/api';
import { Loader2 } from 'lucide-react';
import { ProductTagSelector } from '@/components/profile/ProductTagSelector';
import { cn } from '@/lib/utils';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store';

export default function CreatePostPage() {
  const router = useRouter();
  const user = useSelector((state: RootState) => state.auth.user);
  const { data: myStore } = useGetMyStoreQuery();
  const { data: allProducts } = useGetStoreProductsQuery(myStore?.id || '', { skip: !myStore?.id });
  
  const [isReel, setIsReel] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [createPost] = useCreatePostMutation();
  const [createReel] = useCreateReelMutation();
  const [uploadMedia] = useUploadMediaMutation();
  const [getPresignedUrl] = useGetPresignedUrlMutation();
  const [processMedia] = useProcessMediaMutation();
  const [caption, setCaption] = useState('');
  const [showTagSelector, setShowTagSelector] = useState(false);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<{url: string, type: string}[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    
    if (isReel) {
      const file = files[0];
      if (file.type.startsWith('video/')) {
        const url = URL.createObjectURL(file);
        setMediaPreviews([{ url, type: 'video' }]);
        setMediaFiles([file]);
      }
    } else {
      const newFiles = [...mediaFiles, ...files].slice(0, 10);
      const newPreviews = newFiles.map(file => {
        const url = URL.createObjectURL(file);
        return { url, type: file.type.startsWith('video/') ? 'video' : 'image' };
      });
      setMediaFiles(newFiles);
      setMediaPreviews(newPreviews);
    }
  };

  const removeMedia = (index: number) => {
    const newFiles = [...mediaFiles];
    newFiles.splice(index, 1);
    setMediaFiles(newFiles);
    
    const newPreviews = [...mediaPreviews];
    newPreviews.splice(index, 1);
    setMediaPreviews(newPreviews);
  };

  const handleShare = async () => {
    if (mediaFiles.length === 0) return;
    setIsPosting(true);
    
    try {
      const mediaIds: string[] = [];
      const legacyMedia: {url: string, type: string}[] = [];
      
      for (const file of mediaFiles) {
        const type = file.type.startsWith('video/') ? 'VIDEO' : 'IMAGE';
        
        try {
          // 1. Direct multipart upload to Cloudflare R2
          const formData = new FormData();
          formData.append('file', file);
          const uploadRes = await uploadMedia(formData).unwrap();
          const mediaUrl = uploadRes.publicUrl || uploadRes.url;
          
          if (mediaUrl) {
            legacyMedia.push({
              url: mediaUrl,
              type
            });
            continue;
          }
        } catch (directErr) {
          console.warn('Direct upload failed, trying presigned URL fallback:', directErr);
        }

        try {
          // 2. Presigned URL Pipeline fallback
          const { signedUrl, fileKey } = await getPresignedUrl({ filename: file.name || 'upload', contentType: file.type }).unwrap();
          
          const uploadRes = await fetch(signedUrl, {
            method: 'PUT',
            body: file,
            headers: { 'Content-Type': file.type }
          });
          
          if (!uploadRes.ok) throw new Error('S3 Upload Failed');
          
          const { mediaAsset } = await processMedia({ fileKey, type }).unwrap();
          mediaIds.push(mediaAsset.id);
        } catch (err) {
          console.error('All R2 upload strategies failed:', err);
          throw new Error('Failed to upload media file');
        }
      }
      
      const payload: any = {
        caption,
        productIds: selectedProductIds,
      };
      
      if (mediaIds.length > 0) payload.mediaIds = mediaIds;
      if (legacyMedia.length > 0) payload.media = legacyMedia;
      
      if (!payload.mediaIds && !payload.media) {
          throw new Error('Failed to process any media files');
      }

      if (isReel) {
        await createReel(payload).unwrap();
      } else {
        await createPost(payload).unwrap();
      }
      
      router.push('/profile');
    } catch (error) {
      console.error('Failed to post:', error);
      alert('Failed to post. Please try again.');
    } finally {
      setIsPosting(false);
    }
  };

  const selectedProducts = allProducts?.filter(p => selectedProductIds.includes(p.id)) || [];

  return (
    <div className="flex flex-col min-h-[100dvh] bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 sticky top-0 bg-white/90 backdrop-blur-md z-10">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-1 -ml-1 rounded-full hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-6 h-6 text-[#171717]" />
          </button>
          <h1 className="text-lg font-bold text-[#171717]">New Post</h1>
        </div>
        <button 
          onClick={handleShare}
          disabled={mediaPreviews.length === 0 || isPosting}
          className="bg-[#FF5A36] text-white px-4 py-1.5 rounded-full font-semibold text-sm disabled:opacity-50 disabled:bg-gray-200 disabled:text-gray-500 transition-colors flex items-center gap-2"
        >
          {isPosting && <Loader2 className="w-4 h-4 animate-spin" />}
          {isPosting ? 'Posting...' : 'Share'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pb-20 no-scrollbar">
        {/* Type Switcher */}
        <div className="p-4">
          <div className="flex p-1 bg-gray-100 rounded-xl relative">
            <button 
              onClick={() => { setIsReel(false); setMediaFiles([]); setMediaPreviews([]); }}
              className={cn("flex-1 py-2 text-sm font-semibold rounded-lg z-10 transition-colors", !isReel ? "text-[#171717]" : "text-gray-500")}
            >
              Post
            </button>
            <button 
              onClick={() => { setIsReel(true); setMediaFiles([]); setMediaPreviews([]); }}
              className={cn("flex-1 py-2 text-sm font-semibold rounded-lg z-10 transition-colors", isReel ? "text-[#171717]" : "text-gray-500")}
            >
              Reel
            </button>
            {/* Sliding background */}
            <div 
              className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-lg shadow-sm transition-transform duration-300 ease-spring"
              style={{ transform: isReel ? 'translateX(100%)' : 'translateX(0)' }}
            />
          </div>
        </div>

        {/* Media Upload Area */}
        <div className="px-4 mb-4 relative group">
          {mediaPreviews.length > 0 ? (
            <>
              <div 
                className={cn(
                  "flex overflow-x-auto snap-x snap-mandatory no-scrollbar rounded-2xl bg-[#F9F6F0] overflow-hidden shadow-inner",
                  isReel ? "aspect-[9/16]" : "aspect-[4/5]"
                )}
                onScroll={(e) => {
                  const width = e.currentTarget.clientWidth;
                  const scrollLeft = e.currentTarget.scrollLeft;
                  setActiveIndex(Math.round(scrollLeft / width));
                }}
              >
                {mediaPreviews.map((preview, index) => (
                  <div key={index} className="w-full shrink-0 relative snap-center flex items-center justify-center">
                    {mediaPreviews.length > 1 && (
                      <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full text-white text-[11px] font-bold z-10">
                        {index + 1} / {mediaPreviews.length}
                      </div>
                    )}
                    {preview.type === 'video' ? (
                      <video src={preview.url} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                    ) : (
                      <img src={preview.url} alt="Preview" className="w-full h-full object-cover" />
                    )}
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        removeMedia(index);
                      }}
                      className="absolute top-3 right-3 bg-black/60 backdrop-blur-md p-2 rounded-full text-white z-10 hover:bg-black/80 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                
                {!isReel && mediaPreviews.length < 10 && (
                   <label className="w-full shrink-0 relative snap-center flex flex-col items-center justify-center cursor-pointer bg-[#F9F9F9] hover:bg-gray-100 transition-colors">
                      <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center mb-2">
                        <Plus className="w-6 h-6 text-[#171717]" />
                      </div>
                      <span className="text-sm font-semibold text-[#171717]">Add More</span>
                      <input 
                        type="file" 
                        accept="image/*,video/*"
                        multiple
                        className="hidden" 
                        onChange={handleMediaChange}
                      />
                   </label>
                )}
              </div>
              
              {/* Pagination Dots */}
              {(mediaPreviews.length > 1 || (!isReel && mediaPreviews.length > 0 && mediaPreviews.length < 10)) && (
                <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-1.5 z-10 pointer-events-none">
                  {Array.from({ length: mediaPreviews.length + (!isReel && mediaPreviews.length < 10 ? 1 : 0) }).map((_, i) => (
                    <div key={i} className={cn("h-1.5 rounded-full transition-all duration-300 shadow-sm", i === activeIndex ? "bg-white w-3" : "bg-white/60 w-1.5")} />
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className={cn(
              "flex items-center justify-center relative rounded-2xl border-2 border-dashed border-gray-200 bg-[#F9F9F9] hover:bg-gray-50 transition-colors",
              isReel ? "aspect-[9/16]" : "aspect-[4/5]"
            )}>
              <label className="flex flex-col items-center justify-center cursor-pointer w-full h-full text-center p-6">
                <div className="w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center mb-4">
                  {isReel ? <Film className="w-8 h-8 text-blue-500" /> : <ImageIcon className="w-8 h-8 text-orange-500" />}
                </div>
                <span className="font-bold text-[#171717] text-lg mb-1">
                  Upload {isReel ? 'Video' : 'Photos'}
                </span>
                <span className="text-sm text-gray-500 max-w-[200px]">
                  {isReel ? 'Choose a video for your reel' : 'Select up to 10 photos or videos'}
                </span>
                <input 
                  type="file" 
                  accept={isReel ? 'video/*' : 'image/*,video/*'}
                  multiple={!isReel}
                  className="hidden" 
                  onChange={handleMediaChange}
                />
              </label>
            </div>
          )}
        </div>

        {/* Caption */}
        <div className="px-4 py-3 flex gap-3 border-t border-b border-gray-100">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-orange-400 to-pink-500 shrink-0 flex items-center justify-center text-white font-bold text-sm">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <textarea
            placeholder="Write a caption..."
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            className="w-full min-h-[60px] resize-none outline-none text-[15px] text-[#171717] placeholder:text-gray-400 pt-1"
          />
        </div>

        {/* Tagging Options */}
        <div className="flex flex-col mt-2">
          <button 
            onClick={() => setShowTagSelector(true)}
            className="flex items-center justify-between px-4 py-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                <Tag className="w-4 h-4 text-blue-600" />
              </div>
              <span className="font-semibold text-[#171717]">Tag Products</span>
            </div>
            <div className="flex items-center gap-2">
              {selectedProductIds.length > 0 && (
                <span className="text-sm font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                  {selectedProductIds.length} added
                </span>
              )}
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>
          </button>

          {/* Selected Products Preview */}
          {selectedProducts.length > 0 && (
            <div className="px-4 pb-4 flex gap-3 overflow-x-auto no-scrollbar">
              {selectedProducts.map(product => (
                <div key={product.id} className="relative flex-shrink-0 group">
                  <div className="w-16 h-16 rounded-xl overflow-hidden border border-gray-100 shadow-sm bg-[#F9F6F0]">
                    <img 
                      src={product.images[0]} 
                      alt={product.name}
                      className="w-full h-full object-contain p-1 mix-blend-multiply"
                    />
                  </div>
                  <button 
                    onClick={() => setSelectedProductIds(prev => prev.filter(id => id !== product.id))}
                    className="absolute -top-2 -right-2 bg-white rounded-full shadow-md border border-gray-100 p-1 text-gray-500 hover:text-red-500 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showTagSelector && myStore?.id && (
        <ProductTagSelector 
          storeId={myStore.id}
          initialSelected={selectedProductIds}
          onClose={() => setShowTagSelector(false)}
          onDone={(ids) => {
            setSelectedProductIds(ids);
            setShowTagSelector(false);
          }}
        />
      )}
    </div>
  );
}
