import { NextRequest, NextResponse } from "next/server";
import { deleteFileFromR2 } from "@/lib/r2";
import { createClient } from "@/utils/supabase/server";

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
    const { key } = body;

    if (!key || typeof key !== 'string') {
      return NextResponse.json({ error: "Missing or invalid 'key' in request body." }, { status: 400 });
    }

    // Add validation here if the key should conform to a certain pattern, e.g., start with "gallery/"
    // For example: if (!key.startsWith(`${process.env.R2_GALLERY_FOLDER_PREFIX || 'gallery'}/`)) {
    //   return NextResponse.json({ error: "Invalid key format or unauthorized path." }, { status: 400 });
    // }


    await deleteFileFromR2(key);
    return NextResponse.json({ success: true, message: "File deleted from R2 successfully." });

  } catch (error: any) {
    console.error("R2 Deletion failed:", error);
    // If deleteFileFromR2 throws, it will be caught here
    return NextResponse.json({ error: error.message || "File deletion from R2 failed" }, { status: 500 });
  }
}
