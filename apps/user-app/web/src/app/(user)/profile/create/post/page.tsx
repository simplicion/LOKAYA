'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Image as ImageIcon, Film, Tag, ChevronRight, X, Plus, Scissors, UploadCloud, Loader2 } from 'lucide-react';
import { 
  useGetMyStoreQuery, 
  useGetStoreProductsQuery
} from '@/lib/api';
import { ProductTagSelector } from '@/components/profile/ProductTagSelector';
import { VideoTrimmerModal } from '@/components/media/VideoTrimmerModal';
import { cn, generateVideoThumbnail, getMediaUrl } from '@/lib/utils';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store';
import { useUpload } from '@/context/UploadContext';
import { toast } from 'sonner';

const MAX_VIDEO_SIZE_BYTES = 100 * 1024 * 1024; // 100 MB
const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;  // 10 MB
const RECOMMENDED_VIDEO_DURATION = 90;          // 90s max limit
const MAX_CAROUSEL_IMAGES = 10;

export default function CreatePostPage() {
  const router = useRouter();
  const { startPostUpload } = useUpload();
  const user = useSelector((state: RootState) => state.auth.user);
  const isAuthenticated = Boolean(user);
  const { data: myStore } = useGetMyStoreQuery(undefined, { skip: !isAuthenticated });
  const { data: allProducts } = useGetStoreProductsQuery(myStore?.id || '', { skip: !myStore?.id });
  
  const [isPosting, setIsPosting] = useState(false);
  const [caption, setCaption] = useState('');
  const [showTagSelector, setShowTagSelector] = useState(false);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<{url: string, posterUrl?: string, type: 'image' | 'video'}[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  // Derived state: is video post
  const isVideoPost = mediaPreviews.length > 0 && mediaPreviews[0]?.type === 'video';

  // Video Trimmer state
  const [isTrimmerOpen, setIsTrimmerOpen] = useState(false);
  const [pendingTrimmerFile, setPendingTrimmerFile] = useState<File | null>(null);
  const [trimData, setTrimData] = useState<{ startTime: number; endTime: number; duration: number } | null>(null);

  // Auth Guard
  useEffect(() => {
    if (!isAuthenticated && !user) {
      toast.info('Please log in to create posts');
      router.push('/login?redirect=/profile/create/post');
    }
  }, [isAuthenticated, user, router]);

  const validateAndAddVideo = async (file: File) => {
    if (file.size > MAX_VIDEO_SIZE_BYTES) {
      toast.error('Video exceeds maximum size limit of 100 MB.');
      return;
    }

    // Check duration via temporary video element
    const tempUrl = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.src = tempUrl;

    video.onloadedmetadata = async () => {
      URL.revokeObjectURL(tempUrl);
      const duration = video.duration || 0;

      // If video duration exceeds recommended length (90s), launch interactive trimmer!
      if (duration > RECOMMENDED_VIDEO_DURATION) {
        toast.info(`Video length is ${Math.round(duration)}s. Let's crop/trim it to 90s.`);
        setPendingTrimmerFile(file);
        setIsTrimmerOpen(true);
        return;
      }

      const previewUrl = URL.createObjectURL(file);
      setMediaFiles([file]);
      setMediaPreviews([{ url: previewUrl, type: 'video' }]);
      setPendingTrimmerFile(file);
      setTrimData(null);

      try {
        const { thumbnailDataUrl } = await generateVideoThumbnail(file);
        if (thumbnailDataUrl) {
          setMediaPreviews([{ url: previewUrl, posterUrl: thumbnailDataUrl, type: 'video' }]);
        }
      } catch (err) {
        console.warn('Thumbnail generation notice:', err);
      }
    };

    video.onerror = () => {
      URL.revokeObjectURL(tempUrl);
      toast.error('Unable to read video file. Please try another format (MP4, MOV, WebM).');
    };
  };

  const handleTrimComplete = ({ startTime, endTime, duration, thumbnailDataUrl }: { startTime: number; endTime: number; duration: number; thumbnailDataUrl?: string }) => {
    if (!pendingTrimmerFile) return;

    const previewUrl = URL.createObjectURL(pendingTrimmerFile);
    setMediaFiles([pendingTrimmerFile]);
    setMediaPreviews([{
      url: previewUrl,
      posterUrl: thumbnailDataUrl,
      type: 'video'
    }]);
    setTrimData({ startTime, endTime, duration });
    toast.success(`Video trimmed to ${duration}s (${Math.floor(startTime)}s - ${Math.floor(endTime)}s)`);
  };

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    
    // Check if any video is in the selection
    const firstVideo = files.find(f => f.type.startsWith('video/'));

    // Mutual exclusivity: Video vs Photos
    if (firstVideo) {
      if (mediaFiles.length > 0 && !isVideoPost) {
        toast.info('Switched to video post (replaced previous photos).');
      }
      validateAndAddVideo(firstVideo);
      return;
    }

    // Handle Photos (up to 10)
    const validImageFiles = files.filter(f => {
      if (f.size > MAX_IMAGE_SIZE_BYTES) {
        toast.error(`${f.name} exceeds 10 MB limit.`);
        return false;
      }
      return f.type.startsWith('image/');
    });

    if (validImageFiles.length === 0) return;

    if (isVideoPost) {
      toast.info('Switched to photo post (replaced previous video).');
      const limited = validImageFiles.slice(0, MAX_CAROUSEL_IMAGES);
      const newPreviews = limited.map(file => ({
        url: URL.createObjectURL(file),
        type: 'image' as const
      }));
      setMediaFiles(limited);
      setMediaPreviews(newPreviews);
      setTrimData(null);
      return;
    }

    const combined = [...mediaFiles, ...validImageFiles].slice(0, MAX_CAROUSEL_IMAGES);
    if (mediaFiles.length + validImageFiles.length > MAX_CAROUSEL_IMAGES) {
      toast.info(`Carousel limited to maximum ${MAX_CAROUSEL_IMAGES} photos.`);
    }

    const newPreviews = combined.map(file => ({
      url: URL.createObjectURL(file),
      type: 'image' as const
    }));

    setMediaFiles(combined);
    setMediaPreviews(newPreviews);
    setTrimData(null);
  };

  const removeMedia = (index: number) => {
    const newFiles = [...mediaFiles];
    newFiles.splice(index, 1);
    setMediaFiles(newFiles);
    
    const newPreviews = [...mediaPreviews];
    newPreviews.splice(index, 1);
    setMediaPreviews(newPreviews);
    setTrimData(null);
  };

  const handleShare = () => {
    if (mediaFiles.length === 0 || isPosting) return;
    setIsPosting(true);
    
    // Instantly launch background upload and navigate home
    startPostUpload({
      isReel: isVideoPost,
      mediaFiles,
      caption,
      selectedProductIds,
      previewUrls: mediaPreviews.map(m => m.posterUrl || m.url),
    });
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
          className="bg-[#FF5A36] text-white px-5 py-1.5 rounded-full font-semibold text-sm disabled:opacity-50 disabled:bg-gray-200 disabled:text-gray-500 transition-colors flex items-center gap-2 shadow-sm active:scale-95"
        >
          {isPosting && <Loader2 className="w-4 h-4 animate-spin" />}
          {isPosting ? 'Posting...' : 'Share'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pb-20 no-scrollbar pt-4">
        {/* Media Upload Area */}
        <div className="px-4 mb-4 relative group">
          {mediaPreviews.length > 0 ? (
            <>
              <div 
                className={cn(
                  "flex overflow-x-auto snap-x snap-mandatory no-scrollbar rounded-2xl bg-[#F9F6F0] overflow-hidden shadow-inner",
                  isVideoPost ? "aspect-[9/16] max-h-[520px] mx-auto" : "aspect-[4/5]"
                )}
                onScroll={(e) => {
                  const width = e.currentTarget.clientWidth;
                  const scrollLeft = e.currentTarget.scrollLeft;
                  setActiveIndex(Math.round(scrollLeft / width));
                }}
              >
                {mediaPreviews.map((preview, index) => (
                  <div key={index} className="w-full h-full shrink-0 relative snap-center flex items-center justify-center bg-black/5">
                    {mediaPreviews.length > 1 && (
                      <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full text-white text-[11px] font-bold z-10">
                        {index + 1} / {mediaPreviews.length}
                      </div>
                    )}
                    {preview.type === 'video' ? (
                      <>
                        <video src={preview.url} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                        <button 
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            if (mediaFiles[0]) {
                              setPendingTrimmerFile(mediaFiles[0]);
                              setIsTrimmerOpen(true);
                            }
                          }}
                          className="absolute bottom-3 left-3 bg-black/70 text-white text-xs font-bold px-3 py-1.5 rounded-full backdrop-blur-md hover:bg-black/90 flex items-center gap-1.5 border border-white/20 transition-all shadow-md z-10"
                        >
                          <Scissors className="w-3.5 h-3.5 text-[#FF5A36]" />
                          <span>{trimData ? `Trimmed (${trimData.duration}s)` : 'Trim / Crop'}</span>
                        </button>
                      </>
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
                      title="Remove media"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                
                {!isVideoPost && mediaPreviews.length < MAX_CAROUSEL_IMAGES && (
                   <label className="w-full shrink-0 relative snap-center flex flex-col items-center justify-center cursor-pointer bg-[#F9F9F9] hover:bg-gray-100 transition-colors">
                      <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center mb-2">
                        <Plus className="w-6 h-6 text-[#171717]" />
                      </div>
                      <span className="text-sm font-semibold text-[#171717]">Add More Photos</span>
                      <span className="text-xs text-gray-400 mt-0.5">{mediaPreviews.length} of {MAX_CAROUSEL_IMAGES}</span>
                      <input 
                        type="file" 
                        accept="image/*"
                        multiple
                        className="hidden" 
                        onChange={handleMediaChange}
                      />
                   </label>
                )}
              </div>
              
              {/* Pagination Dots */}
              {(mediaPreviews.length > 1 || (!isVideoPost && mediaPreviews.length > 0 && mediaPreviews.length < MAX_CAROUSEL_IMAGES)) && (
                <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-1.5 z-10 pointer-events-none">
                  {Array.from({ length: mediaPreviews.length + (!isVideoPost && mediaPreviews.length < MAX_CAROUSEL_IMAGES ? 1 : 0) }).map((_, i) => (
                    <div key={i} className={cn("h-1.5 rounded-full transition-all duration-300 shadow-sm", i === activeIndex ? "bg-white w-3" : "bg-white/60 w-1.5")} />
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center justify-center relative rounded-2xl border-2 border-dashed border-gray-200 bg-[#FBFBFB] hover:bg-gray-50 transition-colors aspect-[4/5] max-h-[460px]">
              <label className="flex flex-col items-center justify-center cursor-pointer w-full h-full text-center p-6">
                <div className="w-16 h-16 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center mb-4 text-[#FF5A36] shadow-sm">
                  <div className="flex items-center justify-center gap-1">
                    <ImageIcon className="w-6 h-6" />
                    <Film className="w-5 h-5 opacity-80" />
                  </div>
                </div>
                <span className="font-bold text-[#171717] text-lg mb-1">
                  Upload Photos or Video
                </span>
                <span className="text-xs text-gray-500 max-w-[260px] leading-relaxed">
                  Select up to 10 photos (Max 10 MB each) or 1 video (Max 100 MB, up to 90s)
                </span>
                <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-full text-xs font-bold text-gray-700 shadow-sm hover:border-gray-300">
                  <UploadCloud className="w-4 h-4 text-[#FF5A36]" />
                  <span>Choose Media</span>
                </div>
                <input 
                  type="file" 
                  accept="image/*,video/mp4,video/quicktime,video/webm"
                  multiple
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
              {selectedProducts.map((product: any) => {
                const pImg = product.imageUrl || product.media?.[0]?.url || product.images?.[0] || '';
                return (
                  <div key={product.id} className="relative flex-shrink-0 group">
                    <div className="w-16 h-16 rounded-xl overflow-hidden border border-gray-100 shadow-sm bg-[#F9F6F0] flex items-center justify-center">
                      {pImg ? (
                        <img 
                          src={getMediaUrl(pImg)} 
                          alt={product.name || 'Product'}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-[10px] text-gray-400 font-semibold">No Image</span>
                      )}
                    </div>
                    <button 
                      onClick={() => setSelectedProductIds(prev => prev.filter(id => id !== product.id))}
                      className="absolute -top-2 -right-2 bg-white rounded-full shadow-md border border-gray-100 p-1 text-gray-500 hover:text-red-500 transition-colors"
                      title="Remove product"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {showTagSelector && (
        <ProductTagSelector 
          storeId={myStore?.id}
          initialSelected={selectedProductIds}
          onClose={() => setShowTagSelector(false)}
          onDone={(ids) => {
            setSelectedProductIds(ids);
            setShowTagSelector(false);
          }}
        />
      )}

      {/* Video Trimmer / Cropper Modal */}
      {isTrimmerOpen && pendingTrimmerFile && (
        <VideoTrimmerModal
          isOpen={isTrimmerOpen}
          onClose={() => {
            setIsTrimmerOpen(false);
            if (mediaFiles.length === 0) setPendingTrimmerFile(null);
          }}
          videoFile={pendingTrimmerFile}
          maxDurationSeconds={90}
          onTrimComplete={handleTrimComplete}
        />
      )}
    </div>
  );
}
