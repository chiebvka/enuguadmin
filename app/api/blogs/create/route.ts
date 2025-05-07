// app/api/blogs/save/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import slugify from "slugify";

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
      // Include 'id' and 'status' in the destructured body
      const { id, title, cover_image, content, tags, status } = body;

      // Basic validation: require title for any save/publish
      if (!title) {
         return NextResponse.json({ error: "Title is required" }, { status: 400 });
      }

      // Validate status
      const validStatuses = ["draft", "published"];
      if (!status || !validStatuses.includes(status)) {
           return NextResponse.json({ error: "Invalid status provided" }, { status: 400 });
      }


      let data = null;
      let error = null;

      if (id) {
        // If an ID is provided, update the existing blog post
        console.log(`Updating blog post with ID: ${id} with status: ${status}`);
        const { data: updateData, error: updateError } = await supabase
          .from("blogposts")
          .update({
            title: title,
            cover_image: cover_image,
            content: content,
            status: status, // Use the status from the body
            updated_at: new Date().toISOString(),
          })
          .eq("id", id)
          .select("*")
          .single();

        data = updateData;
        error = updateError;

      } else {
        // If no ID is provided, create a new blog post
        console.log(`Creating new blog post with status: ${status}`);
         // Ensure title is required for initial creation
         if (!title) {
            return NextResponse.json({ error: "Title is required for creating a new post" }, { status: 400 });
         }
        // Generate slug only on initial creation
        const slug = slugify(title, { lower: true, strict: true });

        const { data: insertData, error: insertError } = await supabase
          .from("blogposts")
          .insert([
            {
              title: title,
              slug: slug,
              cover_image: cover_image,
              content: content,
              author_id: user.id,
              status: status, // Use the status from the body
              // created_at and updated_at handled by DB
            },
          ])
          .select("*")
          .single();

          data = insertData;
          error = insertError;
      }

      if (error) {
        console.error(`Supabase ${id ? 'update' : 'insert'} error:`, error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      // Handle tag relationships (basic sync: delete and re-insert)
      // Ensure `blogpost_tags` table exists with `blogpost_id` and `tag_id` columns
      if (data?.id && tags !== undefined) {
           try {
               const { error: deleteTagsError } = await supabase
                   .from("blogpost_tags")
                   .delete()
                   .eq("blogpost_id", data.id);

               if (deleteTagsError) {
                   console.error("Error deleting existing tag relations:", deleteTagsError);
                   // Decide how to handle this error - maybe return a partial success or indicate tag error
               }

               if (Array.isArray(tags) && tags.length > 0) {
                    const tagInserts = tags.map((tagId: string) => ({
                        blogpost_id: data.id,
                        tag_id: tagId,
                    }));

                    const { error: insertTagsError } = await supabase
                        .from("blogpost_tags")
                        .insert(tagInserts);

                    if (insertTagsError) {
                        console.error("Error inserting new tag relations:", insertTagsError);
                         // Decide how to handle this error
                    }
               }

           } catch (tagSyncError) {
               console.error("Overall tag sync error:", tagSyncError);
               // Handle unexpected errors during tag sync
           }
       }

       // Return the saved/updated blog post data, especially the ID
       return NextResponse.json({ success: true, blog: data }, { status: id ? 200 : 201 });

    } catch (err: any) {
      console.error("Blog save/publish failed:", err);
      return NextResponse.json({ error: "Internal server error" + (err.message || "") }, { status: 500 });
    }
}






// // app/api/blogs/create/route.ts
// import { NextRequest, NextResponse } from "next/server";
// import { createClient } from "@/utils/supabase/server";
// import slugify from "slugify";

// export async function POST(req: NextRequest) {
//     const supabase = await createClient();
//     const {
//       data: { user },
//       error: authError,
//     } = await supabase.auth.getUser();
  
//     if (authError || !user) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }
  
//     try {
//       const body = await req.json();
//       const { title, cover_image, content, tags } = body;
  
//       if (!title || !cover_image || !content) {
//         return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
//       }
  

//     const slug = slugify(title, { lower: true, strict: true });

//     const { data, error } = await supabase.from("blogposts").insert([
//       {
//         title,
//         slug,
//         cover_image,
//         content,
//         author_id: user.id,
//         status: "draft", // or "published" depending on your UI
//       },
//     ]).select("*").single();

//     if (error) {
//       console.error("Supabase insert error:", error);
//       return NextResponse.json({ error: error.message }, { status: 500 });
//     }

//     // Optionally: insert blogpost-tag relationships
//     if (tags && Array.isArray(tags)) {
//       const tagInserts = tags.map((tagId: string) => ({
//         blogpost_id: data.id,
//         tag_id: tagId,
//       }));

//       const { error: tagError } = await supabase.from("blogpost_tags").insert(tagInserts);
//       if (tagError) {
//         console.error("Tag relation error:", tagError);
//         // Optional: rollback blogpost insert here
//       }
//     }

//     return NextResponse.json({ success: true, blog: data }, { status: 201 });
//   } catch (err: any) {
//     console.error("Blog creation failed:", err);
//     return NextResponse.json({ error: "Internal server error" }, { status: 500 });
//   }
// }