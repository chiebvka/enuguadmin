"use client"

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { TagSelector, Tag } from "@/components/tag-selector"
import { ArrowLeft, ImageIcon, Film, Info, X, Loader2, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { 
    AlertDialog, 
    AlertDialogAction, 
    AlertDialogCancel, 
    AlertDialogContent, 
    AlertDialogFooter, 
    AlertDialogHeader, 
    AlertDialogTitle, 
    AlertDialogTrigger,
    AlertDialogDescription
} from "@/components/ui/alert-dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from 'sonner';
import { MediaTypeSelector } from '../../components/media-type-selector';
import { MultiFileUploader } from '../../components/multi-file-upload';
import axios from 'axios';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// Interface for existing images passed as initial data
interface ExistingImage {
    id: string;
    image_url: string;
    alt_text?: string | null;
    position?: number | null;
    r2_key?: string | null; // Add r2_key
}

// Interface for the initial gallery data prop
interface InitialGalleryData {
    id: string;
    title: string;
    description: string | null;
    type: string; // e.g., 'image', 'video' (lowercase from DB)
    tags: string[];
    images: ExistingImage[];
}

type Props = {
    availableTags: Tag[];
    galleryId?: string | null; // Optional galleryId for edit mode
    initialGalleryData?: InitialGalleryData | null; // Optional initial data for edit mode
}

export default function Gallerywizard({ availableTags, galleryId: initialGalleryId, initialGalleryData }: Props) {
    const router = useRouter();

    // State for edit mode ID
    const [galleryId, setGalleryId] = useState<string | null>(initialGalleryId || null);

    const [title, setTitle] = useState(initialGalleryData?.title || "");
    const [description, setDescription] = useState(initialGalleryData?.description || "");
    // Initialize mediaType based on initial data or default
    const [mediaType, setMediaType] = useState<'image' | 'video'>(
        initialGalleryData?.type === 'video' ? 'video' : 'image' // Default to image if type is missing or 'image'
    );
    const [mediaFiles, setMediaFiles] = useState<File[]>([]); // For NEW files to upload
    // State to hold existing images (for display and potential deletion tracking)
    const [existingImages, setExistingImages] = useState<ExistingImage[]>(initialGalleryData?.images || []);
    const [selectedTags, setSelectedTags] = useState<string[]>(initialGalleryData?.tags || []);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeletingGallery, setIsDeletingGallery] = useState(false); // For deleting the whole gallery

    // Effect to update state if initialGalleryData changes (e.g., navigating between edit pages)
    useEffect(() => {
        if (initialGalleryData) {
            setGalleryId(initialGalleryData.id);
            setTitle(initialGalleryData.title);
            setDescription(initialGalleryData.description || "");
            setMediaType(initialGalleryData.type === 'video' ? 'video' : 'image');
            setSelectedTags(initialGalleryData.tags);
            setExistingImages(initialGalleryData.images);
            setMediaFiles([]); // Clear any staged new files when loading initial data
        } else {
            // Reset if navigating from edit to create maybe? Or handle differently.
            // setGalleryId(null); setTitle(""); etc. if needed
        }
    }, [initialGalleryData]);

    // Combined list for preview
    const allPreviewItems = useMemo(() => {
        const existing = existingImages.map(img => ({ type: 'existing', data: img } as const));
        const news = mediaFiles.map(file => ({ type: 'new', data: file } as const));
        // Simple concatenation for now, sorting/positioning could be added
        return [...existing, ...news];
    }, [existingImages, mediaFiles]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        console.log("Frontend: handleSubmit called. Mode:", galleryId ? "Edit" : "Create");

        // --- Validation ---
        if (!title.trim()) {
            toast.error("Please enter a title.");
            setIsSubmitting(false);
            return;
        }
        if (mediaFiles.length === 0 && existingImages.length === 0) {
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

        // --- Step 1: Upload NEW Files (only if creating or if new files were added in edit mode) ---
        let uploadedMediaForNewFiles: { url: string; key: string; alt_text?: string }[] = [];
        if (mediaFiles.length > 0) {
            const uploadPromises: Promise<void>[] = [];
            toast.info(`Starting upload of ${mediaFiles.length} new files...`);
            console.log(`Frontend: Starting upload for ${mediaFiles.length} new files.`);

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
                        uploadedMediaForNewFiles.push({ 
                            url: res.data.url, 
                            key: res.data.key, // Store the key
                            alt_text: title 
                        }); 
                        console.log(`Frontend: Uploaded ${file.name}: ${res.data.url} (key: ${res.data.key})`);
                    })
                    .catch(err => {
                        console.error(`Frontend: Failed to upload ${file.name}:`, err);
                        // Throw error to stop Promise.all if one fails
                        throw new Error(`Failed to upload ${file.name}. ${err.response?.data?.error || err.message}`); 
                    })
                );
            }

            try {
                await Promise.all(uploadPromises);
                toast.success("New files uploaded successfully!");
                console.log("Frontend: New file uploads complete.");
            } catch (error: any) {
                console.error("Frontend: Error during new file upload:", error);
                toast.error(error.message || "An error occurred during file upload.");
                setIsSubmitting(false);
                return; // Stop if uploads fail
            }
        } else {
            console.log("Frontend: No new files to upload.");
        }

        // --- Step 2: Prepare data for API (Create or Update) ---
        const commonGalleryData = {
            title: title.trim(),
            description: description.trim() || undefined,
            type: mediaType === 'image' ? 'image' : 'video', // Use lowercase for consistency maybe? API converts anyway.
            tags: selectedTags,
        };

        try {
            let response;
            if (galleryId) {
                // --- UPDATE ---
                console.log(`Frontend: Sending data to PUT /api/gallery/${galleryId}:`, JSON.stringify(commonGalleryData, null, 2));
                toast.info("Updating gallery post...");
                response = await axios.put(`/api/gallery/${galleryId}`, commonGalleryData);
                // Note: Image additions/deletions are handled separately via their own API calls now for simplicity in PUT
                // If new files were uploaded, you *could* make separate calls here to ADD them to the gallery via an API.
                // For now, the PUT only handles metadata and tags. Image management is via delete button.
            } else {
                // --- CREATE ---
                // Add the initially uploaded image URLs and keys
                const createData = {
                    ...commonGalleryData,
                    images: uploadedMediaForNewFiles // Send array of image objects with url and key
                };
                console.log("Frontend: Sending data to POST /api/gallery/create:", JSON.stringify(createData, null, 2));
                toast.info("Creating gallery post...");
                response = await axios.post('/api/gallery/create', createData);
            }

            // --- Handle Response ---
            if (response.data.success) {
                toast.success(`Gallery post ${galleryId ? 'updated' : 'created'} successfully!`);
                const postId = galleryId || response.data.galleryPost?.id;
                if (postId) {
                    // Redirect to the edit page (or view page if preferred)
                    router.push(`/protected/gallery/${postId}`);
                    router.refresh(); // Optional: force refresh if client-side cache needs update
                } else {
                    router.push('/protected/gallery'); // Fallback redirect
                }
                // Reset form state ONLY IF creating, not editing
                // if (!galleryId) { resetFormState(); } // Define resetFormState function if needed
            } else {
                // This else block might not be hit if the server returns non-2xx status,
                // as axios throws an error in that case, which is caught by the catch block.
                throw new Error(response.data.error || `Failed to ${galleryId ? 'update' : 'create'} gallery post.`);
            }
        } catch (error: any) {
            console.error(`Frontend: Error during gallery ${galleryId ? 'update' : 'submission'} process:`, error);
            if (error.response) {
                // The request was made and the server responded with a status code
                // that falls out of the range of 2xx
                console.error("Error response data:", error.response.data);
                console.error("Error response status:", error.response.status);
                
                if (error.response.status === 409) {
                    // Specific handling for 409 Conflict (duplicate title/slug)
                    toast.error(error.response.data.error || "A gallery post with this title already exists. Please choose a different title.");
                } else if (error.response.data?.error) {
                    // Use the error message from the API if available
                    toast.error(error.response.data.error);
                } else {
                    // Fallback error message
                    toast.error(`An error occurred: ${error.message || 'Unknown error'}`);
                }
            } else if (error.request) {
                // The request was made but no response was received
                console.error("Error request:", error.request);
                toast.error("No response from server. Please check your network connection.");
            } else {
                // Something happened in setting up the request that triggered an Error
                console.error('Error message:', error.message);
                toast.error(`An error occurred: ${error.message}`);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    // Function to remove a NEWLY added file (not yet saved)
    const removeNewFile = (index: number) => {
        if (isSubmitting) return;
        setMediaFiles(prev => prev.filter((_, i) => i !== index));
    };

    // Function to delete an EXISTING image (already saved)
    const deleteExistingImage = async (imageId: string, r2Key?: string | null) => {
        if (isSubmitting) return;
        
        const imageToDelete = existingImages.find(img => img.id === imageId);
        if (!imageToDelete) {
            toast.error("Image not found for deletion.");
            return;
        }
        // Use r2Key from argument, or fallback to imageToDelete.r2_key
        const actualR2Key = r2Key || imageToDelete.r2_key;

        console.log(`Frontend: Attempting to delete existing image ID: ${imageId}, R2 Key: ${actualR2Key}`);
        
        // Optional: Add specific loading state for this image deletion
        // setIsDeletingImage(imageId); 

        try {
            // Step 1: Delete from R2 storage if r2_key is available
            if (actualR2Key) {
                toast.info("Removing image from storage...");
                await axios.post('/api/upload/delete', { key: actualR2Key });
                toast.success("Image removed from storage.");
            } else {
                toast.error("R2 key not found for this image. Skipping storage deletion. It might be an older record.");
                console.warn(`Frontend: R2 key missing for image ID ${imageId}. Cannot delete from R2.`);
            }

            // Step 2: Delete from database
            toast.info("Removing image record...");
            await axios.delete(`/api/gallery/images/${imageId}`); // This API deletes the DB record for the image
            toast.success("Image record removed successfully.");
            
            // Update local state to remove the image
            setExistingImages(prev => prev.filter(img => img.id !== imageId));
        } catch (error: any) {
            console.error(`Frontend: Failed to delete image ${imageId}:`, error);
            const errorMessage = error.response?.data?.error || error.message || "Failed to remove image.";
            toast.error(errorMessage);
        } finally {
            // setIsDeletingImage(null);
        }
    };

    const handleDeleteGallery = async () => {
        if (!galleryId) return;
        setIsDeletingGallery(true);
        console.log(`Frontend: Attempting to delete gallery ID: ${galleryId}`);
        try {
            await axios.delete(`/api/gallery/${galleryId}`);
            toast.success("Gallery deleted successfully!");
            router.push("/protected/gallery"); // Redirect after delete
            // Invalidate gallery list cache if implemented
        } catch (error: any) {
            console.error(`Frontend: Failed to delete gallery ${galleryId}:`, error);
            toast.error(error.response?.data?.error || "Failed to delete gallery.");
        } finally {
            setIsDeletingGallery(false);
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

    const maxNewFiles = galleryId ? Math.max(0, 7 - existingImages.length) : 7;

    return (
        <div className="container mx-auto py-6">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" asChild>
                        <Link href="/protected/gallery">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <h1 className="text-3xl font-bold">{galleryId ? 'Edit Gallery' : 'Upload to Gallery'}</h1>
                </div>
                {galleryId && (
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" disabled={isSubmitting || isDeletingGallery}>
                                {isDeletingGallery ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                                Delete Gallery
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Delete Entire Gallery?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete this gallery post and all associated images.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel disabled={isDeletingGallery}>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDeleteGallery} className="bg-red-600 hover:bg-red-700" disabled={isDeletingGallery}>
                                    {isDeletingGallery ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Yes, delete gallery"}
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                )}
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
                                <CardDescription>
                                    {galleryId && existingImages.length > 0
                                        ? `You have ${existingImages.length} ${mediaType === 'image' ? 'item' : 'item'}${existingImages.length === 1 ? '' : 's'} in this gallery.`
                                        : `Select up to 7 files to upload.`}
                                    {galleryId && existingImages.length >= 7 && " Maximum items reached."}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {(galleryId ? existingImages.length < 7 : true) && ( // Only show uploader if space available
                                    <>
                                        <Alert className="mb-4">
                                            <Info className="h-4 w-4" />
                                            <AlertDescription>
                                                You can upload up to {maxNewFiles} new file(s).
                                                Currently selected for new upload: {mediaFiles.length}/{maxNewFiles}
                                            </AlertDescription>
                                        </Alert>
                                        <MultiFileUploader
                                            value={mediaFiles}
                                            onChange={setMediaFiles}
                                            acceptedFileTypes={mediaType === "image" ? "image/*" : "video/*"}
                                            maxFiles={maxNewFiles} // Dynamic max files
                                            disabled={isSubmitting || maxNewFiles === 0}
                                        />
                                    </>
                                )}
                                {galleryId && existingImages.length >= 7 && mediaFiles.length === 0 && (
                                    <Alert variant="default">
                                        <Info className="h-4 w-4" />
                                        <AlertDescription>
                                            You have reached the maximum of 7 items for this gallery. Delete existing items to add new ones.
                                        </AlertDescription>
                                    </Alert>
                                )}
                            </CardContent>
                            <CardFooter>
                                <Button
                                    type="submit"
                                    className="w-full bg-green-600 hover:bg-green-700"
                                    disabled={
                                        isSubmitting ||
                                        (mediaFiles.length === 0 && existingImages.length === 0) || // Must have at least one file (new or existing)
                                        !title.trim() ||
                                        selectedTags.length === 0
                                    }
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            {galleryId ? 'Saving...' : 'Uploading...'}
                                        </>
                                    ) : (
                                        galleryId 
                                            ? (mediaFiles.length > 0 ? `Save Changes & Upload ${mediaFiles.length} New` : 'Save Changes') 
                                            : `Upload ${mediaFiles.length > 0 ? mediaFiles.length : ""} to Gallery`
                                    )}
                                </Button>
                            </CardFooter>
                        </Card>
                    </div>

                    <div className="lg:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Preview</CardTitle>
                                <CardDescription>
                                    {allPreviewItems.length > 0
                                        ? `${allPreviewItems.length} item${allPreviewItems.length === 1 ? '' : 's'} in gallery (max 7)`
                                        : "Add or upload files to see preview"}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {allPreviewItems.length > 0 ? (
                                    <div className="masonry-grid">
                                        {allPreviewItems.map((item, index) => {
                                            const isExisting = item.type === 'existing';
                                            const key = isExisting ? item.data.id : `new-${index}-${item.data.name}`; // More unique key for new files
                                            
                                            // Find the original index for new files to pass to removeNewFile
                                            let newFileIndex = -1;
                                            if (item.type === 'new') {
                                                newFileIndex = mediaFiles.findIndex(f => f === item.data);
                                            }

                                            return (
                                                <div
                                                    key={key}
                                                    className={`masonry-item relative rounded-md overflow-hidden mb-4 ${
                                                        index % 3 === 0 ? "h-64" : index % 3 === 1 ? "h-80" : "h-72"
                                                    }`}
                                                >
                                                    {isExisting ? (
                                                        <Image
                                                            src={item.data.image_url || "/placeholder.svg"}
                                                            alt={item.data.alt_text || item.data.image_url || 'Gallery image'}
                                                            fill className="object-cover"
                                                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                                        />
                                                    ) : item.data.type.startsWith('image/') ? (
                                                        <Image
                                                            src={URL.createObjectURL(item.data)}
                                                            alt={item.data.name}
                                                            fill className="object-cover"
                                                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                                            onLoad={() => URL.revokeObjectURL(URL.createObjectURL(item.data))} // Clean up object URL
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                                                            <Film className="h-12 w-12 text-green-600" />
                                                        </div>
                                                    )}
                                                    <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-40 transition-all flex items-center justify-center opacity-0 hover:opacity-100 group">
                                                        <Button
                                                            variant="destructive" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                                            onClick={() => {
                                                                if (isExisting) {
                                                                    deleteExistingImage(item.data.id, item.data.r2_key);
                                                                } else if (newFileIndex !== -1) {
                                                                    removeNewFile(newFileIndex);
                                                                }
                                                            }}
                                                            disabled={isSubmitting} type="button"
                                                            title={isExisting ? "Delete from gallery" : "Remove from upload list"}
                                                        >
                                                            {isExisting ? <Trash2 className="h-4 w-4" /> : <X className="h-4 w-4" />}
                                                        </Button>
                                                    </div>
                                                    <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent">
                                                        <p className="text-white text-xs truncate font-medium">
                                                            {item.type === 'existing' ? (item.data.alt_text || 'Existing Image') : item.data.name}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })}
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