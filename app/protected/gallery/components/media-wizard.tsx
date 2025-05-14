"use client"

import React, { useState, useEffect, useMemo } from 'react';
import Image from "next/image"
import { PlusCircle, Search, Film, ImageIcon, Calendar, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/pagination"; // Assuming you have this component
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { getCachedGalleryItems, invalidateGalleryCache, CachedGalleryItem } from '@/lib/galleryDataCache'; // Import caching functions

// Helper function to format date (can be moved to a utils file)
const formatDate = (dateString: string) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short", // Changed to short for brevity
    day: "numeric",
  });
};

export default function Mediawizard() {
    const router = useRouter();
    const [allGalleryItems, setAllGalleryItems] = useState<CachedGalleryItem[]>([]);
    const [isLoadingGalleryItems, setIsLoadingGalleryItems] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(5); // Default page size
    const [searchQuery, setSearchQuery] = useState("");

    // Function to load or refresh gallery items
    const loadGalleryItems = async (forceRefresh = false) => {
        setIsLoadingGalleryItems(true);
        try {
            const items = await getCachedGalleryItems(forceRefresh);
            setAllGalleryItems(items);
        } catch (error) {
            console.error("Failed to load gallery items:", error);
            toast.error("Failed to load gallery items. Displaying stale data if available.");
            // If getCachedGalleryItems throws and doesn't return stale data, 
            // allGalleryItems might remain as is, or you might set it to []
        } finally {
            setIsLoadingGalleryItems(false);
        }
    };

    useEffect(() => {
      loadGalleryItems();

      // Example of how you might revalidate if the window gains focus (optional)
      const handleFocus = () => {
        // console.log('Window focused, revalidating gallery cache potentially');
        // loadGalleryItems(true); // Or check cache expiry more granularly
      };
      window.addEventListener('focus', handleFocus);
      return () => window.removeEventListener('focus', handleFocus);

    }, []); // Initial load
  
    const filteredGalleryItems = useMemo(() => {
        if (!searchQuery) return allGalleryItems;
        return allGalleryItems.filter((item) => 
            item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (item.tags && item.tags.some(tag => tag.name.toLowerCase().includes(searchQuery.toLowerCase()))) || // Added null check for item.tags
            item.excerpt.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [allGalleryItems, searchQuery]);
  
    const totalPages = Math.ceil(filteredGalleryItems.length / pageSize);
    const paginatedGalleryItems = useMemo(() => {
        return filteredGalleryItems.slice((currentPage - 1) * pageSize, currentPage * pageSize);
    }, [filteredGalleryItems, currentPage, pageSize]);
  
    const totalFilteredItems = filteredGalleryItems.length;

    const handleCardClick = (itemId: string) => {
        router.push(`/protected/gallery/${itemId}`);
    };

  if (isLoadingGalleryItems && allGalleryItems.length === 0) { // Show loader only if no items are displayed yet
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
        <p className="ml-2">Loading gallery items...</p>
      </div>
    );
  }
    
  return (
    <div className="md:container mx-auto py-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold">Gallery</h1>
        <div className="flex gap-2">
            <Button 
                variant="outline" 
                size="icon" 
                onClick={() => loadGalleryItems(true)} 
                title="Refresh Gallery"
                disabled={isLoadingGalleryItems}
                className="border-gray-300 dark:border-gray-600"
            >
                {isLoadingGalleryItems && allGalleryItems.length > 0 ? <Loader2 className="h-4 w-4 animate-spin" /> : <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-refresh-cw"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M3 21v-5h5"/></svg>}
            </Button>
            <Button className="bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600" asChild>
                <Link href="/protected/gallery/add">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    New Gallery Post
                </Link>
            </Button>
        </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search gallery by title, tags, description..."
                    className="pl-8 border-gray-300 dark:border-gray-600 focus-visible:ring-green-500"
                    value={searchQuery}
                    onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setCurrentPage(1); 
                    }}
                />
            </div>
        </div>

        {paginatedGalleryItems.length > 0 ? (
        <>
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {paginatedGalleryItems.map((item) => (
                <div 
                  key={item.id} 
                  className={`py-4 flex items-start gap-4 group hover:bg-green-100 dark:hover:bg-green-800/40 hover:shadow-xl transition-all rounded-md -mx-2 px-2 cursor-pointer`}
                  onClick={() => handleCardClick(item.id)}
                >
                    {/* Link removed from here, click handled by parent div */}
                    <div className="relative w-24 h-24 sm:w-28 sm:h-28 flex-shrink-0 rounded-md overflow-hidden bg-gray-100 dark:bg-gray-800">
                      {item.cover_image ? (
                        <Image src={item.cover_image} alt={item.title} fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            {item.type === "video" ? <Film className="h-10 w-10 text-gray-400 dark:text-gray-500" /> : <ImageIcon className="h-10 w-10 text-gray-400 dark:text-gray-500" />}
                        </div>
                      )}
                      {item.type === "video" && item.cover_image && ( // Show film icon overlay only if it's a video AND has a cover image
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="bg-black/50 rounded-full p-1.5">
                            <Film className="h-5 w-5 text-white" />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex-grow min-w-0">
                      <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-100 group-hover:text-green-700 dark:group-hover:text-green-400 transition-colors line-clamp-2">
                        {item.title}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{item.excerpt}</p>
                      <div className="flex items-center text-xs text-muted-foreground mt-2 gap-3">
                        <div className="flex items-center">
                            {item.type === 'image' && <ImageIcon className="mr-1 h-3.5 w-3.5"/>}
                            {item.type === 'video' && <Film className="mr-1 h-3.5 w-3.5"/>}
                            {(item.type !== 'image' && item.type !== 'video') && <ImageIcon className="mr-1 h-3.5 w-3.5"/>} {/* Fallback for 'mixed' or other */}
                            <span className="capitalize">{item.type}</span>
                        </div>
                        <div className='flex items-center'>
                            <Calendar className="mr-1 h-3.5 w-3.5" />
                            <span>{formatDate(item.created_at)}</span>
                        </div>
                      </div>
                      {item.tags && item.tags.length > 0 && (
                        <div className="mt-2.5 flex flex-wrap gap-1.5">
                            {item.tags.slice(0, 3).map((tag) => (
                            <Badge 
                                key={tag.id} 
                                variant="default"
                                className="text-xs bg-green-600 hover:bg-green-700 text-white dark:bg-green-700 dark:hover:bg-green-600 dark:text-green-50 px-2 py-0.5"
                            >
                                {tag.name}
                            </Badge>
                            ))}
                            {item.tags.length > 3 && (
                                <Badge variant="outline" className="text-xs dark:border-gray-600 dark:text-gray-400 px-2 py-0.5">
                                    +{item.tags.length - 3} more
                                </Badge>
                            )}
                        </div>
                      )}
                    </div>
                </div>
              ))}
            </div>
            
            {paginatedGalleryItems.length > 0 && totalPages > 1 && (
              <div className="mt-6 mb-8 rounded-lg shadow-sm p-4 border flex flex-col sm:flex-row justify-between items-center gap-4 bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700/50">
                <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
                  <span>
                      Displaying {((currentPage - 1) * pageSize) + 1}-
                      {Math.min(currentPage * pageSize, totalFilteredItems)} of {totalFilteredItems}
                  </span>
                </div>
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  pageSize={pageSize}
                  onPageChange={setCurrentPage}
                  onPageSizeChange={(size) => {
                      setPageSize(size);
                      setCurrentPage(1); 
                  }}
                  // Add a prop for text color if your Pagination component supports it
                  // e.g., textColorClassName="text-green-700 dark:text-green-400"
                />
              </div>
            )}
        </>
        ) : (
        <div className="text-center py-12">
            <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-semibold text-gray-900 dark:text-gray-200">No gallery items found</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {searchQuery ? `Your search for "${searchQuery}" did not match any gallery items.` : "Get started by creating a new gallery post."}
            </p>
            {searchQuery && (
                 <Button variant="link" className="mt-2 text-green-600 dark:text-green-500" onClick={() => setSearchQuery("")}>Clear search</Button>
            )}
             {!searchQuery && (
                <Button className="mt-4 bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600" asChild>
                    <Link href="/protected/gallery/add">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        New Gallery Post
                    </Link>
                </Button>
            )}
        </div>
        )}
    </div>
  )
}

