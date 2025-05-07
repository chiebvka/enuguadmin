import { NextRequest, NextResponse } from "next/server";
import { uploadFileToR2 } from "@/lib/r2";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const file = formData.get("file") as File | null;
    const folder = formData.get("type") as string | null || "misc"; // optional dynamic type

    if (!file) {
      return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
    }

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const contentType = file.type || "application/octet-stream";
    const filename = `${folder}/${Date.now()}-${file.name || "upload"}`;

    const url = await uploadFileToR2(buffer, filename, contentType);

    return NextResponse.json({ url });
  } catch (error) {
    console.error("Upload failed:", error);
    return NextResponse.json({ error: "File upload failed" }, { status: 500 });
  }
}

// Note: You don't need the `config` export with bodyParser: false
// when using req.formData() in the App Router.



// // pages/api/upload.ts
// import { NextApiRequest, NextApiResponse } from "next";
// import formidable, { File as FormidableFile, Fields, Files } from "formidable";
// import { readFile } from "fs/promises";
// import { uploadFileToR2 } from "@/lib/r2";

// // Disable body parsing to allow Formidable to handle multipart/form-data
// export const config = {
//   api: {
//     bodyParser: false,
//   },
// };

// // Helper to promisify the form parsing
// function parseForm(req: NextApiRequest): Promise<{ fields: Fields; files: Files }> {
//   const form = formidable({ multiples: false });

//   return new Promise((resolve, reject) => {
//     form.parse(req, (err, fields, files) => {
//       if (err) return reject(err);
//       resolve({ fields, files });
//     });
//   });
// }

// export default async function handler(req: NextApiRequest, res: NextApiResponse) {
//   if (req.method !== "POST") return res.status(405).end();

//   try {
//     const { fields, files } = await parseForm(req);

//     const file = Array.isArray(files.file) ? files.file[0] : files.file;
//     if (!file) return res.status(400).json({ error: "No file uploaded." });

//     if (!file || Array.isArray(file)) {
//       return res.status(400).json({ error: "Invalid file upload." });
//     }

//     const buffer = await readFile(file.filepath);
//     const contentType = file.mimetype || "application/octet-stream";
//     const folderRaw = fields.type;
//     const folder = Array.isArray(folderRaw) ? folderRaw[0] : folderRaw || "misc";// optional dynamic type: events, blogposts, etc.
//     const filename = `ndienugu/${folder}/${Date.now()}-${file.originalFilename || "upload"}`;

//     const url = await uploadFileToR2(buffer, filename, contentType);
//     return res.status(200).json({ url });
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({ error: "File upload failed" });
//   }
// }