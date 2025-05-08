"use client"

import React, { useState } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { TagSelector, Tag } from "@/components/tag-selector"
import { ArrowLeft, ImageIcon, Film, Info, X, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from 'sonner';
import { MediaTypeSelector } from '../../components/media-type-selector';
import { MultiFileUploader } from '../../components/multi-file-upload';
import axios from 'axios';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type Props = {
    availableTags: Tag[];
}

export default function Gallerywizard({ availableTags }: Props) {
    const router = useRouter();

    const [title, setTitle] = useState("")
    const [description, setDescription] = useState("")
    const [mediaType, setMediaType] = useState<"image" | "video">("image")
    const [mediaFiles, setMediaFiles] = useState<File[]>([])
    const [selectedTags, setSelectedTags] = useState<string[]>([])
    const [isSubmitting, setIsSubmitting] = useState(false)
  
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        // --- Validation ---
        if (!title.trim()) {
            toast.error("Please enter a title.");
            setIsSubmitting(false);
            return;
        }
        if (mediaFiles.length === 0) {
            toast.error("Please select at least one file to upload.");
            setIsSubmitting(false);
            return;
        }
         if (mediaFiles.length > 7) {
             toast.error("You can upload a maximum of 7 files.");
             setIsSubmitting(false);
             return;
         }
        if (selectedTags.length === 0) {
            toast.error("Please select at least one tag.");
            setIsSubmitting(false);
            return;
        }

        // --- Step 1: Upload Files to R2 ---
        const uploadedImageUrls: { url: string; alt_text?: string }[] = [];
        const uploadPromises: Promise<void>[] = []; 

        toast.info(`Starting upload of ${mediaFiles.length} files...`);
        console.log(`Frontend: Starting upload for ${mediaFiles.length} files.`);

        for (const file of mediaFiles) {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("type", "gallery"); // Set upload type to 'gallery'

            uploadPromises.push(
                axios.post("/api/upload", formData, {
                    headers: { "Content-Type": "multipart/form-data" },
                })
                .then(res => {
                    // Use title as basic alt text for now, can be enhanced later
                    uploadedImageUrls.push({ url: res.data.url, alt_text: title }); 
                    console.log(`Frontend: Uploaded ${file.name}: ${res.data.url}`);
                })
                .catch(err => {
                    console.error(`Frontend: Failed to upload ${file.name}:`, err);
                    // Throw error to stop Promise.all if one fails
                    throw new Error(`Failed to upload ${file.name}. ${err.response?.data?.error || err.message}`); 
                })
            );
        }

        try {
            // Wait for all uploads to complete
            await Promise.all(uploadPromises);
            toast.success("All files uploaded successfully!");
            console.log("Frontend: All file uploads complete. URLs:", uploadedImageUrls);

            // --- Step 2: Create Gallery Post in Database ---
            const galleryData = {
                title: title.trim(),
                description: description.trim() || undefined, // Send undefined if empty
                type: mediaType === 'image' ? 'Images' : 'Videos', // Match API expected type
                tags: selectedTags,
                // Only include imageUrls if the type is Images
                imageUrls: mediaType === 'image' ? uploadedImageUrls : undefined, 
            };

            console.log("Frontend: Sending data to /api/gallery/create:", JSON.stringify(galleryData, null, 2));
            toast.info("Creating gallery post...");
            
            const response = await axios.post('/api/gallery/create', galleryData);

            if (response.data.success) {
                toast.success("Gallery post created successfully!");
                console.log("Frontend: Gallery post created successfully:", response.data.galleryPost);
                // Optionally redirect or reset form
                router.push('/protected/gallery'); // Example redirect
                // Or reset form if staying on page:
                // setTitle("");
                // setDescription("");
                // setMediaFiles([]);
                // setSelectedTags([]);
                // setMediaType("image"); 
            } else {
                 // If API returns success: false explicitly
                 throw new Error(response.data.error || "Failed to create gallery post.");
            }

        } catch (error: any) {
            // Handle errors from either upload (Promise.all rejection) or gallery creation (axios rejection)
            console.error("Frontend: Error during gallery submission process:", error);
            toast.error(error.message || "An error occurred during the process.");
        } finally {
            setIsSubmitting(false);
        }
    };
  
    const getFilePreview = (file: File) => {
      if (file.type.startsWith("image/")) {
        return URL.createObjectURL(file)
      }
      return null
    }
  
    const removeFile = (index: number) => {
      const newFiles = [...mediaFiles]
      newFiles.splice(index, 1)
      setMediaFiles(newFiles)
    }

    const handleMediaTypeChange = (newType: "image" | "video") => {
        if (newType !== mediaType) {
            setMediaFiles([])
        }
        setMediaType(newType)
    }

  return (
    <div className="container mx-auto py-6">
        <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Upload to Gallery</h1>
        <Button variant="outline" size="sm" asChild>
            <Link href="/protected/gallery">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Gallery
            </Link>
        </Button>
        </div>

        <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-6">
                <Card>
                <CardHeader>
                    <CardTitle>Upload Details</CardTitle>
                    <CardDescription>Provide information about your uploads</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                        id="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Enter a title for your media"
                        required
                        disabled={isSubmitting}
                    />
                    </div>

                    <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Enter a description"
                        rows={3}
                        disabled={isSubmitting}
                    />
                    </div>

                    <div className="space-y-2">
                    <Label>Media Type</Label>
                    <MediaTypeSelector value={mediaType} onChange={handleMediaTypeChange} />
                    </div>

                    <div className="space-y-2">
                    <Label>Tags</Label>
                    <TagSelector
                        selectedTags={selectedTags}
                        onChange={setSelectedTags}
                        availableTags={availableTags}
                        disabled={isSubmitting}
                    />
                    </div>
                </CardContent>
                </Card>

                <Card>
                <CardHeader>
                    <CardTitle>Upload Files</CardTitle>
                    <CardDescription>Select up to 7 files to upload</CardDescription>
                </CardHeader>
                <CardContent>
                    <Alert className="mb-4">
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                        You can upload up to 7 files. Currently selected: {mediaFiles.length}/7
                    </AlertDescription>
                    </Alert>
                    <MultiFileUploader
                    value={mediaFiles}
                    onChange={setMediaFiles}
                    acceptedFileTypes={mediaType === "image" ? "image/*" : "video/*"}
                    maxFiles={7}
                    disabled={isSubmitting}
                    />
                </CardContent>
                <CardFooter>
                    <Button
                    type="submit"
                    className="w-full bg-green-600 hover:bg-green-700"
                    disabled={isSubmitting || mediaFiles.length === 0 || !title.trim() || selectedTags.length === 0}
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Uploading...
                            </>
                         ) : `Upload ${mediaFiles.length > 0 ? mediaFiles.length : ""} to Gallery`}
                    </Button>
                </CardFooter>
                </Card>
            </div>

            <div className="lg:col-span-2">
                <Card>
                <CardHeader>
                    <CardTitle>Preview</CardTitle>
                    <CardDescription>
                    {mediaFiles.length > 0
                        ? `${mediaFiles.length} files selected for upload`
                        : "Upload files to see preview"}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {mediaFiles.length > 0 ? (
                    <div className="masonry-grid">
                        {mediaFiles.map((file, index) => (
                        <div
                            key={index}
                            className={`masonry-item relative rounded-md overflow-hidden mb-4 ${
                            index % 3 === 0 ? "h-64" : index % 3 === 1 ? "h-80" : "h-72"
                            }`}
                        >
                            {getFilePreview(file) ? (
                            <Image
                                src={getFilePreview(file) || "/placeholder.svg"}
                                alt={file.name}
                                fill
                                className="object-cover"
                                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            />
                            ) : (
                            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                                {file.type.startsWith("video/") ? (
                                <Film className="h-12 w-12 text-green-600" />
                                ) : (
                                <ImageIcon className="h-12 w-12 text-green-600" />
                                )}
                            </div>
                            )}
                            <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-40 transition-all flex items-center justify-center opacity-0 hover:opacity-100 group">
                            <Button
                                variant="destructive"
                                size="icon"
                                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => removeFile(index)}
                                disabled={isSubmitting}
                                type="button"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent">
                                <p className="text-white text-xs truncate font-medium">{file.name}</p>
                            </div>
                        </div>
                        ))}
                    </div>
                    ) : (
                    <div className="h-96 flex items-center justify-center border-2 border-dashed rounded-md">
                        <div className="text-center">
                        <ImageIcon className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                        <p className="text-lg font-medium text-gray-500">No files selected</p>
                        <p className="text-sm text-gray-400">Upload files to see preview</p>
                        </div>
                    </div>
                    )}
                </CardContent>
                </Card>
            </div>
            </div>
        </form>

        <style jsx>{`
        .masonry-grid {
            column-count: 1;
            column-gap: 1rem;
        }
        
        @media (min-width: 640px) {
            .masonry-grid {
            column-count: 2;
            }
        }
        
        @media (min-width: 1024px) {
            .masonry-grid {
            column-count: 3;
            }
        }
        
        .masonry-item {
            break-inside: avoid;
            display: inline-block;
            width: 100%;
        }
        `}</style>
    </div>
  )
}