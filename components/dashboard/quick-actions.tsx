import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link"
import {
  Calendar,
  ImageIcon,
  PenSquare,
  UserPlus,
} from "lucide-react";

type Props = {}

export default function Quickactions({}: Props) {
  return (
      <Card className="col-span-1 mx-2 row-span-1">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4">
          <CardTitle className="text-base font-medium">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-row gap-2 flex-wrap pb-4">
          <Button size="sm" className="flex-grow sm:flex-grow-0 items-center justify-center bg-[#006400] hover:bg-[#004d00]" asChild>
            <Link href="/protected/members" className="flex items-center gap-1.5">
              <UserPlus className="h-4 w-4 " />
              <span>Manage Members</span>
            </Link>
          </Button>
          <Button size="sm" className="flex-grow sm:flex-grow-0 items-center justify-center bg-[#D4AF37] hover:bg-[#b8941f] text-black" asChild>
            <Link href="/protected/events" className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              <span>Add Event</span>
            </Link>
          </Button>
          <Button size="sm" className="flex-grow sm:flex-grow-0 items-center justify-center" asChild>
            <Link href="/protected/blogs/create" className="flex items-center gap-1.5">
              <PenSquare className="h-4 w-4" />
              <span>Add Blog</span>
            </Link>
          </Button>
          <Button size="sm" className="flex-grow sm:flex-grow-0 items-center justify-center" asChild>
            <Link href="/protected/gallery/add" className="flex items-center gap-1.5">
              <ImageIcon className="h-4 w-4" />
              <span>Add Gallery</span>
            </Link>
          </Button>
        </CardContent>
      </Card>

  )
}