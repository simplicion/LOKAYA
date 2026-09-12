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

  const performPostUpload = async (uploadId: string, params: {
    isReel: boolean;
    mediaFiles: File[];
    caption: string;
    selectedProductIds: string[];
  }) => {
    try {
      updateUpload(uploadId, { progress: 20, status: 'uploading' });

      const mediaIds: string[] = [];
      const legacyMedia: { url: string; type: string }[] = [];
      const totalFiles = params.mediaFiles.length;

      for (let i = 0; i < totalFiles; i++) {
        const file = params.mediaFiles[i];
        const type = file.type.startsWith('video/') ? 'VIDEO' : 'IMAGE';

        // Update progress per file
        const baseProgress = 20 + Math.round(((i + 0.3) / totalFiles) * 50);
        updateUpload(uploadId, { progress: baseProgress });

        let posterUrl: string | undefined = undefined;

        // If it's a video, generate and upload thumbnail
        if (type === 'VIDEO') {
          try {
            const { generateVideoThumbnail } = await import('@/lib/utils');
            const { thumbnailBlob, thumbnailDataUrl } = await generateVideoThumbnail(file);
            if (thumbnailDataUrl) {
              updateUpload(uploadId, { thumbnailUrl: thumbnailDataUrl });
            }
            if (thumbnailBlob && thumbnailBlob.size > 0) {
              const thumbFormData = new FormData();
              thumbFormData.append('file', new File([thumbnailBlob], `thumb_${Date.now()}.jpg`, { type: 'image/jpeg' }));
              const thumbRes = await uploadMedia(thumbFormData).unwrap();
              posterUrl = thumbRes.publicUrl || thumbRes.url || undefined;
            }
          } catch (thumbErr) {
            console.warn('[UploadContext] Video thumbnail generation notice:', thumbErr);
          }
        }

        let uploadedUrl: string | null = null;

        // 1. Direct upload strategy
        try {
          const formData = new FormData();
          formData.append('file', file);
          const uploadRes = await uploadMedia(formData).unwrap();
          uploadedUrl = uploadRes.publicUrl || uploadRes.url || null;
        } catch (err) {
          console.warn('Direct upload fallback:', err);
        }

        // 2. Presigned URL strategy fallback
        if (!uploadedUrl) {
          try {
            const { signedUrl, fileKey } = await getPresignedUrl({
              filename: file.name || 'upload',
              contentType: file.type || (type === 'VIDEO' ? 'video/mp4' : 'image/jpeg')
            }).unwrap();

            const s3Res = await fetch(signedUrl, {
              method: 'PUT',
              body: file,
              headers: { 'Content-Type': file.type || (type === 'VIDEO' ? 'video/mp4' : 'image/jpeg') }
            });

            if (!s3Res.ok) throw new Error('Presigned upload failed');

            const { mediaAsset } = await processMedia({ fileKey, type }).unwrap();
            mediaIds.push(mediaAsset.id);
          } catch (err) {
            console.error('Presigned upload error:', err);
          }
        } else {
          legacyMedia.push({
            url: uploadedUrl,
            posterUrl,
            type,
            status: type === 'VIDEO' ? 'PROCESSING' : 'READY'
          } as any);
        }

        const completedFileProgress = 20 + Math.round(((i + 1) / totalFiles) * 55);
        updateUpload(uploadId, { progress: completedFileProgress });
      }

      if (mediaIds.length === 0 && legacyMedia.length === 0) {
        throw new Error('Could not upload media files. Please check network connection.');
      }

      updateUpload(uploadId, { progress: 85, status: 'finishing' });

      const payload: any = {
        caption: params.caption || '',
        productIds: params.selectedProductIds || [],
      };
      if (mediaIds.length > 0) payload.mediaIds = mediaIds;
      if (legacyMedia.length > 0) payload.media = legacyMedia;

      // Create post (ContentService creates Post with VIDEO/IMAGE MediaAsset)
      await createPost(payload).unwrap();

      // Success -> 100%
      updateUpload(uploadId, { progress: 100, status: 'completed' });
      
      // Invalidate RTK queries to refresh feed and reels
      dispatch(api.util.invalidateTags(['Post', 'Reel', 'User']));
      toast.success(params.isReel ? 'Video post published!' : 'Post published!');

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
      updateUpload(uploadId, { progress: 25, status: 'uploading' });

      const formData = new FormData();
      formData.append('file', params.file);
      const uploadRes = await uploadMedia(formData).unwrap();
      const mediaUrl = uploadRes.publicUrl || uploadRes.url;
      const fileKey = uploadRes.fileKey;

      if (!mediaUrl) {
        throw new Error('Failed to upload story media file.');
      }

      updateUpload(uploadId, { progress: 80, status: 'finishing' });

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

    // Instantly navigate home
    router.push('/home');

    // Run upload asynchronously in background
    performPostUpload(uploadId, params);
  }, [router, performPostUpload]);

  const startStoryUpload = useCallback((params: {
    file: File;
    storeId: string;
    mediaType: 'IMAGE' | 'VIDEO';
    caption?: string;
    productId?: string;
    previewUrl: string;
  }) => {
    const uploadId = `story-upload-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newUpload: ActiveUpload = {
      id: uploadId,
      type: 'story',
      caption: params.caption,
      thumbnailUrl: params.previewUrl,
      progress: 10,
      status: 'uploading',
      retryPayload: { kind: 'story', params }
    };

    setActiveUploads(prev => [newUpload, ...prev]);

    // Run upload in background
    performStoryUpload(uploadId, params);
  }, [performStoryUpload]);

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
