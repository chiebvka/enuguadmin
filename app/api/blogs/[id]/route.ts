// app/api/blogs/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

// Define the expected shape of the actual parameters
interface BlogIdParams {
    id: string;
}

// The second argument for route handlers is an object,
// from which we destructure 'params'.
// The type of this second argument is { params: BlogIdParams }
export async function GET(
  req: NextRequest,
  { params }: { params: BlogIdParams } // Standard Next.js 13/14 way using destructuring
) {
    const supabase = await createClient();
    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const blogId = params.id; // 'params' is now directly available due to destructuring

    if (!blogId) {
        // This should ideally not happen if 'id' is a required route segment
        return NextResponse.json({ error: "Blog ID is missing from URL parameters" }, { status: 400 });
    }

    try {
        const { data, error } = await supabase
            .from('blogposts')
            .select('id, title, cover_image, content, status, blogpost_tags(tag_id, tags(id, name))')
            .eq('id', blogId)
            .eq('author_id', user.id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                console.log(`Blog post with ID ${blogId} not found for user ${user.id}`);
                return NextResponse.json({ error: "Blog post not found" }, { status: 404 });
            }
            console.error("Supabase fetch error:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        const formattedTags = data?.blogpost_tags?.map((bt: any) => bt.tag_id) || [];
        const formattedData = data ? {
            id: data.id,
            title: data.title,
            cover_image: data.cover_image,
            content: data.content,
            status: data.status,
            tags: formattedTags,
        } : null;

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
  { params }: { params: BlogIdParams } // Standard Next.js 13/14 way
) {
    const supabase = await createClient();
    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const blogId = params.id; // 'params' is now directly available

    if (!blogId) {
        return NextResponse.json({ error: "Blog ID is missing" }, { status: 400 });
    }

    try {
        const { error: deleteTagsError } = await supabase
            .from('blogpost_tags')
            .delete()
            .eq('blogpost_id', blogId);

        if (deleteTagsError) {
            console.error(`Error deleting tags for blog post ${blogId}:`, deleteTagsError);
        }

        const { error: deletePostError } = await supabase
            .from('blogposts')
            .delete()
            .eq('id', blogId)
            .eq('author_id', user.id); // Ensuring author check

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