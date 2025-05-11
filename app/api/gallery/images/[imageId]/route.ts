import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

// --- DELETE a single gallery image ---
export async function DELETE(
    req: NextRequest, 
    context: any
) {
    const { params } = context;
    const { imageId } = params; // ID of the galleryimages record

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!imageId) {
        return NextResponse.json({ error: "Image ID is missing" }, { status: 400 });
    }
    console.log(`API DELETE /api/gallery/images/${imageId}: Attempting delete...`);

    try {
        // Optional: Verify user has permission to delete this image
        // This might involve joining galleryimages -> galleryposts -> checking author_id
        // For simplicity now, we assume any authenticated user can delete any image record via its ID if found.

        // Delete the specific image record
        const { error: deleteImageError } = await supabase
            .from('galleryimages')
            .delete()
            .eq('id', imageId);

        if (deleteImageError) {
            console.error(`Supabase gallery image delete error for ${imageId}:`, deleteImageError);
             if (deleteImageError.code === 'PGRST116') { // Not found (already deleted?)
                  return NextResponse.json({ error: "Image not found" }, { status: 404 });
             }
            return NextResponse.json({ error: `Failed to delete image: ${deleteImageError.message}` }, { status: 500 });
        }

        // Also consider deleting the actual file from R2 storage here using the image_url if needed

        console.log(`API DELETE /api/gallery/images/${imageId}: Successfully deleted gallery image record.`);
        return NextResponse.json({ message: "Image deleted successfully" }, { status: 200 });

    } catch (err: any) {
        console.error(`Gallery image deletion failed for ID ${imageId}:`, err);
        return NextResponse.json({ error: "Internal server error: " + (err.message || "") }, { status: 500 });
    }
} 