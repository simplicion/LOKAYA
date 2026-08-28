'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Image as ImageIcon, Film, Tag, ChevronRight, X } from 'lucide-react';
import Image from 'next/image';
import { useGetMyStoreQuery, useGetStoreProductsQuery } from '@/lib/api';
import { ProductTagSelector } from '@/components/profile/ProductTagSelector';

export default function CreatePostPage() {
  const router = useRouter();
  const { data: myStore } = useGetMyStoreQuery();
  const { data: allProducts } = useGetStoreProductsQuery(myStore?.id || '', { skip: !myStore?.id });
  
  const [isReel, setIsReel] = useState(false);
  const [caption, setCaption] = useState('');
  const [showTagSelector, setShowTagSelector] = useState(false);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<{url: string, type: string}[]>([]);

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

  const handleShare = () => {
    // Mock the share action
    console.log({
      type: isReel ? 'reel' : 'post',
      caption,
      taggedProducts: selectedProductIds,
      media: mediaPreviews
    });
    router.push('/profile');
  };

  const selectedProducts = allProducts?.filter(p => selectedProductIds.includes(p.id)) || [];

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()}>
            <ArrowLeft className="w-6 h-6 text-[#171717]" />
          </button>
          <h1 className="text-lg font-bold text-[#171717]">New {isReel ? 'Reel' : 'Post'}</h1>
        </div>
        <button 
          onClick={handleShare}
          disabled={mediaPreviews.length === 0}
          className="text-blue-600 font-bold text-[15px] disabled:opacity-50"
        >
          Share
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pb-20">
        {/* Toggle Reel Mode */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <span className="font-semibold text-[#171717]">Post as Reel</span>
          <button 
            type="button"
            onClick={() => {
              setIsReel(!isReel);
              setMediaFiles([]);
              setMediaPreviews([]);
            }}
            className={`w-11 h-6 rounded-full relative transition-colors ${isReel ? 'bg-blue-600' : 'bg-gray-300'}`}
          >
            <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${isReel ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </button>
        </div>

        {/* Media Upload Area */}
        {mediaPreviews.length > 0 ? (
          <div className={`flex overflow-x-auto snap-x snap-mandatory no-scrollbar ${isReel ? 'aspect-[9/16] max-h-[500px]' : 'aspect-square'} bg-gray-50`}>
            {mediaPreviews.map((preview, index) => (
              <div key={index} className="w-full shrink-0 relative snap-center">
                {preview.type === 'video' ? (
                  <video src={preview.url} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                ) : (
                  <Image src={preview.url} alt={`Preview ${index}`} fill className="object-cover" unoptimized />
                )}
                <button 
                  onClick={() => removeMedia(index)}
                  className="absolute top-4 right-4 bg-black/50 p-2 rounded-full text-white z-10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className={`${isReel ? 'aspect-[9/16] max-h-[500px]' : 'aspect-square'} bg-gray-50 flex items-center justify-center relative border-b border-gray-100`}>
            <label className="flex flex-col items-center gap-3 cursor-pointer p-12 text-center w-full h-full justify-center">
              <div className="w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center">
                {isReel ? <Film className="w-8 h-8 text-gray-400" /> : <ImageIcon className="w-8 h-8 text-gray-400" />}
              </div>
              <div>
                <span className="font-bold text-[#171717] block mb-1">Add {isReel ? 'Video' : 'Media'}</span>
                <span className="text-sm text-gray-500">
                  {isReel ? 'Choose a video for your reel' : 'Choose up to 10 photos or videos'}
                </span>
              </div>
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

        {/* Caption */}
        <div className="p-4 border-b border-gray-100">
          <textarea
            placeholder="Write a caption..."
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            className="w-full h-24 resize-none outline-none text-[#171717] placeholder:text-gray-400"
          />
        </div>

        {/* Tagging Options */}
        <div className="flex flex-col">
          <button 
            onClick={() => setShowTagSelector(true)}
            className="flex items-center justify-between p-4 border-b border-gray-100 hover:bg-gray-50"
          >
            <div className="flex items-center gap-3">
              <Tag className="w-5 h-5 text-gray-500" />
              <span className="font-semibold text-[#171717]">Tag Products</span>
            </div>
            <div className="flex items-center gap-2">
              {selectedProductIds.length > 0 && (
                <span className="text-sm text-gray-500">{selectedProductIds.length} selected</span>
              )}
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>
          </button>

          {/* Selected Products Preview */}
          {selectedProducts.length > 0 && (
            <div className="px-4 py-3 flex gap-3 overflow-x-auto border-b border-gray-100 no-scrollbar">
              {selectedProducts.map(product => (
                <div key={product.id} className="relative flex-shrink-0">
                  <div className="w-16 h-16 rounded-lg overflow-hidden border border-gray-200">
                    <Image 
                      src={product.images[0] || 'https://via.placeholder.com/150'} 
                      alt={product.name}
                      width={64}
                      height={64}
                      className="w-full h-full object-cover"
                      unoptimized
                    />
                  </div>
                  <button 
                    onClick={() => setSelectedProductIds(prev => prev.filter(id => id !== product.id))}
                    className="absolute -top-2 -right-2 bg-white rounded-full shadow border border-gray-200 p-0.5"
                  >
                    <X className="w-3 h-3 text-[#171717]" />
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
