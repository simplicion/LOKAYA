'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useUploadMediaMutation, useCreatePostMutation, useCreateReelMutation, useCreateStoryMutation, useGetPresignedUrlMutation, useProcessMediaMutation, api } from '@/lib/api';
import { useDispatch } from 'react-redux';
import { toast } from 'sonner';

export interface ActiveUpload {
  id: string;
  type: 'post' | 'reel' | 'story';
  caption?: string;
  thumbnailUrl: string;
  progress: number; // 0 - 100
  status: 'uploading' | 'finishing' | 'completed' | 'error';
  errorMessage?: string;
  retryPayload?: any;
}

interface UploadContextType {
  activeUploads: ActiveUpload[];
  startPostUpload: (params: {
    isReel: boolean;
    mediaFiles: File[];
    caption: string;
    selectedProductIds: string[];
    previewUrls: string[];
  }) => void;
  startStoryUpload: (params: {
    file: File;
    storeId: string;
    mediaType: 'IMAGE' | 'VIDEO';
    caption?: string;
    productId?: string;
    previewUrl: string;
    thumbnailUrl?: string;
  }) => void;
  dismissUpload: (id: string) => void;
  retryUpload: (id: string) => void;
}

const UploadContext = createContext<UploadContextType | null>(null);

export function UploadProvider({ children }: { children: React.ReactNode }) {
  const [activeUploads, setActiveUploads] = useState<ActiveUpload[]>([]);
  const router = useRouter();
  const dispatch = useDispatch();

  const [uploadMedia] = useUploadMediaMutation();
  const [createPost] = useCreatePostMutation();
  const [createReel] = useCreateReelMutation();
  const [createStory] = useCreateStoryMutation();
  const [getPresignedUrl] = useGetPresignedUrlMutation();
  const [processMedia] = useProcessMediaMutation();

  const updateUpload = useCallback((id: string, updates: Partial<ActiveUpload>) => {
    setActiveUploads(prev => prev.map(u => (u.id === id ? { ...u, ...updates } : u)));
  }, []);

  const dismissUpload = useCallback((id: string) => {
    setActiveUploads(prev => prev.filter(u => u.id !== id));
  }, []);

  const uploadFileToCloud = async (
    file: File,
    type: 'VIDEO' | 'IMAGE',
    onProgress: (percent: number) => void
  ): Promise<{ mediaId?: string; url: string; posterUrl?: string; fileKey: string }> => {
    // Strategy 1 (Primary - YouTube/Instagram standard): Direct Presigned S3/R2 PUT with live byte tracking
    try {
      const ext = file.name ? file.name.split('.').pop() : (type === 'VIDEO' ? 'mp4' : 'jpg');
      const { signedUrl, fileKey, publicUrl, viewUrl } = await getPresignedUrl({
        filename: `upload_${Date.now()}.${ext}`,
        contentType: file.type || (type === 'VIDEO' ? 'video/mp4' : 'image/jpeg')
      }).unwrap();

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', signedUrl, true);
        xhr.setRequestHeader('Content-Type', file.type || (type === 'VIDEO' ? 'video/mp4' : 'image/jpeg'));
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const pct = Math.round((event.loaded / event.total) * 100);
            onProgress(pct);
          }
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(`Direct storage upload responded with HTTP ${xhr.status}`));
          }
        };
        xhr.onerror = () => reject(new Error('Direct storage network connection error'));
        xhr.send(file);
      });

      // Register MediaAsset and queue background HLS adaptive processing
      const processRes = await processMedia({ fileKey, type }).unwrap();
      const mediaAsset = processRes?.mediaAsset || processRes;

      return {
        mediaId: mediaAsset?.id,
        fileKey,
        url: mediaAsset?.url || publicUrl || viewUrl
      };
    } catch (directErr) {
      console.warn('[UploadContext] Direct storage upload notice, falling back to streaming endpoint:', directErr);
    }

    // Strategy 2 (Fallback): Disk-buffered streaming upload to /media/upload
    const formData = new FormData();
    formData.append('file', file);
    const uploadRes = await uploadMedia(formData).unwrap();
    const fileKey = uploadRes.fileKey || `uploads/fallback/${Date.now()}`;
    const url = uploadRes.publicUrl || uploadRes.url;

    try {
      const processRes = await processMedia({ fileKey, type }).unwrap();
      return {
        mediaId: processRes?.mediaAsset?.id,
        fileKey,
        url: processRes?.mediaAsset?.url || url
      };
    } catch {
      return { fileKey, url };
    }
  };

  const performPostUpload = async (uploadId: string, params: {
    isReel: boolean;
    mediaFiles: File[];
    caption: string;
    selectedProductIds: string[];
  }) => {
    try {
      updateUpload(uploadId, { progress: 10, status: 'uploading' });

      const mediaIds: string[] = [];
      const legacyMedia: { url: string; posterUrl?: string; type: string; status: string }[] = [];
      const totalFiles = params.mediaFiles.length;

      for (let i = 0; i < totalFiles; i++) {
        const file = params.mediaFiles[i];
        const type = file.type.startsWith('video/') ? 'VIDEO' : 'IMAGE';

        let posterUrl: string | undefined = undefined;

        // If it's a video, generate and upload a crisp first-frame thumbnail
        if (type === 'VIDEO') {
          try {
            const { generateVideoThumbnail } = await import('@/lib/utils');
            const { thumbnailBlob, thumbnailDataUrl } = await generateVideoThumbnail(file);
            if (thumbnailDataUrl) {
              updateUpload(uploadId, { thumbnailUrl: thumbnailDataUrl });
            }
            if (thumbnailBlob && thumbnailBlob.size > 0) {
              const thumbRes = await uploadFileToCloud(
                new File([thumbnailBlob], `thumb_${Date.now()}.jpg`, { type: 'image/jpeg' }),
                'IMAGE',
                () => {}
              );
              posterUrl = thumbRes.url;
            }
          } catch (thumbErr) {
            console.warn('[UploadContext] Video thumbnail generation notice:', thumbErr);
          }
        }

        // Upload media file directly to storage with live byte progress
        const uploadResult = await uploadFileToCloud(file, type, (filePct) => {
          const fileSlice = 70 / totalFiles;
          const currentTotal = 15 + Math.round((i * fileSlice) + (filePct * fileSlice / 100));
          updateUpload(uploadId, { progress: Math.min(85, Math.max(15, currentTotal)) });
        });

        if (uploadResult.mediaId) {
          mediaIds.push(uploadResult.mediaId);
        } else if (uploadResult.url) {
          legacyMedia.push({
            url: uploadResult.url,
            posterUrl,
            type,
            status: type === 'VIDEO' ? 'PROCESSING' : 'READY'
          });
        }
      }

      if (mediaIds.length === 0 && legacyMedia.length === 0) {
        throw new Error('Could not upload media files. Please check network connection.');
      }

      updateUpload(uploadId, { progress: 88, status: 'finishing' });

      const payload: any = {
        caption: params.caption || '',
        productIds: params.selectedProductIds || [],
      };
      if (mediaIds.length > 0) payload.mediaIds = mediaIds;
      if (legacyMedia.length > 0) payload.media = legacyMedia;

      // Golden standard: Call createReel when isReel is true, otherwise createPost
      if (params.isReel) {
        await createReel(payload).unwrap();
      } else {
        await createPost(payload).unwrap();
      }

      // Success -> 100%
      updateUpload(uploadId, { progress: 100, status: 'completed' });
      
      // Invalidate RTK queries to refresh feed and reels
      dispatch(api.util.invalidateTags(['Post', 'Reel', 'User']));
      toast.success(params.isReel ? 'Video reel published!' : 'Post published!');

      // Auto dismiss after 2.5s
      setTimeout(() => {
        dismissUpload(uploadId);
      }, 2500);
    } catch (err: any) {
      console.error('Upload failed:', err);
      const errMsg = err?.data?.message || err?.message || 'Failed to upload. Please try again.';
      updateUpload(uploadId, {
        status: 'error',
        errorMessage: errMsg
      });
      toast.error(errMsg);
    }
  };

  const performStoryUpload = async (uploadId: string, params: {
    file: File;
    storeId: string;
    mediaType: 'IMAGE' | 'VIDEO';
    caption?: string;
    productId?: string;
  }) => {
    try {
      updateUpload(uploadId, { progress: 15, status: 'uploading' });

      const uploadResult = await uploadFileToCloud(params.file, params.mediaType, (pct) => {
        const mappedProgress = 15 + Math.round((pct / 100) * 65);
        updateUpload(uploadId, { progress: Math.min(80, Math.max(15, mappedProgress)) });
      });

      const mediaUrl = uploadResult.url;
      const fileKey = uploadResult.fileKey;

      if (!mediaUrl) {
        throw new Error('Failed to upload story media file.');
      }

      updateUpload(uploadId, { progress: 85, status: 'finishing' });

      await createStory({
        storeId: params.storeId,
        mediaUrl,
        fileKey,
        mediaType: params.mediaType,
        caption: params.caption || undefined,
        productId: params.productId || undefined,
      }).unwrap();

      updateUpload(uploadId, { progress: 100, status: 'completed' });
      dispatch(api.util.invalidateTags(['Story']));
      toast.success('Story published for 24 hours!');

      setTimeout(() => {
        dismissUpload(uploadId);
      }, 2500);
    } catch (err: any) {
      console.error('Story upload failed:', err);
      const errMsg = err?.data?.message || err?.message || 'Failed to post story.';
      updateUpload(uploadId, {
        status: 'error',
        errorMessage: errMsg
      });
      toast.error(errMsg);
    }
  };

  const startPostUpload = useCallback((params: {
    isReel: boolean;
    mediaFiles: File[];
    caption: string;
    selectedProductIds: string[];
    previewUrls: string[];
  }) => {
    const uploadId = `upload-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newUpload: ActiveUpload = {
      id: uploadId,
      type: params.isReel ? 'reel' : 'post',
      caption: params.caption,
      thumbnailUrl: params.previewUrls[0] || '',
      progress: 10,
      status: 'uploading',
      retryPayload: { kind: 'post', params }
    };

    setActiveUploads(prev => [newUpload, ...prev]);

    // If it's a reel / video post and thumbnailUrl is not a data URL, generate thumbnail immediately
    if (params.isReel && params.mediaFiles[0] && (!newUpload.thumbnailUrl || !newUpload.thumbnailUrl.startsWith('data:image/'))) {
      import('@/lib/utils').then(({ generateVideoThumbnail }) => {
        generateVideoThumbnail(params.mediaFiles[0])
          .then(({ thumbnailDataUrl }) => {
            if (thumbnailDataUrl) {
              updateUpload(uploadId, { thumbnailUrl: thumbnailDataUrl });
            }
          })
          .catch(() => {});
      });
    }

    // Instantly navigate home
    router.push('/home');

    // Run upload asynchronously in background
    performPostUpload(uploadId, params);
  }, [router, performPostUpload, updateUpload]);

  const startStoryUpload = useCallback((params: {
    file: File;
    storeId: string;
    mediaType: 'IMAGE' | 'VIDEO';
    caption?: string;
    productId?: string;
    previewUrl: string;
    thumbnailUrl?: string;
  }) => {
    const uploadId = `story-upload-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const initialThumb = params.thumbnailUrl || params.previewUrl;
    const newUpload: ActiveUpload = {
      id: uploadId,
      type: 'story',
      caption: params.caption,
      thumbnailUrl: initialThumb,
      progress: 10,
      status: 'uploading',
      retryPayload: { kind: 'story', params }
    };

    setActiveUploads(prev => [newUpload, ...prev]);

    // If it's a video and initial thumbnail is not a data URL, generate crisp canvas thumbnail immediately
    if (params.mediaType === 'VIDEO' && (!initialThumb || !initialThumb.startsWith('data:image/'))) {
      import('@/lib/utils').then(({ generateVideoThumbnail }) => {
        generateVideoThumbnail(params.file)
          .then(({ thumbnailDataUrl }) => {
            if (thumbnailDataUrl) {
              updateUpload(uploadId, { thumbnailUrl: thumbnailDataUrl });
            }
          })
          .catch(() => {});
      });
    }

    // Run upload in background
    performStoryUpload(uploadId, params);
  }, [performStoryUpload, updateUpload]);

  const retryUpload = useCallback((id: string) => {
    const upload = activeUploads.find(u => u.id === id);
    if (!upload || !upload.retryPayload) return;

    updateUpload(id, { status: 'uploading', progress: 15, errorMessage: undefined });
    if (upload.retryPayload.kind === 'post') {
      performPostUpload(id, upload.retryPayload.params);
    } else if (upload.retryPayload.kind === 'story') {
      performStoryUpload(id, upload.retryPayload.params);
    }
  }, [activeUploads, updateUpload, performPostUpload, performStoryUpload]);

  return (
    <UploadContext.Provider
      value={{
        activeUploads,
        startPostUpload,
        startStoryUpload,
        dismissUpload,
        retryUpload,
      }}
    >
      {children}
    </UploadContext.Provider>
  );
}

export function useUpload() {
  const context = useContext(UploadContext);
  if (!context) {
    throw new Error('useUpload must be used within an UploadProvider');
  }
  return context;
}
