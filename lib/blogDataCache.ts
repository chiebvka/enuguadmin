import axios from 'axios';
import { toast } from 'sonner';

interface FetchedTag {
  id: string;
  name: string;
}

export interface CachedBlogPost { // Exporting this interface for use in components
  id: string;
  title: string;
  cover_image: string | null;
  created_at: string;
  status: "draft" | "published";
  tags: FetchedTag[];
  excerpt: string;
}

let cachedBlogs: CachedBlogPost[] = []; // Initialize as an empty array
let lastFetchTime: number | null = null;
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes cache duration

export async function getCachedBlogs(): Promise<CachedBlogPost[]> {
  const now = Date.now();

  if (cachedBlogs.length > 0 && lastFetchTime && (now - lastFetchTime < CACHE_DURATION_MS)) {
    console.log("Returning cached blogs");
    return cachedBlogs;
  }

  console.log("Fetching fresh blogs");
  try {
    const response = await axios.get('/api/blogs');
    cachedBlogs = response.data.blogPosts || [];
    lastFetchTime = now;
    return cachedBlogs;
  } catch (error) {
    console.error("Failed to fetch blogs for cache:", error);
    toast.error("Failed to load blog posts.");
    return cachedBlogs; // Return the current cache, which is initialized as an empty array
  }
}

export function invalidateBlogsCache(): void {
  console.log("Invalidating blogs cache");
  cachedBlogs = [];
  lastFetchTime = null;
} 