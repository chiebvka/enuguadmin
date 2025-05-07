"use client"

import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Image from "@tiptap/extension-image"
import Link from "@tiptap/extension-link"
import Placeholder from "@tiptap/extension-placeholder"
import { Button } from "@/components/ui/button"
import TextAlign from "@tiptap/extension-text-align";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  ImageIcon,
  LinkIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
} from "lucide-react"
import axios from "axios"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { LinkDialog } from "./link-dialog"

interface TipTapEditorProps {
  content: string
  onChange: (content: string) => void
  className?: string
  placeholder?: string
}

export function TipTapEditor({
  content,
  onChange,
  className,
  placeholder = "Start writing your blog post here...",
}: TipTapEditorProps) {
  console.log("TipTapEditor rendered");

  const [linkOpen, setLinkOpen] = useState(false)
  // Initialize with empty content if the content is just the default placeholder
  const initialContent = content === "<p>Start writing your blog post here...</p>" ? "" : content

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image,
      Link.configure({
        openOnClick: false,
      }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass: "is-editor-empty",
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"], // required or it won't work!
      }),
    ],
    content: initialContent,
    onUpdate: ({ editor }) => {
      const newHtml = editor.getHTML();
      console.log("TipTap Editor onUpdate - HTML:", newHtml); // Log the HTML after update
      onChange(newHtml);
    },
    // onUpdate: ({ editor }) => {
    //   onChange(editor.getHTML())
    // },
  })

  useEffect(() => {
    if (!editor) return
  
    const handleDrop = async (event: DragEvent) => {
      event.preventDefault()
  
      const file = event.dataTransfer?.files?.[0]
      if (!file || !file.type.startsWith("image/")) return
  
      // Insert temporary placeholder
      const placeholderUrl = "/placeholder.svg"
      editor.chain().focus().setImage({ src: placeholderUrl }).run()
  
      const formData = new FormData()
      formData.append("file", file)
      formData.append("type", "blogposts")
  
      try {
        const res = await axios.post("/api/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        })
        const url = res.data.url
  
        // Replace the placeholder image
        editor.commands.deleteSelection()
        editor.chain().focus().setImage({ src: url }).run()
        editor?.chain().focus().run();
      } catch (err) {
        console.error("Drag upload failed", err)
        alert("Upload failed.")
      }
    }
  
    const el = document.querySelector(".ProseMirror")
    el?.addEventListener("drop", handleDrop as unknown as EventListener)
  
    return () => {
      el?.removeEventListener("drop", handleDrop as unknown as EventListener)
    }
  }, [editor])

  const handleImageUpload = () => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = "image/*"
    input.click()
  
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return
  
      const formData = new FormData()
      formData.append("file", file)
      formData.append("type", "blogposts")
  
      try {
        toast.loading("Uploading image...")
        const res = await axios.post("/api/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        })
        const url = res.data.url
        console.log("Uploaded image URL:", url);
        editor?.chain().focus().setImage({ src: url }).run()
        editor?.chain().focus().insertContent('<p><br></p><p><br></p><p><br></p><p><br></p><p><br></p>').run()
        editor?.chain().focus().run()
        console.log("setImage called in TipTapEditor")
        toast.success("Image added to your content")
      } catch (err) {
        console.error("Upload error:", err)
        toast.error("Failed to upload image")
      }
    }
  }

  
  if (!editor) {
    return null
  }

  return (
    <div className={`border rounded-md ${className}`}>
      <div className="flex flex-wrap gap-1 p-2 border-b bg-muted/20">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive("bold") ? "bg-green-100 text-green-700" : ""}
          type="button"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive("italic") ? "bg-green-100 text-green-700" : ""}
          type="button"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={editor.isActive("heading", { level: 1 }) ? "bg-green-100 text-green-700" : ""}
          type="button"
        >
          <Heading1 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={editor.isActive("heading", { level: 2 }) ? "bg-green-100 text-green-700" : ""}
          type="button"
        >
          <Heading2 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={editor.isActive("bulletList") ? "bg-green-100 text-green-700" : ""}
          type="button"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={editor.isActive("orderedList") ? "bg-green-100 text-green-700" : ""}
          type="button"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          type="button"
          onClick={handleImageUpload} 
        //   onClick={() => {
        //     const input = document.createElement("input")
        //     input.type = "file"
        //     input.accept = "image/*"
        //     input.click()
        
        //     input.onchange = async () => {
        //       const file = input.files?.[0]
        //       if (!file) return
        
        //       const formData = new FormData()
        //       formData.append("file", file)
        //       formData.append("type", "blogposts") // or "gallery", etc., depending on context
        
        //       try {
        //         const res = await axios.post("/api/upload", formData, {
        //             headers: { "Content-Type": "multipart/form-data" },
        //           })
        //           const url = res.data.url
        //           editor.chain().focus().setImage({ src: url }).run()
        //       } catch (err) {
        //         console.error("Upload error:", err)
        //         alert("An error occurred.")
        //       }
        //     }
        //   }}
        //   onClick={() => {
        //     const url = window.prompt("URL")
        //     if (url) {
        //       editor.chain().focus().setImage({ src: url }).run()
        //     }
        //   }}
        >
          <ImageIcon className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            const url = window.prompt("URL")
            if (url) {
              editor.chain().focus().setLink({ href: url }).run()
            }
          }}
          className={editor.isActive("link") ? "bg-green-100 text-green-700" : ""}
          type="button"
        >
          <LinkIcon className="h-4 w-4" />
        </Button>
        <LinkDialog
          open={linkOpen}
          onClose={() => setLinkOpen(false)}
          onConfirm={(url) => {
            editor?.chain().focus().setLink({ href: url }).run()
          }}
        />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          className={editor.isActive({ textAlign: "left" }) ? "bg-green-100 text-green-700" : ""}
          type="button"
        >
          <AlignLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          className={editor.isActive({ textAlign: "center" }) ? "bg-green-100 text-green-700" : ""}
          type="button"
        >
          <AlignCenter className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          className={editor.isActive({ textAlign: "right" }) ? "bg-green-100 text-green-700" : ""}
          type="button"
        >
          <AlignRight className="h-4 w-4" />
        </Button>
      </div>
      <EditorContent editor={editor}  className="p-4 min-h-[200px] prose prose-sm max-w-none cursor-text" />
      <style jsx global>{`
        .is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #adb5bd;
          pointer-events: none;
          height: 0;
        }
        .ProseMirror {
          min-height: 200px;
          outline: none;
        }
        .ProseMirror p.is-editor-empty:first-child::before {
          color: #adb5bd;
          content: attr(data-placeholder);
          float: left;
          height: 0;
          pointer-events: none;
        }
          /* 👇 New list styles */
        .ProseMirror ul {
          list-style-type: disc;
          padding-left: 1.25rem;
          margin-top: 0.5rem;
          margin-bottom: 0.5rem;
        }

        .ProseMirror ol {
          list-style-type: decimal;
          padding-left: 1.25rem;
          margin-top: 0.5rem;
          margin-bottom: 0.5rem;
        }

        .ProseMirror li {
          margin-bottom: 0.25rem;
        }
          /* Light green background for active selection */
        .ProseMirror ::selection {
          background: #d1fae5; /* Tailwind's green-100 */
        }
      `}</style>
    </div>
  )
}
