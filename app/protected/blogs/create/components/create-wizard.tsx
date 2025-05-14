"use client"


import React, { useMemo, useState } from 'react';
import { FileUploader } from "@/components/file-uploader";
import { TagSelector } from "@/components/tag-selector";
import { TipTapEditor } from "@/components/tiptap-editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Save, CheckCircle, Clock, Calendar, BarChart, Loader2, Trash2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
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
} from "@/components/ui/alert-dialog"
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import axios from 'axios';
import { invalidateBlogsCache } from '@/lib/blogDataCache'; // Import cache invalidation



interface BlogPost {
  id: string;
  title: string;
  cover_image: string | null;
  content: string;
  status: "draft" | "published";
  tags: string[];
}

interface Tag {
  id: string;
  name: string;
  slug?: string;
  profile_id?: string;
}



type Props = {
  blogId?: string | null; 
  initialBlogData?: BlogPost | null; 
  availableTags: Tag[];
};

export default function Createwizard({ blogId: initialBlogId, initialBlogData, availableTags  }: Props) {
  const router = useRouter();

  const initialContent = initialBlogData?.content || "";
  

  const [blogId, setBlogId] = useState<string | null>(initialBlogId || null); // State to hold the blog post ID
  const [title, setTitle] = useState(initialBlogData?.title || "");
  const [coverImage, setCoverImage] = useState<string | null>(initialBlogData?.cover_image || null);
  const [tags, setTags] = useState<string[]>(initialBlogData?.tags || []);
  const [currentSection, setCurrentSection] = useState<"draft" | "review" | "publish">("draft")
  const [startTime] = useState(new Date())
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false); // For delete loading state
  const [content, setContent] = useState(initialContent);
  const [wordCount, setWordCount] = useState(() => {
    const text = initialContent.replace(/<[^>]*>/g, "");
    const words = text.trim().split(/\s+/).filter(Boolean);
    return words.length;
  });
  // State to track the current status of the blog post
  const [currentPostStatus, setCurrentPostStatus] = useState<"draft" | "published">(
    initialBlogData?.status || "draft"
  );

   // Dependencies: rerun effect if blogId or router changes

    // --- Save and Publish Logic ---
    const saveBlogPost = async (status: "draft" | "published") => {
      setIsLoading(true);

      // Basic validation before saving
      if (!title) {
           toast.error("Title is required to save or publish.");
           setIsLoading(false);
           return;
      }

      const blogData = {
          id: blogId,
          title,
          cover_image: coverImage,
          content,
          tags,
          status, 
         
      };

      try {

        // Always POST to /api/blogs/create.
        // The backend will determine if it's a create or update based on blogData.id
        const response = await axios.post("/api/blogs/create", blogData);

          const savedBlog = response.data.blog;

          if (savedBlog?.id) {
               if (!blogId) { // If it was a new post (draft or published directly)
                  console.log("New blog created with ID:", savedBlog.id);
                  setBlogId(savedBlog.id); // Update state with the new ID
                  router.replace(`/protected/blogs/${savedBlog.id}`); // Update URL to the edit page with ID
               }
               setCurrentPostStatus(savedBlog.status); // Update current post status
               invalidateBlogsCache(); // Invalidate cache on save/publish/unpublish

               if (status === "published") {
                   toast.success("Blog post published successfully!");
               } else {
                   toast.success("Draft saved successfully!");
               }
          } else {
               throw new Error("API did not return saved blog data.");
          }

      } catch (error: any) {
        console.error(`Failed to ${status === 'published' ? 'publish' : 'save draft'}:`, error);

        const message = error?.response?.data?.error || error.message || "An unexpected error occurred"
      
        if (message.includes("duplicate key value") && message.includes("slug")) {
          toast.error("A blog post with this title already exists. Please choose a different title.")
        } else {
          toast.error(`Failed to ${status === 'published' ? 'publish' : 'save draft'}. ${message}`)
        }
      } finally {
          setIsLoading(false); 
      }
  };

  const handleDeleteBlogPost = async () => {
    if (!blogId) {
      toast.error("Cannot delete a post without an ID.");
      return;
    }
    setIsDeleting(true);
    try {
      await axios.delete(`/api/blogs/${blogId}`);
      toast.success("Blog post deleted successfully!");
      invalidateBlogsCache(); // Invalidate cache on delete
      router.push("/protected/blogs"); // Redirect to blogs list
    } catch (error: any) {
      console.error("Failed to delete blog post:", error);
      const message = error?.response?.data?.error || error.message || "An unexpected error occurred";
      toast.error(`Failed to delete blog post. ${message}`);
    } finally {
      setIsDeleting(false);
    }
  };

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      console.log("Saving Draft:", { blogId, title, coverImage, tags, content });
      saveBlogPost("draft"); // Call the save function with status 'draft'
  };

  // This function is called when the Publish Now / Unpublish button is clicked
  const handlePublishToggle = () => {
    if (currentPostStatus === "published") {
      // If currently published, unpublish (set to draft)
      saveBlogPost("draft");
    } else {
      // If currently draft, try to publish
      console.log("Attempting to Publish:", { blogId, title, coverImage, tags, content });

      const missingItems: string[] = []

      if (!title) missingItems.push("Title")
      if (!coverImage) missingItems.push("Cover Image")
      if (tags.length > 0) { // Check if tags are present, not specifically for 1 tag only for validation
        // The getCompletionPercentage already handles the 1 tag logic for 100%
      } else {
        missingItems.push("At least 1 Tag");
      }
      if (wordCount < 50) missingItems.push("Minimum 50 words of Content")
    
      if (missingItems.length > 0) {
        toast.warning(`Please complete the following: ${missingItems.join(", ")}`)
        return
      }

      if (getCompletionPercentage() < 100) {
          toast.warning("Please complete all sections before publishing.");
          return;
      }
      saveBlogPost("published");
    }
  };



    // const handleSubmit = (e: React.FormEvent) => {
    //     e.preventDefault()
    //     // Handle form submission
    //     console.log({ title, coverImage, tags, content })
    //   }
    
    
    const calculateWordCount = (html: string) => {
      // Remove HTML tags and count words
      const text = html.replace(/<[^>]*>/g, "")
      const words = text.trim().split(/\s+/).filter(Boolean)
      setWordCount(words.length)
    }
      const elapsedTime = useMemo(getElapsedTime, [startTime]);
      const readingTime = useMemo(getReadingTime, [wordCount]);
      const completionPercentage = useMemo(getCompletionPercentage, [title, coverImage, tags, wordCount]);


      function getElapsedTime() {
        const now = new Date();
        const elapsed = now.getTime() - startTime.getTime();
        const minutes = Math.floor(elapsed / 60000);
        return minutes < 1 ? "Just started" : `${minutes} min`;
    }

    function getReadingTime() {
        const readingTime = Math.ceil(wordCount / 225);
        return readingTime < 1 ? "< 1 min read" : `${readingTime} min read`;
    }

 

    function getCompletionPercentage() {
      let percentage = 0;
      if (title.length > 0) percentage += 20;
      if (coverImage) percentage += 15;
       // If there's at least one tag, grant the full 15% for tags.
      if (tags.length > 0) percentage += 15; 
       // Assuming content needs a minimum word count for completion
       if (wordCount >= 50) {
        percentage += 50;
      } else {
        percentage += Math.floor((wordCount / 50) * 50); // scale up to 50%
      }
      return Math.round(percentage);
  }


    const handleContentChange = (newContent: string) => {
        console.log("Createwizard handleContentChange - New Content:", newContent);
        setContent(newContent);
        calculateWordCount(newContent);
    };

   
  



  return (
        <div className="md:container mx-auto py-6">
      <div className="flex flex-col md:flex-row items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" asChild>
            <Link href="/protected/blogs">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">{blogId ? 'Edit Blog Post' : 'Create New Blog Post'}</h1>
        </div>

        {/* Save Draft button: Triggers form submission which calls handleSubmit */}
        <div className="flex items-center gap-2">
          {blogId && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="text-red-600 border-red-600 hover:bg-red-50 hover:text-red-700" disabled={isDeleting || isLoading}>
                  {isDeleting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="mr-2 h-4 w-4" />
                  )}
                  Delete Post
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete your blog post
                    and remove its data from our servers.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteBlogPost}
                    className="bg-red-600 hover:bg-red-700"
                    disabled={isDeleting}
                  >
                    {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Yes, delete post"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          <Button type="submit" form="blog-form" className="bg-green-600 hover:bg-green-700" disabled={isLoading || isDeleting}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Save className={`mr-2 h-4 w-4 ${isLoading ? 'hidden' : ''}`} />
            Save Draft
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <form id="blog-form" onSubmit={handleSubmit} className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-lg">
                      Title
                    </Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Enter blog title"
                      className="text-xl border-green-200 focus-visible:ring-green-500"
                      required
                    />
                    <div className="text-sm text-muted-foreground">
                      <p>A good title should:</p>
                      <ul className="list-disc pl-5 mt-2 space-y-1">
                        <li>Be clear and concise</li>
                        <li>Include keywords relevant to your topic</li>
                        <li>Engage your readers and make them want to read more</li>
                      </ul>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-lg">Cover Image</Label>
                    <FileUploader onChange={setCoverImage} value={coverImage} uploadType="blogCovers" />
                    <div className="text-sm text-muted-foreground">
                      <p>Your cover image:</p>
                      <ul className="list-disc pl-5 mt-2 space-y-1">
                        <li>Should be at least 1200 x 630 pixels</li>
                        <li>Will be displayed at the top of your blog post</li>
                        <li>Should be relevant to your content</li>
                        <li>Will be used when sharing on social media</li>
                      </ul>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-lg">Tags</Label>
                    <TagSelector selectedTags={tags} onChange={setTags} availableTags={availableTags} />
                    <div className="text-sm text-muted-foreground">
                      <p>Tags help readers find your content:</p>
                      <ul className="list-disc pl-5 mt-2 space-y-1">
                        <li>Choose at least 1 relevant tag </li>
                        <li>Use specific tags rather than general ones</li>
                        <li>Consider what readers might search for</li>
                        <li>Use consistent tagging across your blog</li>
                      </ul>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-lg">Content</Label>
                    <TipTapEditor
                      content={content}
                      onChange={handleContentChange}
                      className="min-h-[400px]"
                      placeholder="Start writing your blog post here..."
                    />
                    <div className="text-sm text-muted-foreground">
                      <p>Writing effective content:</p>
                      <ul className="list-disc pl-5 mt-2 space-y-1">
                        <li>Start with a compelling introduction</li>
                        <li>Break content into sections with subheadings</li>
                        <li>Use short paragraphs and simple language</li>
                        <li>Include images or media to enhance your points</li>
                        <li>End with a clear conclusion or call to action</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </form>
        </div>

        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold mb-4">Blog Journey</h2>

              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-green-200"></div>

                {/* Timeline items */}
                <div className="space-y-8">
                  <TimelineItem
                    icon={<Calendar className="h-5 w-5" />}
                    title="Started"
                    description={startTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    isActive={true}
                    isCompleted={true}
                  />

                  <TimelineItem
                    icon={<Clock className="h-5 w-5" />}
                    title="Working Time"
                    description={getElapsedTime()}
                    isActive={true}
                    isCompleted={false}
                  />

                    {/* Add an item for Draft Saved status */}
                    <TimelineItem
                    icon={<Save className="h-5 w-5" />}
                    title="Draft Saved"
                    description={blogId ? "Saved to Drafts" : "Not saved yet"}
                    isActive={!!blogId} // Active if blogId exists (means it's been saved at least once)
                    isCompleted={!!blogId} // Completed if blogId exists
                   />

                  <TimelineItem
                    icon={<BarChart className="h-5 w-5" />}
                    title="Completion"
                    description={`${getCompletionPercentage()}% complete`}
                    isActive={getCompletionPercentage() > 0}
                    isCompleted={getCompletionPercentage() === 100}
                    progress={getCompletionPercentage()}
                  />

                  <TimelineItem
                    icon={<CheckCircle className="h-5 w-5" />}
                    title="Ready to Publish"
                    description={getCompletionPercentage() === 100 ? "Ready!" : "Complete all sections"}
                    isActive={getCompletionPercentage() === 100}
                    isCompleted={false}
                  />

                    {/* Optional: Add an item for Published status */}
                  {/* {currentSection === 'published' && (
                       <TimelineItem
                           icon={<CheckCircle className="h-5 w-5" />}
                           title="Published"
                           description="Live on the blog"
                           isActive={true}
                           isCompleted={true}
                       />
                   )} */}
                </div>
              </div>

              <Separator className="my-6" />

              <div className="space-y-4">
                <h3 className="font-medium">Blog Stats</h3>

                <div className="grid grid-cols-2 gap-2">
                  <StatCard title="Word Count" value={wordCount.toString()} />
                  <StatCard title="Reading Time" value={getReadingTime()} />
                </div>

                <div className="pt-4">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          className="w-full bg-green-600 hover:bg-green-700"
                          disabled={
                            isLoading || (currentPostStatus !== "published" && getCompletionPercentage() < 100)
                          }
                          onClick={handlePublishToggle} // Updated onClick handler
                        >
                          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          {currentPostStatus === "published" ? "Unpublish" : "Publish Now"}
                        </Button>
                      </TooltipTrigger>
                      {currentPostStatus !== "published" && getCompletionPercentage() < 100 && (
                        <TooltipContent>
                          <p>Complete all sections before publishing</p>
                        </TooltipContent>
                      )}
                      {currentPostStatus === "published" && (
                        <TooltipContent>
                          <p>Change status to draft. The post will no longer be publicly visible.</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}



function TimelineItem({
    icon,
    title,
    description,
    isActive,
    isCompleted,
    progress,
  }: {
    icon: React.ReactNode
    title: string
    description: string
    isActive: boolean
    isCompleted: boolean
    progress?: number
  }) {
    return (
      <div className="relative pl-10">
        {/* Icon */}
        <div
          className={`absolute left-0 top-0 w-6 h-6 rounded-full flex items-center justify-center ${
            isCompleted
              ? "bg-green-600 text-white"
              : isActive
                ? "bg-green-100 text-green-600 border border-green-600"
                : "bg-muted text-muted-foreground"
          }`}
        >
          {icon}
        </div>
  
        {/* Content */}
        <div>
          <h3 className="font-medium">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
  
          {/* Progress bar */}
          {progress !== undefined && (
            <div className="w-full h-1.5 bg-muted mt-2 rounded-full overflow-hidden">
              <div className="h-full bg-green-600 transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
          )}
        </div>
      </div>
    )
  }
  
  function StatCard({ title, value }: { title: string; value: string }) {
    return (
      <div className="bg-muted/20 p-3 rounded-md">
        <p className="text-xs text-muted-foreground">{title}</p>
        <p className="text-lg font-semibold">{value}</p>
      </div>
    )
  }
  