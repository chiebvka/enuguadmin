import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { deleteFileFromR2 } from "@/lib/r2"; // Assuming r2.ts is in lib

// Helper function to extract R2 key from URL
// This is a basic implementation. For robustness, store the R2 key separately.
function extractKeyFromUrl(url: string): string | null {
  try {
    const r2PublicUrl = process.env.R2_PUBLIC_URL;
    const r2Endpoint = process.env.R2_ENDPOINT;
    const r2Bucket = process.env.R2_BUCKET;

    let baseUrl = "";
    if (r2PublicUrl) {
      baseUrl = r2PublicUrl.endsWith('/') ? r2PublicUrl : `${r2PublicUrl}/`;
    } else if (r2Endpoint && r2Bucket) {
      const endpoint = r2Endpoint.endsWith('/') ? r2Endpoint : `${r2Endpoint}/`;
      const bucket = r2Bucket.endsWith('/') ? r2Bucket : `${r2Bucket}/`;
      baseUrl = `${endpoint}${bucket}`;
    } else {
      console.error("R2_PUBLIC_URL or R2_ENDPOINT and R2_BUCKET must be set to extract key from URL");
      return null;
    }
    
    if (url.startsWith(baseUrl)) {
      return url.substring(baseUrl.length);
    }
    // Fallback for URLs that might not have the full base if only endpoint/bucket is used for baseUrl construction
    // and the stored URL is just endpoint/bucket/key
    if (r2Endpoint && r2Bucket && url.includes(`${r2Bucket}/`)) {
        const keyPart = url.split(`${r2Bucket}/`)[1];
        if (keyPart) return keyPart;
    }

    console.warn(`Could not extract key from URL: ${url} with baseUrl: ${baseUrl}`);
    return null;
  } catch (error) {
    console.error("Error extracting R2 key:", error);
    return null;
  }
}


// --- GET Feed Posts (Optional - for fetching later) ---
// export async function GET(req: NextRequest) {
//   const supabase = await createClient();
//   // Add auth check if needed
//   try {
//     const { data, error } = await supabase
//       .from("membership_feed")
//       .select(`
//         *,
//         profiles ( id, username, avatar_url, full_name )
//       `) // Adjust profiles selection as needed
//       .order("created_at", { ascending: false });

//     if (error) throw error;
//     return NextResponse.json(data);
//   } catch (error: any) {
//     console.error("Error fetching feed posts:", error);
//     return NextResponse.json({ error: error.message }, { status: 500 });
//   }
// }


// --- POST (Create new feed post) ---
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
  }
  if (!user.email) {
    return NextResponse.json({ error: "User email not available" }, { status: 400 });
  }

  try {
    const body = await req.json();
    const {
      title,
      content,
      content_type, // 'text', 'image', 'video', 'file'
      media_url,    // URL from R2
      file_name,
      file_size_mb,
      // media_r2_key // Recommended to add this to your table and pass it from client
    } = body;

    if (!content_type || (content_type !== 'text' && !media_url)) {
      return NextResponse.json({ error: "Content type is required, and media URL is required for non-text posts." }, { status: 400 });
    }
    if (content_type === 'text' && !content && !title) {
        return NextResponse.json({ error: "For text posts, either title or content is required." }, { status: 400 });
    }


    const { data: postData, error: insertError } = await supabase
      .from("membership_feed")
      .insert({
        user_id: user.id,
        user_email: user.email, // Store user_email as per table schema
        title,
        content,
        content_type,
        media_url,
        file_name,
        file_size_mb,
        // media_r2_key, // Store this key
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error inserting feed post:", insertError);
      throw insertError;
    }

    return NextResponse.json(postData, { status: 201 });
  } catch (error: any) {
    console.error("Error creating feed post:", error);
    return NextResponse.json({ error: error.message || "Failed to create feed post" }, { status: 500 });
  }
}

// --- PUT (Edit existing feed post) ---
export async function PUT(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      feed_id, // ID of the post to update
      title,
      content,
      // Note: content_type is generally not updatable once set.
      // If it needs to be, ensure frontend handles new file upload/old file deletion correctly.
      media_url,    // New URL from R2 if media changed
      file_name,
      file_size_mb,
      // new_media_r2_key // Recommended
    } = body;

    if (!feed_id) {
      return NextResponse.json({ error: "Feed post ID is required." }, { status: 400 });
    }

    // Fetch the existing post to check for old media to delete
    const { data: existingPost, error: fetchError } = await supabase
      .from("membership_feed")
      .select("media_url, content_type") // Add media_r2_key if you store it
      .eq("id", feed_id)
      .single();

    if (fetchError || !existingPost) {
      return NextResponse.json({ error: "Feed post not found." }, { status: 404 });
    }

    const updatePayload: any = {};
    if (title !== undefined) updatePayload.title = title;
    if (content !== undefined) updatePayload.content = content;
    if (media_url !== undefined) updatePayload.media_url = media_url; // Can be null to remove media
    if (file_name !== undefined) updatePayload.file_name = file_name;
    if (file_size_mb !== undefined) updatePayload.file_size_mb = file_size_mb;
    // if (new_media_r2_key !== undefined) updatePayload.media_r2_key = new_media_r2_key;


    // If media_url is being updated (or removed) and there was an old media_url
    if (media_url !== existingPost.media_url && existingPost.media_url && existingPost.content_type !== 'text') {
      const oldKey = extractKeyFromUrl(existingPost.media_url);
      // const oldKey = existingPost.media_r2_key; // If you store the key
      if (oldKey) {
        try {
          await deleteFileFromR2(oldKey);
        } catch (deleteError) {
          console.error("Failed to delete old R2 file during update:", deleteError);
          // Decide if this should be a critical error or just a warning
        }
      }
    }


    const { data: updatedPostData, error: updateError } = await supabase
      .from("membership_feed")
      .update(updatePayload)
      .eq("id", feed_id)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating feed post:", updateError);
      throw updateError;
    }

    return NextResponse.json(updatedPostData);
  } catch (error: any) {
    console.error("Error updating feed post:", error);
    return NextResponse.json({ error: error.message || "Failed to update feed post" }, { status: 500 });
  }
}


// --- DELETE (Delete existing feed post) ---
export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
  }

  try {
    const { feed_id } = await req.json(); // Or get from URL params: const feed_id = req.nextUrl.searchParams.get('id');

    if (!feed_id) {
      return NextResponse.json({ error: "Feed post ID is required." }, { status: 400 });
    }

    // Fetch the post to get media_url for R2 deletion
    const { data: postToDelete, error: fetchError } = await supabase
      .from("membership_feed")
      .select("media_url, content_type") // Add media_r2_key if you store it
      .eq("id", feed_id)
      .single();

    if (fetchError || !postToDelete) {
      return NextResponse.json({ error: "Feed post not found." }, { status: 404 });
    }

    // If there's media associated, delete it from R2
    if (postToDelete.media_url && postToDelete.content_type !== 'text') {
      const key = extractKeyFromUrl(postToDelete.media_url);
      // const key = postToDelete.media_r2_key; // If you store the key
      if (key) {
        try {
          await deleteFileFromR2(key);
        } catch (deleteError) {
          console.error("Failed to delete R2 file during post deletion:", deleteError);
          // Decide if this should be a critical error.
          // The post will be deleted from DB anyway.
        }
      }
    }

    // Delete the post from the database
    const { error: deleteDbError } = await supabase
      .from("membership_feed")
      .delete()
      .eq("id", feed_id);

    if (deleteDbError) {
      console.error("Error deleting feed post from DB:", deleteDbError);
      throw deleteDbError;
    }

    return NextResponse.json({ message: "Feed post deleted successfully." });
  } catch (error: any) {
    console.error("Error deleting feed post:", error);
    return NextResponse.json({ error: error.message || "Failed to delete feed post" }, { status: 500 });
  }
}
