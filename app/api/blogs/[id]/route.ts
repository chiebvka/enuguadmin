import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

// Define the expected shape of the route parameters
type BlogIdParams = {
  id: string;
};

// Use the correct type for the route handler context
interface Context {
  params: BlogIdParams;
}

export async function GET(req: NextRequest, context: Context) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const blogId = context.params.id; // Access params from context

  if (!blogId) {
    return NextResponse.json({ error: "Blog ID is missing from URL parameters" }, { status: 400 });
  }

  try {
    const { data, error } = await supabase
      .from("blogposts")
      .select("id, title, cover_image, content, status, blogpost_tags(tag_id, tags(id, name))")
      .eq("id", blogId)
      .eq("author_id", user.id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        console.log(`Blog post with ID ${blogId} not found for user ${user.id}`);
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

export async function DELETE(req: NextRequest, context: Context) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const blogId = context.params.id; // Access params from context

  if (!blogId) {
    return NextResponse.json({ error: "Blog ID is missing" }, { status: 400 });
  }

  try {
    const { error: deleteTagsError } = await supabase
      .from("blogpost_tags")
      .delete()
      .eq("blogpost_id", blogId);

    if (deleteTagsError) {
      console.error(`Error deleting tags for blog post ${blogId}:`, deleteTagsError);
    }

    const { error: deletePostError } = await supabase
      .from("blogposts")
      .delete()
      .eq("id", blogId)
      .eq("author_id", user.id);

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