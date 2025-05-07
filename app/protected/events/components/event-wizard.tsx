"use client"

import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
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
  Loader2,
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
import axios from 'axios'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog"
import { Pagination } from "@/components/pagination"; // Import the reusable Pagination component
import { getCachedEvents, invalidateEventsCache, CachedEvent } from '@/lib/eventDataCache'; // Import cache functions

// Define event type - rename or ensure compatibility with CachedEvent
// type Event = { ... } // Can be replaced by CachedEvent if identical
// For this implementation, we'll use CachedEvent as the primary type for `events` state

export default function RefinedEventsDashboard({ initialEvents = [] }: { initialEvents: CachedEvent[] }) {
  const [activeStep, setActiveStep] = useState(1)
  const [isCreatingEvent, setIsCreatingEvent] = useState(false)
  const [isEditingEvent, setIsEditingEvent] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<CachedEvent | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(5)
  const [upcomingCurrentPage, setUpcomingCurrentPage] = useState(1)
  const [upcomingRowsPerPage, setUpcomingRowsPerPage] = useState(6)

  const totalSteps = 3

  const [upcomingFilter, setUpcomingFilter] = useState("all")
  const [pastFilter, setPastFilter] = useState("all")

  // State to hold the filtered and paginated events for display
  const [upcomingEventsToShow, setUpcomingEventsToShow] = useState<CachedEvent[]>([])
  const [pastEventsToShow, setPastEventsToShow] = useState<CachedEvent[]>([])
  const [upcomingTotalPages, setUpcomingTotalPages] = useState(1)
  const [pastTotalPages, setPastTotalPages] = useState(1)

  const [events, setEvents] = useState<CachedEvent[]>(initialEvents) // Initialize with server-fetched data

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<CachedEvent | null>(null); // Use CachedEvent
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmittingForm, setIsSubmittingForm] = useState(false); // New state for form submission

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

  // Calculate total filtered upcoming events count for display purposes
  const totalFilteredUpcomingEvents = useMemo(() => {
    return events.filter((event) => {
        if (event.status !== "upcoming") return false;
        switch (upcomingFilter) {
            case "this-week": return isThisWeek(new Date(event.event_date));
            case "this-month": return isThisMonth(new Date(event.event_date));
            case "next-month": return isNextMonth(new Date(event.event_date));
            default: return true;
        }
    }).length;
  }, [events, upcomingFilter]); // Removed isThisWeek, isThisMonth, isNextMonth from deps as they are stable

    // Calculate total filtered past events count for display purposes
    const totalFilteredPastEvents = useMemo(() => {
        return events.filter((event) => {
            if (event.status !== "past") return false;
            switch (pastFilter) {
                case "this-month": return isThisMonth(new Date(event.event_date));
                case "last-month": return isLastMonth(new Date(event.event_date));
                default: return true;
            }
        }).length;
    }, [events, pastFilter]); // Removed isThisMonth, isLastMonth from deps

  // Effect to filter and paginate upcoming events client-side
  useEffect(() => {
    // This effect depends on the `events` state, which is now managed by the cache logic
    const filtered = events.filter((event) => {
      if (event.status !== "upcoming") return false

      switch (upcomingFilter) {
        case "this-week":
          return isThisWeek(new Date(event.event_date))
        case "this-month":
          return isThisMonth(new Date(event.event_date))
        case "next-month":
          return isNextMonth(new Date(event.event_date))
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
          return isThisMonth(new Date(event.event_date))
        case "last-month":
          return isLastMonth(new Date(event.event_date))
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
  const handleEditEvent = (event: CachedEvent) => {
    setSelectedEvent(event)
    setIsEditingEvent(true)
    setActiveStep(1)
  }

  // Handle view event details
  const handleViewEventDetails = (event: CachedEvent) => {
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

  // Fetch events (for refresh after CRUD or if cache is stale on component mount)
  const fetchEventsAndRefreshState = async (forceRefresh: boolean = false) => {
    // Consider adding a loading state for this specific refresh if needed
    const data = await getCachedEvents(forceRefresh);
    setEvents(data);
  };

  // Initial fetch or use cache when component mounts, supplementing initialEvents
  useEffect(() => {
    // If initialEvents are provided (first SSR load), they are already in `events` state.
    // This effect can be used to re-validate or fetch if navigating back to the page.
    // For simplicity, we assume initialEvents are fresh enough for the first render.
    // Subsequent navigations or actions will trigger cache invalidation and refetch.
    // Or, you could always fetch here and `getCachedEvents` will decide if API call is needed.
    const loadEvents = async () => {
        const cached = await getCachedEvents(); // Will use cache if valid
        if (cached.length > 0 || initialEvents.length === 0) { // Prioritize fresh/cached data if available or if no SSR data
            setEvents(cached);
        }
    };
    loadEvents();
  }, []); // Runs once on mount to ensure client-side cache logic is engaged

  const [formData, setFormData] = useState<CachedEvent>({ // Use CachedEvent
    id: "",
    name: "",
    event_date: "",
    start_time: "",
    end_time: "",
    venue: "",
    type: "",
    summary: "",
    content: "",
    status: "upcoming",
  })

  // Populate formData when editing
  useEffect(() => {
    if (isEditingEvent && selectedEvent) {
      setFormData({
        id: selectedEvent.id,
        name: selectedEvent.name,
        event_date: selectedEvent.event_date,
        start_time: selectedEvent.start_time,
        end_time: selectedEvent.end_time,
        venue: selectedEvent.venue,
        type: selectedEvent.type,
        summary: selectedEvent.summary,
        content: selectedEvent.content || "",
        status: selectedEvent.status,
      })
    }
  }, [isEditingEvent, selectedEvent])

  const resetFormData = () => setFormData({
    id: "",
    name: "",
    event_date: "",
    start_time: "",
    end_time: "",
    venue: "",
    type: "",
    summary: "",
    content: "",
    status: "upcoming",
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleCreateEvent = async (formDataPayload: Omit<CachedEvent, 'id'>) => { // Adjust type for payload
    setIsSubmittingForm(true);
    try {
        console.log("Creating event with data:", formDataPayload); 
        await axios.post('/api/events', formDataPayload);
        invalidateEventsCache(); // Invalidate cache
        await fetchEventsAndRefreshState(true); // Force refresh state from (now fresh) cache/API
        toast.success("Event created successfully!");
        setIsCreatingEvent(false);
        resetFormData();
    } catch (err) {
        console.error("Create event error:", err);
      toast.error("Failed to create event.")
    } finally {
        setIsSubmittingForm(false); // Stop loading
    }
  }

  const handleUpdateEvent = async (formDataPayload: CachedEvent) => { // formDataPayload is a full Event object
    setIsSubmittingForm(true);
    try {
      await axios.put('/api/events', formDataPayload); // Assuming API expects full event object with ID for update
      invalidateEventsCache(); // Invalidate cache
      await fetchEventsAndRefreshState(true); // Force refresh state from (now fresh) cache/API
      toast.success("Event updated successfully!");
      setIsEditingEvent(false);
      resetFormData();
    } catch {
      toast.error("Failed to update event.")
    } finally {
        setIsSubmittingForm(false); // Stop loading
    }
  }


  return (
    <>
      {/* Wrap the content that causes hydration issues in a check */}
      {/* This assumes the sidebar components are not the primary source of hydration issues */}
      {/* If sidebar or main layout causes issues, they might need similar handling or different structures */}
        <div className="flex-1 flex flex-col overflow-hidden ">
        <header className="border-b bg-white p-4 flex items-center justify-end">
            <div className="flex items-center gap-2">

              <Button onClick={() => setIsCreatingEvent(true)} className="bg-green-600 hover:bg-green-700">
                <Plus className="mr-2 h-4 w-4" /> Create Event
              </Button>
            </div>
          </header>
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
                        disabled={isSubmittingForm} // Disable when submitting
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
                            value={formData.name}
                            onChange={e => handleInputChange("name", e.target.value)}
                            disabled={isSubmittingForm} // Disable when submitting
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
                                value={formData.event_date}
                                onChange={e => handleInputChange("event_date", e.target.value)}
                                disabled={isSubmittingForm} // Disable when submitting
                                />
                            </div>
                            </div>

                            <div>
                            <Label htmlFor="event-type">Event Type</Label>
                            <Select
                                value={formData.type}
                                onValueChange={value => handleInputChange("type", value)}
                                disabled={isSubmittingForm} // Disable when submitting
                            >
                                <SelectTrigger>
                                <SelectValue placeholder="Select event type" />
                                </SelectTrigger>
                                <SelectContent>
                                <SelectItem value="physical">In Person</SelectItem>
                                <SelectItem value="online">Online</SelectItem>
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
                                value={formData.venue}
                                onChange={e => handleInputChange("venue", e.target.value)}
                                disabled={isSubmittingForm} // Disable when submitting
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
                                value={formData.start_time}
                                onChange={e => handleInputChange("start_time", e.target.value)}
                                disabled={isSubmittingForm} // Disable when submitting
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
                                value={formData.end_time}
                                onChange={e => handleInputChange("end_time", e.target.value)}
                                disabled={isSubmittingForm} // Disable when submitting
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
                            value={formData.summary}
                            onChange={e => handleInputChange("summary", e.target.value)}
                            disabled={isSubmittingForm} // Disable when submitting
                            />
                        </div>

                        <div>
                            <Label htmlFor="content">Content</Label>
                            <Textarea
                            id="content"
                            placeholder="Detailed information about the event"
                            rows={6}
                            value={formData.content}
                            onChange={e => handleInputChange("content", e.target.value)}
                            disabled={isSubmittingForm} // Disable when submitting
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
                        disabled={isSubmittingForm} // Disable when submitting
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
                        className="bg-green-600 hover:bg-green-700 min-w-[120px]" // Added min-width for consistency
                        onClick={
                            activeStep === totalSteps
                              ? () => {
                                  if (isEditingEvent) {
                                    handleUpdateEvent(formData)
                                  } else {
                                    handleCreateEvent(formData)
                                  }
                                }
                              : nextStep
                          }
                        disabled={isSubmittingForm} // Disable when submitting
                    >
                        {isSubmittingForm ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : activeStep === totalSteps ? (
                            isEditingEvent ? "Update Event" : "Create Event"
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
                                <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                    setEventToDelete(event);
                                    setDeleteDialogOpen(true);
                                }}
                                >
                                <Trash2 className="h-4 w-4 text-red-600" />
                                </Button>
                            </div>
                            </div>
                            <CardTitle className="mt-2">{event.name}</CardTitle>
                            <CardDescription className="flex items-center mt-1">
                            <CalendarDays className="mr-1 h-4 w-4" />
                            {/* Use formatDate, which now handles potential server-side differences */}
                            {formatDate(new Date(event.event_date))}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                            <div className="flex items-center">
                                <Clock className="mr-2 h-4 w-4 shrink-0" />
                                <span>
                                {event.start_time} - {event.end_time}
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
                    <div className="col-span-2 py-12 flex flex-col items-center justify-center">
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 bg-gray-50 w-full max-w-md text-center">
                            <h3 className="text-lg font-semibold text-gray-500 mb-2">No Upcoming Events</h3>
                            <p className="text-gray-400">There are currently no upcoming events. Click "Create Event" to add one.</p>
                        </div>
                    </div>
                    )}
                </div>

                {/* Upcoming Events Pagination - Use reusable Pagination component */}
                {upcomingEventsToShow.length > 0 && (
                    <div className="mt-6 mb-8 rounded-lg shadow-sm p-4 border flex flex-col sm:flex-row justify-between items-center gap-4 bg-green-50 border-green-200">
                        <div className="flex items-center gap-2 text-sm text-green-700">
                            <span>
                                Displaying {((upcomingCurrentPage - 1) * upcomingRowsPerPage) + 1}-
                                {Math.min(upcomingCurrentPage * upcomingRowsPerPage, totalFilteredUpcomingEvents)} of {totalFilteredUpcomingEvents}
                            </span>
                        </div>
                        <Pagination
                            currentPage={upcomingCurrentPage}
                            totalPages={upcomingTotalPages}
                            pageSize={upcomingRowsPerPage}
                            onPageChange={setUpcomingCurrentPage}
                            onPageSizeChange={(size) => {
                                setUpcomingRowsPerPage(size);
                                setUpcomingCurrentPage(1);
                            }}
                        />
                    </div>
                )}

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
                        <thead className="bg-enugu/20">
                          <tr>
                            {/* Hide less important columns on mobile */}
                            <th className="px-4 py-3 text-left text-xs font-medium text-enugu uppercase">
                              Event
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-enugu uppercase hidden md:table-cell">
                              Date
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-enugu uppercase hidden lg:table-cell">
                              Time
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-enugu uppercase hidden lg:table-cell">
                              Venue
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-enugu uppercase">
                              <span className="sr-only">Actions</span>
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {pastEventsToShow.length > 0 ? (
                            pastEventsToShow.map((event) => (
                              <tr key={event.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3">
                                  <div className="text-sm font-medium text-gray-900">{event.name}</div>
                                  {/* Show date on mobile only */}
                                  <div className="text-xs text-gray-500 md:hidden">
                                    {formatDate(new Date(event.event_date))}
                                  </div>
                                  <div className="text-xs text-gray-500 line-clamp-1 max-w-[200px]">
                                    {event.summary}
                                  </div>
                                </td>
                                {/* Hide these columns on mobile */}
                                <td className="px-4 py-3 whitespace-nowrap hidden md:table-cell">
                                  <div className="text-sm text-gray-900">{formatDate(new Date(event.event_date))}</div>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap hidden lg:table-cell">
                                  <div className="text-sm text-gray-900">
                                    {event.start_time} - {event.end_time}
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
                              <td colSpan={5}>
                                <div className="py-12 flex flex-col items-center justify-center">
                                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 bg-gray-50 w-full max-w-md text-center">
                                    <h3 className="text-lg font-semibold text-gray-500 mb-2">No Past Events</h3>
                                    <p className="text-gray-400">There are currently no past events.</p>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>

                {/* Past Events Pagination - Use reusable Pagination component */}
                {pastEventsToShow.length > 0 && (
                     <div className="mt-6 rounded-lg shadow-sm p-4 border flex flex-col sm:flex-row justify-between items-center gap-4 bg-green-50 border-green-200">
                        <div className="flex items-center gap-2 text-sm text-green-700">
                            <span>
                                Displaying {((currentPage - 1) * rowsPerPage) + 1}-
                                {Math.min(currentPage * rowsPerPage, totalFilteredPastEvents)} of {totalFilteredPastEvents}
                            </span>
                        </div>
                        <Pagination
                            currentPage={currentPage}
                            totalPages={pastTotalPages}
                            pageSize={rowsPerPage}
                            onPageChange={setCurrentPage}
                            onPageSizeChange={(size) => {
                                setRowsPerPage(size);
                                setCurrentPage(1);
                            }}
                        />
                    </div>
                )}
                </>
            )}
            </main>
        </div>

        {/* Event Details Drawer */}
        <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
          <DrawerContent>
            <DrawerHeader className="pb-0">
              <div className="flex justify-between items-start">
                <div>
                  <DrawerTitle>{selectedEvent?.name}</DrawerTitle>
                  <DrawerDescription className="flex items-center mt-1">
                    <CalendarDays className="mr-1 h-4 w-4" />
                    {selectedEvent ? formatDate(new Date(selectedEvent.event_date)) : ""}
                  </DrawerDescription>
                </div>
                {selectedEvent && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-red-600 hover:bg-red-100"
                    onClick={() => {
                      setEventToDelete(selectedEvent);
                      setDeleteDialogOpen(true);
                    }}
                    title="Delete Event"
                  >
                    <Trash2 className="h-5 w-5" />
                  </Button>
                )}
              </div>
              <div className="flex items-center text-muted-foreground text-sm mt-2">
                <Clock className="mr-1 h-4 w-4" />
                {selectedEvent ? `${selectedEvent.start_time} - ${selectedEvent.end_time}` : ""}
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

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Event?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete <b>{eventToDelete?.name}</b>?<br />
                <span className="text-red-600 font-semibold">This action cannot be undone.</span>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700"
                onClick={async () => {
                  if (!eventToDelete) return;
                  setIsDeleting(true);
                  try {
                    await axios.delete(`/api/events?id=${eventToDelete.id}`);
                    toast.success("Event deleted successfully!");
                    invalidateEventsCache(); // Invalidate cache
                    await fetchEventsAndRefreshState(true); // Force refresh state
                    if (isDrawerOpen && selectedEvent?.id === eventToDelete.id) {
                        setIsDrawerOpen(false);
                    }
                  } catch (err) {
                    toast.error("Failed to delete event.");
                  } finally {
                    setIsDeleting(false);
                    setDeleteDialogOpen(false);
                    setEventToDelete(null);
                  }
                }}
              >
                {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
    </>
  )
}