import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getMediaUrl(url: string | null | undefined): string {
  if (!url) return '';
  
  // If it's a data URL or blob URL, return as is
  if (url.startsWith('data:') || url.startsWith('blob:')) {
    return url;
  }

  // Determine base API URL
  let apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4002/api/v1';
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    // In production or on live domain, never point to localhost on client device
    if ((host.includes('lokaya.shop') || host.includes('lokaya.com')) && (apiUrl.includes('localhost') || apiUrl.includes('127.0.0.1'))) {
      apiUrl = 'https://api.lokaya.shop/api/v1';
    }
  }

  // 1. If it's an S3 protocol URL: s3://bucket/key
  if (url.startsWith('s3://')) {
    const withoutScheme = url.replace(/^s3:\/\//, '');
    const segments = withoutScheme.split('/');
    const fileKey = segments.length > 1 ? segments.slice(1).join('/') : segments[0];
    return `${apiUrl}/media/stream/${fileKey}`;
  }

  // 2. If it's a direct Cloudflare R2 storage endpoint, rewrite to backend stream proxy
  if (url.includes('.r2.cloudflarestorage.com/')) {
    const parts = url.split('.r2.cloudflarestorage.com/')[1];
    if (parts) {
      const pathSegments = parts.split('/');
      // Skip bucket name if present (e.g. lokaya-cdn/...)
      const fileKey = pathSegments.length > 1 ? pathSegments.slice(1).join('/') : pathSegments[0];
      return `${apiUrl}/media/stream/${fileKey}`;
    }
  }

  // 3. If it's the broken R2 dev domain, rewrite to the working backend media stream proxy
  if (url.includes('pub-9735c0214aaa423b89c9c5f647cc184c.r2.dev/')) {
    const fileKey = url.split('.r2.dev/')[1];
    return `${apiUrl}/media/stream/${fileKey}`;
  }

  // 4. If it has a query parameter key (/media/view?key=... or /view?key=...)
  if (url.includes('/media/view?key=') || url.includes('/view?key=')) {
    const splitKey = url.includes('/media/view?key=') ? '/media/view?key=' : '/view?key=';
    const key = decodeURIComponent(url.split(splitKey)[1].split('&')[0]);
    return `${apiUrl}/media/stream/${key}`;
  }

  // 5. If it's already a stream URL: .../media/stream/...
  if (url.includes('/media/stream/')) {
    const fileKey = url.split('/media/stream/')[1].split('?')[0];
    return `${apiUrl}/media/stream/${fileKey}`;
  }

  // 6. Rewrite any localhost / 127.0.0.1 / api.lokaya.com / wrong-host media URLs
  if (
    url.includes('localhost:4002') ||
    url.includes('127.0.0.1:4002') ||
    url.includes('api.lokaya.com') ||
    url.includes('lokaya-backend:4002')
  ) {
    if (url.includes('/api/v1/')) {
      const subpath = url.split('/api/v1/')[1];
      return `${apiUrl}/${subpath}`;
    }
    if (url.includes('/media/')) {
      const subpath = url.split('/media/')[1];
      return `${apiUrl}/media/${subpath}`;
    }
  }

  // 7. If it's a relative backend path
  if (url.startsWith('/api/v1/')) {
    const backendHost = apiUrl.replace(/\/api\/v1\/?$/, '');
    return `${backendHost}${url}`;
  }

  if (url.startsWith('/media/')) {
    return `${apiUrl}${url}`;
  }

  // 8. If it's a raw storage key like uploads/... or processed/...
  if (url.startsWith('uploads/') || url.startsWith('processed/')) {
    return `${apiUrl}/media/stream/${url}`;
  }

  return url;
}

export function isVideoMedia(url?: string | null): boolean {
  if (!url) return false;
  const clean = url.split('?')[0].toLowerCase();
  return (
    clean.endsWith('.mp4') ||
    clean.endsWith('.webm') ||
    clean.endsWith('.mov') ||
    clean.endsWith('.m4v') ||
    clean.endsWith('.mkv') ||
    clean.endsWith('.ogv') ||
    clean.endsWith('.m3u8') ||
    clean.includes('/videos/') ||
    clean.includes('/video/') ||
    clean.includes('master.m3u8') ||
    url.includes('/video/') ||
    url.includes('type=video')
  );
}

export function generateVideoThumbnail(file: File): Promise<{ thumbnailBlob: Blob; thumbnailDataUrl: string }> {
  return new Promise((resolve, reject) => {
    try {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.muted = true;
      video.playsInline = true;
      video.crossOrigin = 'anonymous';
      const url = URL.createObjectURL(file);
      video.src = url;

      let captured = false;
      const timeoutId = setTimeout(() => {
        if (!captured) {
          captured = true;
          URL.revokeObjectURL(url);
          // Fallback empty blob
          resolve({ thumbnailBlob: new Blob(), thumbnailDataUrl: '' });
        }
      }, 5000);

      video.onloadedmetadata = () => {
        video.currentTime = Math.min(0.5, (video.duration || 1) / 2);
      };

      video.onseeked = () => {
        if (captured) return;
        captured = true;
        clearTimeout(timeoutId);
        try {
          const canvas = document.createElement('canvas');
          const width = video.videoWidth || 640;
          const height = video.videoHeight || 1136;
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(video, 0, 0, width, height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
            canvas.toBlob((blob) => {
              URL.revokeObjectURL(url);
              resolve({
                thumbnailBlob: blob || new Blob(),
                thumbnailDataUrl: dataUrl
              });
            }, 'image/jpeg', 0.85);
          } else {
            URL.revokeObjectURL(url);
            resolve({ thumbnailBlob: new Blob(), thumbnailDataUrl: '' });
          }
        } catch (err) {
          URL.revokeObjectURL(url);
          resolve({ thumbnailBlob: new Blob(), thumbnailDataUrl: '' });
        }
      };

      video.onerror = () => {
        if (!captured) {
          captured = true;
          clearTimeout(timeoutId);
          URL.revokeObjectURL(url);
          resolve({ thumbnailBlob: new Blob(), thumbnailDataUrl: '' });
        }
      };
    } catch {
      resolve({ thumbnailBlob: new Blob(), thumbnailDataUrl: '' });
    }
  });
}

export function formatTimeAgo(date: string | Date | number | undefined | null): string {
  if (!date) return 'Recently';

  try {
    const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();

    if (isNaN(diffMs)) return 'Recently';
    
    // Future or right now (< 10 seconds)
    if (diffMs < 10000 && diffMs >= 0) return 'Just now';
    if (diffMs < 0) return 'Just now';

    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return `${diffSec}s ago`;

    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;

    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;

    const diffWeeks = Math.floor(diffDays / 7);
    if (diffWeeks < 4) return `${diffWeeks}w ago`;

    const diffMonths = Math.floor(diffDays / 30);
    if (diffMonths < 12) return `${diffMonths}mo ago`;

    const diffYears = Math.floor(diffDays / 365);
    return `${diffYears}y ago`;
  } catch {
    return 'Recently';
  }
}

/**
 * Generates an industry-standard 8-digit alphanumeric SKU with platform prefix.
 * e.g. "LKY-84920153"
 */
export function generateStandardSku(prefix = 'LKY'): string {
  const random8Digits = Math.floor(10000000 + Math.random() * 90000000);
  return `${prefix}-${random8Digits}`;
}

/**
 * Helper to check if a store is registered in India.
 * Non-Indian stores (e.g., Nepal, USA, etc.) are restricted to Cash on Delivery (COD) / Pay on Pickup.
 */
export function isIndianStore(store: { address?: string | null; city?: string | null; state?: string | null; country?: string | null } | undefined | null): boolean {
  if (!store) return true; // Default safe fallback

  const address = (store.address || '').toLowerCase();
  const city = (store.city || '').toLowerCase();
  const state = (store.state || '').toLowerCase();
  const country = (store.country || '').toLowerCase();

  // Check Nepal and international signatures
  if (
    country.includes('nepal') ||
    state.includes('bagmati') ||
    state.includes('madhesh') ||
    state.includes('gandaki') ||
    state.includes('lumbini') ||
    state.includes('karnali') ||
    state.includes('sudurpashchim') ||
    city.includes('kathmandu') ||
    city.includes('lalbandi') ||
    city.includes('pokhara') ||
    city.includes('biratnagar') ||
    city.includes('lalitpur') ||
    city.includes('bhaktapur') ||
    city.includes('butwal') ||
    city.includes('dharan') ||
    city.includes('birgunj') ||
    address.includes('nepal') ||
    address.includes('lalbandi') ||
    address.includes('sarlahi')
  ) {
    return false;
  }

  if (country && country !== 'india' && country !== 'in' && country !== 'bharat') {
    return false;
  }

  return true;
}


