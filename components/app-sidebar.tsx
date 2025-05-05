"use client"

import * as React from "react"
import {
  BookOpen,
  Frame,
  GalleryVerticalEnd,
  Image,
  Logs,
  Map,
  Newspaper,
  PieChart,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { TeamSwitcher } from "./team-switcher"
import { NavMain } from "./nav-main"
import { NavProjects } from "./nav-projects"
import { NavUser } from "./nav-user"

// This is sample data.
const data = {

  teams: [
    {
      name: "Ndi Enugu Scotland",
      logo: GalleryVerticalEnd,
      plan: "Enterprise",
    },
  ],
  navMain: [
    {
      title: "Membership",
      url: "/protected/members",
      icon: Logs,
      isActive: true,
      items: [
        {
          title: "All Members",
          url: "/protected/members",
        },
        {
          title: "Pending Members",
          url: "/protected/members/pending",
        },
        {
          title: "Denied Members",
          url: "/protected/members/denied",
        },
      ],
    },
    {
      title: "Blogs & News",
      url: "/protected/blogs",
      icon: Newspaper,
      items: [
        {
          title: "Blog Posts",
          url: "/protected/blogs",
        },
        {
          title: "Blog Tags",
          url: "/protected/blogs/tags",
        }
      ],
    },
    {
      title: "Events",
      url: "/protected/events",
      icon: BookOpen,
      items: [
        {
          title: "Upcoming Events",
          url: "/protected/events",
        },
      ],
    },
    {
      title: "Gallery",
      url: "/protected/gallery",
      icon: Image,
      items: [
        {
          title: "Add Media",
          url: "/protected/gallery/add",
        },
        {
          title: "Team",
          url: "#",
        },
        {
          title: "Billing",
          url: "#",
        },
      ],
    },
  ],
  projects: [
    {
      name: "Design Engineering",
      url: "#",
      icon: Frame,
    },
    {
      name: "Sales & Marketing",
      url: "#",
      icon: PieChart,
    },
    {
      name: "Travel",
      url: "#",
      icon: Map,
    },
  ],
}

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user: any; // You can replace 'any' with your Supabase User type if available
}

export function AppSidebar({ user, ...props }: AppSidebarProps) {
  // Create a user object that matches the NavUser component's expected format
  const userData = {
    name: user.user_metadata?.full_name || user.email?.split('@')[0] || "Admin",
    email: user.email,
    avatar: user.user_metadata?.avatar_url || "/avatars/shadcn.jpg"
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavProjects projects={data.projects} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
