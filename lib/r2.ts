import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

export const r2 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export async function uploadFileToR2(
  fileBuffer: Buffer,
  key: string,
  contentType: string
) {
  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET!,
    Key: key,
    Body: fileBuffer,
    ContentType: contentType,
    // ACL: "public-read", // ❌ DO NOT use with R2 – not supported
  });

  await r2.send(command);

  // Return a public-accessible URL — customize this if you're using a CDN domain
  const baseUrl = process.env.R2_PUBLIC_URL || `${process.env.R2_ENDPOINT}/${process.env.R2_BUCKET}`;
  return `${baseUrl}/${key}`;
}



// // lib/r2.ts
// import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

// export const r2 = new S3Client({
//   region: "auto",
//   endpoint: process.env.R2_ENDPOINT,
//   credentials: {
//     accessKeyId: process.env.R2_ACCESS_KEY_ID!,
//     secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
//   },
// });

// export async function uploadFileToR2(fileBuffer: Buffer, key: string, contentType: string) {
//   const command = new PutObjectCommand({
//     Bucket: process.env.R2_BUCKET!,
//     Key: key,
//     Body: fileBuffer,
//     ContentType: contentType,
//   });

//   await r2.send(command);
//   return `${process.env.R2_ENDPOINT}/${process.env.R2_BUCKET}/${key}`;
// }