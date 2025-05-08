import React from 'react';

import { createClient } from '@/utils/supabase/server'
import { Tag } from '@/components/tag-selector'
import Gallerywizard from '../add/components/gallery-wizard';

// Server-side function to fetch all available tags (similar to blog/tag pages)
async function fetchAvailableTags(): Promise<Tag[]> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        // Handle authentication required - maybe throw or redirect
        throw new Error("Authentication required to fetch tags.")
    }

    const { data: tags, error } = await supabase
        .from('tags')
        .select('id, name') // Select only necessary fields
        .order('name', { ascending: true })

    if (error) {
        console.error("Server-side failed to fetch available tags for gallery:", error)
        throw new Error("Failed to fetch available tags from database")
    }
    return tags || []
}

type Props = {}

export default function page({}: Props) {
  return (
    <div>
        <Gallerywizard availableTags={availableTags} />
    </div>
  )
}