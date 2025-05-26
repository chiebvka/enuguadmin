// components/tag-selector.tsx
"use client";

// Removed useEffect import
import React, { useState, useMemo } from "react";
import { X, Check, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
// Removed axios and toast imports as fetching is handled elsewhere
// import axios from "axios";
// import { toast } from "sonner";

// Define the type for a Tag object (should match the type passed from the page)
export interface Tag {
    id: string;
    name: string;
    slug?: string;
    profile_id?: string;
}

interface TagSelectorProps {
  selectedTags: string[]; // Array of selected tag IDs (managed by parent)
  onChange: (tags: string[]) => void; // Callback to update the parent's selectedTags state
  availableTags: Tag[]; // Prop: List of all available tags fetched from higher up
  disabled?: boolean; // Optional prop to disable the selector
}

// Receive availableTags as a prop
export function TagSelector({ selectedTags, onChange, availableTags, disabled }: TagSelectorProps) {
  const [open, setOpen] = useState(false);
  // Removed availableTags state and isLoadingAvailableTags state
  // Removed useEffect for fetching available tags

  // Find the full tag objects for the selected tag IDs to display their names
  // This still needs availableTags, which now comes from props
  const selectedTagObjects = useMemo(() => {
      return selectedTags
          .map(tagId => availableTags.find(tag => tag.id === tagId))
          .filter((tag): tag is Tag => tag !== undefined);
  }, [selectedTags, availableTags]);


  const handleSelect = (tagId: string) => {
    // Prevent selecting/deselecting if disabled
    if (disabled) return;

    // Ensure the tag ID exists in the available tags before selecting
     const tagExists = availableTags.some(tag => tag.id === tagId);
     if (!tagExists) {
         console.warn(`Attempted to select non-existent tag ID: ${tagId}`);
         return; // Do not proceed if the tag ID is invalid
     }


    if (selectedTags.includes(tagId)) {
      onChange(selectedTags.filter((id) => id !== tagId));
    } else {
      onChange([...selectedTags, tagId]);
    }
  };

  const handleRemove = (tagId: string) => {
    // Prevent removing if disabled
    if (disabled) return;

    onChange(selectedTags.filter((id) => id !== tagId));
  };

  // No internal loading state for fetching available tags anymore
  const isLoadingAvailableTags = false; // Always false in this component


  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {/* No loading indicator for available tags fetch here */}
        {selectedTagObjects.length > 0 ? (
          selectedTagObjects.map((tag) => (
            <Badge key={tag.id} variant="secondary" className="bg-green-100 text-green-800">
              {tag.name}
              <button
                type="button"
                className="ml-1 rounded-full outline-none focus:ring-2"
                onClick={() => handleRemove(tag.id)}
                disabled={disabled} // Use the disabled prop
              >
                <X className="h-3 w-3" />
                <span className="sr-only">Remove tag {tag.name}</span>
              </button>
            </Badge>
          ))
        ) : (
          <div className="text-sm text-muted-foreground">No tags selected</div>
        )}
      </div>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          {/* Disable the trigger button based on the disabled prop */}
          <Button
            variant="outline"
            size="sm"
            className="h-8 border-dashed border-green-300 text-green-50 bg-green-600 hover:bg-green-100 hover:text-green-800"
            disabled={disabled}
          >
             {/* No loader for fetching here, parent manages loading */}
             Add tags
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0" align="start">
          <Command>
            {/* Disable command input based on the disabled prop */}
            <CommandInput placeholder="Search tags..." disabled={disabled} />
             {/* No loading state indicator for available tags fetch here */}
            <CommandList>
                <CommandEmpty>No tags found.</CommandEmpty>
                <CommandGroup>
                  {availableTags.map((tag) => (
                    <CommandItem
                        key={tag.id}
                        onSelect={() => handleSelect(tag.id)}
                        className="flex items-center"
                        // Disable item if it's already selected or if disabled
                        disabled={selectedTags.includes(tag.id) || disabled}
                        style={{
                            pointerEvents: selectedTags.includes(tag.id) || disabled ? 'none' : 'auto',
                            opacity: selectedTags.includes(tag.id) || disabled ? 0.5 : 1,
                        }}
                        >
                         <div
                            className={`mr-2 flex h-4 w-4 items-center justify-center rounded-sm border ${
                                selectedTags.includes(tag.id)
                                ? "bg-green-600 border-green-600"
                                : "border-gray-300"
                            }`}
                            >
                            {selectedTags.includes(tag.id) && <Check className="h-3 w-3 text-white" />}
                            </div>
                      <span>{tag.name}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}










// "use client"

// import { useState } from "react"
// import { X } from "lucide-react"
// import { Badge } from "@/components/ui/badge"
// import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
// import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
// import { Button } from "@/components/ui/button"

// // Sample tags - in a real app, these would come from your database
// const availableTags = [
//   { id: "1", name: "Announcements" },
//   { id: "2", name: "Events" },
//   { id: "3", name: "Marketing" },
//   { id: "4", name: "Community Development" },
//   { id: "5", name: "Updates" },
//   { id: "6", name: "Board" },
//   { id: "6", name: "Press Release" },
// ]

// // Define the type for a Tag object as fetched from your API
// interface Tag {
//   id: string; // Assuming UUID or string ID
//   name: string;
//   slug?: string; // Include other fields if needed, but id and name are essential
// }

// interface TagSelectorProps {
//   selectedTags: string[]; // Array of selected tag IDs
//   onChange: (tags: string[]) => void; // Callback to update the parent state (array of IDs)
//   disabled?: boolean;
// }

// export function TagSelector({ selectedTags, onChange, disabled }: TagSelectorProps) {
//   const [open, setOpen] = useState(false)
//     // State to store available tags fetched from the API
//     const [availableTags, setAvailableTags] = useState<Tag[]>([]);
//     const [isLoadingAvailableTags, setIsLoadingAvailableTags] = useState(false); // Loading state

//   const handleSelect = (tagId: string) => {
//     if (selectedTags.includes(tagId)) {
//       onChange(selectedTags.filter((id) => id !== tagId))
//     } else {
//       onChange([...selectedTags, tagId])
//     }
//   }

//   const handleRemove = (tagId: string) => {
//     onChange(selectedTags.filter((id) => id !== tagId))
//   }

//   return (
//     <div className="space-y-2">
//       <div className="flex flex-wrap gap-2">
//         {selectedTags.length > 0 ? (
//           selectedTags.map((tagId) => {
//             const tag = availableTags.find((t) => t.id === tagId)
//             return (
//               <Badge key={tagId} variant="secondary" className="bg-green-100 text-green-800">
//                 {tag?.name}
//                 <button
//                   type="button"
//                   className="ml-1 rounded-full outline-none focus:ring-2"
//                   onClick={() => handleRemove(tagId)}
//                 >
//                   <X className="h-3 w-3" />
//                   <span className="sr-only">Remove tag {tag?.name}</span>
//                 </button>
//               </Badge>
//             )
//           })
//         ) : (
//           <div className="text-sm text-muted-foreground">No tags selected</div>
//         )}
//       </div>
//       <Popover open={open} onOpenChange={setOpen}>
//         <PopoverTrigger asChild>
//           <Button variant="outline" size="sm" className="h-8 border-dashed">
//             Add tags
//           </Button>
//         </PopoverTrigger>
//         <PopoverContent className="p-0" align="start">
//           <Command>
//             <CommandInput placeholder="Search tags..." />
//             <CommandList>
//               <CommandEmpty>No tags found.</CommandEmpty>
//               <CommandGroup>
//                 {availableTags.map((tag) => (
//                   <CommandItem key={tag.id} onSelect={() => handleSelect(tag.id)} className="flex items-center">
//                     <div
//                       className={`mr-2 h-4 w-4 rounded-sm border ${
//                         selectedTags.includes(tag.id) ? "bg-green-600 border-green-600" : "border-input"
//                       }`}
//                     >
//                       {selectedTags.includes(tag.id) && <X className="h-3 w-3 text-white" />}
//                     </div>
//                     <span>{tag.name}</span>
//                   </CommandItem>
//                 ))}
//               </CommandGroup>
//             </CommandList>
//           </Command>
//         </PopoverContent>
//       </Popover>
//     </div>
//   )
// }
