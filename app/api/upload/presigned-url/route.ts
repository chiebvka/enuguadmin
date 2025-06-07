import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createClient } from "@/utils/supabase/server";

const s3Client = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

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
        const { fileName, contentType, folder } = body;

        if (!fileName || !contentType || !folder) {
            return NextResponse.json({ error: "fileName, contentType, and folder are required." }, { status: 400 });
        }

        const key = `${folder}/${Date.now()}-${fileName.replace(/\s/g, '_')}`;
        const publicUrl = `${process.env.R2_PUBLIC_URL}/${key}`;

        const command = new PutObjectCommand({
            Bucket: process.env.R2_BUCKET!,
            Key: key,
            ContentType: contentType,
        });

        // @ts-expect-error - Type mismatch between AWS SDK versions
        const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 600 }); // 10 minutes expiry

        return NextResponse.json({ 
            presignedUrl, 
            key,
            url: publicUrl 
        });

    } catch (error: any) {
        console.error("Presigned URL generation failed:", error);
        return NextResponse.json({ error: "Failed to generate presigned URL." }, { status: 500 });
    }
} 