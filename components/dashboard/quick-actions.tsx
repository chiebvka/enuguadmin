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
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base font-medium">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-row gap-2">
          <Button className="flex items-center justify-center bg-[#006400] hover:bg-[#004d00]" asChild>
            <Link href="/protected/members/feed" >
              <UserPlus className="h-4 w-4 " />
              Approve Member
            </Link>
          </Button>
          <Button className="flex items-center justify-center bg-[#D4AF37] hover:bg-[#b8941f] text-black" asChild>
            <Link href="/protected/events">
              <Calendar className="h-4 w-4" />
              <span>Add Event</span>
            </Link>
          </Button>
          <Button className="flex items-center justify-center" asChild>
            <Link href="/protected/blogs/create">
              <PenSquare className="h-4 w-4" />
              <span>Add Blog</span>
            </Link>
          </Button>
          <Button className="flex items-center justify-center" asChild>
            <Link href="/protected/gallery/add">
              <ImageIcon className="h-4 w-4" />
              <span>Add Gallery</span>
            </Link>
          </Button>
        </CardContent>
      </Card>

  )
}