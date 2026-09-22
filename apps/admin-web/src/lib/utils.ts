import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
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
    url.includes('/video/') ||
    url.includes('type=video')
  );
}

export function getMediaUrl(url: string | null | undefined): string {
  if (!url) return '';
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
