"use client"

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { FileUploader } from "@/components/file-uploader";
import { FileIcon, Trash2 } from "lucide-react";
import Link from "next/link";
import type { Tables } from "@/types/supabase";
import { toast } from "sonner";
import { z } from "zod";
import { Separator } from '@/components/ui/separator';

type FeedPost = Tables<"membership_feed">;

interface MemberfeedwizardProps {
  posts: FeedPost[];
}

// Zod schema for validation
const postSchema = z.object({
  title: z.string().min(1, "Title is required").max(150, "Title is too long"),
  content: z.string().min(1, "Content is required").max(2000, "Content is too long"),
});

const acceptOptions = {
  'image/*': ['.png', '.gif', '.jpeg', '.jpg', '.webp'],
  'video/*': ['.mp4', '.mov', '.avi', '.mkv'],
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/vnd.ms-excel': ['.xls'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'text/csv': ['.csv'],
  'text/plain': ['.txt'],
};

export default function Memberfeedwizard({ posts: initialPosts }: MemberfeedwizardProps) {
  const searchParams = useSearchParams();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [contentType, setContentType] = useState<"text" | "image" | "video" | "file">("text");
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [mediaKey, setMediaKey] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSizeMb, setFileSizeMb] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<FeedPost | null>(null);
  const [formErrors, setFormErrors] = useState<{ title?: string; content?: string }>({});

  const posts = initialPosts;

  useEffect(() => {
    const birthdayName = searchParams.get('birthdayName');
    if (birthdayName) {
      setTitle(`Happy Birthday, ${birthdayName}! 🎉`);
      setContent(`Join us in wishing ${birthdayName} a very happy birthday today! 🥳🎂 Let's make their day special!`);
      setContentType("text");
    }
  }, [searchParams]);

  const handleFileChange = async (newUrl: string | null) => {
    if (mediaKey && mediaUrl !== newUrl) {
      try {
        await axios.post("/api/upload/delete", { key: mediaKey });
      } catch (error) {
        console.warn("Failed to delete old file from R2. It might have already been removed or the key was incorrect.", error);
      }
    }

    if (!newUrl) {
      setMediaUrl(null);
      setMediaKey(null);
      setFileName(null);
      setFileSizeMb(null);
      return;
    }

    setMediaUrl(newUrl);
    const keyFromUrl = newUrl.includes("/memberFeed/") ? newUrl.split("/memberFeed/")[1] : newUrl.split("/").pop();
    setMediaKey(keyFromUrl ? (newUrl.includes("/memberFeed/") ? `memberFeed/${keyFromUrl}` : keyFromUrl) : null);
    setFileName(newUrl.split("/").pop() || "Uploaded File");
    setFileSizeMb(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});

    const validationData:any = { title };
    if (contentType === "text" || content.trim() !== "") {
        validationData.content = content;
    } else if (!mediaUrl) {
        toast.error("Please upload a file for image, video, or file posts.");
        return;
    }

    const result = postSchema.partial().safeParse(validationData);
     if (!result.success) {
      const errors: { title?: string; content?: string } = {};
      result.error.errors.forEach((err) => {
        if (err.path[0] === "title") errors.title = err.message;
        if (err.path[0] === "content") errors.content = err.message;
      });
      setFormErrors(errors);
      toast.error("Please fill in all required fields correctly.");
      return;
    }

    setLoading(true);
    try {
      const payload: any = {
        title: result.data.title,
        content: result.data.content || "",
        content_type: contentType,
      };
      if (contentType !== "text" && mediaUrl) {
        payload.media_url = mediaUrl;
        payload.file_name = fileName;
        payload.file_size_mb = fileSizeMb;
      } else if (contentType !== "text" && !mediaUrl) {
        toast.error("Media is required for this post type.");
        setLoading(false);
        return;
      }
      
      await axios.post("/api/members/feed", payload);
      setTitle("");
      setContent("");
      setContentType("text");
      setMediaUrl(null);
      setMediaKey(null);
      setFileName(null);
      setFileSizeMb(null);
      toast.success("Post created successfully!");
      window.location.reload();
    } catch (err: any) {
      toast.error("Failed to create post: " + (err?.response?.data?.error || err.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePost = async () => {
    if (!postToDelete) return;
    setLoading(true);
    try {
      await axios.delete("/api/members/feed", { data: { feed_id: postToDelete.id } });
      toast.success("Post deleted successfully!");
      setDeleteDialogOpen(false);
      setPostToDelete(null);
      window.location.reload();
    } catch (err: any) {
      toast.error("Failed to delete post: " + (err?.response?.data?.error || err.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-4 px-2 sm:px-6">

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Activity Stream</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Stay updated with the latest feeds for your members.</p>
        </div>
        <Button asChild size="sm" className="w-full sm:w-auto">
            <Link href="/protected/members/feed/all">
                View Full Feed
            </Link>
        </Button>
      </div>
      {/* Create Post Form */}
      <Card className="mb-6 sm:mb-8">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-lg sm:text-xl">
            Share an Update
            </CardTitle>
          <CardDescription className="text-xs sm:text-sm">Post content for other organization members to see.</CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              placeholder="Enter post title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            {formErrors.title && <p className="text-red-500 text-xs mt-1">{formErrors.title}</p>}
            
            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" variant={contentType === "text" ? "default" : "outline"} onClick={() => setContentType("text")}>Text</Button>
              <Button type="button" size="sm" variant={contentType === "image" ? "default" : "outline"} onClick={() => setContentType("image")}>Image</Button>
              <Button type="button" size="sm" variant={contentType === "video" ? "default" : "outline"} onClick={() => setContentType("video")}>Video</Button>
              <Button type="button" size="sm" variant={contentType === "file" ? "default" : "outline"} onClick={() => setContentType("file")}>File</Button>
            </div>
            
            <Textarea
              placeholder="What would you like to share? (Optional for media posts)"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[80px] sm:min-h-[100px]"
            />
            {formErrors.content && <p className="text-red-500 text-xs mt-1">{formErrors.content}</p>}
            
            {contentType !== "text" && (
              <div>
                <FileUploader
                  onChange={handleFileChange}
                  value={mediaUrl}
                  uploadType="memberFeed"
                  accept={Object.keys(acceptOptions).join(',')}
                />
              </div>
            )}
            <Button type="submit" disabled={loading} className="w-full sm:w-auto">
              {loading ? "Sharing..." : "Share"}
            </Button>
          </form>
        </CardContent>
      </Card>

        <Separator className='my-6 bg-enugu border-3' />
      {/* Feed Posts */}
      <div className="space-y-4 sm:space-y-6">
        {posts.map((post) => (
          <Card key={post.id} className="relative hover:shadow-md border-2 border-enugu transition-shadow">
            <CardContent className="p-3 sm:p-6">
              <div className="flex items-start gap-3 sm:gap-4">
                <Avatar className="h-8 w-8 sm:h-10 sm:w-10 mt-1">
                  <AvatarFallback>{post.user_email[0]?.toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1 sm:space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2">
                    <div>
                      <p className="font-medium text-sm sm:text-base break-all">{post.user_email.split("@")[0]}</p>
                      <p className="text-xs text-muted-foreground">
                        {post.created_at ? new Date(post.created_at).toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : "No date"}
                      </p>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 sm:h-8 sm:w-8 self-start sm:self-center"
                        onClick={() => { setPostToDelete(post); setDeleteDialogOpen(true); }}
                        disabled={loading}
                        aria-label="Delete post"
                        >
                        <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                  {post.title && <h3 className="text-base sm:text-xl font-semibold mt-1 sm:mt-2">{post.title}</h3>}
                  {post.content && <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{post.content}</p>}
                  
                  {post.content_type === "image" && post.media_url && (
                    <div className="mt-2 sm:mt-3 flex flex-col items-center">
                      <div className="rounded-md overflow-hidden w-full sm:w-10/12 mx-auto max-h-[200px] sm:max-h-[300px] bg-black flex items-center justify-center">
                        <img
                          src={post.media_url}
                          alt={post.title || "Feed image"}
                          className="object-contain w-full h-full"
                        />
                      </div>
                      {post.file_name && (
                        <a
                          href={post.media_url}
                          download={post.file_name}
                          className="mt-2"
                        >
                          <Button variant="outline" size="sm">Download "{post.file_name}"</Button>
                        </a>
                      )}
                    </div>
                  )}
                  {post.content_type === "video" && post.media_url && (
                    <div className="mt-2 sm:mt-3 flex flex-col items-center">
                      <div className="rounded-md overflow-hidden w-full sm:w-10/12 mx-auto max-h-[200px] sm:max-h-[300px] bg-black flex items-center justify-center">
                        <video
                          src={post.media_url}
                          controls
                          className="object-contain w-full h-full"
                        />
                      </div>
                       {post.file_name && (
                        <a
                            href={post.media_url}
                            download={post.file_name}
                            className="mt-2"
                        >
                            <Button variant="outline" size="sm">Download "{post.file_name}"</Button>
                        </a>
                       )}
                    </div>
                  )}
                  {post.content_type === "file" && post.media_url && (
                    <div className="mt-2 sm:mt-3 p-3 sm:p-4 bg-muted rounded-md flex items-center justify-between gap-2 sm:gap-3">
                      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                        <FileIcon className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs sm:text-sm font-medium truncate" title={post.file_name || "Attached file"}>{post.file_name || "Attached file"}</p>
                          {post.file_size_mb && <p className="text-xs text-muted-foreground">{`${post.file_size_mb.toFixed(2)} MB`}</p>}
                        </div>
                      </div>
                      <a href={post.media_url} target="_blank" rel="noopener noreferrer" download={post.file_name}>
                        <Button variant="outline" size="sm" className="flex-shrink-0">Download</Button>
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {posts.length > 0 && (
            <div className="flex justify-center mt-4 sm:mt-6">
            <Button asChild variant="outline">
                <Link href="/protected/members/feed/all">
                View More
                </Link>
            </Button>
            </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="w-[95vw] sm:w-full rounded-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg sm:text-xl">Delete Post?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs sm:text-sm">
              Are you sure you want to delete this post? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <AlertDialogCancel asChild>
                <Button size="sm" variant="outline" className="w-full sm:w-auto">Cancel</Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button 
                size="sm" 
                onClick={handleDeletePost} 
                className="bg-red-600 hover:bg-red-700 w-full sm:w-auto"
                disabled={loading}
              >
                {loading ? "Deleting..." : "Delete"}
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}