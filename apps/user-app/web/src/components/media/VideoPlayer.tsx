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
  isPreloadCandidate?: boolean;
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
  isPreloadCandidate = false,
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
  const [hasFirstFrameRendered, setHasFirstFrameRendered] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [posterFailed, setPosterFailed] = useState(false);

  // Expose the video element to parent ref
  useImperativeHandle(ref, () => internalVideoRef.current as HTMLVideoElement);

  // Ensure poster is a genuine image URL, NEVER an HLS .m3u8 manifest or video stream
  const isValidPoster = (url?: string): boolean => {
    if (!url) return false;
    const clean = url.toLowerCase().split('?')[0];
    if (
      clean.endsWith('.m3u8') ||
      clean.endsWith('.mp4') ||
      clean.endsWith('.ts') ||
      clean.endsWith('.mov') ||
      clean.endsWith('.webm') ||
      clean.includes('/processed/videos/') ||
      clean.includes('/master')
    ) {
      return false;
    }
    return true;
  };

  const cleanSrc = getMediaUrl(src);
  const cleanPoster = isValidPoster(poster) ? getMediaUrl(poster) : undefined;
  const isHlsSource = Boolean(cleanSrc && (cleanSrc.includes('.m3u8') || cleanSrc.includes('/master') || cleanSrc.includes('/720p')));

  // Use refs for isActive and autoPlay so media listeners don't re-trigger setup effect
  const isActiveRef = useRef(isActive);
  const autoPlayRef = useRef(autoPlay);
  useEffect(() => {
    isActiveRef.current = isActive;
    autoPlayRef.current = autoPlay;
  }, [isActive, autoPlay]);

  // Reset states when the media source changes
  useEffect(() => {
    setPosterFailed(false);
    setHasFirstFrameRendered(false);
    setIsVideoReady(false);
  }, [cleanSrc, cleanPoster]);

  // Core setup: Initialized ONCE per cleanSrc.
  // CRITICAL: isActive and isPreloadCandidate MUST NOT be dependencies here,
  // otherwise scrolling destroys HLS instances, wiping the video buffer and causing black screens!
  useEffect(() => {
    const video = internalVideoRef.current;
    if (!video || !cleanSrc) return;

    let destroyed = false;
    setHasError(false);

    const handleReady = () => {
      if (!destroyed) {
        setIsVideoReady(true);
        if (isActiveRef.current && autoPlayRef.current) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      }
    };

    const handleFirstFrame = () => {
      if (!destroyed && video.currentTime > 0.01) {
        setHasFirstFrameRendered(true);
      }
    };

    video.addEventListener('loadeddata', handleReady);
    video.addEventListener('canplay', handleReady);
    video.addEventListener('timeupdate', handleFirstFrame);
    video.addEventListener('playing', () => {
      if (!destroyed) {
        setIsVideoReady(true);
        if (!isActiveRef.current) {
          video.pause();
        } else if (video.currentTime > 0.01) {
          setHasFirstFrameRendered(true);
        }
      }
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
          backBufferLength: 6,
          maxBufferLength: 10,
          maxMaxBufferLength: 16,
          startFragPrefetch: true,
          progressive: true,
          autoStartLoad: Boolean(isActiveRef.current || isPreloadCandidate),
        });

        hlsRef.current = hls;
        hls.loadSource(cleanSrc);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          if (!destroyed) {
            if (isActiveRef.current && autoPlayRef.current) {
              video.play().catch(() => {});
            } else {
              video.pause();
            }
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
      video.removeEventListener('timeupdate', handleFirstFrame);
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [cleanSrc, isHlsSource]);

  // Handle active playback state when user scrolls into/out of viewport or item becomes preload candidate
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
      // STRICT: Any non-active video MUST be paused immediately
      // The video element remains frozen on its decoded frame — ZERO black flash
      if (!video.paused) {
        video.pause();
      }
      if (isPreloadCandidate) {
        // Speculatively load first segment into memory while strictly keeping playback paused
        if (hlsRef.current) {
          hlsRef.current.startLoad(0);
        }
      } else {
        // Distant item: stop loading fragments to save bandwidth & memory
        if (hlsRef.current) {
          hlsRef.current.stopLoad();
        }
      }
    }
  }, [isActive, isPreloadCandidate, autoPlay]);

  // Reactive sound toggle synchronization across global feed
  useEffect(() => {
    const video = internalVideoRef.current;
    if (video) {
      video.muted = Boolean(muted);
    }
  }, [muted]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-black flex items-center justify-center" onClick={onClick}>
      {/* Video Element */}
      <video
        ref={internalVideoRef}
        poster={cleanPoster}
        autoPlay={Boolean(autoPlay && isActive)}
        muted={muted}
        loop={loop}
        playsInline={playsInline}
        preload={preload}
        onTimeUpdate={(e) => {
          if (!hasFirstFrameRendered && (e.currentTarget.currentTime > 0.01)) {
            setHasFirstFrameRendered(true);
          }
          if (onTimeUpdate) onTimeUpdate(e);
        }}
        onEnded={onEnded}
        onPlay={onPlay}
        onPause={onPause}
        className={className}
      />

      {/* Poster Image Overlay on top (z-10): 
           - Stays visible until the video's first frame is actively decoding to prevent any black screen flash
           - Once first frame renders, fades to opacity-0 permanently for this source
           - Paused videos stay on their last decoded frame without re-covering with black */}
      {cleanPoster && !posterFailed && (
        <img
          src={cleanPoster}
          alt=""
          onError={() => setPosterFailed(true)}
          className={`absolute inset-0 w-full h-full object-cover pointer-events-none z-10 transition-opacity duration-200 ${
            hasFirstFrameRendered ? 'opacity-0' : 'opacity-100'
          }`}
        />
      )}

      {/* Loading Pulse only if no poster is available and video isn't ready */}
      {!isVideoReady && !hasError && !cleanPoster && !hasFirstFrameRendered && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none z-20">
          <Loader2 className="w-8 h-8 animate-spin text-[#FF5A36]/80" />
        </div>
      )}
    </div>
  );
}));
