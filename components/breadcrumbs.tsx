"use client"


import React from 'react';
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from './ui/breadcrumb';


type Props = {}

export default function Breadcrumbs({}: Props) {
    const pathname = usePathname()
    const segments = pathname.split("/").filter(Boolean)

    const transformLabel = (segment: string) => {
        if (segment === "protected") return "Dashboard"
        return segment
          .replace(/-/g, " ")
          .replace(/\b\w/g, (char) => char.toUpperCase())
      }
  
    if (segments.length === 0) return null // No breadcrumbs on root
  
    const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1)

  return (
    <Breadcrumb className='-mt-8'>
    <BreadcrumbList>
      {segments.map((segment, index) => {
        const isLast = index === segments.length - 1
        const href = "/" + segments.slice(0, index + 1).join("/")

        const label =
        index === 0 && segment === "protected"
          ? "Dashboard"
          : transformLabel(segment)

        return (
          <React.Fragment key={href}>
            <BreadcrumbItem>
              {isLast ? (
                <BreadcrumbPage>{label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link href={href}>{label}</Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
            {!isLast && <BreadcrumbSeparator />}
          </React.Fragment>
        )
      })}
    </BreadcrumbList>
  </Breadcrumb>
  )
}