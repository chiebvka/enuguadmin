"use client"

import React, { useState } from 'react';
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { FileUploader } from "@/components/file-uploader";
import { Trash2 } from "lucide-react";
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
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
});

export default function Memberfeedwizard({ posts: initialPosts }: MemberfeedwizardProps) {
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

  // Use the posts passed from the server
  const posts = initialPosts;

  const handleFileChange = async (url: string | null) => {
    setMediaUrl(url);
    if (!url) {
      setMediaKey(null);
      setFileName(null);
      setFileSizeMb(null);
      return;
    }
    const key = url.split("/memberFeed/")[1];
    setMediaKey(key ? `memberFeed/${key}` : null);
    setFileName(url.split("/").pop() || null);
  };

  const handleRemoveFile = async () => {
    if (mediaKey) {
      await axios.post("/api/upload/delete", { key: mediaKey });
    }
    setMediaUrl(null);
    setMediaKey(null);
    setFileName(null);
    setFileSizeMb(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});

    // Validate with Zod
    const result = postSchema.safeParse({ title, content });
    if (!result.success) {
      const errors: { title?: string; content?: string } = {};
      result.error.errors.forEach((err) => {
        if (err.path[0] === "title") errors.title = err.message;
        if (err.path[0] === "content") errors.content = err.message;
      });
      setFormErrors(errors);
      toast.error("Please fill in all required fields.");
      return;
    }

    setLoading(true);
    try {
      const payload: any = {
        title,
        content,
        content_type: contentType,
      };
      if (contentType !== "text" && mediaUrl) {
        payload.media_url = mediaUrl;
        payload.file_name = fileName;
        payload.file_size_mb = fileSizeMb;
      }
      await axios.post("/api/members/feed", payload);
      setTitle("");
      setContent("");
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
    <div className="container mx-auto py-6">

<div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Activity Stream</h1>
          <p className="text-muted-foreground">Stay updated with the latest feeds for your members.</p>
        </div>
        <Button asChild>
            <Link href="/protected/members/feed/all">
                View Full Feed
            </Link>
        </Button>
      </div>
      {/* Create Post Form */}
      <Card>
        <CardHeader>
          <CardTitle>
            Share an Update
            </CardTitle>
          <CardDescription>Post content for other organization members to see.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              placeholder="Enter post title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
            {formErrors.title && <p className="text-red-500 text-xs">{formErrors.title}</p>}
            <div className="flex gap-2">
              <Button type="button" variant={contentType === "text" ? "default" : "outline"} onClick={() => setContentType("text")}>Text</Button>
              <Button type="button" variant={contentType === "image" ? "default" : "outline"} onClick={() => setContentType("image")}>Image</Button>
              <Button type="button" variant={contentType === "video" ? "default" : "outline"} onClick={() => setContentType("video")}>Video</Button>
              <Button type="button" variant={contentType === "file" ? "default" : "outline"} onClick={() => setContentType("file")}>File</Button>
            </div>
            {(contentType === "text" || contentType === "image" || contentType === "video" || contentType === "file") && (
              <Textarea
                placeholder="What would you like to share?"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[100px]"
                required={contentType === "text"}
              />
            )}
            {formErrors.content && <p className="text-red-500 text-xs">{formErrors.content}</p>}
            {contentType !== "text" && (
              <div>
                <FileUploader
                  onChange={handleFileChange}
                  value={mediaUrl}
                  uploadType="memberFeed"
                  accept=".pdf,.txt,.doc,.docx,.xls,.xlsx,.csv,image/*,video/*"
                />
              </div>
            )}
            <Button type="submit" disabled={loading}>
              {loading ? "Sharing..." : "Share"}
            </Button>
          </form>
        </CardContent>
      </Card>

        <Separator className='my-6 bg-enugu border-3' />
      {/* Feed Posts */}
      <div className="mt-8 space-y-6">
        {posts.map((post) => (
          <Card key={post.id} className="relative hover:shadow-md border-2 border-enugu transition-shadow">
          
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <Avatar className="h-10 w-10">
                  <AvatarFallback>{post.user_email[0]?.toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-2">
                  <div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{post.user_email.split("@")[0]}</p>
                      </div>
                      <span className=' flex gap-2 items-center '>
                        <Button
                            variant="ghost"
                            size="icon"
                            className=" z-10"
                            onClick={() => { setPostToDelete(post); setDeleteDialogOpen(true); }}
                            disabled={loading}
                            aria-label="Delete post"
                            >
                            <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                        <p className="text-xs text-muted-foreground">
                            <span className="font-semibold">Uploaded on:</span>{" "}
                            {post.created_at ? new Date(post.created_at).toLocaleString() : "No date"}
                        </p>
                      </span>
                    </div>
                    <h3 className="text-xl font-semibold mt-2">{post.title}</h3>
                  </div>
                  <p className="text-sm">{post.content}</p>
                  {/* Media preview */}
                  {post.content_type === "image" && post.media_url && (
                    <div className="mt-3 flex flex-col items-center">
                      <div className="rounded-md overflow-hidden w-10/12 mx-auto h-60 bg-black flex items-center justify-center">
                        <img
                          src={post.media_url}
                          alt={post.title || "Feed image"}
                          className="object-contain w-full h-full"
                          style={{ maxWidth: "100%", maxHeight: "100%" }}
                        />
                      </div>
                      <a
                        href={post.media_url}
                        download={post.file_name || "image"}
                        className="mt-2"
                      >
                        <Button variant="outline" size="sm" asChild>
                            Download
                        </Button>
                      </a>
                    </div>
                  )}
                  {post.content_type === "video" && post.media_url && (
                    <div className="mt-3 flex flex-col items-center">
                      <div className="rounded-md overflow-hidden w-10/12 mx-auto h-60 bg-black flex items-center justify-center">
                        <video
                          src={post.media_url}
                          controls
                          className="object-contain w-full h-full"
                          style={{ maxWidth: "100%", maxHeight: "100%" }}
                        />
                      </div>
                      <a
                        href={post.media_url}
                        download={post.file_name || "video"}
                        className="mt-2"
                      >
                        <Button variant="outline" size="sm">Download</Button>
                      </a>
                    </div>
                  )}
                  {post.content_type === "file" && post.media_url && (
                    <div className="mt-3 p-4 bg-muted rounded-md flex items-center gap-3">
                      {/* File icon */}
                      <svg className="h-5 w-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7v10M17 7v10M7 7h10M7 17h10" />
                      </svg>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{post.file_name}</p>
                        <p className="text-xs text-muted-foreground">{post.file_size_mb ? `${post.file_size_mb} MB` : ""}</p>
                      </div>
                      <a href={post.media_url} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="sm">Download</Button>
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        <div className="flex justify-center mt-4">
          <Button asChild variant="outline">
            <Link href="/protected/members/feed/all">
              View More
            </Link>
          </Button>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Post?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this post? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePost} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}