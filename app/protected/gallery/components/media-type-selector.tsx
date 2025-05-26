"use client"

import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ImageIcon, Film } from "lucide-react"

interface MediaTypeSelectorProps {
  value: string
  onChange: (value: "image" | "video") => void
}

export function MediaTypeSelector({ value, onChange }: MediaTypeSelectorProps) {
  const handleValueChange = (newValue: string) => {
    if (newValue === 'image' || newValue === 'video') {
      onChange(newValue);
    }
  };

  return (
    <RadioGroup value={value} onValueChange={handleValueChange} className="flex gap-4">
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="image" id="image" className="accent-green-600  dark:accent-green-500" />
        <Label htmlFor="image" className="flex items-center cursor-pointer">
          <ImageIcon className="h-4 w-4 mr-2 text-green-600 dark:text-green-500" />
          Images
        </Label>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="video" id="video" className="accent-green-600 dark:accent-green-500" />
        <Label htmlFor="video" className="flex items-center cursor-pointer">
          <Film className="h-4 w-4 mr-2 text-green-600 dark:text-green-500" />
          Videos
        </Label>
      </div>
    </RadioGroup>
  )
}
