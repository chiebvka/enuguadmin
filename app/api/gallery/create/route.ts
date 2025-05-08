import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import slugify from "slugify";
import { Database } from "@/types/supabase"; // Assuming your generated types are here

// Define the expected shape of the request body
// Adjust based on what the frontend gallery uploader component will send
interface CreateGalleryRequestBody {
    title: string;
    description?: string;
    type: 'Images' | 'Videos'; // Match the expected types from your frontend
    tags?: string[]; // Array of tag IDs
    imageUrls?: { url: string; alt_text?: string }[]; // Array of objects containing URL and optional alt text
    // We'll likely use server timestamp for date, but could accept it if needed
}

export async function POST(req: NextRequest) {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: CreateGalleryRequestBody;
    try {
        body = await req.json();
        // Log the received body after successful parsing
        console.log("API /api/gallery/create: Received request body:", JSON.stringify(body, null, 2)); 
    } catch (e) {
        console.error("API /api/gallery/create: Error parsing request body:", e);
        return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const { title, description, type, tags, imageUrls } = body;

    // --- Basic Validation ---
    if (!title) {
        return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }
    if (!type || (type !== 'Images' && type !== 'Videos')) {
        return NextResponse.json({ error: "Valid media type (Images/Videos) is required" }, { status: 400 });
    }
    // For 'Images' type, at least one image URL is required. Videos might have different handling later.
    if (type === 'Images' && (!imageUrls || imageUrls.length === 0)) {
        return NextResponse.json({ error: "At least one image file is required for an Image gallery" }, { status: 400 });
    }
    // Add validation for videos if needed

    // --- Generate Slug ---
    const slug = slugify(title, { lower: true, strict: true, remove: /[*+~.()'"!:@]/g }); // Customize remove regex as needed
    console.log(`API /api/gallery/create: Generated slug: ${slug}`);

    try {
        // --- Step 1: Insert into galleryposts ---

        const normalizedType =
        type === 'Images' ? 'image' :
        type === 'Videos' ? 'video' :
        'mixed'; // optional fallback


        const galleryPostInsertData: Database['public']['Tables']['galleryposts']['Insert'] = {
            title,
            description: description || null,
            type: normalizedType,
            slug,
            author_id: user.id,
            date: new Date().toISOString(), // Use current server time for the date
            // created_at and updated_at should be handled by DB defaults/triggers
        };
        console.log("API /api/gallery/create: Attempting to insert gallery post:", JSON.stringify(galleryPostInsertData, null, 2));

        const { data: newGalleryPost, error: galleryPostError } = await supabase
            .from('galleryposts')
            .insert(galleryPostInsertData)
            .select('*')
            .single();

        if (galleryPostError) {
            console.error("Supabase gallery post insert error:", galleryPostError);
            // Check for unique constraint violation (e.g., slug)
            if (galleryPostError.code === '23505') { // Unique violation
                 return NextResponse.json({ error: "A gallery post with this title already exists. Please choose a different title." }, { status: 409 }); // 409 Conflict
            }
            return NextResponse.json({ error: `Database error creating gallery post: ${galleryPostError.message}` }, { status: 500 });
        }

        if (!newGalleryPost) {
             return NextResponse.json({ error: "Failed to create gallery post, no data returned." }, { status: 500 });
        }

        const galleryId = newGalleryPost.id;
        console.log(`API /api/gallery/create: Gallery post created with ID: ${galleryId}`);

        // --- Step 2: Insert into galleryimages (if type is Images and imageUrls exist) ---
        if (type === 'Images' && imageUrls && imageUrls.length > 0) {
            const imageInserts: Database['public']['Tables']['galleryimages']['Insert'][] = imageUrls.map((img, index) => ({
                gallery_id: galleryId,
                image_url: img.url,
                alt_text: img.alt_text || null, // Use provided alt text or null
                position: index + 1 // Simple positioning based on array order
            }));
            console.log(`API /api/gallery/create: Attempting to insert ${imageInserts.length} images for gallery ID ${galleryId}`);

            const { error: imageInsertError } = await supabase
                .from('galleryimages')
                .insert(imageInserts);

            if (imageInsertError) {
                 console.error("Supabase gallery images insert error:", imageInsertError);
                 // Consider cleanup: Should we delete the gallerypost if images fail?
                 // For now, we'll return an error but the post might remain.
                 return NextResponse.json({ error: `Gallery post created, but failed to add images: ${imageInsertError.message}` }, { status: 500 });
            }
        }
        // Add similar logic for videos if needed

        // --- Step 3: Insert into gallerypost_tags (if tags exist) ---
        if (tags && Array.isArray(tags) && tags.length > 0) {
             const tagInserts: Database['public']['Tables']['gallerypost_tags']['Insert'][] = tags.map(tagId => ({
                 gallery_id: galleryId,
                 tag_id: tagId,
                 user_id: user.id // Optional: track who added the tag link if needed
             }));
             console.log(`API /api/gallery/create: Attempting to insert ${tagInserts.length} tags for gallery ID ${galleryId}`);

             const { error: tagInsertError } = await supabase
                 .from('gallerypost_tags')
                 .insert(tagInserts);

             if (tagInsertError) {
                 console.error(`Supabase gallery post tags insert error for gallery ID ${galleryId}: ${tagInsertError.message}`);
                 // Non-critical error: Log it on the server.
                 // If the client needs to know, consider adding a 'warnings' field to the success response.
             }
        }

        // --- Success ---
        console.log(`API /api/gallery/create: Successfully created gallery post ID ${galleryId}`);
        return NextResponse.json({ success: true, galleryPost: newGalleryPost }, { status: 201 });

    } catch (err: any) {
        console.error("Gallery creation failed:", err);
        return NextResponse.json({ error: "Internal server error: " + (err.message || "") }, { status: 500 });
    }
}
