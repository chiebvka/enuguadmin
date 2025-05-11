import React from 'react';
import { createClient } from '@/utils/supabase/server';
import { Tag } from '@/components/tag-selector'; // Assuming exported from tag-selector
import Gallerywizard from '../add/components/gallery-wizard';
import { notFound } from 'next/navigation';

// Define expected types for fetched gallery data (align with GET response)
type FetchedGalleryImage = { // More specific type for selected image fields
    id: string;
    image_url: string;
    alt_text: string | null;
    position: number | null;
    r2_key: string | null; // Add r2_key
};

interface FetchedGalleryPost {
    id: string;
    title: string;
    description: string | null;
    type: string; // Adjust type if needed e.g., 'image' | 'video'
    date: string;
    tags: string[]; // Array of tag IDs
    images: FetchedGalleryImage[]; // Use the more specific type
    r2_key?: string | null; // Ensure this matches the FetchedGalleryImage
}

// Props for the page component
type Props = {
  params: {
      id: string;
  };
};

// Fetch single gallery post data
async function fetchGalleryPost(galleryId: string): Promise<FetchedGalleryPost | null> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        console.error("Unauthorized attempt to fetch gallery post");
        notFound(); // Or redirect to login
    }

     try {
        const { data, error } = await supabase
            .from('galleryposts')
            .select(`
                id,
                title,
                description,
                type,
                date,
                galleryimages ( id, image_url, alt_text, position, r2_key ),
                gallerypost_tags ( tags ( id ) )
            `)
            .eq('id', galleryId)
            // Add .eq('author_id', user.id) if only authors can fetch their own
            .single();

        if (error) {
            if (error.code === 'PGRST116' || error.code === '22P02') {
                console.log(`Gallery post GET server: Not found or invalid ID ${galleryId}. Code: ${error.code}`);
                return null; // Handled by page component calling notFound()
            }
            console.error("fetchGalleryPost Supabase error:", error);
            throw new Error(`Database error fetching gallery: ${error.message}`);
        }

        if (!data) {
             return null; // Handled by page component calling notFound()
        }

        // Format data
        const formattedData: FetchedGalleryPost = {
            ...data,
            tags: data.gallerypost_tags.map(gt => gt.tags?.[0]?.id).filter(Boolean) as string[],
            images: data.galleryimages.sort((a, b) => (a.position ?? 0) - (b.position ?? 0)) as FetchedGalleryImage[], // Cast to specific type
            type: data.type, // Pass through the type from DB
        };
        
        return formattedData;

    } catch (err: any) {
         console.error(`fetchGalleryPost failed for ID ${galleryId}:`, err);
         // Re-throw other errors to be caught by Next.js error handling
         throw new Error(`An unexpected error occurred fetching gallery post ${galleryId}`);
    }
}

// Fetch available tags (reuse existing function or copy here)
async function fetchAvailableTags(): Promise<Tag[]> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { throw new Error("Authentication required to fetch tags."); }

    const { data: tags, error } = await supabase
        .from('tags')
        .select('id, name').order('name', { ascending: true });
    if (error) { throw new Error("Failed to fetch available tags."); }
    return tags || [];
}

// The Page Component
export default async function EditGalleryPage(
    { params }: { params: { id: string } }
) {
   
    const galleryId =  params?.id;

    // Fetch gallery post and available tags in parallel
    const [galleryPostData, availableTagsData] = await Promise.all([
        fetchGalleryPost(galleryId),
        fetchAvailableTags(),
    ]);

    // If gallery post not found, render 404 page
    if (!galleryPostData) {
        notFound();
    }

    return (
        <div>
            {/* Pass fetched data to the wizard */}
            <Gallerywizard
                galleryId={galleryPostData.id}
                initialGalleryData={galleryPostData}
                availableTags={availableTagsData}
            />
        </div>
    );
}