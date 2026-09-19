// Service to manage recently viewed products in client storage
const STORAGE_KEY = 'lokaya_recently_viewed_products';
const MAX_ITEMS = 50;

export interface RecentlyViewedEntry {
  id: string;
  viewedAt: number;
}

export function recordRecentlyViewed(productId: string): void {
  if (typeof window === 'undefined' || !productId) return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    let list: RecentlyViewedEntry[] = raw ? JSON.parse(raw) : [];
    
    // Remove if already exists so we bring it to the top
    list = list.filter(item => item && item.id !== productId);
    
    // Unshift new view
    list.unshift({ id: productId, viewedAt: Date.now() });
    
    // Cap at MAX_ITEMS
    if (list.length > MAX_ITEMS) {
      list = list.slice(0, MAX_ITEMS);
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (err) {
    console.warn('Failed to save recently viewed product:', err);
  }
}

export function getRecentlyViewedIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const list: RecentlyViewedEntry[] = JSON.parse(raw);
    return list.map(item => item.id).filter(Boolean);
  } catch {
    return [];
  }
}

export function removeRecentlyViewed(productId: string): void {
  if (typeof window === 'undefined' || !productId) return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const list: RecentlyViewedEntry[] = JSON.parse(raw);
    const updated = list.filter(item => item && item.id !== productId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('Failed to remove recently viewed item:', err);
  }
}

export function clearRecentlyViewed(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.warn('Failed to clear recently viewed:', err);
  }
}
