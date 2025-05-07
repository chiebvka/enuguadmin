// app/api/tags/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server"; // Using uuid for generating IDs
import slugify from "slugify";

// Make sure you install uuid: npm install uuid @types/uuid

export async function GET(req: NextRequest) {
    const supabase = await createClient();
    // Authentication is likely required to manage tags,
    // but you might allow public reading of tags depending on your app
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    // Decide if tags are public or only accessible to authenticated users
    // If public, remove the auth check. Assuming authenticated for management context.
    if (authError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        // Fetch all tags from the 'tags' table
        const { data: tags, error } = await supabase
            .from('tags')
            .select('id, name') // Select the fields you need
            .order('name', { ascending: true }); // Order alphabetically

        if (error) {
            console.error("Supabase fetch tags error:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ tags }, { status: 200 });

    } catch (err: any) {
        console.error("API error fetching tags:", err);
        return NextResponse.json({ error: "Internal server error" + (err.message || "") }, { status: 500 });
    }
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

    try {
        const body = await req.json();
        const { name } = body;

        if (!name || typeof name !== 'string' || name.trim().length === 0) {
            return NextResponse.json({ error: "Tag name is required and must be a non-empty string" }, { status: 400 });
        }

        // Generate the slug from the tag name
        const slug = slugify(name.trim(), { lower: true, strict: true });

        // Insert the new tag into the 'tags' table
        const { data: newTag, error } = await supabase
            .from('tags')
            .insert([
                {  name: name.trim(),
                    slug: slug,
                    profile_id: user.id
                 }
            ])
            .select('id, name, slug, profile_id') // Select the newly created tag
            .single(); // Expecting a single row back

        if (error) {
             // Handle unique constraint violation specifically if needed (e.g., tag name already exists)
             if (error.code === '23505') { // PostgreSQL unique violation error code
                 return NextResponse.json({ error: `Tag with name "${name}" already exists.` }, { status: 409 }); // 409 Conflict
             }
            console.error("Supabase insert tag error:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, tag: newTag }, { status: 201 }); // 201 Created

    } catch (err: any) {
        console.error("API error creating tag:", err);
        return NextResponse.json({ error: "Internal server error" + (err.message || "") }, { status: 500 });
    }
}