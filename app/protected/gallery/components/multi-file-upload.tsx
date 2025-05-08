"use client"

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { X, Upload, ImageIcon, Film } from "lucide-react";
import { toast } from "sonner";



interface MultiFileUploaderProps {
    value: File[]
    onChange: (files: File[]) => void
    acceptedFileTypes?: string
    maxFiles?: number
    disabled?: boolean;
}


export function MultiFileUploader({
    value,
    onChange,
    acceptedFileTypes = "image/*,video/*",
    maxFiles = 7,
    disabled,
  }: MultiFileUploaderProps) {
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [isDragging, setIsDragging] = useState(false)
  
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (disabled) return;
      if (!e.target.files?.length) return
  
      const newFiles = Array.from(e.target.files)
  
      if (value.length + newFiles.length > maxFiles) {
        toast.error(`You can only upload up to ${maxFiles} files at once.`)
        return
      }
  
      // Check file types
      const validFiles = newFiles.filter((file) => {
        if (file.type.startsWith("image/") || file.type.startsWith("video/")) {
          return true
        }
        toast.error(`${file.name} is not a valid image or video file.`)
        return false
      })
  
      onChange([...value, ...validFiles])
  
      // Reset the input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  
    const handleDragOver = (e: React.DragEvent) => {
      if (disabled) return;
      e.preventDefault()
      setIsDragging(true)
    }
  
    const handleDragLeave = () => {
      if (disabled) return;
      setIsDragging(false)
    }
  
    const handleDrop = (e: React.DragEvent) => {
      if (disabled) return;
      e.preventDefault()
      setIsDragging(false)
  
      if (!e.dataTransfer.files?.length) return
  
      const newFiles = Array.from(e.dataTransfer.files)
  
      if (value.length + newFiles.length > maxFiles) {
        toast.error(`You can only upload up to ${maxFiles} files at once.`)
        return
      }
  
      // Check file types
      const validFiles = newFiles.filter((file) => {
        if (file.type.startsWith("image/") || file.type.startsWith("video/")) {
          return true
        }
        toast.error(`${file.name} is not a valid image or video file.`)
        return false
      })
  
      onChange([...value, ...validFiles])
    }
  
    const removeFile = (index: number) => {
      if (disabled) return;
      const newFiles = [...value]
      newFiles.splice(index, 1)
      onChange(newFiles)
    }
  
    const getFileIcon = (file: File) => {
      if (file.type.startsWith("image/")) {
        return <ImageIcon className="h-6 w-6" />
      } else if (file.type.startsWith("video/")) {
        return <Film className="h-6 w-6" />
      }
      return null
    }
  
    return (
      <div className="space-y-4">
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            isDragging ? "border-green-600 bg-green-50" : "border-gray-300"
          } ${disabled ? 'bg-gray-100 opacity-50 cursor-not-allowed' : 'hover:border-gray-400'}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept={acceptedFileTypes}
            multiple
            className="hidden"
            disabled={disabled}
          />
          <Upload className={`h-10 w-10 mx-auto mb-2 ${disabled ? 'text-gray-400' : 'text-green-600'}`} />
          <p className="text-sm font-medium mb-1">
            Drag and drop files here or{" "}
            <Button
              type="button"
              variant="link"
              className={`p-0 h-auto ${disabled ? 'text-gray-500' : 'text-green-600'}`}
              onClick={() => !disabled && fileInputRef.current?.click()}
              disabled={disabled}
            >
              browse
            </Button>
          </p>
          <p className="text-xs text-muted-foreground">
            Upload up to {maxFiles} files ({value.length}/{maxFiles})
          </p>
        </div>
  
        {value.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">
              Selected files ({value.length}/{maxFiles})
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {value.map((file, index) => (
                <div key={index} className={`flex items-center justify-between p-2 border rounded-md ${disabled ? 'bg-gray-100' : 'bg-gray-50'}`}>
                  <div className="flex items-center space-x-2 overflow-hidden">
                    <div className="flex-shrink-0 w-8 h-8 rounded bg-gray-200 flex items-center justify-center">
                      {getFileIcon(file)}
                    </div>
                    <span className="text-sm truncate" title={file.name}>
                      {file.name}
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-gray-500 hover:text-red-600"
                    onClick={() => removeFile(index)}
                    disabled={disabled}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }
  


  
