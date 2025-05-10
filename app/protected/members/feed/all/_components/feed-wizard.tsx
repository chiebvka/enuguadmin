"use client"

import React, { useEffect, useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import type { Tables } from "@/types/supabase";
import { toast } from "sonner";

type FeedPost = Tables<"membership_feed">;

export default function Feedwizard() {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<FeedPost | null>(null);

  const LIMIT = 5;

  useEffect(() => {
    fetchPosts(1, true);
  }, []);

  const fetchPosts = async (pageNum: number, reset = false) => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/members/feed/all?page=${pageNum}&limit=${LIMIT}`);
      const { posts: newPosts, total } = res.data;
      setPosts(reset ? newPosts : [...posts, ...newPosts]);
      setHasMore((pageNum * LIMIT) < total);
      setPage(pageNum);
    } catch (err) {
      toast.error("Failed to fetch posts.");
    } finally {
      setLoading(false);
    }
  };

  const handleViewMore = () => {
    fetchPosts(page + 1);
  };

  const handleDeletePost = async () => {
    if (!postToDelete) return;
    setLoading(true);
    try {
      await axios.delete("/api/members/feed", { data: { feed_id: postToDelete.id } });
      setPosts(posts.filter((p) => p.id !== postToDelete.id));
      toast.success("Post deleted successfully!");
      setDeleteDialogOpen(false);
      setPostToDelete(null);
    } catch (err: any) {
      toast.error("Failed to delete post: " + (err?.response?.data?.error || err.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold tracking-tight mb-8">Full Member Feed</h1>
      <div className="space-y-6">
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
                      <span className="flex gap-2 items-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="z-10"
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
                        <Button variant="outline" size="sm" type="button">Download</Button>
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
                        <Button variant="outline" size="sm" type="button">Download</Button>
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
        {hasMore && (
          <div className="flex justify-center mt-4">
            <Button variant="outline" onClick={handleViewMore} disabled={loading}>
              {loading ? "Loading..." : "View More"}
            </Button>
          </div>
        )}
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