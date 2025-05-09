import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { Database } from "@/types/supabase";

export async function GET(req: NextRequest) {
    const supabase = await createClient();
    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { data: galleryPostsData, error } = await supabase
            .from('galleryposts')
            .select(`
                id,
                title,
                description,
                type,
                created_at,
                galleryimages!left (image_url, position), 
                gallerypost_tags!left (tags!inner (id, name))
            `)
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Supabase fetch error for gallery posts:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        const formattedGalleryPosts = galleryPostsData.map(post => {
            let excerptText = "No description available.";
            if (post.description) {
                excerptText = post.description.substring(0, 100) + (post.description.length > 100 ? '...' : '');
            }

            let coverImageUrl = null;
            if (post.galleryimages && post.galleryimages.length > 0) {
                // Sort images by position if available, then take the first one
                const sortedImages = [...post.galleryimages].sort((a, b) => (a.position || 0) - (b.position || 0));
                coverImageUrl = sortedImages[0]?.image_url || null;
            }
            
            return {
                id: post.id,
                title: post.title,
                cover_image: coverImageUrl,
                created_at: post.created_at, // This will be used as dateUploaded essentially
                type: post.type,
                tags: post.gallerypost_tags.map((gt: any) => gt.tags).filter(Boolean), // gt.tags is already {id, name}
                excerpt: excerptText,
            };
        });

        return NextResponse.json({ galleryPosts: formattedGalleryPosts }, { status: 200 });

    } catch (err: any) {
        console.error("Gallery list fetch failed:", err);
        return NextResponse.json({ error: "Internal server error: " + (err.message || "") }, { status: 500 });
    }
}
