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

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4002/api/v1';

  if (url.includes('/media/view?key=') && (url.includes('.m3u8') || url.includes('.ts') || url.includes('processed/'))) {
    const key = decodeURIComponent(url.split('/media/view?key=')[1]);
    return `${apiUrl}/media/stream/${key}`;
  }

  if (url.includes('pub-9735c0214aaa423b89c9c5f647cc184c.r2.dev/')) {
    const fileKey = url.split('.r2.dev/')[1];
    return `${apiUrl}/media/stream/${fileKey}`;
  }

  if (url.startsWith('/api/v1/')) {
    const backendHost = apiUrl.replace(/\/api\/v1\/?$/, '');
    return `${backendHost}${url}`;
  }

  if (url.startsWith('/media/')) {
    return `${apiUrl}${url}`;
  }

  return url;
}
