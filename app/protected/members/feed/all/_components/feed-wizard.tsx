"use client"

import React, { useEffect, useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Trash2, FileIcon } from "lucide-react";
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
    <div className="container mx-auto py-6 px-2 sm:px-6">
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-6 sm:mb-8">Full Member Feed</h1>
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
                          <Button variant="outline" size="sm" type="button">Download "{post.file_name}"</Button>
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
                          <Button variant="outline" size="sm" type="button">Download "{post.file_name}"</Button>
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
                        <Button variant="outline" size="sm" className="flex-shrink-0" type="button">Download</Button>
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {hasMore && (
          <div className="flex justify-center mt-4 sm:mt-6">
            <Button variant="outline" onClick={handleViewMore} disabled={loading}>
              {loading ? "Loading..." : "View More"}
            </Button>
          </div>
        )}
      </div>
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