"use client"

import { useState, useEffect, useMemo } from "react"
import {
  CalendarDays,
  Clock,
  MapPin,
  Plus,
  Search,
  Edit,
  Trash2,
  Calendar,
  ChevronRight,
  LayoutDashboard,
  ListChecks,
  Settings,
  Users,
  ChevronLeft,
  X,
  MapPinned,
  FileText,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
// Assuming these sidebar components are client-safe or handled elsewhere
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
// Assuming these drawer components are client-safe or handled elsewhere
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"

// Define event type
type Event = {
  id: number
  title: string
  date: Date
  startTime: string
  endTime: string
  venue: string
  summary: string
  content?: string
  status: "upcoming" | "past" | "draft" | "cancelled"
}

export default function RefinedEventsDashboard() {
  const [activeStep, setActiveStep] = useState(1)
  const [isCreatingEvent, setIsCreatingEvent] = useState(false)
  const [isEditingEvent, setIsEditingEvent] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(5)
  const [upcomingCurrentPage, setUpcomingCurrentPage] = useState(1)
  const [upcomingRowsPerPage, setUpcomingRowsPerPage] = useState(6)

  const totalSteps = 3

  const [upcomingFilter, setUpcomingFilter] = useState("all")
  const [pastFilter, setPastFilter] = useState("all")

  // State to hold the filtered and paginated events for display
  const [upcomingEventsToShow, setUpcomingEventsToShow] = useState<Event[]>([])
  const [pastEventsToShow, setPastEventsToShow] = useState<Event[]>([])
  const [upcomingTotalPages, setUpcomingTotalPages] = useState(1)
  const [pastTotalPages, setPastTotalPages] = useState(1)

  // Utility functions for date filtering
  // These will now be used within useEffect, ensuring client-side execution
  const isThisWeek = (date: Date) => {
    const now = new Date()
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - now.getDay()) // Start of week (Sunday)
    startOfWeek.setHours(0, 0, 0, 0)

    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 6) // End of week (Saturday)
    endOfWeek.setHours(23, 59, 59, 999)

    return date >= startOfWeek && date <= endOfWeek
  }

  const isThisMonth = (date: Date) => {
    const now = new Date()
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
  }

  const isNextMonth = (date: Date) => {
    const now = new Date()
    const nextMonth = new Date(now)
    nextMonth.setMonth(now.getMonth() + 1)
    return date.getMonth() === nextMonth.getMonth() && date.getFullYear() === nextMonth.getFullYear()
  }

  const isLastMonth = (date: Date) => {
    const now = new Date()
    const lastMonth = new Date(now)
    lastMonth.setMonth(now.getMonth() - 1)
    return date.getMonth() === lastMonth.getMonth() && date.getFullYear() === lastMonth.getFullYear()
  }

  // Sample events data (kept as is, but filtering/pagination moved to useEffect)
  const [events, setEvents] = useState<Event[]>([
    // Original events
    {
      id: 1,
      title: "Community Development Workshop",
      date: new Date(2025, 4, 28), // May 28, 2025
      startTime: "09:00",
      endTime: "16:00",
      venue: "Delta Hotel and Suites",
      summary: "A hands-on workshop focused on sustainable community development practices.",
      content:
        "Join us for a comprehensive workshop on sustainable community development. This event will cover project planning, resource allocation, community engagement strategies, and impact assessment.",
      status: "upcoming",
    },
    {
      id: 2,
      title: "Annual General Meeting",
      date: new Date(2025, 3, 15), // April 15, 2025
      startTime: "10:00",
      endTime: "14:00",
      venue: "Organization Headquarters",
      summary: "Annual meeting to review achievements and elect new board members.",
      content:
        "The Annual General Meeting will include a review of our organization's achievements over the past year, financial reports, and the election of new board members.",
      status: "past",
    },
    {
      id: 3,
      title: "Fundraising Gala",
      date: new Date(2025, 5, 10), // June 10, 2025
      startTime: "18:00",
      endTime: "22:00",
      venue: "Grand Ballroom, Hilton Hotel",
      summary: "Annual fundraising event with dinner, entertainment, and auction.",
      content:
        "Our annual Fundraising Gala is our premier event of the year. The evening will include a gourmet dinner, live entertainment, and both silent and live auctions.",
      status: "upcoming",
    },
    {
      id: 4,
      title: "Board Meeting Q2",
      date: new Date(2025, 5, 5), // June 5, 2025
      startTime: "14:00",
      endTime: "16:00",
      venue: "Conference Room A",
      summary: "Quarterly board meeting to discuss progress and future plans.",
      content:
        "This quarterly board meeting will focus on reviewing our Q2 performance, discussing ongoing projects, and planning for the next quarter.",
      status: "draft",
    },
    {
      id: 5,
      title: "Youth Leadership Program",
      date: new Date(2025, 2, 20), // March 20, 2025
      startTime: "09:00",
      endTime: "17:00",
      venue: "Community Center",
      summary: "A program designed to develop leadership skills in youth.",
      content:
        "The Youth Leadership Program aims to empower young people with essential leadership skills through workshops, team activities, and mentoring sessions.",
      status: "past",
    },
    {
      id: 6,
      title: "Cultural Festival",
      date: new Date(2025, 7, 15), // August 15, 2025
      startTime: "12:00",
      endTime: "22:00",
      venue: "City Park",
      summary: "Annual cultural festival celebrating diversity and heritage.",
      content:
        "Join us for a day of cultural celebration featuring traditional music, dance performances, food stalls, and art exhibitions from diverse communities.",
      status: "upcoming",
    },
    {
      id: 7,
      title: "Health and Wellness Fair",
      date: new Date(2025, 1, 10), // February 10, 2025
      startTime: "10:00",
      endTime: "16:00",
      venue: "Community Sports Center",
      summary: "A fair promoting health awareness and wellness practices.",
      content:
        "The Health and Wellness Fair will feature health screenings, fitness demonstrations, nutrition workshops, and information booths from local health providers.",
      status: "past",
    },
    {
      id: 8,
      title: "Environmental Cleanup Day",
      date: new Date(2025, 0, 25), // January 25, 2025
      startTime: "08:00",
      endTime: "13:00",
      venue: "Riverside Park",
      summary: "Community cleanup event to preserve local natural areas.",
      content:
        "Join fellow community members in cleaning up our beautiful Riverside Park. Equipment will be provided, and the event will conclude with a thank-you lunch for all volunteers.",
      status: "past",
    },
    // Generate 80 more past events
    ...Array.from({ length: 80 }, (_, i) => {
      const year = 2024
      const month = Math.floor(Math.random() * 12)
      const day = Math.floor(Math.random() * 28) + 1
      const eventTypes = [
        "Workshop",
        "Meeting",
        "Conference",
        "Seminar",
        "Training",
        "Fundraiser",
        "Community Event",
        "Volunteer Day",
        "Panel Discussion",
        "Networking Event",
      ]
      const venues = [
        "Community Center",
        "Town Hall",
        "Public Library",
        "Local School",
        "City Park",
        "Conference Center",
        "Hotel Ballroom",
        "University Campus",
        "Sports Complex",
        "Cultural Center",
      ]
      const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)]
      const venue = venues[Math.floor(Math.random() * venues.length)]

      return {
        id: 9 + i,
        title: `${eventType} - ${i + 1}`,
        date: new Date(year, month, day),
        startTime: `${Math.floor(Math.random() * 12) + 8}:00`,
        endTime: `${Math.floor(Math.random() * 12) + 13}:00`,
        venue: venue,
        summary: `Past ${eventType.toLowerCase()} focused on community development and engagement.`,
        content: `This ${eventType.toLowerCase()} brought together community members to discuss important issues and develop action plans. The event was well-attended and received positive feedback from participants.`,
        status: "past" as const,
      }
    }),
    // Generate 80 more past events for the previous year
    ...Array.from({ length: 80 }, (_, i) => {
      const year = 2023
      const month = Math.floor(Math.random() * 12)
      const day = Math.floor(Math.random() * 28) + 1
      const eventTypes = [
        "Workshop",
        "Meeting",
        "Conference",
        "Seminar",
        "Training",
        "Fundraiser",
        "Community Event",
        "Volunteer Day",
        "Panel Discussion",
        "Networking Event",
      ]
      const venues = [
        "Community Center",
        "Town Hall",
        "Public Library",
        "Local School",
        "City Park",
        "Conference Center",
        "Hotel Ballroom",
        "University Campus",
        "Sports Complex",
        "Cultural Center",
      ]
      const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)]
      const venue = venues[Math.floor(Math.random() * venues.length)]

      return {
        id: 89 + i,
        title: `${eventType} ${year} - ${i + 1}`,
        date: new Date(year, month, day),
        startTime: `${Math.floor(Math.random() * 12) + 8}:00`,
        endTime: `${Math.floor(Math.random() * 12) + 13}:00`,
        venue: venue,
        summary: `Past ${eventType.toLowerCase()} from ${year} focused on community development.`,
        content: `This ${eventType.toLowerCase()} from ${year} brought together community members to discuss important issues and develop action plans. The event was well-attended and received positive feedback from participants.`,
        status: "past" as const,
      }
    }),
    // Generate 80 upcoming events
    ...Array.from({ length: 80 }, (_, i) => {
      const year = 2025
      const month = Math.floor(Math.random() * 12)
      const day = Math.floor(Math.random() * 28) + 1
      const eventTypes = [
        "Workshop",
        "Meeting",
        "Conference",
        "Seminar",
        "Training",
        "Fundraiser",
        "Community Event",
        "Volunteer Day",
        "Panel Discussion",
        "Networking Event",
      ]
      const venues = [
        "Community Center",
        "Town Hall",
        "Public Library",
        "Local School",
        "City Park",
        "Conference Center",
        "Hotel Ballroom",
        "University Campus",
        "Sports Complex",
        "Cultural Center",
      ]
      const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)]
      const venue = venues[Math.floor(Math.random() * venues.length)]

      return {
        id: 169 + i,
        title: `Upcoming ${eventType} - ${i + 1}`,
        date: new Date(year, month, day),
        startTime: `${Math.floor(Math.random() * 12) + 8}:00`,
        endTime: `${Math.floor(Math.random() * 12) + 13}:00`,
        venue: venue,
        summary: `Upcoming ${eventType.toLowerCase()} focused on community development and engagement.`,
        content: `This upcoming ${eventType.toLowerCase()} will bring together community members to discuss important issues and develop action plans. We expect good attendance and look forward to productive discussions.`,
        status: "upcoming" as const,
      }
    }),
  ])

  // Effect to filter and paginate upcoming events client-side
  useEffect(() => {
    const filtered = events.filter((event) => {
      if (event.status !== "upcoming") return false

      switch (upcomingFilter) {
        case "this-week":
          return isThisWeek(event.date)
        case "this-month":
          return isThisMonth(event.date)
        case "next-month":
          return isNextMonth(event.date)
        default:
          return true // "all"
      }
    })

    setUpcomingTotalPages(Math.ceil(filtered.length / upcomingRowsPerPage))
    const startIndex = (upcomingCurrentPage - 1) * upcomingRowsPerPage
    const endIndex = startIndex + upcomingRowsPerPage
    setUpcomingEventsToShow(filtered.slice(startIndex, endIndex))
  }, [events, upcomingFilter, upcomingCurrentPage, upcomingRowsPerPage]) // Dependencies

  // Effect to filter and paginate past events client-side
  useEffect(() => {
    const filtered = events.filter((event) => {
      if (event.status !== "past") return false

      switch (pastFilter) {
        case "this-month":
          return isThisMonth(event.date)
        case "last-month":
          return isLastMonth(event.date)
        default:
          return true // "all"
      }
    })

    setPastTotalPages(Math.ceil(filtered.length / rowsPerPage))
    const startIndex = (currentPage - 1) * rowsPerPage
    const endIndex = startIndex + rowsPerPage
    setPastEventsToShow(filtered.slice(startIndex, endIndex))
  }, [events, pastFilter, currentPage, rowsPerPage]) // Dependencies


  const nextStep = () => {
    if (activeStep < totalSteps) {
      setActiveStep(activeStep + 1)
    }
  }

  const prevStep = () => {
    if (activeStep > 1) {
      setActiveStep(activeStep - 1)
    }
  }

  // Function to format date (can potentially cause minor hydration warnings depending on locale, but less likely to break structure)
  const formatDate = (date: Date) => {
    // Added a check to ensure this runs client-side or handle potential server differences
    if (typeof window === 'undefined') {
        // During SSR, return a simple representation or null
        return date.toISOString().split('T')[0];
    }
    return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
  }

  // Handle edit event
  const handleEditEvent = (event: Event) => {
    setSelectedEvent(event)
    setIsEditingEvent(true)
    setActiveStep(1)
  }

  // Handle view event details
  const handleViewEventDetails = (event: Event) => {
    setSelectedEvent(event)
    setIsDrawerOpen(true)
  }

  // Reset form when closing
  useEffect(() => {
    if (!isCreatingEvent && !isEditingEvent) {
      setActiveStep(1)
      setSelectedEvent(null)
    }
  }, [isCreatingEvent, isEditingEvent])

  return (
    <>
      {/* Wrap the content that causes hydration issues in a check */}
      {/* This assumes the sidebar components are not the primary source of hydration issues */}
      {/* If sidebar or main layout causes issues, they might need similar handling or different structures */}
        <div className="flex ">
        {/* Assuming sidebar is okay for initial render or handled separately */}
            <main className="flex-1 overflow-auto p-6">
            {isCreatingEvent || isEditingEvent ? (
                <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm border">
                <div className="p-6 border-b">
                    <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold">{isEditingEvent ? "Edit Event" : "Create New Event"}</h2>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                        setIsCreatingEvent(false)
                        setIsEditingEvent(false)
                        }}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                    </div>

                    {/* Step indicators */}
                    <div className="mt-8 mb-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center w-full">
                        <div
                            className={`flex items-center justify-center rounded-full w-10 h-10 ${
                            activeStep >= 1 ? "bg-green-600 text-white" : "bg-gray-200"
                            }`}
                        >
                            <CalendarDays className="h-5 w-5" />
                        </div>
                        <div className={`h-1 flex-1 mx-2 ${activeStep >= 2 ? "bg-green-600" : "bg-gray-200"}`}></div>

                        <div
                            className={`flex items-center justify-center rounded-full w-10 h-10 ${
                            activeStep >= 2 ? "bg-green-600 text-white" : "bg-gray-200"
                            }`}
                        >
                            <MapPinned className="h-5 w-5" />
                        </div>
                        <div className={`h-1 flex-1 mx-2 ${activeStep >= 3 ? "bg-green-600" : "bg-gray-200"}`}></div>

                        <div
                            className={`flex items-center justify-center rounded-full w-10 h-10 ${
                            activeStep >= 3 ? "bg-green-600 text-white" : "bg-gray-200"
                            }`}
                        >
                            <FileText className="h-5 w-5" />
                        </div>
                        </div>
                    </div>

                    <div className="flex justify-between mt-2 text-sm">
                        <div
                        className={`text-center w-20 ${activeStep >= 1 ? "text-green-600 font-medium" : "text-gray-500"}`}
                        >
                        Basic Info
                        </div>
                        <div
                        className={`text-center w-20 ${activeStep >= 2 ? "text-green-600 font-medium" : "text-gray-500"}`}
                        >
                        Location
                        </div>
                        <div
                        className={`text-center w-20 ${activeStep >= 3 ? "text-green-600 font-medium" : "text-gray-500"}`}
                        >
                        Details
                        </div>
                    </div>
                    </div>

                    <div className="p-6">
                    {activeStep === 1 && (
                        <div className="space-y-4">
                        <h3 className="text-lg font-medium">Basic Information</h3>
                        <div>
                            <Label htmlFor="event-name">Event Name</Label>
                            <Input
                            id="event-name"
                            placeholder="Enter event name"
                            defaultValue={selectedEvent?.title || ""}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                            <Label htmlFor="event-date">Event Date</Label>
                            <div className="relative">
                                <CalendarDays className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                id="event-date"
                                type="date"
                                className="pl-8"
                                // Convert Date to ISO string for defaultValue in input[type="date"]
                                defaultValue={selectedEvent?.date instanceof Date ? selectedEvent.date.toISOString().split("T")[0] : ""}
                                />
                            </div>
                            </div>

                            <div>
                            <Label htmlFor="event-type">Event Type</Label>
                            <Select defaultValue={selectedEvent?.status || "upcoming"}>
                                <SelectTrigger>
                                <SelectValue placeholder="Select event type" />
                                </SelectTrigger>
                                <SelectContent>
                                <SelectItem value="upcoming">Upcoming</SelectItem>
                                <SelectItem value="draft">Draft</SelectItem>
                                </SelectContent>
                            </Select>
                            </div>
                        </div>
                        </div>
                    )}

                    {activeStep === 2 && (
                        <div className="space-y-4">
                        <h3 className="text-lg font-medium">Location & Time</h3>
                        <div>
                            <Label htmlFor="venue">Venue</Label>
                            <div className="relative">
                            <MapPin className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="venue"
                                placeholder="Enter venue"
                                className="pl-8"
                                defaultValue={selectedEvent?.venue || ""}
                            />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                            <Label htmlFor="start-time">Start Time</Label>
                            <div className="relative">
                                <Clock className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                id="start-time"
                                type="time"
                                className="pl-8"
                                defaultValue={selectedEvent?.startTime || ""}
                                />
                            </div>
                            </div>

                            <div>
                            <Label htmlFor="end-time">End Time</Label>
                            <div className="relative">
                                <Clock className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                id="end-time"
                                type="time"
                                className="pl-8"
                                defaultValue={selectedEvent?.endTime || ""}
                                />
                            </div>
                            </div>
                        </div>
                        </div>
                    )}

                    {activeStep === 3 && (
                        <div className="space-y-4">
                        <h3 className="text-lg font-medium">Event Details</h3>
                        <div>
                            <Label htmlFor="summary">Summary</Label>
                            <Textarea
                            id="summary"
                            placeholder="Brief description of the event"
                            rows={2}
                            defaultValue={selectedEvent?.summary || ""}
                            />
                        </div>

                        <div>
                            <Label htmlFor="content">Content</Label>
                            <Textarea
                            id="content"
                            placeholder="Detailed information about the event"
                            rows={6}
                            defaultValue={selectedEvent?.content || ""}
                            />
                        </div>
                        </div>
                    )}
                    </div>

                    <div className="p-6 border-t flex justify-between">
                    <Button
                        variant="outline"
                        onClick={
                        activeStep === 1
                            ? () => {
                                setIsCreatingEvent(false)
                                setIsEditingEvent(false)
                            }
                            : prevStep
                        }
                    >
                        {activeStep === 1 ? (
                        "Cancel"
                        ) : (
                        <>
                            <ChevronLeft className="mr-2 h-4 w-4" /> Back
                        </>
                        )}
                    </Button>

                    <Button
                        className="bg-green-600 hover:bg-green-700"
                        onClick={
                        activeStep === totalSteps
                            ? () => {
                                setIsCreatingEvent(false)
                                setIsEditingEvent(false)
                                setActiveStep(1)
                            }
                            : nextStep
                        }
                    >
                        {activeStep === totalSteps ? (
                        isEditingEvent ? (
                            "Update Event"
                        ) : (
                            "Create Event"
                        )
                        ) : (
                        <>
                            Next <ChevronRight className="ml-2 h-4 w-4" />
                        </>
                        )}
                    </Button>
                    </div>
                </div>
                </div>
            ) : (
                <>
                {/* Upcoming Events Section */}
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold">Upcoming Events</h2>
                    <Select
                    defaultValue="all"
                    value={upcomingFilter}
                    onValueChange={(value) => {
                        setUpcomingFilter(value)
                        setUpcomingCurrentPage(1) // Reset to first page when filter changes
                    }}
                    >
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Events</SelectItem>
                        <SelectItem value="this-week">This Week</SelectItem>
                        <SelectItem value="this-month">This Month</SelectItem>
                        <SelectItem value="next-month">Next Month</SelectItem>
                    </SelectContent>
                    </Select>
                </div>

                {/* Upcoming Events Grid - Now uses state updated in useEffect */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {upcomingEventsToShow.length > 0 ? (
                    upcomingEventsToShow.map((event) => (
                        <Card key={event.id} className="overflow-hidden">
                        <div className="h-3 bg-green-600" />
                        <CardHeader className="pb-2">
                            <div className="flex justify-between">
                            <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Upcoming</Badge>
                            <div className="flex gap-1">
                                <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleEditEvent(event)}
                                >
                                <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                            </div>
                            <CardTitle className="mt-2">{event.title}</CardTitle>
                            <CardDescription className="flex items-center mt-1">
                            <CalendarDays className="mr-1 h-4 w-4" />
                            {/* Use formatDate, which now handles potential server-side differences */}
                            {formatDate(event.date)}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                            <div className="flex items-center">
                                <Clock className="mr-2 h-4 w-4 shrink-0" />
                                <span>
                                {event.startTime} - {event.endTime}
                                </span>
                            </div>
                            <div className="flex items-center">
                                <MapPin className="mr-2 h-4 w-4 shrink-0" />
                                <span>{event.venue}</span>
                            </div>
                            </div>
                            <p className="mt-3 text-sm line-clamp-2">{event.summary}</p>
                        </CardContent>
                        <CardFooter className="pt-0 flex justify-between">
                            {/* Created on date could also benefit from a client-side check if it's dynamic */}
                            <div className="text-xs text-muted-foreground">Created on May 1, 2025</div>
                            <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1"
                            onClick={() => handleViewEventDetails(event)}
                            >
                            View <ChevronRight className="h-3 w-3" />
                            </Button>
                        </CardFooter>
                        </Card>
                    ))
                    ) : (
                    <div className="col-span-2 py-12 text-center text-muted-foreground">
                        No upcoming events found for the selected filter.
                    </div>
                    )}
                </div>

                {/* Upcoming Events Pagination - Use upcomingTotalPages state */}
                <div className="mt-6 mb-8 rounded-lg shadow-sm p-4 border flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Rows per page:</span>
                    <Select
                        value={upcomingRowsPerPage.toString()}
                        onValueChange={(value) => {
                        setUpcomingRowsPerPage(Number.parseInt(value))
                        setUpcomingCurrentPage(1)
                        }}
                    >
                        <SelectTrigger className="w-[70px] h-8">
                        <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                        <SelectItem value="6">6</SelectItem>
                        <SelectItem value="12">12</SelectItem>
                        <SelectItem value="24">24</SelectItem>
                        <SelectItem value="48">48</SelectItem>
                        </SelectContent>
                    </Select>
                    <span className="text-sm text-muted-foreground">
                        {/* Displaying range based on upcomingEventsToShow and total filtered count */}
                        {upcomingEventsToShow.length > 0
                        ? `${(upcomingCurrentPage - 1) * upcomingRowsPerPage + 1}-${Math.min(
                            upcomingCurrentPage * upcomingRowsPerPage,
                            // Need the total count of filtered events *before* pagination for this
                            // A small adjustment needed here or calculate total filtered count in effect
                                events.filter((event) => {
                                if (event.status !== "upcoming") return false;
                                switch (upcomingFilter) {
                                    case "this-week": return isThisWeek(event.date);
                                    case "this-month": return isThisMonth(event.date);
                                    case "next-month": return isNextMonth(event.date);
                                    default: return true;
                                }
                                }).length
                            )} of ${
                                events.filter((event) => {
                                if (event.status !== "upcoming") return false;
                                switch (upcomingFilter) {
                                    case "this-week": return isThisWeek(event.date);
                                    case "this-month": return isThisMonth(event.date);
                                    case "next-month": return isNextMonth(event.date);
                                    default: return true;
                                }
                                }).length
                            }`
                        : "0-0 of 0"}
                    </span>
                    </div>

                    <div className="flex items-center">
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 p-0"
                        onClick={() => setUpcomingCurrentPage(1)}
                        disabled={upcomingCurrentPage === 1 || upcomingEventsToShow.length === 0}
                    >
                        <span className="sr-only">Go to first page</span>
                        <ChevronLeft className="h-4 w-4" />
                        <ChevronLeft className="h-4 w-4 -ml-2" />
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 p-0 ml-2"
                        onClick={() => setUpcomingCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={upcomingCurrentPage === 1 || upcomingEventsToShow.length === 0}
                    >
                        <span className="sr-only">Go to previous page</span>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="mx-2 text-sm font-medium">
                        {upcomingTotalPages > 0 ? `${upcomingCurrentPage} of ${upcomingTotalPages}` : '0 of 0'}
                    </span>
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 p-0 mr-2"
                        onClick={() => setUpcomingCurrentPage((p) => Math.min(upcomingTotalPages, p + 1))}
                        disabled={upcomingCurrentPage === upcomingTotalPages || upcomingEventsToShow.length === 0}
                    >
                        <span className="sr-only">Go to next page</span>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 p-0"
                        onClick={() => setUpcomingCurrentPage(upcomingTotalPages)}
                        disabled={upcomingCurrentPage === upcomingTotalPages || upcomingEventsToShow.length === 0}
                    >
                        <span className="sr-only">Go to last page</span>
                        <ChevronRight className="h-4 w-4" />
                        <ChevronRight className="h-4 w-4 -ml-2" />
                    </Button>
                    </div>
                </div>

                <Separator className="my-8" />

                {/* Past Events Section */}
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold">Past Events</h2>
                    <Select
                    defaultValue="all"
                    value={pastFilter}
                    onValueChange={(value) => {
                        setPastFilter(value)
                        setCurrentPage(1) // Reset to first page when filter changes
                    }}
                    >
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Events</SelectItem>
                        <SelectItem value="this-month">This Month</SelectItem>
                        <SelectItem value="last-month">Last Month</SelectItem>
                    </SelectContent>
                    </Select>
                </div>

                {/* Past Events Table - Mobile-friendly and compact version */}
                <Card>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            {/* Hide less important columns on mobile */}
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Event
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden md:table-cell">
                              Date
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden lg:table-cell">
                              Time
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden lg:table-cell">
                              Venue
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                              <span className="sr-only">Actions</span>
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {pastEventsToShow.length > 0 ? (
                            pastEventsToShow.map((event) => (
                              <tr key={event.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3">
                                  <div className="text-sm font-medium text-gray-900">{event.title}</div>
                                  {/* Show date on mobile only */}
                                  <div className="text-xs text-gray-500 md:hidden">
                                    {formatDate(event.date)}
                                  </div>
                                  <div className="text-xs text-gray-500 line-clamp-1 max-w-[200px]">
                                    {event.summary}
                                  </div>
                                </td>
                                {/* Hide these columns on mobile */}
                                <td className="px-4 py-3 whitespace-nowrap hidden md:table-cell">
                                  <div className="text-sm text-gray-900">{formatDate(event.date)}</div>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap hidden lg:table-cell">
                                  <div className="text-sm text-gray-900">
                                    {event.startTime} - {event.endTime}
                                  </div>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 hidden lg:table-cell">
                                  {event.venue}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-right">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-enugu hover:text-indigo-900"
                                    onClick={() => handleViewEventDetails(event)}
                                  >
                                    Details
                                  </Button>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                                No past events found for the selected filter.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>

                {/* Past Events Pagination - Use pastTotalPages state */}
                <div className="mt-6 rounded-lg shadow-sm p-4 border flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Rows per page:</span>
                    <Select
                        value={rowsPerPage.toString()}
                        onValueChange={(value) => {
                        setRowsPerPage(Number.parseInt(value))
                        setCurrentPage(1)
                        }}
                    >
                        <SelectTrigger className="w-[70px] h-8">
                        <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                        <SelectItem value="5">5</SelectItem>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="20">20</SelectItem>
                        </SelectContent>
                    </Select>
                        <span className="text-sm text-muted-foreground">
                        {/* Displaying range based on pastEventsToShow and total filtered count */}
                        {pastEventsToShow.length > 0
                        ? `${(currentPage - 1) * rowsPerPage + 1}-${Math.min(
                            currentPage * rowsPerPage,
                            // Need the total count of filtered events *before* pagination for this
                            // A small adjustment needed here or calculate total filtered count in effect
                                events.filter((event) => {
                                if (event.status !== "past") return false;
                                switch (pastFilter) {
                                    case "this-month": return isThisMonth(event.date);
                                    case "last-month": return isLastMonth(event.date);
                                    default: return true;
                                }
                                }).length
                            )} of ${
                                events.filter((event) => {
                                if (event.status !== "past") return false;
                                switch (pastFilter) {
                                    case "this-month": return isThisMonth(event.date);
                                    case "last-month": return isLastMonth(event.date);
                                    default: return true;
                                }
                                }).length
                            }`
                        : "0-0 of 0"}
                    </span>
                    </div>

                    <div className="flex items-center">
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 p-0"
                        onClick={() => setCurrentPage(1)}
                        disabled={currentPage === 1 || pastEventsToShow.length === 0}
                    >
                        <span className="sr-only">Go to first page</span>
                        <ChevronLeft className="h-4 w-4" />
                        <ChevronLeft className="h-4 w-4 -ml-2" />
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 p-0 ml-2"
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1 || pastEventsToShow.length === 0}
                    >
                        <span className="sr-only">Go to previous page</span>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="mx-2 text-sm font-medium">
                        {pastTotalPages > 0 ? `${currentPage} of ${pastTotalPages}` : '0 of 0'}
                    </span>
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 p-0 mr-2"
                        onClick={() => setCurrentPage((p) => Math.min(pastTotalPages, p + 1))}
                        disabled={currentPage === pastTotalPages || pastEventsToShow.length === 0}
                    >
                        <span className="sr-only">Go to next page</span>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 p-0"
                        onClick={() => setCurrentPage(pastTotalPages)}
                        disabled={currentPage === pastTotalPages || pastEventsToShow.length === 0}
                    >
                        <span className="sr-only">Go to last page</span>
                        <ChevronRight className="h-4 w-4" />
                        <ChevronRight className="h-4 w-4 -ml-2" />
                    </Button>
                    </div>
                </div>
                </>
            )}
            </main>
        </div>

        {/* Event Details Drawer */}
        <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
          <DrawerContent>
            <DrawerHeader className="pb-0">
              <DrawerTitle>{selectedEvent?.title}</DrawerTitle>
              <DrawerDescription className="flex items-center">
                <CalendarDays className="mr-1 h-4 w-4" />
                {selectedEvent ? formatDate(selectedEvent.date) : ""}
              </DrawerDescription>
              <div className="flex items-center text-muted-foreground text-sm">
                <Clock className="mr-1 h-4 w-4" />
                {selectedEvent ? `${selectedEvent.startTime} - ${selectedEvent.endTime}` : ""}
              </div>
              <div className="flex items-center text-muted-foreground text-sm">
                <MapPin className="mr-1 h-4 w-4" />
                {selectedEvent?.venue}
              </div>
            </DrawerHeader>
            <div className="p-4 overflow-y-auto">
              <h3 className="text-lg font-semibold mb-2">Summary</h3>
              <p className="text-sm text-muted-foreground mb-4">{selectedEvent?.summary}</p>
              <h3 className="text-lg font-semibold mb-2">Details</h3>
              <div className="text-sm text-muted-foreground prose">{selectedEvent?.content}</div>
            </div>
            <DrawerFooter>
              <DrawerClose asChild>
                <Button variant="outline">Close</Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
    </>
  )
}