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

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4002/api/v1';

  // If it's an HLS master playlist URL using query param, convert to clean hierarchical stream URL for relative chunks
  if (url.includes('/media/view?key=') && (url.includes('.m3u8') || url.includes('.ts') || url.includes('processed/'))) {
    const key = decodeURIComponent(url.split('/media/view?key=')[1]);
    return `${apiUrl}/media/stream/${key}`;
  }

  // If it's the broken R2 dev domain, rewrite to the working backend media stream proxy
  if (url.includes('pub-9735c0214aaa423b89c9c5f647cc184c.r2.dev/')) {
    const fileKey = url.split('.r2.dev/')[1];
    return `${apiUrl}/media/stream/${fileKey}`;
  }

  // If it's a relative backend path
  if (url.startsWith('/api/v1/')) {
    const backendHost = apiUrl.replace(/\/api\/v1\/?$/, '');
    return `${backendHost}${url}`;
  }

  if (url.startsWith('/media/')) {
    return `${apiUrl}${url}`;
  }

  return url;
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

