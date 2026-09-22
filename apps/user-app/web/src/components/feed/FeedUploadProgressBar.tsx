'use client';

import React, { useState } from 'react';
import { useUpload, ActiveUpload } from '@/context/UploadContext';
import { Loader2, CheckCircle2, AlertCircle, RotateCcw, X, Film, Sparkles } from 'lucide-react';
import { cn, getMediaUrl, isVideoMedia } from '@/lib/utils';

export function FeedUploadProgressBar() {
  const { activeUploads, dismissUpload, retryUpload } = useUpload();

  if (!activeUploads || activeUploads.length === 0) return null;

  return (
    <div className="flex flex-col gap-2.5 px-4 pt-1 pb-3 animate-in slide-in-from-top duration-300">
      {activeUploads.map((upload) => (
        <UploadCard
          key={upload.id}
          upload={upload}
          onDismiss={() => dismissUpload(upload.id)}
          onRetry={() => retryUpload(upload.id)}
        />
      ))}
    </div>
  );
}

function UploadThumbnail({ upload }: { upload: ActiveUpload }) {
  const [imgError, setImgError] = useState(false);
  const rawUrl = upload.thumbnailUrl;

  if (!rawUrl) {
    return (
      <div className="w-full h-full bg-orange-50 flex items-center justify-center text-[#FF5A36]">
        {upload.type === 'reel' ? (
          <Film className="w-5 h-5 text-[#FF5A36]" />
        ) : upload.type === 'story' ? (
          <Sparkles className="w-5 h-5 text-[#FF5A36]" />
        ) : (
          <span className="text-[10px] font-bold text-gray-500">{upload.type.toUpperCase()}</span>
        )}
      </div>
    );
  }

  const mediaUrl = getMediaUrl(rawUrl);
  // Check if it's explicitly video or if image loading already failed
  const isVideo = imgError || isVideoMedia(rawUrl) || (upload.type === 'reel' && !rawUrl.startsWith('data:image/'));

  if (isVideo) {
    const videoSrc = mediaUrl.includes('#t=') ? mediaUrl : `${mediaUrl}#t=0.1`;
    return (
      <video
        src={videoSrc}
        className="w-full h-full object-cover pointer-events-none"
        muted
        playsInline
        preload="metadata"
      />
    );
  }

  return (
    <img
      src={mediaUrl}
      alt="Upload thumbnail"
      className="w-full h-full object-cover"
      onError={() => setImgError(true)}
    />
  );
}

function UploadCard({
  upload,
  onDismiss,
  onRetry,
}: {
  upload: ActiveUpload;
  onDismiss: () => void;
  onRetry: () => void;
}) {
  const isCompleted = upload.status === 'completed';
  const isError = upload.status === 'error';
  const isFinishing = upload.status === 'finishing';

  let title = 'Posting...';
  if (upload.type === 'reel') title = isFinishing ? 'Processing reel...' : 'Sharing reel...';
  else if (upload.type === 'story') title = isFinishing ? 'Finishing story...' : 'Sharing story...';
  else title = isFinishing ? 'Finishing post...' : 'Posting...';

  if (isCompleted) {
    title = upload.type === 'story' ? 'Story published!' : upload.type === 'reel' ? 'Reel published!' : 'Posted!';
  } else if (isError) {
    title = 'Failed to post';
  }

  return (
    <div className={cn(
      "w-full bg-white rounded-2xl p-3 border shadow-sm flex items-center gap-3 transition-all duration-300",
      isCompleted ? "border-emerald-200 bg-emerald-50/40" : isError ? "border-red-200 bg-red-50/30" : "border-[#E5E2DC]"
    )}>
      {/* Thumbnail Preview */}
      <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-200/60 relative">
        <UploadThumbnail upload={upload} />
      </div>

      {/* Center Details & Progress Bar */}
      <div className="flex-1 min-w-0 flex flex-col justify-center gap-1.5">
        <div className="flex items-center justify-between">
          <span className={cn(
            "text-xs font-bold truncate",
            isCompleted ? "text-emerald-700" : isError ? "text-red-600" : "text-[#171717]"
          )}>
            {title}
          </span>
          <span className="text-[11px] font-semibold text-gray-400 tabular-nums">
            {isError ? '' : `${upload.progress}%`}
          </span>
        </div>

        {/* Progress Bar Track */}
        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden relative">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-300 ease-out",
              isCompleted 
                ? "bg-emerald-500" 
                : isError 
                  ? "bg-red-500" 
                  : "bg-gradient-to-r from-[#FF5A36] to-[#FF8C66] animate-pulse"
            )}
            style={{ width: `${Math.min(100, Math.max(5, upload.progress))}%` }}
          />
        </div>

        {upload.caption && !isError && (
          <p className="text-[11px] text-gray-400 truncate">
            {upload.caption}
          </p>
        )}

        {isError && upload.errorMessage && (
          <p className="text-[10px] text-red-500 line-clamp-1">
            {upload.errorMessage}
          </p>
        )}
      </div>

      {/* Right Action / Status Icons */}
      <div className="flex items-center gap-1 flex-shrink-0">
        {isCompleted && (
          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 animate-in zoom-in">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        )}

        {isError && (
          <div className="flex items-center gap-1">
            <button
              onClick={onRetry}
              className="p-1.5 rounded-full bg-red-100 hover:bg-red-200 text-red-600 transition-colors"
              title="Retry upload"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={onDismiss}
              className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 transition-colors"
              title="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {!isCompleted && !isError && (
          <div className="p-1.5">
            <Loader2 className="w-5 h-5 text-[#FF5A36] animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
}
