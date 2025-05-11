import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { Database } from "@/types/supabase";
import slugify from "slugify";
import { deleteFileFromR2 } from "@/lib/r2";

// --- GET a single gallery post for editing ---

// @ts-ignore
export async function GET(
    request: NextRequest,
    context: { params: { id: string } }
) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const galleryId = context.params.id;
  if (!galleryId) {
    return NextResponse.json({ error: "Gallery ID is missing" }, { status: 400 });
  }

  try {
    const { data, error } = await supabase
      .from("galleryposts")
      .select(`
                id,
                title,
                description,
                type,
                date,
                galleryimages ( id, image_url, alt_text, position ),
                gallerypost_tags ( tags ( id, name ) )
            `)
      .eq("id", galleryId)
      .single();

    if (error) {
      if (error.code === "PGRST116" || error.code === "22P02") {
        console.log(`Gallery post GET: Not found or invalid ID ${galleryId}. Code: ${error.code}`);
        return NextResponse.json({ error: "Gallery post not found" }, { status: 404 });
      }
      console.error("Supabase gallery GET error:", error);
      return NextResponse.json({ error: `Database error fetching gallery: ${error.message}` }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: "Gallery post not found" }, { status: 404 });
    }

    const formattedData = {
      ...data,
      tags: data.gallerypost_tags.map((gt) => gt.tags?.[0]?.id).filter(Boolean) as string[],
      images: data.galleryimages.sort((a, b) => (a.position ?? 0) - (b.position ?? 0)),
    };

    return NextResponse.json({ galleryPost: formattedData }, { status: 200 });
  } catch (err: any) {
    console.error("Gallery GET failed:", err);
    return NextResponse.json({ error: "Internal server error: " + (err.message || "") }, { status: 500 });
  }
}

// --- PUT (Update) an existing gallery post ---
interface UpdateGalleryRequestBody {
  title?: string;
  description?: string;
  type?: "images" | "videos" | "mixed";
  tags?: string[];
}


// @ts-ignore
export async function PUT(
    req: NextRequest, context: { params: { id: string } }

) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const galleryId = context.params.id;
  if (!galleryId) {
    return NextResponse.json({ error: "Gallery ID is missing" }, { status: 400 });
  }

  let body: UpdateGalleryRequestBody;
  try {
    body = await req.json();
    console.log(`API PUT /api/gallery/${galleryId}: Received body:`, JSON.stringify(body, null, 2));
  } catch (e) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { title, description, type, tags } = body;

  if (title !== undefined && !title.trim()) {
    return NextResponse.json({ error: "Title cannot be empty" }, { status: 400 });
  }

  try {
    const galleryUpdateData: Database["public"]["Tables"]["galleryposts"]["Update"] = {};
    if (title) galleryUpdateData.title = title;
    if (description !== undefined) galleryUpdateData.description = description || null;
    if (type) galleryUpdateData.type = type;
    if (title) galleryUpdateData.slug = slugify(title, { lower: true, strict: true, remove: /[*+~.()'"!:@]/g });
    galleryUpdateData.updated_at = new Date().toISOString();

    const { data: updatedPost, error: updateError } = await supabase
      .from("galleryposts")
      .update(galleryUpdateData)
      .eq("id", galleryId)
      .select("*")
      .single();

    if (updateError) {
      console.error("Supabase gallery post update error:", updateError);
      if (updateError.code === "23505") {
        return NextResponse.json(
          { error: "A gallery post with this title already exists. Please choose a different title." },
          { status: 409 }
        );
      }
      if (updateError.code === "PGRST116") {
        return NextResponse.json({ error: "Gallery post not found for update" }, { status: 404 });
      }
      return NextResponse.json({ error: `Database error updating gallery post: ${updateError.message}` }, { status: 500 });
    }

    if (!updatedPost) {
      return NextResponse.json({ error: "Gallery post not found after update attempt." }, { status: 404 });
    }

    if (tags !== undefined && Array.isArray(tags)) {
      console.log(`API PUT /api/gallery/${galleryId}: Syncing tags:`, tags);
      const { error: deleteTagsError } = await supabase
        .from("gallerypost_tags")
        .delete()
        .eq("gallery_id", galleryId);

      if (deleteTagsError) {
        console.error(`Error deleting existing tags for gallery ${galleryId}:`, deleteTagsError);
      }

      if (tags.length > 0) {
        const newTagInserts: Database["public"]["Tables"]["gallerypost_tags"]["Insert"][] = tags.map((tagId) => ({
          gallery_id: galleryId,
          tag_id: tagId,
          user_id: user.id,
        }));

        const { error: insertTagsError } = await supabase.from("gallerypost_tags").insert(newTagInserts);

        if (insertTagsError) {
          console.error(`Error inserting new tags for gallery ${galleryId}:`, insertTagsError);
        }
      }
    }

    console.warn(`API PUT /api/gallery/${galleryId}: Image syncing via PUT is not fully implemented yet.`);

    console.log(`API PUT /api/gallery/${galleryId}: Successfully updated gallery post.`);
    return NextResponse.json({ success: true, galleryPost: updatedPost }, { status: 200 });
  } catch (err: any) {
    console.error(`Gallery update failed for ID ${galleryId}:`, err);
    return NextResponse.json({ error: "Internal server error: " + (err.message || "") }, { status: 500 });
  }
}

// --- DELETE a gallery post ---
export async function DELETE(req: NextRequest, context: { params: { id: string } }) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const galleryId = context.params.id;

  if (!galleryId) {
    return NextResponse.json({ error: "Gallery ID is missing" }, { status: 400 });
  }

  try {
    const { data: images, error: fetchError } = await supabase
      .from("galleryimages")
      .select("r2_key")
      .eq("gallery_id", galleryId);

    const keysToDelete = images?.map((img) => img.r2_key).filter(Boolean) as string[];

    for (const key of keysToDelete) {
      try {
        await deleteFileFromR2(key);
        console.log(`Deleted ${key} from R2`);
      } catch (err) {
        console.warn(`Failed to delete ${key} from R2`, err);
      }
    }

    await supabase.from("galleryimages").delete().eq("gallery_id", galleryId);
    await supabase.from("gallerypost_tags").delete().eq("gallery_id", galleryId);

    const { error: deletePostError } = await supabase
      .from("galleryposts")
      .delete()
      .eq("id", galleryId);

    if (deletePostError) {
      return NextResponse.json({ error: deletePostError.message }, { status: 500 });
    }

    return NextResponse.json({ message: "Gallery and all associated images deleted." }, { status: 200 });
  } catch (err: any) {
    console.error("Error deleting gallery:", err);
    return NextResponse.json({ error: "Failed to delete gallery." }, { status: 500 });
  }
}



// import { NextRequest, NextResponse } from "next/server";
// import { createClient } from "@/utils/supabase/server";
// import { Database } from "@/types/supabase";
// import slugify from "slugify";
// import { deleteFileFromR2 } from "@/lib/r2";

// interface RouteParams {
//     id: string;
// }

// // --- GET a single gallery post for editing ---
// export async function GET(req: NextRequest,
//     params: RouteParams
// ) {
//     const supabase = await createClient();
//     const { data: { user }, error: authError } = await supabase.auth.getUser();

//     if (authError || !user) {
//         return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     const galleryId = params?.id;
//     if (!galleryId) {
//         return NextResponse.json({ error: "Gallery ID is missing" }, { status: 400 });
//     }

//     try {
//         const { data, error } = await supabase
//             .from('galleryposts')
//             .select(`
//                 id,
//                 title,
//                 description,
//                 type,
//                 date,
//                 galleryimages ( id, image_url, alt_text, position ),
//                 gallerypost_tags ( tags ( id, name ) )
//             `)
//             .eq('id', galleryId)
//             // Add .eq('author_id', user.id) if only authors can edit their own
//             .single();

//         if (error) {
//             if (error.code === 'PGRST116' || error.code === '22P02') { // Not found or invalid UUID
//                 console.log(`Gallery post GET: Not found or invalid ID ${galleryId}. Code: ${error.code}`);
//                 return NextResponse.json({ error: "Gallery post not found" }, { status: 404 });
//             }
//             console.error("Supabase gallery GET error:", error);
//             return NextResponse.json({ error: `Database error fetching gallery: ${error.message}` }, { status: 500 });
//         }

//         if (!data) {
//              return NextResponse.json({ error: "Gallery post not found" }, { status: 404 });
//         }

//         // Format data slightly for easier frontend use
//         const formattedData = {
//             ...data,
//             tags: data.gallerypost_tags.map(gt => gt.tags?.[0]?.id).filter(Boolean) as string[], // Array of tag IDs
//             images: data.galleryimages.sort((a, b) => (a.position ?? 0) - (b.position ?? 0)), // Ensure images are sorted
//         };
//         // Remove intermediate join table data if not needed
//         // delete (formattedData as any).gallerypost_tags;
//         // delete (formattedData as any).galleryimages; // Keep images array

//         return NextResponse.json({ galleryPost: formattedData }, { status: 200 });

//     } catch (err: any) {
//         console.error("Gallery GET failed:", err);
//         return NextResponse.json({ error: "Internal server error: " + (err.message || "") }, { status: 500 });
//     }
// }


// // --- PUT (Update) an existing gallery post ---
// interface UpdateGalleryRequestBody {
//     title?: string;
//     description?: string;
//     type?: 'images' | 'videos' | 'mixed'; // Use lowercase to match DB constraint likely
//     tags?: string[]; // Full list of desired tag IDs for syncing
//     // Image updates might be complex here, potentially handled by separate endpoints
//     // Or send full list of desired image objects { id?, url, alt_text, position? }
//     // For now, let's just update title, desc, type, tags
// }
// export async function PUT(  req: NextRequest,
//     params: RouteParams
// ) {
//      const supabase = await createClient();
//      const { data: { user }, error: authError } = await supabase.auth.getUser();

//      if (authError || !user) {
//          return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//      }

//      const galleryId = params?.id;
//      if (!galleryId) {
//          return NextResponse.json({ error: "Gallery ID is missing" }, { status: 400 });
//      }

//      let body: UpdateGalleryRequestBody;
//      try {
//          body = await req.json();
//          console.log(`API PUT /api/gallery/${galleryId}: Received body:`, JSON.stringify(body, null, 2));
//      } catch (e) {
//          return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
//      }

//      const { title, description, type, tags } = body;

//       // Basic validation: require title if provided
//       if (title !== undefined && !title.trim()) {
//           return NextResponse.json({ error: "Title cannot be empty" }, { status: 400 });
//       }

//      try {
//         // --- Step 1: Update galleryposts table ---
//         const galleryUpdateData: Database['public']['Tables']['galleryposts']['Update'] = {};
//         if (title) galleryUpdateData.title = title;
//         if (description !== undefined) galleryUpdateData.description = description || null; // Allow clearing description
//         if (type) galleryUpdateData.type = type;
//         if (title) galleryUpdateData.slug = slugify(title, { lower: true, strict: true, remove: /[*+~.()'"!:@]/g }); // Update slug if title changes
//         galleryUpdateData.updated_at = new Date().toISOString();

//         const { data: updatedPost, error: updateError } = await supabase
//             .from('galleryposts')
//             .update(galleryUpdateData)
//             .eq('id', galleryId)
//             // Add .eq('author_id', user.id) if only authors can edit their own
//             .select('*')
//             .single();

//         if (updateError) {
//              console.error("Supabase gallery post update error:", updateError);
//               if (updateError.code === '23505') { // Unique violation (slug)
//                   return NextResponse.json({ error: "A gallery post with this title already exists. Please choose a different title." }, { status: 409 });
//              }
//              if (updateError.code === 'PGRST116') { // Not found
//                   return NextResponse.json({ error: "Gallery post not found for update" }, { status: 404 });
//              }
//              return NextResponse.json({ error: `Database error updating gallery post: ${updateError.message}` }, { status: 500 });
//         }
//          if (!updatedPost) {
//               return NextResponse.json({ error: "Gallery post not found after update attempt." }, { status: 404 });
//          }


//         // --- Step 2: Sync gallerypost_tags ---
//         if (tags !== undefined && Array.isArray(tags)) {
//             console.log(`API PUT /api/gallery/${galleryId}: Syncing tags:`, tags);
//             // Delete existing tags for this gallery post
//             const { error: deleteTagsError } = await supabase
//                 .from('gallerypost_tags')
//                 .delete()
//                 .eq('gallery_id', galleryId);

//             if (deleteTagsError) {
//                  console.error(`Error deleting existing tags for gallery ${galleryId}:`, deleteTagsError);
//                  // Decide if this is critical. Maybe just log?
//             }

//             // Insert new tags if any are provided
//             if (tags.length > 0) {
//                  const newTagInserts: Database['public']['Tables']['gallerypost_tags']['Insert'][] = tags.map(tagId => ({
//                      gallery_id: galleryId,
//                      tag_id: tagId,
//                      user_id: user.id // Optional
//                  }));

//                  const { error: insertTagsError } = await supabase
//                      .from('gallerypost_tags')
//                      .insert(newTagInserts);

//                  if (insertTagsError) {
//                       console.error(`Error inserting new tags for gallery ${galleryId}:`, insertTagsError);
//                       // Log error, but likely continue
//                  }
//             }
//         }

//          // --- Step 3: Handle Image Syncing (Placeholder - Add logic later if needed via PUT) ---
//          // If the PUT request body included the full list of desired `imageUrls` (with IDs for existing ones),
//          // you would fetch existing `galleryimages`, compare, delete removed, insert new, update existing here.
//          // This is complex and often better handled by separate ADD/DELETE image endpoints called by the client as needed.
//          console.warn(`API PUT /api/gallery/${galleryId}: Image syncing via PUT is not fully implemented yet.`);


//          // --- Success ---
//          console.log(`API PUT /api/gallery/${galleryId}: Successfully updated gallery post.`);
//          // Return updated post (without relations refetched here, GET does that)
//          return NextResponse.json({ success: true, galleryPost: updatedPost }, { status: 200 });

//      } catch (err: any) {
//          console.error(`Gallery update failed for ID ${galleryId}:`, err);
//          return NextResponse.json({ error: "Internal server error: " + (err.message || "") }, { status: 500 });
//      }
// }

// // --- DELETE a gallery post ---



// export async function DELETE(req: NextRequest, 
//     params: RouteParams
// ) {
//     const supabase = await createClient();
//     const {
//       data: { user },
//       error: authError,
//     } = await supabase.auth.getUser();
  
//     if (authError || !user) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }
  
//     const galleryId = params?.id;
  
//     if (!galleryId) {
//       return NextResponse.json({ error: "Gallery ID is missing" }, { status: 400 });
//     }
  
//     try {
//       // Step 1: Get R2 keys for images
//       const { data: images, error: fetchError } = await supabase
//         .from("galleryimages")
//         .select("r2_key")
//         .eq("gallery_id", galleryId);
  
//       const keysToDelete = images?.map((img) => img.r2_key).filter(Boolean) as string[];
  
//       // Step 2: Delete from R2
//       for (const key of keysToDelete) {
//         try {
//           await deleteFileFromR2(key);
//           console.log(`Deleted ${key} from R2`);
//         } catch (err) {
//           console.warn(`Failed to delete ${key} from R2`, err);
//         }
//       }
  
//       // Step 3: Delete gallery image records
//       await supabase.from("galleryimages").delete().eq("gallery_id", galleryId);
  
//       // Step 4: Delete gallery tags
//       await supabase.from("gallerypost_tags").delete().eq("gallery_id", galleryId);
  
//       // Step 5: Delete the gallery post
//       const { error: deletePostError } = await supabase
//         .from("galleryposts")
//         .delete()
//         .eq("id", galleryId);
  
//       if (deletePostError) {
//         return NextResponse.json({ error: deletePostError.message }, { status: 500 });
//       }
  
//       return NextResponse.json({ message: "Gallery and all associated images deleted." }, { status: 200 });
  
//     } catch (err: any) {
//       console.error("Error deleting gallery:", err);
//       return NextResponse.json({ error: "Failed to delete gallery." }, { status: 500 });
//     }
//   }


