import React from 'react';
import { Button } from "./ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Gift, PartyPopper } from 'lucide-react'; // Added PartyPopper
import Link from 'next/link';
import { Badge } from "@/components/ui/badge"; // Added Badge

type BirthdayMember = {
  id: number; // Membership ID is a number
  name: string;
  dob_day: string;
  dob_month: string;
  isBirthdayToday?: boolean; // Added flag
};

type Props = {
  birthdays: BirthdayMember[];
};

// Helper function to format birthday (e.g., "January 15")
const formatDisplayBirthday = (dayStr: string, monthStr: string): string => {
  if (!dayStr || !monthStr) return "N/A";
  const day = parseInt(dayStr, 10);
  let monthIndex = -1;

  const monthNum = parseInt(monthStr, 10);
  if (!isNaN(monthNum) && monthNum >= 1 && monthNum <= 12) {
    monthIndex = monthNum - 1; // 0-indexed for Date constructor
  } else {
    // Handle month names (full or short)
    const monthNames = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
    const shortMonthNames = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
    const lowerMonth = monthStr.toLowerCase();
    monthIndex = monthNames.indexOf(lowerMonth);
    if (monthIndex === -1) {
      monthIndex = shortMonthNames.indexOf(lowerMonth);
    }
  }

  if (isNaN(day) || monthIndex === -1) {
    return `${monthStr} ${dayStr}`; // Fallback to raw display
  }

  // Use a dummy year (e.g., 2000) as only month and day are displayed
  const date = new Date(2000, monthIndex, day);
  if (isNaN(date.getTime())) {
    return `${monthStr} ${dayStr}`; // Fallback if date is invalid
  }

  return date.toLocaleDateString(undefined, { month: 'long', day: 'numeric' });
};

export default function UpcomingBirthdays({ birthdays }: Props) {
  const hasBirthdays = birthdays && birthdays.length > 0;
  // Show up to 4 upcoming birthdays, similar to events
  const birthdaysToShow = hasBirthdays ? birthdays.slice(0, 4) : []; 

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upcoming Birthdays</CardTitle>
      </CardHeader>
      <CardContent>
        {hasBirthdays ? (
          <div className="space-y-4">
            {birthdaysToShow.map(member => (
              <div key={member.id} className="flex items-center gap-4">
                <div className={`flex h-12 w-12 items-center justify-center rounded-lg text-white ${member.isBirthdayToday ? 'bg-yellow-500' : 'bg-pink-500'}`}>
                  {member.isBirthdayToday ? <PartyPopper className="h-7 w-7" /> : <Gift className="h-6 w-6" />}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium leading-none">{member.name}</p>
                      {member.isBirthdayToday && (
                        <Badge variant="default" className="bg-green-500 text-white text-xs px-1.5 py-0.5">
                          Today!
                        </Badge>
                      )}
                    </div>
                    {member.isBirthdayToday && (
                      <Link href={`/protected/members/feed?birthdayName=${encodeURIComponent(member.name)}`} passHref>
                        <Button size="sm" variant="outline" className="text-xs h-7 px-2 py-1 border-green-600 text-green-600 hover:bg-green-50">
                          <PartyPopper className="h-3 w-3 mr-1" />
                          Post Greeting
                        </Button>
                      </Link>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formatDisplayBirthday(member.dob_day, member.dob_month)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <Gift className="h-10 w-10 mb-2" />
            <p>No upcoming birthdays in the next 30 days.</p>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button variant="outline" className="w-full" asChild>
          <Link href="/protected/members">View All Members</Link>
        </Button>
      </CardFooter>
    </Card>
  );
} 