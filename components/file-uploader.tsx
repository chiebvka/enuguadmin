"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Upload, X, Trash2 } from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import axios from "axios"

interface FileUploaderProps {
    onChange: (file: string | null) => void
    value?: File | string | null
    className?: string
    uploadType?: "events" | "blogposts" | "gallery" | "blogCovers" | "memberFeed"
    accept?: string
}

export function FileUploader({ onChange, value, className, uploadType = "events", accept }: FileUploaderProps) {
  const [preview, setPreview] = useState<string | null>(typeof value === "string" ? value : null)
  const [uploading, setUploading] = useState(false)
  const [removing, setRemoving] = useState(false)

  // Accept prop fallback
  const acceptedTypes = accept || (uploadType === "memberFeed"
    ? ".pdf,.txt,.doc,.docx,.xls,.xlsx,.csv,image/*,video/*"
    : "image/*");

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    if (!file) return

    // Preview image locally temporarily
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    // Upload to R2
    const formData = new FormData()
    formData.append("file", file)
    formData.append("type", uploadType)

    try {
      setUploading(true)
      const res = await axios.post("/api/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      const url = res.data.url
      onChange(url)
      setPreview(url)
    } catch (err) {
      console.error("Upload error:", err)
      alert("Something went wrong.")
      setPreview(null)
    } finally {
      setUploading(false)
    }
  }

  // Universal file removal
  const handleRemove = async () => {
    if (!preview) {
      onChange(null)
      setPreview(null)
      return
    }
    // Extract the key from the URL
    let key = preview.split("/").slice(-2).join("/")
    // If your structure is e.g. .../memberFeed/filename, .../gallery/filename, etc.
    // You may want to use a regex or a more robust method depending on your URL structure
    setRemoving(true)
    try {
      await axios.post("/api/upload/delete", { key })
      onChange(null)
      setPreview(null)
    } catch (err) {
      alert("Failed to delete file from storage.")
    } finally {
      setRemoving(false)
    }
  }

  useEffect(() => {
    setPreview(value ? value.toString() : null)
  }, [value]);

  return (
    <div className={`relative ${className}`}>
      {uploading ? (
        <div className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-md">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-600"></div>
          <p className="mt-2 text-sm text-muted-foreground">Uploading...</p>
        </div>
      ) : preview ? (
        <div className="relative rounded-md overflow-hidden border border-dashed border-enugu w-10/12 h-56 mx-auto flex items-center justify-center bg-muted">
          {/* File preview logic */}
          {preview.match(/\.(jpg|jpeg|png|svg)$/i) ? (
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
            <video src={preview} controls className="max-h-24 max-w-32" />
          ) : (
            <span className="text-xs">File uploaded</span>
          )}
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2"
            onClick={handleRemove}
            disabled={removing}
            aria-label="Remove file"
          >
            <Trash2 className="h-4 w-4" />
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
              PDF, TXT, DOCX, XLSX, CSV, JPG, PNG, SVG, MP4, etc. (MAX. 2MB)
            </p>
          </div>
          <input type="file" className="hidden" accept={acceptedTypes} onChange={handleFileChange} />
        </label>
      )}
    </div>
  )
}
