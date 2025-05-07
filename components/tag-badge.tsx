"use client"

import type React from "react"

import { X, Check, Pencil } from "lucide-react"
import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface TagBadgeProps {
  id: string
  name: string
  // onEdit and onDelete callbacks are now async and might be handled in parent
  onEdit?: (id: string, newName: string) => Promise<void> | void; // Accepts async or sync function
  onDelete?: (id: string) => Promise<void> | void; // Accepts async or sync function
  className?: string
  disabled?: boolean;
  variant?: "default" | "interactive" | "outline"
}

export function TagBadge({ id, name, onEdit, onDelete, className = "", variant = "default", disabled }: TagBadgeProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(name);

//   const handleEdit = () => {
//     if (editValue.trim()) {
//       onEdit(id, editValue)
//       setIsEditing(false)
//     }
//   }


const handleEdit = async () => { // Made async to potentially await parent callback
    if (editValue.trim() === name) { // Don't save if name hasn't changed
         setIsEditing(false);
         return;
    }
    if (editValue.trim()) {
      // If onEdit prop is provided, call it
      if (onEdit) {
         // If TagBadge handles saving, manage isSaving state here and call API directly
         // If parent handles, just call the prop
         await onEdit(id, editValue.trim()); // Await if parent is async
      }
      // setIsEditing(false); // Parent's success callback should ideally clear editing
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleEdit()
    } else if (e.key === "Escape") {
      setIsEditing(false)
      setEditValue(name)
    }
  }

  const isDisabled = disabled;

  if (isEditing) {
    return (
      <div className="flex items-center space-x-1">
        <Input
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className="h-7 px-2 py-1 text-xs w-32"
          autoFocus
          disabled={isDisabled}
        />
        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={handleEdit}>
            {/* Loader for saving edit */}
            {/* {isSaving && <Loader2 className="h-3 w-3 animate-spin" />} */}
            <Check className={`h-3 w-3 ${isDisabled ? 'hidden' : ''}`} />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6"
          onClick={() => {
            setIsEditing(false);
            setEditValue(name);
          }}
           disabled={isDisabled} 
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    )
  }

  if (variant === "interactive") {
    return (
      <Badge variant="secondary" className={`bg-green-100 text-green-800 flex items-center gap-1 group ${className}`}>
        {name}
        <div className="flex items-center">
          {/* <Button
            variant="ghost"
            size="icon"
            className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => setIsEditing(true)}
          >
            <Pencil className="h-2.5 w-2.5" />
          </Button> */}
             {onEdit && ( // Only show edit button if onEdit prop is provided
             <Button
               variant="ghost"
               size="icon"
               className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
               onClick={() => setIsEditing(true)}
                disabled={isDisabled}
             >
               <Pencil className="h-2.5 w-2.5" />
             </Button>
          )}
          {/* <Button
            variant="ghost"
            size="icon"
            className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-red-500"
            onClick={() => onDelete(id)}
          >
            <X className="h-2.5 w-2.5" />
          </Button> */}

            {onDelete && ( // Only show delete button if onDelete prop is provided
             <Button
               variant="ghost"
               size="icon"
               className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-red-500"
               onClick={() => onDelete(id)} // Call parent's onDelete callback
                disabled={isDisabled}
             >
                {/* Loader for delete - if TagBadge handles deletion */}
                {/* {isDeleting && <Loader2 className="h-2.5 w-2.5 animate-spin" />} */}
                {/* <X className={`h-2.5 w-2.5 ${isDeleting ? 'hidden' : ''}`} /> */}
               <X className="h-2.5 w-2.5" />
             </Button>
          )}
        </div>
      </Badge>
    )
  }

  if (variant === "outline") {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Badge variant="outline" className="bg-green-50 text-green-800">
          {name}
        </Badge>
        <div className="flex items-center gap-1">
            {onEdit && (
                 <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsEditing(true)} disabled={isDisabled}>
                     <Pencil className="h-3 w-3" />
                 </Button>
            )}
             {onDelete && (
                 <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500" onClick={() => onDelete(id)} disabled={isDisabled}>
                     {/* {isDeleting && <Loader2 className="h-3 w-3 animate-spin" />} */}
                     {/* <X className={`h-3 w-3 ${isDeleting ? 'hidden' : ''}`} /> */}
                     <X className="h-3 w-3" />
                 </Button>
            )}
        </div>
      </div>
    )
  }

  return (
    <Badge variant="secondary" className={`bg-green-100 text-green-800 ${className}`} >
      {name}
    </Badge>
  )
}
