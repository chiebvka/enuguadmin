"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Plus } from "lucide-react"

interface AddTagFormProps {
  onAddTag: (name: string) => void
  className?: string
  variant?: "default" | "inline" | "compact"
  disabled?: boolean;
}

export function AddTagForm({ onAddTag, className = "", variant = "default", disabled }: AddTagFormProps) {
  const [tagName, setTagName] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (tagName.trim()) {
      onAddTag(tagName.trim())
      setTagName("")
    }
  }

  if (variant === "inline") {
    return (
      <form onSubmit={handleSubmit} className={`flex items-center gap-2 ${className}`}>
        <Input
          value={tagName}
          onChange={(e) => setTagName(e.target.value)}
          placeholder="New tag name"
          disabled={disabled}
          className="h-9 border-green-200 focus-visible:ring-green-500"
        />
        <Button type="submit" className="bg-green-600 hover:bg-green-700 h-9">
            {disabled && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} {/* Show loader if disabled */}
            Add
        </Button>
      </form>
    )
  }

  if (variant === "compact") {
    return (
      <form onSubmit={handleSubmit} className={`flex items-center gap-2 ${className}`}>
        <Input
          value={tagName}
          onChange={(e) => setTagName(e.target.value)}
          disabled={disabled}
          placeholder="Add a new tag"
          className="h-8 text-sm border-green-200 focus-visible:ring-green-500"
        />
        <Button type="submit" size="sm" className="bg-green-600 hover:bg-green-700">
            {disabled && <Loader2 className="h-4 w-4 animate-spin" />} {/* Show loader if disabled */}
            <Plus className={`h-4 w-4 ${disabled ? 'hidden' : ''}`} />
        </Button>
      </form>
    )
  }

  return (
    <form onSubmit={handleSubmit} className={`space-y-4 ${className}`}>
      <div className="space-y-2">
        <Label htmlFor="tag-name">Tag Name</Label>
        <Input
          id="tag-name"
          value={tagName}
          disabled={disabled}
          onChange={(e) => setTagName(e.target.value)}
          placeholder="Enter tag name"
          className="border-green-200 focus-visible:ring-green-500"
        />
      </div>
      <Button type="submit" className="bg-green-600 hover:bg-green-700">
        {disabled && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} {/* Show loader if disabled */}
        <Plus className={`mr-2 h-4 w-4 ${disabled ? 'hidden' : ''}`} /> {/* Hide icon if disabled */}
        Add Tag
      </Button>
    </form>
  )
}
