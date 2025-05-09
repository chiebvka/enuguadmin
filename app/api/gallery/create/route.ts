import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import slugify from "slugify";
import { Database } from "@/types/supabase"; // Assuming your generated types are here

// Define the expected shape of the request body
// Adjust based on what the frontend gallery uploader component will send
interface CreateGalleryRequestBody {
    title: string;
    description?: string;
    type: 'image' | 'video' | 'mixed'; // Changed from 'images' | 'videos' | 'mixed'
    tags?: string[]; // Array of tag IDs
    images?: { url: string; key: string; alt_text?: string }[]; // Array of objects containing URL and optional alt text
    // We'll likely use server timestamp for date, but could accept it if needed
}

export async function POST(req: NextRequest) {
    console.log("API POST /api/gallery/create: Request received.");
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error("API POST /api/gallery/create: Unauthorized access attempt.");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.log("API POST /api/gallery/create: User authenticated:", user.id);

    let body: CreateGalleryRequestBody;
    try {
        body = await req.json();
        console.log("API POST /api/gallery/create: Successfully parsed request body:", JSON.stringify(body, null, 2));
    } catch (e: any) {
        console.error("API POST /api/gallery/create: Error parsing request body JSON:", e.message);
        return NextResponse.json({ error: "Invalid request body. Malformed JSON." }, { status: 400 });
    }

    const { title, description, type, tags, images } = body;

    // --- Detailed Validations ---
    console.log("API POST /api/gallery/create: Validating title:", title);
    if (!title || typeof title !== 'string' || title.trim() === "") {
        console.error("API POST /api/gallery/create: Validation failed - Title is required or invalid. Received:", title);
        return NextResponse.json({ error: "Title is required." }, { status: 400 });
    }

    console.log("API POST /api/gallery/create: Validating type:", type);
    if (!type || typeof type !== 'string') {
        console.error("API POST /api/gallery/create: Validation failed - Gallery type is required. Received:", type);
        return NextResponse.json({ error: "Gallery type is required." }, { status: 400 });
    }
    const validTypes = ['image', 'video', 'mixed'];
    if (!validTypes.includes(type)) {
        console.error(`API POST /api/gallery/create: Validation failed - Invalid gallery type '${type}'. Must be one of ${validTypes.join(', ')}.`);
        return NextResponse.json({ error: `Invalid gallery type. Must be one of ${validTypes.join(', ')}.` }, { status: 400 });
    }

    console.log("API POST /api/gallery/create: Validating tags:", tags);
    if (!Array.isArray(tags) || tags.length === 0) {
        console.error("API POST /api/gallery/create: Validation failed - At least one tag is required. Received:", tags);
        return NextResponse.json({ error: "At least one tag is required." }, { status: 400 });
    }
    if (tags.some(tag => typeof tag !== 'string' || !tag.trim())) {
        console.error("API POST /api/gallery/create: Validation failed - All tags must be non-empty strings. Received tags:", tags);
        return NextResponse.json({ error: "Invalid tag format. All tags must be non-empty strings." }, { status: 400 });
    }

    console.log("API POST /api/gallery/create: Validating images:", images);
    if (!Array.isArray(images) || images.length === 0) {
        console.error("API POST /api/gallery/create: Validation failed - At least one image is required. Received:", images);
        return NextResponse.json({ error: "At least one image is required." }, { status: 400 });
    }
    if (images.some(img => !img || typeof img.url !== 'string' || !img.url.trim() || typeof img.key !== 'string' || !img.key.trim())) {
        console.error("API POST /api/gallery/create: Validation failed - All images must have a valid non-empty URL and Key string. Received images:", images);
        return NextResponse.json({ error: "All images must have a valid non-empty URL and Key string." }, { status: 400 });
    }

    console.log("API POST /api/gallery/create: All validations passed. Proceeding to database operations.");

    // --- Generate Slug ---
    const slug = slugify(title, { lower: true, strict: true, remove: /[*+~.()'"!:@]/g }); // Customize remove regex as needed
    console.log(`API POST /api/gallery/create: Generated slug: ${slug}`);

    try {
        // --- Step 1: Insert into galleryposts ---

        const galleryPostInsertData: Database['public']['Tables']['galleryposts']['Insert'] = {
            title: title.trim(),
            description: description ? description.trim() : null,
            type: type,
            slug,
            author_id: user.id,
            date: new Date().toISOString(), // Use current server time for the date
            // created_at and updated_at should be handled by DB defaults/triggers
        };
        console.log("API POST /api/gallery/create: Attempting to insert gallery post:", JSON.stringify(galleryPostInsertData, null, 2));

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
        console.log(`API POST /api/gallery/create: Gallery post created with ID: ${galleryId}`);

        // --- Step 2: Insert into galleryimages (if type is Images and images exist) ---
        if ((type === 'image' || type === 'video' || type === 'mixed') && images && images.length > 0) {
            const imageInserts: Database['public']['Tables']['galleryimages']['Insert'][] = images.map((img, index) => ({
                gallery_id: galleryId,
                image_url: img.url,
                r2_key: img.key, // Save the R2 key
                alt_text: img.alt_text || null,
                position: index + 1 
            }));
            console.log(`API POST /api/gallery/create: Attempting to insert ${imageInserts.length} images for gallery ID ${galleryId}`);

            const { error: imageInsertError } = await supabase
                .from('galleryimages')
                .insert(imageInserts);

            if (imageInsertError) {
                 console.error("Supabase gallery images insert error:", imageInsertError);
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
             console.log(`API POST /api/gallery/create: Attempting to insert ${tagInserts.length} tags for gallery ID ${galleryId}`);

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
        console.log(`API POST /api/gallery/create: Successfully created gallery post ID ${galleryId}`);
        return NextResponse.json({ success: true, galleryPost: newGalleryPost }, { status: 201 });

    } catch (err: any) {
        console.error("Gallery creation failed:", err);
        return NextResponse.json({ error: "Internal server error: " + (err.message || "") }, { status: 500 });
    }
}
