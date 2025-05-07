import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

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
        const { data: blogPostsData, error } = await supabase
            .from('blogposts')
            .select(`
                id,
                title,
                cover_image,
                created_at,
                status,
                content, 
                blogpost_tags (
                    tags (id, name)
                )
            `)
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Supabase fetch error for blog posts:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        const formattedBlogPosts = blogPostsData.map(post => {
            let excerptText = "No content available.";
            // Assuming content is stored as an HTML string from Tiptap
            if (post.content && typeof post.content === 'string') {
                const plainText = post.content.replace(/<[^>]+>/g, '');
                excerptText = plainText.substring(0, 150) + (plainText.length > 150 ? '...' : '');
            }
            
            return {
                id: post.id,
                title: post.title,
                cover_image: post.cover_image,
                created_at: post.created_at,
                status: post.status,
                tags: post.blogpost_tags.map((bt: any) => bt.tags).filter(Boolean),
                excerpt: excerptText,
            };
        });

        return NextResponse.json({ blogPosts: formattedBlogPosts }, { status: 200 });

    } catch (err: any) {
        console.error("Blog list fetch failed:", err);
        return NextResponse.json({ error: "Internal server error: " + (err.message || "") }, { status: 500 });
    }
}
