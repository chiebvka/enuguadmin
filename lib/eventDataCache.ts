import axios from 'axios';
import { toast } from 'sonner';

// Define event type - ensure this matches or is compatible with the one in event-wizard.tsx
export interface CachedEvent {
  id: string;
  name: string;
  event_date: string;
  start_time: string;
  end_time: string;
  venue: string;
  type: string;
  summary: string;
  content?: string;
  status: "upcoming" | "past" | "draft" | "cancelled";
}

let cachedEvents: CachedEvent[] | null = null;
let lastFetchTime: number | null = null;
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes cache duration

export async function getCachedEvents(forceRefresh: boolean = false): Promise<CachedEvent[]> {
  const now = Date.now();

  if (!forceRefresh && cachedEvents && lastFetchTime && (now - lastFetchTime < CACHE_DURATION_MS)) {
    console.log("Returning cached events");
    return cachedEvents;
  }

  console.log(forceRefresh ? "Forcing refresh of events" : "Fetching fresh events");
  try {
    // Ensure the API endpoint is correct for your events
    const res = await axios.get('/api/events', { headers: { 'Cache-Control': 'no-store' } }); // Match header from page.tsx
    cachedEvents = res.data || []; // Assuming API returns an array directly or an object with an events key
    lastFetchTime = now;
    return cachedEvents;
  } catch (error) {
    console.error("Failed to fetch events for cache:", error);
    toast.error("Failed to load events.");
    return cachedEvents || []; 
  }
}

export function invalidateEventsCache(): void {
  console.log("Invalidating events cache");
  cachedEvents = null;
  lastFetchTime = null;
} 