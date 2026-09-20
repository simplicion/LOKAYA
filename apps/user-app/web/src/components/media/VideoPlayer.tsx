'use client';

import React, { useRef, useEffect, useState, memo, forwardRef, useImperativeHandle } from 'react';
import Hls from 'hls.js';
import { getMediaUrl } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export interface VideoPlayerProps {
  src: string;
  poster?: string;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
  playsInline?: boolean;
  className?: string;
  isActive?: boolean;
  preload?: 'auto' | 'metadata' | 'none';
  onTimeUpdate?: (e: React.SyntheticEvent<HTMLVideoElement>) => void;
  onEnded?: () => void;
  onPlay?: () => void;
  onPause?: () => void;
  onClick?: (e: React.MouseEvent) => void;
}

export const VideoPlayer = memo(forwardRef<HTMLVideoElement, VideoPlayerProps>(function VideoPlayer({
  src,
  poster,
  autoPlay = true,
  muted = true,
  loop = true,
  playsInline = true,
  className = 'w-full h-full object-cover',
  isActive = true,
  preload = 'auto',
  onTimeUpdate,
  onEnded,
  onPlay,
  onPause,
  onClick,
}: VideoPlayerProps, ref) {
  const internalVideoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Expose the video element to parent ref
  useImperativeHandle(ref, () => internalVideoRef.current as HTMLVideoElement);

  const cleanSrc = getMediaUrl(src);
  const cleanPoster = poster ? getMediaUrl(poster) : undefined;
  const isHlsSource = Boolean(cleanSrc && (cleanSrc.includes('.m3u8') || cleanSrc.includes('/master') || cleanSrc.includes('/720p')));

  useEffect(() => {
    const video = internalVideoRef.current;
    if (!video || !cleanSrc) return;

    let destroyed = false;
    setHasError(false);

    const handleReady = () => {
      if (!destroyed) {
        setIsVideoReady(true);
        if (isActive && autoPlay && video.paused) {
          video.play().catch(() => {});
        }
      }
    };

    video.addEventListener('loadeddata', handleReady);
    video.addEventListener('canplay', handleReady);
    video.addEventListener('playing', () => {
      if (!destroyed) setIsVideoReady(true);
    });

    // Clean up previous HLS instance if any
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (isHlsSource) {
      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 4,
          maxBufferLength: 8,
          maxMaxBufferLength: 14,
          startFragPrefetch: false,
          progressive: true,
          autoStartLoad: isActive,
        });

        hlsRef.current = hls;
        hls.loadSource(cleanSrc);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          if (!destroyed && isActive && autoPlay) {
            video.play().catch(() => {});
          }
        });

        hls.on(Hls.Events.ERROR, (_, data) => {
          if (data.fatal) {
            console.warn('[VideoPlayer] HLS fatal error:', data.type, data.details);
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                hls.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                hls.recoverMediaError();
                break;
              default:
                hls.destroy();
                setHasError(true);
                break;
            }
          }
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Native Safari/iOS HLS support
        video.src = cleanSrc;
      } else {
        video.src = cleanSrc;
      }
    } else {
      // Standard Fast-Start MP4 / WebM
      video.src = cleanSrc;
    }

    return () => {
      destroyed = true;
      video.removeEventListener('loadeddata', handleReady);
      video.removeEventListener('canplay', handleReady);
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [cleanSrc, isHlsSource, isActive, autoPlay]);

  // Handle active playback state when user scrolls into/out of viewport
  useEffect(() => {
    const video = internalVideoRef.current;
    if (!video) return;

    if (isActive) {
      if (hlsRef.current) {
        hlsRef.current.startLoad();
      }
      if (video.paused && autoPlay) {
        video.play().catch(() => {});
      }
    } else {
      if (hlsRef.current) {
        hlsRef.current.stopLoad();
      }
      if (!video.paused) {
        video.pause();
      }
    }
  }, [isActive, autoPlay]);

  // Reactive sound toggle synchronization across global feed
  useEffect(() => {
    const video = internalVideoRef.current;
    if (video) {
      video.muted = Boolean(muted);
    }
  }, [muted]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-black flex items-center justify-center" onClick={onClick}>
      {/* Poster Image Background for instant 0ms visual presence */}
      {cleanPoster && (
        <img
          src={cleanPoster}
          alt="Video Preview"
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 pointer-events-none ${
            isVideoReady ? 'opacity-0' : 'opacity-100'
          }`}
        />
      )}

      {/* Video Element */}
      <video
        ref={internalVideoRef}
        poster={cleanPoster}
        autoPlay={autoPlay}
        muted={muted}
        loop={loop}
        playsInline={playsInline}
        preload={preload}
        onTimeUpdate={onTimeUpdate}
        onEnded={onEnded}
        onPlay={onPlay}
        onPause={onPause}
        className={className}
      />

      {/* Loading Pulse only if no poster is available and video isn't ready */}
      {!isVideoReady && !hasError && !cleanPoster && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
          <Loader2 className="w-8 h-8 animate-spin text-[#FF5A36]/80" />
        </div>
      )}
    </div>
  );
}));
