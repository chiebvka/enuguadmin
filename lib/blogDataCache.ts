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

let cachedBlogs: CachedBlogPost[] | null = null;
let lastFetchTime: number | null = null;
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes cache duration

export async function getCachedBlogs(): Promise<CachedBlogPost[]> {
  const now = Date.now();

  if (cachedBlogs && lastFetchTime && (now - lastFetchTime < CACHE_DURATION_MS)) {
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
    // If fetch fails, return current cache if available, otherwise empty array
    return cachedBlogs || []; 
  }
}

export function invalidateBlogsCache(): void {
  console.log("Invalidating blogs cache");
  cachedBlogs = null;
  lastFetchTime = null;
} 