"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Upload, X } from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import axios from "axios"

interface FileUploaderProps {
    onChange: (file: string | null) => void
    value?: File | string | null
    className?: string
    uploadType?: "events" | "blogposts" | "gallery" | "blogCovers"
}

export function FileUploader({ onChange, value, className, uploadType = "events" }: FileUploaderProps) {
  const [preview, setPreview] = useState<string | null>(typeof value === "string" ? value : null)
  const [uploading, setUploading] = useState(false)

  // const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
  //   const file = e.target.files?.[0] || null
  //   // onChange(file)

  //   // if (file) {
  //   //   const reader = new FileReader()
  //   //   reader.onloadend = () => {
  //   //     setPreview(reader.result as string)
  //   //   }
  //   //   reader.readAsDataURL(file)
  //   // } else {
  //   //   setPreview(null)
  //   // }

  //   if (!file) return

  //   // Preview image locally
  //   const reader = new FileReader()
  //   reader.onloadend = () => {
  //     setPreview(reader.result as string)
  //   }
  //   reader.readAsDataURL(file)
  //     // Upload to R2
  //     const formData = new FormData()
  //     formData.append("file", file)
  //     formData.append("type", uploadType)

  //     try {
  //       setUploading(true)
  //       // const res = await fetch("/api/upload", {
  //       //   method: "POST",
  //       //   body: formData,
  //       // })
  //       // const data = await res.json()

  //       const res = await axios.post("/api/upload", formData, {
  //           headers: { "Content-Type": "multipart/form-data" },
  //         })
  //         const url = res.data.url
  //         onChange(url)
  //         setPreview(url)
  //     } catch (err) {
  //       console.error("Upload error:", err)
  //       alert("Something went wrong.")
  //     } finally {
  //       setUploading(false)
  //     }


      
  // }

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
          // Call onChange with the uploaded URL
          onChange(url)
          // Update preview state with the actual uploaded URL
          setPreview(url)
      } catch (err) {
        console.error("Upload error:", err)
        alert("Something went wrong.")
        // If upload fails, revert preview or handle error appropriately
        setPreview(null); // Or set to a default error image
      } finally {
        setUploading(false)
      }
  }


  // const handleRemove = () => {
  //   onChange(null)
  //   setPreview(null)
  // }

  const handleRemove = () => {
    // Call onChange with null when removing
    onChange(null)
    setPreview(null)
  }

    // Add useEffect to update preview if the value prop changes externally
    useEffect(() => {
        setPreview(value ? value.toString() : null)
    }, [value]);

  return (
    <div className={`relative ${className}`}>
      {/* {preview ? (
        <div className="relative rounded-md overflow-hidden border">
          <div className="aspect-video relative">
            <Image src={preview || "/placeholder.svg"} alt="Preview" fill className="object-cover" />
          </div>
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2"
            onClick={handleRemove}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-md cursor-pointer hover:bg-muted/50">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <Upload className="w-8 h-8 text-green-600 mb-2" />
            <p className="mb-2 text-sm text-muted-foreground">
              <span className="font-semibold">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-muted-foreground">SVG, PNG, JPG or GIF (MAX. 2MB)</p>
          </div>
          <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
        </label>
      )} */}

{uploading ? (
        <div className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-md">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-600"></div>
            <p className="mt-2 text-sm text-muted-foreground">Uploading...</p>
        </div>
      ) : preview ? (
        <div className="relative rounded-md overflow-hidden border">
          <div className="aspect-video relative">
            {/* Use the preview state for the Image src */}
            <Image src={preview} alt="Preview" fill className="object-cover" />
          </div>
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2"
            onClick={handleRemove}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-md cursor-pointer hover:bg-muted/50">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <Upload className="w-8 h-8 text-green-600 mb-2" />
            <p className="mb-2 text-sm text-muted-foreground">
              <span className="font-semibold">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-muted-foreground">SVG, PNG, JPG or GIF (MAX. 2MB)</p>
          </div>
          <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
        </label>
      )}
    </div>
  )
}
