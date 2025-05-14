import React from 'react'
import { Button } from "./ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "./ui/card"
import { Calendar } from 'lucide-react'
import Link from 'next/link'

type Props = {
  events: {
    id: string
    name: string
    event_date: string
    event_time: string | null
    venue: string | null
  }[]
}

export default function Upcomingevents({ events }: Props) {
  const hasEvents = events && events.length > 0;
  const eventsToShow = hasEvents ? events.slice(0, 4) : [];
  return (
    <>
      <Card>
        <CardHeader className="pb-3 pt-4">
          <CardTitle>Upcoming Events</CardTitle>
        </CardHeader>
        <CardContent className="pt-0 pb-3">
          {hasEvents ? (
            <div className="space-y-3">
              {eventsToShow.map(event => (
                <div key={event.id} className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#006400] text-white">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div className="flex-1 space-y-0.5">
                    <p className="text-sm font-medium leading-tight">{event.name}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-tight">
                      {new Date(event.event_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      {event.event_time ? ` • ${event.event_time}` : ''}
                      {event.venue ? ` • ${event.venue}` : ''}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Calendar className="h-10 w-10 mb-2" />
              <p>No upcoming events in the next 30 days.</p>
            </div>
          )}
        </CardContent>
        <CardFooter className="pt-3 pb-4">
          <Button variant="outline" className="w-full" asChild>
            <Link href="/protected/events">View All Events</Link>
          </Button>
        </CardFooter>
      </Card>
    </>
  )
}