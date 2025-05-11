"use client"

import {
  Folder,
  Forward,
  MoreHorizontal,
  Trash2,
  type LucideIcon,
} from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import Link from "next/link"

export function NavProjects({
  projects,
  userEmail,
}: {
  projects: {
    name: string
    url: string
    icon: LucideIcon
  }[]
  userEmail?: string // User's email address
}) {
  const { isMobile } = useSidebar()

  const getLinkDetails = (item: typeof projects[0]) => {
    let href = item.url;
    let isMailto = false;

    if (userEmail) {
      if (item.name === "Error Message?") {
        const to = "support@bexoni.com";
        const subject = "Error Report";
        const body = `Hi,\n\nThis is a notification for an error message.\n\nUser: ${userEmail}\nError Code/Message: \n\n[Please describe the error or paste the code here]`;
        href = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        isMailto = true;
      } else if (item.name === "Need Support?") {
        const to = "hello@bexoni.com";
        const subject = "Support Request";
        const body = `Hi,\n\nI'm requesting assistance with the following:\n\nUser: ${userEmail}\n\n[Please describe your support need here]`;
        href = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        isMailto = true;
      }
    }
    return { href, isMailto };
  };

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>Projects</SidebarGroupLabel>
      <SidebarMenu>
        {projects.map((item) => {
          const { href, isMailto } = getLinkDetails(item);
          return (
            <SidebarMenuItem key={item.name}>
              <SidebarMenuButton asChild>
                <a href={href} target={isMailto ? '_self' : undefined}>
                  <item.icon />
                  <span>{item.name}</span>
                </a>
              </SidebarMenuButton>
              {!isMailto && ( // Only show dropdown for non-mailto links
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <SidebarMenuAction showOnHover>
                      <MoreHorizontal />
                      <span className="sr-only">More</span>
                    </SidebarMenuAction>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    className="w-48 rounded-lg"
                    side={isMobile ? "bottom" : "right"}
                    align={isMobile ? "end" : "start"}
                  >
                    <DropdownMenuItem>
                      <Folder className="text-muted-foreground" />
                      <span>View Project</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Forward className="text-muted-foreground" />
                      <span>Share Project</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <Trash2 className="text-muted-foreground" />
                      <span>Delete Project</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </SidebarMenuItem>
          );
        })}
        <SidebarMenuItem>
          <SidebarMenuButton className="text-sidebar-foreground/70 mt-8">
              <Link href="https://bexoni.com" target="_blank">
                  <span className="text-bexoni">
                  Powered by Bexoni</span>
              </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  )
}
