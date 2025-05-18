"use client"

import React, { useState, useEffect, useMemo } from 'react';
import Image from "next/image"
import { PlusCircle, Search, Filter, ChevronDown, ChevronUp, Calendar, Trash2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/pagination";
import { BlogActionsMenu } from './blog-actions-menu';
import Link from 'next/link';
import axios from 'axios';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { getCachedBlogs, invalidateBlogsCache, CachedBlogPost } from '@/lib/blogDataCache';

interface FetchedTag {
  id: string;
  name: string;
}

// Helper function to format date (can be moved to a utils file)
const formatDate = (dateString: string) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

export default function Blogwizard() {
    const [allBlogs, setAllBlogs] = useState<CachedBlogPost[]>([]);
    const [isLoadingBlogs, setIsLoadingBlogs] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(5);
    const [searchQuery, setSearchQuery] = useState("");
    const [expandedBlogIds, setExpandedBlogIds] = useState<Record<string, boolean>>({});
    
    const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
    const [blogToDelete, setBlogToDelete] = useState<CachedBlogPost | null>(null);
    const [isDeletingPost, setIsDeletingPost] = useState(false);

    useEffect(() => {
      const fetchBlogs = async () => {
        setIsLoadingBlogs(true);
        const blogsFromCache = await getCachedBlogs();
        setAllBlogs(blogsFromCache);
        setIsLoadingBlogs(false);
      };
      fetchBlogs();
    }, []);
  
    const filteredBlogs = useMemo(() => {
        return allBlogs.filter((blog) => 
            blog.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            blog.tags.some(tag => tag.name.toLowerCase().includes(searchQuery.toLowerCase()))
        );
    }, [allBlogs, searchQuery]);
  
    const totalPages = Math.ceil(filteredBlogs.length / pageSize);
    const paginatedBlogs = useMemo(() => {
        return filteredBlogs.slice((currentPage - 1) * pageSize, currentPage * pageSize);
    }, [filteredBlogs, currentPage, pageSize]);
  
    const totalFilteredBlogs = filteredBlogs.length; // Calculate total number of filtered blogs
  
    const toggleExpand = (blogId: string) => {
      setExpandedBlogIds((prev) => ({
        ...prev,
        [blogId]: !prev[blogId],
      }));
    };

    const handleOpenDeleteDialog = (blog: CachedBlogPost) => {
      setBlogToDelete(blog);
      setDeleteAlertOpen(true);
    };

    const confirmDeletePost = async () => {
      if (!blogToDelete) return;
      setIsDeletingPost(true);
      try {
        await axios.delete(`/api/blogs/${blogToDelete.id}`);
        toast.success(`"${blogToDelete.title}" deleted successfully.`);
        invalidateBlogsCache();
        const updatedBlogs = await getCachedBlogs();
        setAllBlogs(updatedBlogs);
        setDeleteAlertOpen(false);
        setBlogToDelete(null);
      } catch (error: any) {
        toast.error(`Failed to delete blog post: ${error.response?.data?.error || error.message}`);
        console.error(error);
      } finally {
        setIsDeletingPost(false);
      }
    };

  if (isLoadingBlogs) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
        <p className="ml-2">Loading blog posts...</p>
      </div>
    );
  }
    
  return (
    <div className="md:container mx-auto py-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 px-1 sm:px-0">
        <h1 className="text-xl sm:text-2xl font-bold">Blog Posts</h1>
        <Button className="bg-green-600 hover:bg-green-700 w-full sm:w-auto" asChild>
            <Link href="/protected/blogs/create">
                <PlusCircle className="mr-2 h-4 w-4" />
                New Blog Post
            </Link>
        </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6 px-1 sm:px-0">
        <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
            placeholder="Search blogs by title, tags..."
            className="pl-8 border-green-200 focus-visible:ring-green-500 text-sm sm:text-base"
            value={searchQuery}
            onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1); // Reset to first page on search
            }}
            />
        </div>
        <Button variant="outline" className="border-green-200">
            <Filter className="mr-2 h-4 w-4" />
            Filter
        </Button>
        </div>

        {paginatedBlogs.length > 0 ? (
        <>
            <div className="space-y-3 mb-6">
            {paginatedBlogs.map((blog) => (
                <Card
                key={blog.id}
                className={`overflow-hidden transition-all ${expandedBlogIds[blog.id] ? "ring-2 ring-green-200" : ""}`}
                >
                <div
                    className="flex items-center justify-between p-3 sm:p-4 cursor-pointer hover:bg-muted/20"
                    onClick={() => toggleExpand(blog.id)}
                >
                    <div className="flex items-center gap-3 sm:gap-4 flex-grow min-w-0">
                    <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-md overflow-hidden flex-shrink-0">
                        <Image
                        src={blog.cover_image || "/placeholder.svg"}
                        alt={blog.title}
                        fill
                        className="object-cover"
                        />
                    </div>
                    <div className="flex-grow min-w-0">
                        <h3 className="font-medium truncate text-sm sm:text-base">{blog.title}</h3>
                        <div className="flex flex-col xs:flex-row xs:items-center gap-x-3 gap-y-0.5 text-xs sm:text-sm text-muted-foreground mt-0.5">
                        <div className="flex items-center">
                            <Calendar className="mr-1 h-3 w-3" />
                            {formatDate(blog.created_at)}
                        </div>
                        {blog.status === 'draft' ? (
                            <Badge variant="outline" className="bg-yellow-100 text-yellow-800 md:w-16 border-yellow-300 py-0.5 px-1.5 text-xs">
                                <span className="mr-1.5 h-2 w-2 rounded-full bg-yellow-500 animate-pulse"></span>
                                Draft
                            </Badge>
                            ) : (
                            <Badge variant="outline" className="bg-green-100 text-green-800 md:w-20 border-green-300 py-0.5 px-1.5 text-xs">
                                <span className="mr-1.5 h-2 w-2 rounded-full bg-green-500"></span>
                                Published
                            </Badge>
                        )}
                        </div>
                    </div>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0 ml-2">
                    <div className="hidden sm:flex flex-wrap gap-1 items-center">
                        {blog.tags
                        .slice(0, 2)
                        .map((tag) => (
                            <Badge key={tag.id} variant="secondary" className="bg-green-100 text-green-800 text-xs">
                            {tag.name}
                            </Badge>
                        ))}
                        {blog.tags.length > 2 && <Badge variant="outline" className="text-xs">+{blog.tags.length - 2}</Badge>}
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-red-600 h-7 w-7 sm:h-8 sm:w-8"
                        onClick={(e) => { e.stopPropagation(); handleOpenDeleteDialog(blog); }}
                        title="Delete Post"
                    >
                        <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                    <div onClick={(e) => e.stopPropagation()} className="h-7 w-7 sm:h-8 sm:w-8 flex items-center justify-center">
                        <BlogActionsMenu blogId={blog.id} />
                    </div>
                    <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${expandedBlogIds[blog.id] ? "rotate-180" : ""}`} />
                    </div>
                </div>

                {!expandedBlogIds[blog.id] && (
                    <div className="px-3 sm:px-4 pb-3 sm:pb-4 pt-0">
                    <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 sm:ml-[calc(theme(spacing.12)_+_theme(spacing.4))]">
                        {blog.excerpt}
                    </p>
                    </div>
                )}

                {expandedBlogIds[blog.id] && (
                    <CardContent className="border-t p-3 sm:p-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                        <div className="md:col-span-2">
                        <h4 className="font-medium mb-1 sm:mb-2 text-sm sm:text-base">Excerpt</h4>
                        <p className="text-xs sm:text-sm text-muted-foreground">{blog.excerpt}</p>

                        <div className="mt-3 sm:mt-4">
                            <h4 className="font-medium mb-1 sm:mb-2 text-sm sm:text-base">Tags</h4>
                            <div className="flex flex-wrap gap-2">
                            {blog.tags.map((tag) => (
                                <Badge key={tag.id} variant="secondary" className="bg-green-100 text-green-800">
                                {tag.name}
                                </Badge>
                            ))}
                            </div>
                        </div>

                        </div>

                        <div>
                        <h4 className="font-medium mb-1 sm:mb-2 text-sm sm:text-base">Preview</h4>
                        <div className="relative aspect-video rounded-md overflow-hidden">
                            <Image
                            src={blog.cover_image || "/placeholder.svg"}
                            alt={blog.title}
                            fill
                            className="object-cover"
                            />
                        </div>

                        <div className="mt-3 sm:mt-4 space-y-1 sm:space-y-2">
                            <div className="flex justify-between">
                            <span className="text-xs sm:text-sm text-muted-foreground">Published</span>
                            <span className="text-xs sm:text-sm font-medium">{formatDate(blog.created_at)}</span>
                            </div>
                            <div className="flex justify-between">
                            <span className="text-xs sm:text-sm text-muted-foreground">Status</span>
                            {blog.status === 'draft' ? (
                                <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300 text-xs">Draft</Badge>
                                ) : (
                                <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300 text-xs">Published</Badge>
                            )}
                            </div>
                        </div>

                        <div className="mt-3 sm:mt-4">
                            <Button asChild className="w-full bg-green-600 hover:bg-green-700 text-xs sm:text-sm">
                                <Link href={`/protected/blogs/${blog.id}`}>Edit Post</Link>
                            </Button>
                        </div>
                        </div>
                    </div>
                    </CardContent>
                )}
                </Card>
            ))}
            </div>

            {/* Styled Pagination Container - To match Events page */}
            {paginatedBlogs.length > 0 && (
              <div className="mt-6 mb-8 rounded-lg shadow-sm p-3 sm:p-4 border flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4 bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700/50">
                <div className="flex items-center gap-2 text-xs sm:text-sm text-green-700 dark:text-green-400">
                  <span>
                      Displaying {((currentPage - 1) * pageSize) + 1}-
                      {Math.min(currentPage * pageSize, totalFilteredBlogs)} of {totalFilteredBlogs}
                  </span>
                </div>
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  pageSize={pageSize}
                  onPageChange={setCurrentPage}
                  onPageSizeChange={(size) => {
                      setPageSize(size);
                      setCurrentPage(1); // Reset to first page on size change
                  }}
                />
              </div>
            )}
        </>
        ) : (
        <div className="text-center py-12">
            <p className="text-muted-foreground">
                {searchQuery ? `No blog posts found for "${searchQuery}".` : "No blog posts found."}
            </p>
            {searchQuery && (
                 <Button variant="link" onClick={() => setSearchQuery("")}>Clear search</Button>
            )}
        </div>
        )}

        <AlertDialog open={deleteAlertOpen} onOpenChange={setDeleteAlertOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the blog post
                    <span className="font-semibold"> &quot;{blogToDelete?.title}&quot;</span>.
                </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                <AlertDialogCancel disabled={isDeletingPost}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                    onClick={confirmDeletePost}
                    className="bg-red-600 hover:bg-red-700"
                    disabled={isDeletingPost}
                >
                    {isDeletingPost ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Yes, delete post"}
                </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </div>
  )
}