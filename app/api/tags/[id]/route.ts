import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

// --- PUT (Update) an existing tag ---
export async function PUT(
    req: NextRequest, { params }: { params: { tagId: string } }
) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { tagId } =  params;

  if (!tagId) {
    return NextResponse.json({ error: "Tag ID is missing from URL" }, { status: 400 });
  }

  try {
    const body = await req.json();
    const { name } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ error: "New tag name is required and must be a non-empty string" }, { status: 400 });
    }

    const { data: updatedTag, error } = await supabase
      .from("tags")
      .update({ name: name.trim() })
      .eq("id", tagId)
      .select("id, name")
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Tag not found" }, { status: 404 });
      }
      if (error.code === "23505") {
        return NextResponse.json({ error: `Tag with name "${name}" already exists.` }, { status: 409 });
      }
      console.error("Supabase update tag error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!updatedTag) {
      return NextResponse.json({ error: "Tag not found or not updated" }, { status: 404 });
    }

    return NextResponse.json({ success: true, tag: updatedTag }, { status: 200 });
  } catch (err: any) {
    console.error("API error updating tag:", err);
    return NextResponse.json({ error: "Internal server error" + (err.message || "") }, { status: 500 });
  }
}

// --- DELETE a tag ---
export async function DELETE(
    req: NextRequest, { params }: { params: { tagId: string } }
) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { tagId } =  params;

  if (!tagId) {
    return NextResponse.json({ error: "Tag ID is missing from URL" }, { status: 400 });
  }

  try {
    const { error } = await supabase
      .from("tags")
      .delete()
      .eq("id", tagId);

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Tag not found" }, { status: 404 });
      }
      if (error.code === "23503") {
        return NextResponse.json(
          { error: "Tag is currently used by blog posts or events and cannot be deleted." },
          { status: 409 }
        );
      }
      console.error("Supabase delete tag error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: tagId }, { status: 200 });
  } catch (err: any) {
    console.error("API error deleting tag:", err);
    return NextResponse.json({ error: "Internal server error" + (err.message || "") }, { status: 500 });
  }
}









// import { NextRequest, NextResponse } from "next/server";
// import { createClient } from "@/utils/supabase/server";

// // Define the expected shape of the route parameters
// type RouteParams = {
//   id: string;
// };

// // Define the context type for the route handler
// interface Context {
//   params: RouteParams;
// }

// // --- PUT (Update) an existing tag ---
// export async function PUT(req: NextRequest, context: Context) {
//   const supabase = await createClient();
//   const {
//     data: { user },
//     error: authError,
//   } = await supabase.auth.getUser();

//   if (authError || !user) {
//     return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//   }

//   const tagId = context.params.id;

//   if (!tagId) {
//     return NextResponse.json({ error: "Tag ID is missing from URL" }, { status: 400 });
//   }

//   try {
//     const body = await req.json();
//     const { name } = body;

//     if (!name || typeof name !== "string" || name.trim().length === 0) {
//       return NextResponse.json({ error: "New tag name is required and must be a non-empty string" }, { status: 400 });
//     }

//     const { data: updatedTag, error } = await supabase
//       .from("tags")
//       .update({ name: name.trim() })
//       .eq("id", tagId)
//       .select("id, name")
//       .single();

//     if (error) {
//       if (error.code === "PGRST116") {
//         return NextResponse.json({ error: "Tag not found" }, { status: 404 });
//       }
//       if (error.code === "23505") {
//         return NextResponse.json({ error: `Tag with name "${name}" already exists.` }, { status: 409 });
//       }
//       console.error("Supabase update tag error:", error);
//       return NextResponse.json({ error: error.message }, { status: 500 });
//     }

//     if (!updatedTag) {
//       return NextResponse.json({ error: "Tag not found or not updated" }, { status: 404 });
//     }

//     return NextResponse.json({ success: true, tag: updatedTag }, { status: 200 });
//   } catch (err: any) {
//     console.error("API error updating tag:", err);
//     return NextResponse.json({ error: "Internal server error" + (err.message || "") }, { status: 500 });
//   }
// }

// // --- DELETE a tag ---
// export async function DELETE(req: NextRequest, context: Context) {
//   const supabase = await createClient();
//   const {
//     data: { user },
//     error: authError,
//   } = await supabase.auth.getUser();

//   if (authError || !user) {
//     return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//   }

//   const tagId = context.params.id;

//   if (!tagId) {
//     return NextResponse.json({ error: "Tag ID is missing from URL" }, { status: 400 });
//   }

//   try {
//     const { error } = await supabase
//       .from("tags")
//       .delete()
//       .eq("id", tagId);

//     if (error) {
//       if (error.code === "PGRST116") {
//         return NextResponse.json({ error: "Tag not found" }, { status: 404 });
//       }
//       if (error.code === "23503") {
//         return NextResponse.json(
//           { error: "Tag is currently used by blog posts or events and cannot be deleted." },
//           { status: 409 }
//         );
//       }
//       console.error("Supabase delete tag error:", error);
//       return NextResponse.json({ error: error.message }, { status: 500 });
//     }

//     return NextResponse.json({ success: true, id: tagId }, { status: 200 });
//   } catch (err: any) {
//     console.error("API error deleting tag:", err);
//     return NextResponse.json({ error: "Internal server error" + (err.message || "") }, { status: 500 });
//   }
// }








// // app/api/tags/[id]/route.ts
// import { NextRequest, NextResponse } from "next/server";
// import { createClient } from "@/utils/supabase/server";

// interface RouteParams {
//     id: string;
// }

// export async function PUT(req: NextRequest, 
//     params: RouteParams
// ) {
//     const supabase = await createClient();
//     const {
//       data: { user },
//       error: authError,
//     } = await supabase.auth.getUser();

//     if (authError || !user) {
//         return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     // Await params as per Next.js docs for async handlers with dynamic segments
     
//     const tagId = params?.id;

//     if (!tagId) {
//         return NextResponse.json({ error: "Tag ID is missing from URL" }, { status: 400 });
//     }

//     try {
//         const body = await req.json();
//         const { name } = body;

//         if (!name || typeof name !== 'string' || name.trim().length === 0) {
//             return NextResponse.json({ error: "New tag name is required and must be a non-empty string" }, { status: 400 });
//         }

//         // Update the tag in the 'tags' table
//         const { data: updatedTag, error } = await supabase
//             .from('tags')
//             .update({ name: name.trim() })
//             .eq('id', tagId)
//             .select('id, name') // Select the updated tag
//             .single(); // Expecting a single row back

//         if (error) {
//              if (error.code === 'PGRST116') { // Supabase error code for "Not Found"
//                  return NextResponse.json({ error: "Tag not found" }, { status: 404 });
//              }
//               if (error.code === '23505') { // PostgreSQL unique violation error code
//                  return NextResponse.json({ error: `Tag with name "${name}" already exists.` }, { status: 409 }); // 409 Conflict
//              }
//             console.error("Supabase update tag error:", error);
//             return NextResponse.json({ error: error.message }, { status: 500 });
//         }

//          if (!updatedTag) {
//              // This might happen if the eq filter doesn't find a match but no explicit error is thrown
//              return NextResponse.json({ error: "Tag not found or not updated" }, { status: 404 });
//          }


//         return NextResponse.json({ success: true, tag: updatedTag }, { status: 200 }); // 200 OK

//     } catch (err: any) {
//         console.error("API error updating tag:", err);
//         return NextResponse.json({ error: "Internal server error" + (err.message || "") }, { status: 500 });
//     }
// }

// export async function DELETE(req: NextRequest, 
//     params: RouteParams
// ) {
//     const supabase = await createClient();
//     const {
//       data: { user },
//       error: authError,
//     } = await supabase.auth.getUser();

//     if (authError || !user) {
//         return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     // Await params as per Next.js docs for async handlers with dynamic segments
//     const tagId = params?.id;

//     if (!tagId) {
//         return NextResponse.json({ error: "Tag ID is missing from URL" }, { status: 400 });
//     }

//     try {
//         // Before deleting a tag, you might want to check if it's linked to any blog posts or events
//         // If linked, you might prevent deletion or handle cascading deletes in your database schema.
//         // For simplicity here, we'll proceed with deletion.

//         const { error } = await supabase
//             .from('tags')
//             .delete()
//             .eq('id', tagId);

//         if (error) {
//              if (error.code === 'PGRST116') { // Supabase error code for "Not Found"
//                  return NextResponse.json({ error: "Tag not found" }, { status: 404 });
//              }
//              // Handle foreign key constraint violation if the tag is still linked (code '23503')
//              if (error.code === '23503') {
//                   return NextResponse.json({ error: "Tag is currently used by blog posts or events and cannot be deleted." }, { status: 409 }); // 409 Conflict
//              }
//             console.error("Supabase delete tag error:", error);
//             return NextResponse.json({ error: error.message }, { status: 500 });
//         }

//         // Supabase delete doesn't return data by default, check for error instead
//         // If no error, assume success
//          return NextResponse.json({ success: true, id: tagId }, { status: 200 }); // 200 OK

//     } catch (err: any) {
//         console.error("API error deleting tag:", err);
//         return NextResponse.json({ error: "Internal server error" + (err.message || "") }, { status: 500 });
//     }
// }