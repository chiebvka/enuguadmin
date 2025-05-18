import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { deleteFileFromR2 } from "@/lib/r2";

export async function GET(
    req: NextRequest, 
    context: any
) {
  const { params } = context;
  const { blogId } = params;

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!blogId) {
    return NextResponse.json({ error: "Blog ID is missing from URL parameters" }, { status: 400 });
  }

  try {
    const { data, error } = await supabase
      .from("blogposts")
      .select("id, title, cover_image, content, status, blogpost_tags(tag_id, tags(id, name))")
      .eq("id", blogId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        console.log(`Blog post with ID ${blogId} not found.`);
        return NextResponse.json({ error: "Blog post not found" }, { status: 404 });
      }
      console.error("Supabase fetch error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const formattedTags = data?.blogpost_tags?.map((bt: any) => bt.tag_id) || [];
    const formattedData = data
      ? {
          id: data.id,
          title: data.title,
          cover_image: data.cover_image,
          content: data.content,
          status: data.status,
          tags: formattedTags,
        }
      : null;

    if (!formattedData) {
      console.log(`Blog post data for ID ${blogId} resolved to null after Supabase query without error.`);
      return NextResponse.json({ error: "Blog post not found or data malformed" }, { status: 404 });
    }

    return NextResponse.json({ blog: formattedData }, { status: 200 });
  } catch (err: any) {
    console.error("Blog fetch failed for ID " + blogId + ":", err);
    return NextResponse.json({ error: "Internal server error: " + (err.message || "") }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest, 
  context: any
) {

  const { params } = context;
  const { blogId } = params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }


    if (!blogId) {
        return NextResponse.json({ error: "Blog ID is missing" }, { status: 400 });
    }

    try {
        // Step 1: Fetch the blog post to get the cover_image URL 
        // (author_id is no longer strictly needed for authorization here, but can be kept for logging if desired)
        const { data: blogPost, error: fetchError } = await supabase
            .from("blogposts")
            .select("cover_image, author_id") // author_id can still be selected for logging or other purposes
            .eq("id", blogId)
            .single();

        if (fetchError) {
            console.error(`Error fetching blog post ${blogId} for deletion:`, fetchError.message);
            if (fetchError.code === 'PGRST116') { // Not found
                return NextResponse.json({ error: "Blog post not found" }, { status: 404 });
            }
            return NextResponse.json({ error: "Failed to fetch blog post details for deletion" }, { status: 500 });
        }

        if (!blogPost) {
            return NextResponse.json({ error: "Blog post not found" }, { status: 404 });
        }

        // Step 2: If a cover image URL exists, attempt to delete it from R2
        if (blogPost.cover_image) {
            try {
                const imageUrl = blogPost.cover_image;
                const parsedUrl = new URL(imageUrl);
                let r2Key = parsedUrl.pathname;

                // Remove leading slash if present, as R2 keys usually don't start with /
                if (r2Key.startsWith('/')) {
                    r2Key = r2Key.substring(1);
                }

                if (r2Key) {
                    console.log(`Attempting to delete cover image from R2 for blog ${blogId}. Key: ${r2Key}`);
                    await deleteFileFromR2(r2Key);
                    console.log(`Successfully deleted cover image ${r2Key} from R2 for blog ${blogId}.`);
                } else {
                    console.warn(`Could not extract a valid R2 key from cover_image URL: ${imageUrl} for blog ${blogId}.`);
                }
            } catch (r2Error: any) {
                // Log the R2 deletion error but proceed with deleting the database record
                console.warn(`Failed to delete cover image from R2 for blog ${blogId}. Error: ${r2Error.message}. The database record will still be deleted.`);
            }
        }

        // Step 3: Delete associated tags from blogpost_tags junction table
        const { error: deleteTagsError } = await supabase
            .from("blogpost_tags")
            .delete()
            .eq("blog_id", blogId);

        if (deleteTagsError) {
            // Log error but consider it non-critical for the overall deletion success
            console.error(`Error deleting tags for blog post ${blogId}: ${deleteTagsError.message}`);
        }

        // Step 4: Delete the blog post itself from the blogposts table
        const { error: deletePostError } = await supabase
            .from("blogposts")
            .delete()
            .eq("id", blogId);

        if (deletePostError) {
            console.error(`Error deleting blog post ${blogId} from database:`, deletePostError.message);
            return NextResponse.json({ error: `Failed to delete blog post from database: ${deletePostError.message}` }, { status: 500 });
        }

        console.log(`Blog post ${blogId} and associated data deleted successfully by user ${user.id}.`);
        return NextResponse.json({ message: "Blog post and associated cover image (if any) deleted successfully" }, { status: 200 });

    } catch (error: any) {
        console.error(`Unexpected error during deletion process for blog post ${blogId}:`, error.message);
        return NextResponse.json({ error: "Internal server error during blog post deletion process" }, { status: 500 });
    }
}

