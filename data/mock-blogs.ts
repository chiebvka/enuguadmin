export interface Blog {
    id: string
    title: string
    excerpt: string
    coverImage: string | null
    publishedAt: string
    author: string
    status: "published" | "draft" | "archived"
    tags: string[]
    readTime: number
    views: number
  }
  
  export const blogs: Blog[] = [
    {
      id: "1",
      title: "Getting Started with Next.js and Tailwind CSS",
      excerpt: "Learn how to set up a new project with Next.js and Tailwind CSS for rapid development.",
      coverImage: "/placeholder.svg?key=iijy3",
      publishedAt: "2025-04-15T10:30:00Z",
      author: "John Doe",
      status: "published",
      tags: ["1", "5"],
      readTime: 5,
      views: 1250,
    },
    {
      id: "2",
      title: "The Future of Web Development: What to Expect in 2026",
      excerpt: "Explore the upcoming trends and technologies that will shape web development in the coming year.",
      coverImage: "/placeholder.svg?key=0jqa3",
      publishedAt: "2025-04-10T14:45:00Z",
      author: "Jane Smith",
      status: "published",
      tags: ["1", "4", "5"],
      readTime: 8,
      views: 3420,
    },
    {
      id: "3",
      title: "Optimizing Database Performance in Modern Applications",
      excerpt: "Practical tips and strategies for improving database performance in your applications.",
      coverImage: "/placeholder.svg?key=lqebu",
      publishedAt: "2025-04-05T09:15:00Z",
      author: "Robert Johnson",
      status: "published",
      tags: ["2", "5"],
      readTime: 12,
      views: 980,
    },
    {
      id: "4",
      title: "Building Accessible User Interfaces: Best Practices",
      excerpt: "Learn how to create inclusive web applications that everyone can use effectively.",
      coverImage: "/placeholder.svg?key=xzehg",
      publishedAt: "2025-03-28T16:20:00Z",
      author: "Sarah Williams",
      status: "published",
      tags: ["3", "7"],
      readTime: 7,
      views: 2150,
    },
    {
      id: "5",
      title: "Serverless Architecture: When and Why to Use It",
      excerpt: "Understand the benefits and limitations of serverless architecture for your next project.",
      coverImage: "/cloud-computing-concept.png",
      publishedAt: "2025-03-20T11:10:00Z",
      author: "Michael Brown",
      status: "published",
      tags: ["2", "4", "5"],
      readTime: 10,
      views: 1870,
    },
    {
      id: "6",
      title: "Mastering CSS Grid for Complex Layouts",
      excerpt: "Deep dive into CSS Grid and learn how to create sophisticated page layouts with ease.",
      coverImage: "/placeholder.svg?key=h6s8d",
      publishedAt: "2025-03-15T13:25:00Z",
      author: "Emily Chen",
      status: "published",
      tags: ["3", "7"],
      readTime: 9,
      views: 3560,
    },
    {
      id: "7",
      title: "Introduction to TypeScript for JavaScript Developers",
      excerpt: "A beginner-friendly guide to TypeScript for developers already familiar with JavaScript.",
      coverImage: "/placeholder.svg?height=400&width=600&query=typescript+code",
      publishedAt: "2025-03-08T08:50:00Z",
      author: "David Wilson",
      status: "published",
      tags: ["1", "5"],
      readTime: 6,
      views: 4210,
    },
    {
      id: "8",
      title: "Securing Your Web Applications: A Comprehensive Guide",
      excerpt: "Learn essential security practices to protect your web applications from common threats.",
      coverImage: "/placeholder.svg?height=400&width=600&query=cybersecurity+lock",
      publishedAt: "2025-03-01T15:40:00Z",
      author: "Alex Turner",
      status: "published",
      tags: ["2", "4"],
      readTime: 15,
      views: 2890,
    },
  ]
  
  // Sample tags - in a real app, these would come from your database
  export const availableTags = [
    { id: "1", name: "Technology" },
    { id: "2", name: "Design" },
    { id: "3", name: "Marketing" },
    { id: "4", name: "Business" },
    { id: "5", name: "Development" },
    { id: "6", name: "Product" },
    { id: "7", name: "UX" },
    { id: "8", name: "Research" },
  ]
  
  export function getTagNames(tagIds: string[]): string[] {
    return tagIds
      .map((id) => {
        const tag = availableTags.find((t) => t.id === id)
        return tag ? tag.name : ""
      })
      .filter(Boolean)
  }
  
  export function formatDate(dateString: string): string {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date)
  }
  