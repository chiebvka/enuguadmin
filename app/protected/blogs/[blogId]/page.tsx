// app/protected/blogs/[blogId]/page.tsx
import React from 'react';
import Createwizard from '../create/components/create-wizard';
import { createClient } from '@/utils/supabase/server';
import { notFound } from 'next/navigation'; // Import notFound
// Adjust the import path for Createwizard based on where it's located relative to this new file


// Define the type for a Blog post object fetched from the database
interface BlogPost {
    id: string;
    title: string;
    cover_image: string | null;
    content: string;
    status: "draft" | "published";
    tags: string[]; // Array of tag IDs from the junction table
}

// Define the type for a Tag object
interface Tag {
    id: string;
    name: string;
    slug?: string;
    profile_id?: string;
}


// Props will include the dynamic 'blogId' segment
type Props = {
  params: Promise<{ blogId: string }>;
};


// Server-side function to fetch a specific blog post
async function fetchBlogPost(blogId: string): Promise<BlogPost | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
      console.error("User not authenticated while trying to fetch blog post");
      notFound();
  }

  try {
    const { data, error } = await supabase
        .from('blogposts')
        .select('id, title, cover_image, content, status, blogpost_tags(tag_id)')
        .eq('id', blogId)
        .eq('author_id', user.id)
        .single();

    // Handle errors after the query attempt
    if (error) {
        // If the error is "Not Found" (PGRST116) or "Invalid UUID syntax" (22P02)
        if (error.code === 'PGRST116' || error.code === '22P02') {
            console.log(`Blog post with ID ${blogId} not found or ID is invalid. Error code: ${error.code}`);
            return null; // Treat as not found
        }
        // For any other database errors, log and re-throw to show a generic server error
        console.error(`Supabase fetch error for blog post ${blogId}:`, error);
        throw new Error("Failed to fetch blog post due to a database error.");
    }

    if (!data) {
        // This case handles when the query was successful but returned no data (e.g., ID valid but no matching record for the user)
        console.log(`No data returned for blog post with ID ${blogId} for user ${user.id}.`);
        return null; // Treat as not found
    }

    const selectedTagIds = data?.blogpost_tags?.map((bt: any) => bt.tag_id) || [];

    return {
        id: data.id,
        title: data.title,
        cover_image: data.cover_image,
        content: data.content,
        status: data.status,
        tags: selectedTagIds,
    };

  } catch (err: any) {
    // Catch any other unexpected errors during the try block (e.g., network issues with Supabase client itself)
    // or re-thrown errors from above.
    console.error("Unexpected error in fetchBlogPost:", err);
    // Depending on the error, you might want to throw it to let Next.js handle it as a server error,
    // or if it's an error that should lead to a 404, you could call notFound() here.
    // For simplicity, if an error is thrown by Supabase and not handled as null above,
    // it will propagate up. If it's a generic JS error, it will also propagate.
    // The page component calling this will then decide if it leads to notFound().
    // Given the `throw new Error` above, we probably want that to be caught by Next.js as a server error page.
    // The `notFound()` calls are best placed based on `null` return values.
    
    // If the error was our custom "Failed to fetch..." error, re-throw it.
    // Otherwise, for safety, consider it a scenario where the post effectively isn't found for the page.
    if (err.message.startsWith("Failed to fetch blog post")) {
        throw err; // Let Next.js handle this specific server error
    }
    // For truly unexpected errors not from Supabase query failure,
    // it's often better to show a generic error than a 404.
    // However, if the goal is strictly to show 404 for ANY failure to get a specific blog,
    // one might return null here too, but it masks other potential server issues.
    // The current setup where the page calls notFound() if fetchBlogPost returns null is good.
    // We just need to ensure fetchBlogPost correctly returns null for invalid ID syntax.
    console.error(`General error fetching blog post ${blogId}: ${err.message}`);
    // For a general fetch failure not already identified as a non-existent post,
    // throwing an error is usually more appropriate than a 404.
    // The page logic already handles null returns by calling notFound().
    throw new Error(`An unexpected error occurred while trying to fetch blog post ${blogId}.`);
  }
}


// Server-side function to fetch all available tags (same as create page)
async function fetchAvailableTags(): Promise<Tag[]> {
 const supabase =  await createClient();
  const { data: { user } } = await supabase.auth.getUser(); // Auth check again
  if (!user) { /* handle unauthorized */ }

 const { data: tags, error } = await supabase
     .from('tags')
     .select('id, name')
     .order('name', { ascending: true });

 if (error) {
     console.error("Server-side failed to fetch available tags:", error);
     throw new Error("Failed to fetch available tags from database");
 }

 return tags || [];
}




// This page component renders the Createwizard and passes the dynamic ID as a prop
export default async function EditBlogPostPage({ params }: Props) {
  // Await params as suggested by the error message when de-opted to dynamic rendering
  const resolvedParams = await params;
  const blogId = resolvedParams.blogId;

  // Fetch both the specific blog post and the available tags in parallel
  const [blogPostData, availableTags] = await Promise.all([ // Renamed to avoid conflict with blogPost variable below
      fetchBlogPost(blogId),
      fetchAvailableTags(),
  ]);

  // If the blog post is not found, trigger the 404 page
  if (!blogPostData) {
    notFound();
  }


  return (
    <div>
      {/* Pass the blogId directly as a prop to Createwizard */}
      <Createwizard 
        blogId={blogPostData.id} // Use blogPostData here
        initialBlogData={blogPostData} // Use blogPostData here
        availableTags={availableTags}
      />
    </div>
  );
}