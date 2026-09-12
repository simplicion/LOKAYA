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

  // If it's the broken R2 dev domain, rewrite to the working backend media proxy
  if (url.includes('pub-9735c0214aaa423b89c9c5f647cc184c.r2.dev/')) {
    const fileKey = url.split('.r2.dev/')[1];
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4002/api/v1';
    return `${apiUrl}/media/view?key=${encodeURIComponent(fileKey)}`;
  }

  // If it's a relative backend path
  if (url.startsWith('/api/v1/')) {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4002/api/v1';
    const backendHost = apiUrl.replace(/\/api\/v1\/?$/, '');
    return `${backendHost}${url}`;
  }

  if (url.startsWith('/media/view')) {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4002/api/v1';
    return `${apiUrl}${url}`;
  }

  return url;
}
