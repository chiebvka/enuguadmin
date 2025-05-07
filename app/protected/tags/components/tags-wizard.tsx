"use client"
import React, { useState, useEffect } from 'react';

import { PlusCircle, Search, TagIcon, X, Check, Pencil, Trash, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { availableTags } from "@/data/mock-blogs"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { useIsMobile } from '@/hooks/use-mobile';
import { AddTagForm } from '@/components/add-tag-form';
import { TagBadge } from '@/components/tag-badge';
import axios from 'axios'; 
import { toast } from 'sonner';
// Import AlertDialog components
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"; 
import { getCachedTags, invalidateTagsCache, CachedTag } from '@/lib/tagDataCache'; // Import cache functions


type Props = {
    initialTags: CachedTag[]; // Use CachedTag
}

// Define the type for a Tag object received from the API
// interface Tag { ... } // This can be replaced by CachedTag if identical


export default function Tagswizard({ initialTags }: Props) {

    const [tags, setTags] = useState<CachedTag[]>(initialTags); // Use CachedTag
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedTagId, setSelectedTagId] = useState<string | null>(null)
    const [isEditing, setIsEditing] = useState(false)
    const [editValue, setEditValue] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    // State for managing the delete confirmation dialog
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    // State to hold the tag object we are considering deleting
    const [tagToDelete, setTagToDelete] = useState<CachedTag | null>(null); // Use CachedTag

    const isMobile = useIsMobile()

    // Fetch tags and refresh state
    const fetchTagsAndRefreshState = async (forceRefresh: boolean = false) => {
        setIsLoading(true);
        const data = await getCachedTags(forceRefresh);
        setTags(data);
        setIsLoading(false);
    };

    // Initial fetch or use cache when component mounts
    useEffect(() => {
        const loadTags = async () => {
            setIsLoading(true);
            const cached = await getCachedTags(); // Will use cache if valid
            // If initialTags are provided and cache is empty, use initialTags.
            // Otherwise, prioritize cached/fresh data.
            if (cached.length > 0 || initialTags.length === 0) {
                setTags(cached);
            } else {
                setTags(initialTags); // Fallback to SSR data if cache is empty and SSR data exists
            }
            setIsLoading(false);
        };
        loadTags();
    }, []); // Removed initialTags from dependency array to avoid re-fetch on prop change if not desired


    // Filter tags based on search query
    const filteredTags = tags.filter((tag) => tag.name.toLowerCase().includes(searchQuery.toLowerCase()))
    const selectedTag = selectedTagId ? tags.find((tag) => tag.id === selectedTagId) : null;

    // const handleAddTag = (name: string) => {
    //     const newId = (Math.max(...tags.map((tag) => Number.parseInt(tag.id))) + 1).toString()
    //     const newTag = { id: newId, name }
    //     setTags([...tags, newTag])
    //     setSelectedTagId(newId)
    // }

    // const handleEditTag = () => {
    //     if (selectedTagId && editValue.trim()) {
    //     setTags(tags.map((tag) => (tag.id === selectedTagId ? { ...tag, name: editValue } : tag)))
    //     setIsEditing(false)
    //     }
    // }

    // const handleDeleteTag = (id: string) => {
    //     setTags(tags.filter((tag) => tag.id !== id))
    //     if (selectedTagId === id) {
    //     setSelectedTagId(null)
    //     }
    // }

    // const startEditing = () => {
    //     if (selectedTag) {
    //     setEditValue(selectedTag.name)
    //     setIsEditing(true)
    //     }
    // }


    const handleAddTag = async (name: string) => {
        setIsLoading(true);
        try {
            const response = await axios.post('/api/tags', { name });
            const newTag = response.data.tag;

            if (newTag) {
                 invalidateTagsCache(); // Invalidate cache
                 await fetchTagsAndRefreshState(true); // Force refresh
                 setSelectedTagId(newTag.id); // Optionally select the new tag
                 toast.success(`Tag "${newTag.name}" added.`);
            } else {
                 throw new Error("API did not return new tag data.");
            }

        } catch (error: any) {
            console.error("Failed to add tag:", error);
             // Show an error toast
            toast.error("Failed to add tag. " + (error.response?.data?.error || error.message));
        } finally {
            setIsLoading(false);
        }
    };

    const handleEditTag = async () => {
        if (!selectedTagId || !editValue.trim()) {
            toast.warning("Cannot save with empty name.");
            return;
        }
         // Only save if the name has actually changed
         const currentSelectedTag = tags.find(tag => tag.id === selectedTagId);
         if (currentSelectedTag && currentSelectedTag.name === editValue.trim()) {
             setIsEditing(false); // Exit editing if no change
             return;
         }


        setIsLoading(true);
        try {
            const response = await axios.put(`/api/tags/${selectedTagId}`, { name: editValue.trim() });
            const updatedTag = response.data.tag;

            if (updatedTag) {
                 invalidateTagsCache(); // Invalidate cache
                 await fetchTagsAndRefreshState(true); // Force refresh
                 setIsEditing(false);
                 toast.success(`Tag "${updatedTag.name}" updated.`);
            } else {
                  // Should not happen if API returns the tag on success
                 throw new Error("API did not return updated tag data.");
            }

        } catch (error: any) {
            console.error("Failed to edit tag:", error);
             // Show an error toast
            toast.error("Failed to update tag. " + (error.response?.data?.error || error.message));
        } finally {
            setIsLoading(false);
        }
    };

    // const handleDeleteTag = async (id: string) => {
    //     if (!id) return;

    //      // Confirmation before deleting
    //      if (!window.confirm(`Are you sure you want to delete this tag?`)) {
    //          return;
    //      }

    //     setIsLoading(true);
    //     try {
    //         // Call the DELETE /api/tags/[id] route
    //         await axios.delete(`/api/tags/${id}`);

    //         // Remove the tag from local state immediately on success
    //         setTags(tags.filter((tag) => tag.id !== id));
    //         // If the selected tag was deleted, clear the selection
    //         if (selectedTagId === id) {
    //             setSelectedTagId(null);
    //         }
    //         toast.success("Tag deleted.");

    //     } catch (error: any) {
    //         console.error("Failed to delete tag:", error);
    //          // Handle specific errors like foreign key constraints
    //          if (error.response?.status === 409) {
    //              toast.error(error.response.data.error || "Tag is currently used and cannot be deleted.");
    //          } else {
    //              toast.error("Failed to delete tag. " + (error.response?.data?.error || error.message));
    //          }
    //     } finally {
    //         setIsLoading(false);
    //     }
    // };



    // This function is called when the user confirms deletion in the AlertDialog
    const confirmDeleteTag = async () => {
        if (!tagToDelete?.id) return;

        setIsLoading(true);
        setShowDeleteConfirm(false); 

        try {
            await axios.delete(`/api/tags/${tagToDelete.id}`);
            invalidateTagsCache(); // Invalidate cache
            await fetchTagsAndRefreshState(true); // Force refresh
            
            if (selectedTagId === tagToDelete.id) {
                setSelectedTagId(null);
            }
            toast.success(`Tag "${tagToDelete.name}" deleted.`);

        } catch (error: any) {
            console.error("Failed to delete tag:", error);
             if (error.response?.status === 409) {
                 toast.error(error.response.data.error || "Tag is currently used and cannot be deleted.");
             } else {
                 toast.error("Failed to delete tag. " + (error.response?.data?.error || error.message));
             }
        } finally {
            setIsLoading(false);
             setTagToDelete(null);
        }
    };

    // This function is called when the Delete button is clicked to OPEN the dialog
    const handleDeleteClick = (tag: CachedTag) => {
        setTagToDelete(tag); 
        setShowDeleteConfirm(true); 
    };


    const startEditing = () => {
        if (selectedTag) {
        setEditValue(selectedTag.name)
        setIsEditing(true)
        }
    }


  return (
    <div className="container mx-auto py-6">
        <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
            {/* AlertDialogTrigger can wrap the button that opens the dialog,
                but here we control it manually with state (showDeleteConfirm). */}
            {/* <AlertDialogTrigger asChild>
                <Button variant="outline">Show Dialog</Button>
            </AlertDialogTrigger> */}
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the tag
                        <span className="font-semibold text-foreground"> "{tagToDelete?.name}"</span>.
                        This may affect any blog posts or events currently using this tag.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
                    {/* The action button calls the confirmation logic */}
                    <AlertDialogAction onClick={confirmDeleteTag} disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Continue
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
        {/* --- End AlertDialog --- */}

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold">Tags Management</h1>
         {/* Button to clear selection and potentially reveal the Add Tag form */}
         {/* Only show this button if a tag is currently selected */}
         {selectedTagId && (
            <Button variant="outline" className="bg-green-50 hover:bg-green-100" onClick={() => setSelectedTagId(null)} disabled={isLoading}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add New Tag
            </Button>
         )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
            <Card className="h-full">
            <CardHeader className="pb-2">
                <CardTitle>All Tags ({filteredTags.length})</CardTitle>
                <div className="relative mt-2">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search tags..."
                    className="pl-8 border-green-200 focus-visible:ring-green-500"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    disabled={isLoading}
                />
                </div>

                {isMobile && !selectedTagId && (
                     <div className="mt-4">
                         <AddTagForm onAddTag={handleAddTag} variant="compact" className="w-full" disabled={isLoading} />
                     </div>
                 )}
            </CardHeader>
            {isLoading && tags.length === 0 ? (
                 <CardContent className="flex flex-col items-center justify-center py-8 h-[calc(100%-130px)]">
                     <Loader2 className="h-8 w-8 animate-spin text-green-600" />
                     <span className="mt-2 text-muted-foreground">Loading tags...</span>
                 </CardContent>
             ) : (
                <CardContent className="h-[calc(100%-130px)] overflow-auto">
                    <div className="space-y-1">
                        {filteredTags.length > 0 ? (
                            filteredTags.map((tag) => (
                                <div
                                    key={tag.id}
                                    className={`flex items-center justify-between p-2 rounded-md cursor-pointer hover:bg-muted/50 ${
                                    selectedTagId === tag.id ? "bg-green-50 border border-green-200" : ""
                                    } ${isLoading ? 'pointer-events-none opacity-60' : ''}`}
                                    onClick={() => setSelectedTagId(tag.id)}
                                >
                                    <div className="flex items-center">
                                    <TagIcon className="mr-2 h-4 w-4 text-green-600" />
                                    <span>{tag.name}</span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                            No tags found. Create your first tag to get started.
                            </div>
                        )}
                    </div>
                </CardContent>
             )}
            {/* <CardContent className="h-[calc(100%-130px)] overflow-auto">
                <div className="space-y-1">
                {filteredTags.length > 0 ? (
                    filteredTags.map((tag) => (
                    <div
                        key={tag.id}
                        className={`flex items-center justify-between p-2 rounded-md cursor-pointer hover:bg-muted/50 ${
                        selectedTagId === tag.id ? "bg-green-50 border border-green-200" : ""
                        }`}
                        onClick={() => setSelectedTagId(tag.id)}
                    >
                        <div className="flex items-center">
                        <TagIcon className="mr-2 h-4 w-4 text-green-600" />
                        <span>{tag.name}</span>
                        </div>
            
                    </div>
                    ))
                ) : (
                    <div className="text-center py-8 text-muted-foreground">
                    No tags found. Create your first tag to get started.
                    </div>
                )}
                </div>
            </CardContent> */}
            {!isMobile && !selectedTagId && (
                <CardFooter className="border-t p-4">
                    <AddTagForm onAddTag={handleAddTag} variant="compact" className="w-full" disabled={isLoading} />
                </CardFooter>
            )}
            </Card>
        </div>

        <div className="lg:col-span-2">
            {selectedTag ? (
            <Card>
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle>Tag Details</CardTitle>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={startEditing} disabled={isEditing}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                    </Button>
                    <Button
                    variant="outline"
                    size="sm"
                    className="text-red-500"
                    // onClick={() => {
                    //     if (window.confirm(`Are you sure you want to delete the tag "${selectedTag.name}"?`)) {
                    //     handleDeleteTag(selectedTag.id)
                    //     }
                    // }}
                    onClick={() => handleDeleteClick(selectedTag)} // Call handleDeleteClick with the tag object
                    disabled={isLoading}
                    >
                    <Trash className="mr-2 h-4 w-4" />
                    Delete
                    </Button>
                </div>
                </CardHeader>
                <CardContent>
                <div className="space-y-6">
                    {/* <div className="space-y-2">
                    <Label>Tag ID</Label>
                    <div className="p-2 bg-muted/20 rounded-md">{selectedTag.id}</div>
                    </div> */}

                    <div className="space-y-2">
                    <Label>Tag Name</Label>
                    {isEditing ? (
                        <div className="flex items-center space-x-2">
                        <Input
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="border-green-200 focus-visible:ring-green-500"
                        />
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleEditTag}>
                            <Check className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setIsEditing(false)}>
                            <X className="h-4 w-4" />
                        </Button>
                        </div>
                    ) : (
                        <div className="p-2 bg-muted/20 rounded-md">{selectedTag.name}</div>
                    )}
                    </div>

                    <div className="space-y-2">
                    <Label>Preview</Label>
                    <div className="p-4 bg-muted/20 rounded-md flex items-center justify-center">
                        <TagBadge
                            id={selectedTag.id}
                            name={isEditing ? editValue : selectedTag.name}
                            onEdit={() => {}}
                            onDelete={() => {}}
                        />
                    </div>
                    </div>
                </div>
                </CardContent>
            </Card>
            ) : (
            <Card>
                <CardContent className="flex flex-col items-center justify-center min-h-[400px] text-center">
                <TagIcon className="h-16 w-16 text-muted-foreground opacity-20" />
                <h3 className="mt-4 text-lg font-medium">No Tag Selected</h3>
                <p className="mt-2 text-muted-foreground">
                    Select a tag from the list to view and edit its details, or create a new tag.
                </p>
                <AddTagForm onAddTag={handleAddTag} className="mt-6 max-w-md" />
                </CardContent>
            </Card>
            )}
        </div>
        </div>
    </div>
  )
}