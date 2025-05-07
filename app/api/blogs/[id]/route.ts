// app/api/blogs/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

// Define the expected shape of the parameters object from the dynamic route
interface BlogRouteParams {
    params: {
        id: string;
    };
}

export async function GET(req: NextRequest, { params }: BlogRouteParams) {
    const supabase = await createClient();
     const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

    const blogId = params.id; // Get the ID from the URL path parameters

    if (!blogId) {
         return NextResponse.json({ error: "Blog ID is missing from URL" }, { status: 400 });
    }

    try {
        // Fetch the blog post by ID
        // Join with blogpost_tags and tags tables to get tag information
        const { data, error } = await supabase
            .from('blogposts')
            .select('id, title, cover_image, content, status, blogpost_tags(tag_id, tags(id, name))') // Select required fields and join relations
            .eq('id', blogId)
            .eq('author_id', user.id) // IMPORTANT: Ensure only the author can fetch their own draft/post
            .single();

        if (error && error.code === 'PGRST116') { // Supabase error code for "Not Found"
             console.log(`Blog post with ID ${blogId} not found for user ${user.id}`);
             return NextResponse.json({ error: "Blog post not found" }, { status: 404 });
        }
        if (error) {
            console.error("Supabase fetch error:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Format the returned data to match the client-side state structure
        // Specifically, extract an array of tag IDs
        const formattedTags = data?.blogpost_tags?.map((bt: any) => bt.tag_id) || [];
        const formattedData = data ? {
            id: data.id,
            title: data.title,
            cover_image: data.cover_image,
            content: data.content,
            status: data.status,
            tags: formattedTags, // Array of tag IDs
        } : null;


        return NextResponse.json({ blog: formattedData }, { status: 200 });

    } catch (err: any) {
        console.error("Blog fetch failed:", err);
        return NextResponse.json({ error: "Internal server error" + (err.message || "") }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: BlogRouteParams) {
    const supabase = await createClient();
    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const blogId = params.id;

    if (!blogId) {
        return NextResponse.json({ error: "Blog ID is missing" }, { status: 400 });
    }

    try {
        // Step 1: Delete related tags from blogpost_tags
        const { error: deleteTagsError } = await supabase
            .from('blogpost_tags')
            .delete()
            .eq('blogpost_id', blogId);

        if (deleteTagsError) {
            console.error(`Error deleting tags for blog post ${blogId}:`, deleteTagsError);
            // Consider if this should be a hard stop or just a logged error
            // return NextResponse.json({ error: "Failed to delete associated tags: " + deleteTagsError.message }, { status: 500 });
        }

        // Step 2: Delete the blog post
        const { error: deletePostError } = await supabase
            .from('blogposts')
            .delete()
            .eq('id', blogId); // Removed .eq('author_id', user.id)

        if (deletePostError) {
            console.error(`Supabase delete error for blog post ${blogId}:`, deletePostError);
            return NextResponse.json({ error: "Failed to delete blog post: " + deletePostError.message }, { status: 500 });
        }

        return NextResponse.json({ message: "Blog post deleted successfully" }, { status: 200 });

    } catch (err: any) {
        console.error(`Blog deletion failed for ID ${blogId}:`, err);
        return NextResponse.json({ error: "Internal server error: " + (err.message || "") }, { status: 500 });
    }
}