import React from 'react'
import Tagswizard from './components/tags-wizard'
import { createClient } from '@/utils/supabase/server';


// Define the type for a Tag object
interface Tag {
    id: string;
    name: string;
}

type Props = {}

async function fetchTagsFromServer(): Promise<Tag[]> {
    const supabase = await createClient();
    // You likely have middleware handling authentication for /protected routes,
    // but a check here adds safety or handles cases where middleware isn't used.
     const { data: { user } } = await supabase?.auth.getUser();
     if (!user) {
         // If no user, redirect to login or show an error (depending on your auth flow)
         // In a real app, protected routes usually handle this earlier.
         // Throwing an error here might show an error page.
         throw new Error("Authentication required"); // Or handle redirection
     }


    const { data: tags, error } = await supabase
        .from('tags')
        .select('id, name')
        .order('name', { ascending: true });

    if (error) {
        console.error("Server-side failed to fetch tags:", error);
        // Decide how to handle fetch errors on the server - show error page, return empty array, etc.
        throw new Error("Failed to fetch tags from database"); // Throwing will trigger Next.js error handling
    }

    return tags || []; // Return the fetched data
}


export default async function page({}: Props) {

    const initialTags = await fetchTagsFromServer();

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <Tagswizard initialTags={initialTags} />
    </div>
  )
}