"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Upload, X, Trash2, Loader2 } from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import axios from "axios"
import { toast } from "sonner"

interface FileUploadResponse {
    url: string;
    key: string;
    fileName: string;
    fileSizeMb: number;
}

interface FileUploaderProps {
    onChange: (file: FileUploadResponse | null) => void
    value?: string | null // Keep value as string URL for initial display
    className?: string
    uploadType?: "events" | "blogposts" | "gallery" | "blogCovers" | "memberFeed"
    accept?: string
}

export function FileUploader({ onChange, value, className, uploadType = "events", accept }: FileUploaderProps) {
  const [preview, setPreview] = useState<string | null>(value || null)
  const [fileKey, setFileKey] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false)
  const [removing, setRemoving] = useState(false)

  // Accept prop fallback
  const acceptedTypes = accept || (uploadType === "memberFeed"
    ? ".pdf,.txt,.doc,.docx,.xls,.xlsx,.csv,image/*,video/*"
    : "image/*");

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    if (!file) return

    setUploading(true);
    const toastId = toast.loading(`Uploading ${file.name}...`);

    // Preview image locally temporarily
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    try {
        // 1. Get presigned URL
        const presignedResponse = await axios.post('/api/upload/presigned-url', {
            fileName: file.name,
            contentType: file.type,
            folder: uploadType,
        });

        const { presignedUrl, url: publicUrl, key } = presignedResponse.data;

        // 2. Upload to R2 via presigned URL
        await axios.put(presignedUrl, file, {
            headers: { 'Content-Type': file.type },
        });

        // 3. Notify parent component
        const fileDetails: FileUploadResponse = {
            url: publicUrl,
            key: key,
            fileName: file.name,
            fileSizeMb: file.size / (1024 * 1024),
        };
        onChange(fileDetails);
        setPreview(publicUrl);
        setFileKey(key);
        toast.success("File uploaded successfully!", { id: toastId });

    } catch (err) {
        console.error("Upload error:", err);
        toast.error("Something went wrong during upload.", { id: toastId });
        setPreview(null); // Clear preview on error
        onChange(null);
    } finally {
        setUploading(false);
    }
  }

  // Universal file removal
  const handleRemove = async () => {
    // Prefer the key stored in state, but fall back to extracting from URL if needed
    // This covers cases where the component is initialized with a `value` URL
    const keyToDelete = fileKey || (preview ? preview.split(`/${uploadType}/`)[1] : null);

    if (!keyToDelete) {
      toast.error("Could not determine file to delete.");
      // Still clear the component state
      onChange(null)
      setPreview(null)
      setFileKey(null)
      return
    }

    setRemoving(true)
    const toastId = toast.loading("Removing file...");
    try {
      await axios.post("/api/upload/delete", { key: keyToDelete })
      onChange(null)
      setPreview(null)
      setFileKey(null);
      toast.success("File removed.", { id: toastId });
    } catch (err) {
      toast.error("Failed to delete file from storage.", { id: toastId });
    } finally {
      setRemoving(false)
    }
  }

  useEffect(() => {
    setPreview(value || null)
    if (value) {
        const keyFromValue = value.includes(`/${uploadType}/`) ? `${uploadType}/${value.split(`/${uploadType}/`)[1]}` : null;
        setFileKey(keyFromValue);
    } else {
        setFileKey(null);
    }
  }, [value, uploadType]);

  return (
    <div className={`relative ${className}`}>
      {uploading ? (
        <div className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-md">
          <Loader2 className="h-8 w-8 animate-spin text-green-600" />
          <p className="mt-2 text-sm text-muted-foreground">Uploading...</p>
        </div>
      ) : preview ? (
        <div className="relative rounded-md overflow-hidden border border-dashed border-enugu w-10/12 h-56 mx-auto flex items-center justify-center bg-muted">
          {/* File preview logic */}
          {preview.match(/\.(jpg|jpeg|png|svg|gif|webp)$/i) ? (
            <Image src={preview} alt="Preview" fill className="object-contain" />
          ) : preview.match(/\.(pdf)$/i) ? (
            <div className="flex flex-col items-center">
              <span className="text-4xl">📄</span>
              <span className="text-xs mt-1">PDF File</span>
            </div>
          ) : preview.match(/\.(doc|docx)$/i) ? (
            <div className="flex flex-col items-center">
              <span className="text-4xl">📝</span>
              <span className="text-xs mt-1">Word Doc</span>
            </div>
          ) : preview.match(/\.(xls|xlsx|csv)$/i) ? (
            <div className="flex flex-col items-center">
              <span className="text-4xl">📊</span>
              <span className="text-xs mt-1">Excel File</span>
            </div>
          ) : preview.match(/\.(txt)$/i) ? (
            <div className="flex flex-col items-center">
              <span className="text-4xl">📄</span>
              <span className="text-xs mt-1">Text File</span>
            </div>
          ) : preview.match(/\.(mp4|mov|avi|webm)$/i) ? (
            <video src={preview} controls className="max-h-full max-w-full" />
          ) : (
            <span className="text-xs">File uploaded</span>
          )}
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 h-7 w-7"
            onClick={handleRemove}
            disabled={removing}
            aria-label="Remove file"
          >
            {removing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
          </Button>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-md cursor-pointer hover:bg-muted/50">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <Upload className="w-8 h-8 text-green-600 mb-2" />
            <p className="mb-2 text-sm text-muted-foreground">
              <span className="font-semibold">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-muted-foreground">
              Supports images, videos, and documents
            </p>
          </div>
          <input type="file" className="hidden" accept={acceptedTypes} onChange={handleFileChange} disabled={uploading} />
        </label>
      )}
    </div>
  )
}
