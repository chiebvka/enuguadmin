
import React from 'react'
import Createwizard from './components/create-wizard'
import { createClient } from '@/utils/supabase/server';

// Define type for Tag (should match your DB schema)
interface Tag {
  id: string;
  name: string;
  slug?: string;
  profile_id?: string;
}
type Props = {}

// Server-side function to fetch all available tags
async function fetchAvailableTags(): Promise<Tag[]> {
  const supabase = await createClient();
   // Ensure user is authenticated - though middleware should handle this for /protected
   const { data: { user } } = await supabase.auth.getUser();
   if (!user) {
       // Handle authentication required - maybe throw or redirect
       // In a real app, middleware is better for route protection
   }

  const { data: tags, error } = await supabase
      .from('tags')
      .select('id, name') // Select only the necessary fields (id and name for the selector)
      .order('name', { ascending: true });

  if (error) {
      console.error("Server-side failed to fetch available tags:", error);
      // Decide how to handle fetch errors - throw, return empty array, etc.
       // Throwing an error will trigger Next.js error handling
      throw new Error("Failed to fetch available tags from database");
  }

  return tags || [];
}


export default async function page({}: Props) {

  const availableTags = await fetchAvailableTags();
  return (
    <div>
        <Createwizard  availableTags={availableTags}  />
    </div>
  )
}