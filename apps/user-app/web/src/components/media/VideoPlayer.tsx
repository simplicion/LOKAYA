'use client';

import React, { useRef, useEffect, useState, useCallback, memo, forwardRef, useImperativeHandle } from 'react';
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
  isActive = false,
  isPreloadCandidate = false,
  preload,
  onTimeUpdate,
  onEnded,
  onPlay,
  onPause,
  onClick,
}: VideoPlayerProps, ref) {
  const internalVideoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const isAttachedRef = useRef(false);

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

  // Use refs for reactive states to avoid re-triggering teardown effects during rapid scroll
  const isActiveRef = useRef(isActive);
  const isPreloadCandidateRef = useRef(isPreloadCandidate);
  const autoPlayRef = useRef(autoPlay);

  useEffect(() => {
    isActiveRef.current = isActive;
    isPreloadCandidateRef.current = isPreloadCandidate;
    autoPlayRef.current = autoPlay;
  }, [isActive, isPreloadCandidate, autoPlay]);

  // Reset states when the media source changes
  useEffect(() => {
    setPosterFailed(false);
    setHasFirstFrameRendered(false);
    setIsVideoReady(false);
  }, [cleanSrc, cleanPoster]);

  // Cleanly attach HLS or native source
  const attachMediaSource = useCallback(() => {
    const video = internalVideoRef.current;
    if (!video || !cleanSrc || isAttachedRef.current) return;

    isAttachedRef.current = true;
    setHasError(false);

    if (isHlsSource) {
      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 4,
          maxBufferLength: 8,
          maxMaxBufferLength: 12,
          startFragPrefetch: true,
          progressive: true,
          autoStartLoad: false, // Strict: never auto-load until explicitly requested
        });

        hlsRef.current = hls;

        // SINGLE-FRAGMENT BUDGET THROTTLE (Instagram / TikTok Architecture):
        // When in speculative preloading mode (not active), stop loading immediately after chunk 0 is buffered
        hls.on(Hls.Events.FRAG_BUFFERED, () => {
          if (!isActiveRef.current) {
            hls.stopLoad();
          }
        });

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          if (isActiveRef.current && autoPlayRef.current) {
            video.play().catch(() => {});
          } else {
            video.pause();
          }
        });

        hls.on(Hls.Events.ERROR, (_, data) => {
          if (data.fatal) {
            console.warn('[VideoPlayer] HLS fatal error:', data.type, data.details);
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                if (isActiveRef.current) {
                  hls.startLoad();
                }
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                hls.recoverMediaError();
                break;
              default:
                hls.destroy();
                isAttachedRef.current = false;
                setHasError(true);
                break;
            }
          }
        });

        hls.attachMedia(video);
        hls.loadSource(cleanSrc);
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Native Safari/iOS HLS
        video.src = cleanSrc;
      } else {
        video.src = cleanSrc;
      }
    } else {
      // Standard progressive MP4 / WebM
      video.src = cleanSrc;
    }
  }, [cleanSrc, isHlsSource]);

  // Cleanly detach and reclaim GPU decoders and buffer memory
  const detachMediaSource = useCallback(() => {
    if (hlsRef.current) {
      hlsRef.current.stopLoad();
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    const video = internalVideoRef.current;
    if (video) {
      if (!video.paused) video.pause();
      video.removeAttribute('src');
      video.load();
    }
    isAttachedRef.current = false;
    setIsVideoReady(false);
  }, []);

  // Set up video element event listeners once
  useEffect(() => {
    const video = internalVideoRef.current;
    if (!video) return;

    let destroyed = false;

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

    const handlePlaying = () => {
      if (!destroyed) {
        setIsVideoReady(true);
        if (!isActiveRef.current) {
          video.pause();
        } else if (video.currentTime > 0.01) {
          setHasFirstFrameRendered(true);
        }
      }
    };

    video.addEventListener('loadeddata', handleReady);
    video.addEventListener('canplay', handleReady);
    video.addEventListener('timeupdate', handleFirstFrame);
    video.addEventListener('playing', handlePlaying);

    return () => {
      destroyed = true;
      video.removeEventListener('loadeddata', handleReady);
      video.removeEventListener('canplay', handleReady);
      video.removeEventListener('timeupdate', handleFirstFrame);
      video.removeEventListener('playing', handlePlaying);
      detachMediaSource();
    };
  }, [detachMediaSource]);

  // 3-Zone Virtual Viewport Lifecycle Controller
  useEffect(() => {
    const video = internalVideoRef.current;
    if (!video || !cleanSrc) return;

    if (isActive) {
      // ZONE 0: Active Viewport Item
      if (!isAttachedRef.current) {
        attachMediaSource();
      }
      if (hlsRef.current) {
        hlsRef.current.startLoad();
      }
      if (video.paused && autoPlay) {
        video.play().catch(() => {});
      }
    } else if (isPreloadCandidate) {
      // ZONE 1: Speculative Preload Candidate (Immediate adjacent / entering prewarm margin)
      if (!isAttachedRef.current) {
        attachMediaSource();
      }
      if (!video.paused) {
        video.pause();
      }
      if (hlsRef.current) {
        // Speculatively load chunk 0 into memory; stops as soon as first chunk buffers
        hlsRef.current.startLoad(0);
      }
    } else {
      // ZONE 2: Dormant / Off-Screen Item
      if (!video.paused) {
        video.pause();
      }
      if (hlsRef.current) {
        hlsRef.current.stopLoad();
      }
      // Reclaim hardware decoder and memory when post moves completely offscreen
      if (isAttachedRef.current) {
        detachMediaSource();
      }
    }
  }, [isActive, isPreloadCandidate, autoPlay, cleanSrc, attachMediaSource, detachMediaSource]);

  // Reactive sound toggle synchronization across global feed
  useEffect(() => {
    const video = internalVideoRef.current;
    if (video) {
      video.muted = Boolean(muted);
    }
  }, [muted]);

  // Dynamic preload attribute to ensure browser native engine doesn't eagerly fetch when dormant
  const effectivePreload = preload || (isActive ? 'auto' : isPreloadCandidate ? 'metadata' : 'none');

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
        preload={effectivePreload}
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

      {/* Loading Pulse only if no poster is available, video isn't ready, and video is active */}
      {!isVideoReady && !hasError && !cleanPoster && !hasFirstFrameRendered && isActive && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none z-20">
          <Loader2 className="w-8 h-8 animate-spin text-[#FF5A36]/80" />
        </div>
      )}
    </div>
  );
}));
