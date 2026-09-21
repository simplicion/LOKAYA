'use client';

import React, { useRef, useEffect, useState } from 'react';
import { getMediaUrl, isVideoMedia } from '@/lib/utils';
import { Film } from 'lucide-react';

export interface BannerMediaItemProps {
  url: string;
  alt?: string;
  isActiveSlide?: boolean;
  className?: string;
}

export function BannerMediaItem({
  url,
  alt = 'Promotional Banner',
  isActiveSlide = true,
  className = 'absolute inset-0 w-full h-full object-cover',
}: BannerMediaItemProps) {
  const isVideo = isVideoMedia(url);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isInViewport, setIsInViewport] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!isVideo) return;

    const el = videoRef.current;
    if (!el) return;

    // IntersectionObserver to detect when the video is visible on screen
    const observer = new IntersectionObserver(
      ([entry]) => {
        // Only consider in viewport when at least 25% of the banner is visible
        const visible = entry.isIntersecting && entry.intersectionRatio >= 0.25;
        setIsInViewport(visible);
      },
      {
        threshold: [0, 0.25, 0.5, 0.75, 1.0],
      }
    );

    observer.observe(el);

    // Also pause on tab switch / visibility change
    const handleVisibilityChange = () => {
      if (document.hidden && videoRef.current) {
        videoRef.current.pause();
      } else if (!document.hidden && isInViewport && isActiveSlide && videoRef.current) {
        videoRef.current.play().catch(() => {});
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isVideo, isInViewport, isActiveSlide]);

  // Handle play / pause based on viewport visibility and active carousel slide
  useEffect(() => {
    if (!isVideo) return;
    const video = videoRef.current;
    if (!video) return;

    const shouldPlay = isInViewport && isActiveSlide && !document.hidden;

    if (shouldPlay) {
      video.muted = true;
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          // Retry on mute in case browser policy was strict
          video.muted = true;
          video.play().catch(() => {});
        });
      }
    } else {
      video.pause();
    }
  }, [isVideo, isInViewport, isActiveSlide]);

  if (isVideo) {
    return (
      <div className="absolute inset-0 w-full h-full overflow-hidden bg-black select-none">
        <video
          ref={videoRef}
          src={getMediaUrl(url)}
          muted
          loop
          playsInline
          autoPlay
          preload="auto"
          onLoadedData={() => setIsLoaded(true)}
          className={`${className} transition-opacity duration-500 ${
            isLoaded ? 'opacity-85' : 'opacity-0'
          }`}
        />
        {/* Subtle Video Pill Badge */}
        <div className="absolute top-3 left-3 z-20 bg-black/50 backdrop-blur-xs text-white text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-white/10 pointer-events-none">
          <Film className="w-2.5 h-2.5 text-[#FF5A36]" />
          <span>VIDEO</span>
        </div>
      </div>
    );
  }

  return (
    <img
      src={getMediaUrl(url)}
      alt={alt}
      className={className}
      loading="eager"
    />
  );
}
