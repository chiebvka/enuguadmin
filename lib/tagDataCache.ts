import axios from 'axios';
import { toast } from 'sonner';

export interface CachedTag {
  id: string;
  name: string;
  slug?: string;      // Optional, align with Tagswizard's Tag type
  profile_id?: string; // Optional, align with Tagswizard's Tag type
}

let cachedTags: CachedTag[] = [];
let lastFetchTime: number | null = null;
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes cache duration

export async function getCachedTags(forceRefresh: boolean = false): Promise<CachedTag[]> {
  const now = Date.now();

  if (!forceRefresh && cachedTags.length > 0 && lastFetchTime && (now - lastFetchTime < CACHE_DURATION_MS)) {
    console.log("Returning cached tags");
    return cachedTags;
  }

  console.log(forceRefresh ? "Forcing refresh of tags" : "Fetching fresh tags");
  try {
    const response = await axios.get('/api/tags'); // Ensure this is your correct API endpoint
    cachedTags = response.data.tags || response.data || []; // Adjust based on API response structure
    lastFetchTime = now;
    return cachedTags;
  } catch (error) {
    console.error("Failed to fetch tags for cache:", error);
    toast.error("Failed to load tags.");
    return cachedTags;
  }
}

export function invalidateTagsCache(): void {
  console.log("Invalidating tags cache");
  cachedTags = [];
  lastFetchTime = null;
} 