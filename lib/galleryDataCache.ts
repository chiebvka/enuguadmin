import axios from 'axios';

// Define the structure of a fetched gallery item (can be shared with Mediawizard)
export interface CachedGalleryItem {
  id: string;
  title: string;
  cover_image: string | null;
  created_at: string;
  type: string; 
  tags: { id: string; name: string }[];
  excerpt: string;
}

let cachedGalleryItems: CachedGalleryItem[] | null = null;
let lastFetchTime: number | null = null;
const CACHE_DURATION_MS = 5 * 60 * 1000; // Cache for 5 minutes

/**
 * Fetches gallery items, using a client-side cache to avoid redundant API calls.
 * @param forceRefresh - If true, bypasses the cache and fetches fresh data.
 * @returns A promise that resolves to an array of gallery items.
 */
export async function getCachedGalleryItems(forceRefresh: boolean = false): Promise<CachedGalleryItem[]> {
  const now = Date.now();

  if (!forceRefresh && cachedGalleryItems && lastFetchTime && (now - lastFetchTime < CACHE_DURATION_MS)) {
    // console.log("Returning gallery items from client-side cache.");
    return Promise.resolve([...cachedGalleryItems]); // Return a copy
  }

  // console.log("Fetching gallery items from API (cache miss, expired, or forced).");
  try {
    const response = await axios.get<{ galleryPosts: CachedGalleryItem[] }>('/api/gallery');
    cachedGalleryItems = response.data.galleryPosts || [];
    lastFetchTime = now;
    return Promise.resolve([...cachedGalleryItems]); // Return a copy
  } catch (error) {
    console.error("Failed to fetch gallery items for cache:", error);
    // If fetch fails and we have stale cache, return stale data.
    if (cachedGalleryItems) {
        console.warn("Failed to refresh gallery items, returning stale cache.");
        return Promise.resolve([...cachedGalleryItems]); // Return a copy of stale data
    }
    // If no stale data, re-throw error or return empty array based on desired behavior
    // For now, returning empty to prevent breaking the UI completely on initial load failure.
    return Promise.resolve([]); 
  }
}

/**
 * Invalidates the client-side gallery items cache.
 * Should be called after any CUD (Create, Update, Delete) operation on gallery items.
 */
export function invalidateGalleryCache(): void {
  // console.log("Invalidating gallery items client-side cache.");
  cachedGalleryItems = null;
  lastFetchTime = null;
} 