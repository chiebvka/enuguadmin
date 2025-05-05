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
    <div>
             <Card className="col-span-1 row-span-1">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-base font-medium">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <Button className="flex h-24 flex-col items-center justify-center gap-1 bg-[#006400] hover:bg-[#004d00]" asChild>
                    <Link href="/protected/members">
                      <UserPlus className="h-8 w-8" />
                      <span>Add Member</span>
                    </Link>
                  </Button>
                  <Button className="flex h-24 flex-col items-center justify-center gap-1 bg-[#D4AF37] hover:bg-[#b8941f] text-black" asChild>
                    <Link href="/protected/events">
                      <Calendar className="h-8 w-8" />
                      <span>New Event</span>
                    </Link>
                  </Button>
                  <Button className="flex h-24 flex-col items-center justify-center gap-1" asChild>
                    <Link href="/protected/blogs">
                      <PenSquare className="h-8 w-8" />
                      <span>New Post</span>
                    </Link>
                  </Button>
                  <Button className="flex h-24 flex-col items-center justify-center gap-1" asChild>
                    <Link href="/protected/photos">
                      <ImageIcon className="h-8 w-8" />
                      <span>Add Photos</span>
                    </Link>
                  </Button>
                </CardContent>
              </Card>
    </div>
  )
}