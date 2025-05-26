"use client"

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
  } from "@/components/ui/dropdown-menu"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator";
import {
  Check,
  X,
  Mail,
  Phone,
  MapPin,
  Search,
  Calendar,
  Building,
  User,
  UserCheck,
  UserX,
  ChevronUp,
  ChevronDown,
  MoreHorizontal,
  Download,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react"
import axios from 'axios';
import { toast } from 'sonner';
import { Pagination } from "@/components/pagination";
import { MembershipStatsChart } from "./membership-stats-chart";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

import jsPDF from 'jspdf';
import { applyPlugin } from 'jspdf-autotable';

applyPlugin(jsPDF);

type Props = {}

type Member = {
  id: number; // Or string if your API returns string IDs
  name: string | null;
  first_name: string | null;
  last_name: string | null;
  dob: string | null; // Keep for potential historical data or fallback
  dob_day: string | null; // New field for day of birth
  dob_month: string | null; // New field for month of birth
  lga: string | null; // Corresponds to localGovernment
  mobile: string | null;
  email: string | null;
  address: string | null;
  bio: string | null; // Corresponds to description/occupation
  // avatar: string | null; // Not in DB schema, will use fallback
  created_at: string; // Corresponds to submittedAt
  status: string | null;
  member_no: string | null; // Corresponds to membershipNumber
  approved_on: string | null; // Corresponds to joinedDate
  denied_on: string | null; // Corresponds to declinedDate
  denial_reason: string | null; // Corresponds to reason
  blocked_on?: string | null; // Add blocked_on
  // Add any other fields from your 'membership' table that you need
};

export default function Memberswizard({}: Props) {
    const [searchQuery, setSearchQuery] = useState("")
    const [activeView, setActiveView] = useState<"pending" | "approved" | "declined" | "blocked">("approved")
    const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({})
    const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
    const [declineDialogOpen, setDeclineDialogOpen] = useState(false)
    const [blockDialogOpen, setBlockDialogOpen] = useState(false)
    const [unblockDialogOpen, setUnblockDialogOpen] = useState(false)
    const [declineReason, setDeclineReason] = useState("")
    const [selectedRequest, setSelectedRequest] = useState<Member | null>(null)

    const [members, setMembers] = useState<Member[]>([]);
    const [stats, setStats] = useState({
      totalApplications: 0,
      approvedMembers: 0,
      declinedRequests: 0,
      blockedMembers: 0,
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [apiChartData, setApiChartData] = useState<any[]>([]);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(5); // Default page size

    const fetchMembersData = useCallback(async () => {
      setLoading(true);
      try {
        const response = await axios.get('/api/members');
        setMembers(response.data.members || []);
        setStats(response.data.stats || { totalApplications: 0, approvedMembers: 0, declinedRequests: 0, blockedMembers: 0 });
        setApiChartData(response.data.chartData || []);
        setError(null);
      } catch (err: any) {
        console.error("Failed to fetch members data:", err);
        const errorMessage = err.response?.data?.error || err.message || "Failed to load membership data.";
        setError(errorMessage + " Please try again later.");
        toast.error(errorMessage, { description: "Please try refreshing the page."});
        setMembers([]); 
        setStats({ totalApplications: 0, approvedMembers: 0, declinedRequests: 0, blockedMembers: 0 }); 
      } finally {
        setLoading(false);
      }
    }, []);

    useEffect(() => {
      fetchMembersData();
    }, [fetchMembersData]);

    // Reset to page 1 when activeView or searchQuery changes
    useEffect(() => {
      setCurrentPage(1);
    }, [activeView, searchQuery]);

    const totalApplications = stats.totalApplications;
    const approvedMemberCount = stats.approvedMembers;
    const declinedRequestCount = stats.declinedRequests;
    const blockedMemberCount = stats.blockedMembers;

    const approvalRate =
      (stats.approvedMembers + stats.declinedRequests + stats.blockedMembers) > 0
        ? Math.round((stats.approvedMembers / (stats.approvedMembers + stats.declinedRequests + stats.blockedMembers)) * 100)
        : 0;

    const calculateTrend = (chartDataForTrend: any[]) => {
      if (!chartDataForTrend || chartDataForTrend.length < 2) {
        return null; // Not enough data for trend
      }
      // Assuming chartData is sorted chronologically, last element is current month
      const currentMonthData = chartDataForTrend[chartDataForTrend.length - 1];
      const previousMonthData = chartDataForTrend[chartDataForTrend.length - 2];

      if (!currentMonthData || !previousMonthData) return null;

      const currentTotal = (currentMonthData.approved || 0) + (currentMonthData.pending || 0);
      const previousTotal = (previousMonthData.approved || 0) + (previousMonthData.pending || 0);

      if (previousTotal === 0) {
        return currentTotal > 0 ? 100 : 0; // Avoid division by zero
      }
      
      const trend = ((currentTotal - previousTotal) / previousTotal) * 100;
      return trend;
    };
    
    const membershipTrend = calculateTrend(apiChartData);

    const handleApprove = async (request: Member) => {
      if (!request || request.id === undefined) {
        console.error("Invalid request object for approval:", request);
        toast.error("Invalid member data", { description: "Cannot approve this member." });
        return;
      }
      try {
        const response = await axios.patch(`/api/members`, {
          memberId: request.id,
          status: "approved",
        });
        toast.success(`Member ${request.first_name || ''} ${request.last_name || ''} approved!`, {
          description: response.data.message || "Status updated successfully.",
        });
        fetchMembersData(); 
        if (detailsDialogOpen) setDetailsDialogOpen(false);
      } catch (err: any) {
        console.error("Error approving member:", err);
        const errorMessage = err.response?.data?.error || err.message || "An unknown error occurred.";
        toast.error("Approval Failed", { description: errorMessage });
      }
    };

    const handleDeclineClick = (request: Member) => {
      setSelectedRequest(request);
      setDeclineReason(""); // Reset reason
      setDeclineDialogOpen(true);
    };

    const handleDeclineSubmit = async () => {
      if (!selectedRequest || !declineReason.trim()) {
        toast.warning("Decline Reason Required", { description: "Please provide a reason for declining." });
        return;
      }

      try {
        // Step 1: Update status and reason in DB
        const response = await axios.patch(`/api/members`, {
          memberId: selectedRequest.id,
          status: "declined",
          denialReason: declineReason.trim(),
        });
        
        toast.success(`Member ${selectedRequest.first_name || ''} ${selectedRequest.last_name || ''} declined.`, {
          description: response.data.message || "Status updated and reason recorded.",
        });

        // Step 2: Prepare and open mailto link
        const subject = encodeURIComponent("Membership Application Declined");
        const body = encodeURIComponent(`Dear ${selectedRequest.first_name || ''} ${selectedRequest.last_name || ''},

We regret to inform you that your membership application has been declined for the following reason:

${declineReason.trim()}

If you have any questions or would like to submit a new application, please feel free to contact us.

Best regards,
Membership Team`);

        window.location.href = `mailto:${selectedRequest.email}?subject=${subject}&body=${body}`;
        
        setDeclineDialogOpen(false);
        fetchMembersData(); 
        if (detailsDialogOpen) setDetailsDialogOpen(false);

      } catch (err: any) {
        console.error("Error declining member:", err);
        const errorMessage = err.response?.data?.error || err.message || "An unknown error occurred.";
        toast.error("Decline Failed", { description: errorMessage });
      }
    };

    const handleBlockClick = (member: Member) => {
      setSelectedRequest(member);
      setBlockDialogOpen(true);
    };

    const handleConfirmBlock = async () => {
      if (!selectedRequest) return;
      try {
        const response = await axios.patch(`/api/members`, {
          memberId: selectedRequest.id,
          status: "blocked",
        });
        toast.success(`Member ${getDisplayName(selectedRequest)} blocked!`, {
          description: response.data.message || "Status updated to blocked.",
        });
        fetchMembersData();
        setBlockDialogOpen(false);
        if (detailsDialogOpen && selectedRequest?.status === 'approved') setDetailsDialogOpen(false);
      } catch (err: any) {
        console.error("Error blocking member:", err);
        const errorMessage = err.response?.data?.error || err.message || "An unknown error occurred.";
        toast.error("Blocking Failed", { description: errorMessage });
        setBlockDialogOpen(false);
      }
    };

    const handleUnblockClick = (member: Member) => {
      setSelectedRequest(member);
      setUnblockDialogOpen(true);
    };

    const handleConfirmUnblock = async () => {
      if (!selectedRequest) return;
      try {
        // Unblocking means setting status back to "approved"
        const response = await axios.patch(`/api/members`, {
          memberId: selectedRequest.id,
          status: "approved", 
        });
        toast.success(`Member ${getDisplayName(selectedRequest)} unblocked!`, {
          description: response.data.message || "Status updated to approved.",
        });
        fetchMembersData();
        setUnblockDialogOpen(false);
        if (detailsDialogOpen && selectedRequest?.status === 'blocked') setDetailsDialogOpen(false); 
      } catch (err: any) {
        console.error("Error unblocking member:", err);
        const errorMessage = err.response?.data?.error || err.message || "An unknown error occurred.";
        toast.error("Unblocking Failed", { description: errorMessage });
        setUnblockDialogOpen(false);
      }
    };

    const handleViewDetails = (request: Member) => {
      setSelectedRequest(request);
      setDetailsDialogOpen(true);
    };

    const toggleExpand = (id: string | number) => {
      setExpandedItems((prev) => ({
        ...prev,
        [String(id)]: !prev[String(id)],
      }));
    };

    const formatDate = (dateString: string | null | undefined) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      }
    
    const formatBirthday = (day: string | null | undefined, month: string | null | undefined) => {
      if (!day || !month) return "N/A";

      // Attempt to parse month name/number and create a date object to format
      // This handles numeric months ("1", "12") or full names ("January", "December")
      const monthNumber = parseInt(month, 10);
      let dateForFormatting: Date | null = null;

      if (!isNaN(monthNumber) && monthNumber >= 1 && monthNumber <= 12) {
        // Month is likely a number (adjusting for 0-index)
        // Use a placeholder year (e.g., 2000) as year doesn't matter for Month-Day format
        dateForFormatting = new Date(2000, monthNumber - 1, parseInt(day, 10));
      } else {
        // Try parsing month as a name
        try {
          // Append a day and year to make Date.parse work reliably for month names
          const tempDate = Date.parse(`${month} ${day}, 2000`);
          if (!isNaN(tempDate)) {
            dateForFormatting = new Date(tempDate);
          }
        } catch (e) {
          // If parsing fails, fallback
        }
      }

      if (dateForFormatting && !isNaN(dateForFormatting.getTime())) {
        return dateForFormatting.toLocaleDateString("en-US", {
          month: "long", // e.g., "January"
          day: "numeric", // e.g., "15"
        });
      }

      // Fallback if parsing fails or inputs are invalid
      return `${month || '?'} ${day || '?'}`;
    };

    const getAvatarFallback = (item: Member | null) => {
      if (!item) return "N/A";
      const firstInitial = item.first_name?.[0]?.toUpperCase();
      const lastInitial = item.last_name?.[0]?.toUpperCase();

      if (firstInitial && lastInitial) {
        return `${firstInitial}${lastInitial}`;
      }
      if (item.name) {
        const nameParts = item.name.split(' ');
        if (nameParts.length > 1) {
          return `${nameParts[0][0]?.toUpperCase() || ''}${nameParts[nameParts.length - 1][0]?.toUpperCase() || ''}`;
        }
        return item.name[0]?.toUpperCase() || "N/A";
      }
      return "N/A";
    };

    const getDisplayName = (item: Member | null) => {
      if (!item) return "N/A";
      if (item.first_name && item.last_name) {
        return `${item.first_name} ${item.last_name}`;
      }
      if (item.name) {
        return item.name;
      }
      if (item.first_name) return item.first_name;
      if (item.last_name) return item.last_name;
      return "N/A";
    };
    
    const filteredItems = members.filter((item) => {
      const displayName = getDisplayName(item).toLowerCase();
      const email = item.email?.toLowerCase() || "";
      const membershipNumber = item.member_no?.toLowerCase() || "";
      const query = searchQuery.toLowerCase();

      const matchesSearch =
        displayName.includes(query) ||
        email.includes(query) ||
        (membershipNumber && membershipNumber.includes(query));

      if (!matchesSearch) return false;

      if (activeView === "pending") {
        return item.status !== "approved" && item.status !== "declined" && item.status !== "blocked";
      }
      return item.status === activeView;
    });

    // Calculate total pages and paginated items
    const totalPages = Math.ceil(filteredItems.length / pageSize);
    const paginatedMembers = filteredItems.slice(
      (currentPage - 1) * pageSize,
      currentPage * pageSize
    );

    const handlePageChange = (page: number) => {
      setCurrentPage(page);
    };
  
    const handlePageSizeChange = (size: number) => {
      setPageSize(size);
      setCurrentPage(1); // Reset to first page when page size changes
    };

    const downloadApprovedMembersPDF = () => {
      const approved = members.filter(member => member.status === 'approved');

      if (approved.length === 0) {
        toast.info("No Approved Members", { description: "There are no approved members to download." });
        return;
      }

      const doc = new jsPDF();
      
      doc.setFontSize(18);
      doc.text("Approved Members List", 14, 22);
      doc.setFontSize(12);
      
      const tableColumn = ["Name", "Email", "Membership Number"];
      const tableRows: (string | null)[][] = [];

      approved.forEach(member => {
        const memberData = [
          getDisplayName(member),
          member.email || 'N/A',
          member.member_no || 'N/A',
        ];
        tableRows.push(memberData);
      });

      (doc as any).autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 30,
        theme: 'striped',
        headStyles: { fillColor: [22, 160, 133] }, // Example: green header
      });
      
      doc.save('approved_members_data.pdf');
      toast.success("PDF Downloaded", { description: "Approved members list has been downloaded."});
    };

    if (loading) {
      return (
        <div className="container mx-auto py-6 text-center">
          <p>Loading membership data...</p>
          {/* You can add a spinner here */}
        </div>
      );
    }

    if (error) {
      return (
        <div className="container mx-auto py-4 px-2 sm:px-6 text-center text-red-500">
          <p>{error}</p>
          <Button onClick={fetchMembersData} className="mt-4">Try Again</Button>
        </div>
      );
    }
  
    return (
      <div className="container mx-auto py-4 px-2 sm:px-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Membership Management</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Review and manage membership applications</p>
          </div>
          <div>
            <Button onClick={downloadApprovedMembersPDF} size="sm" className="w-full sm:w-auto">
              <Download className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Save Members Data</span>
              <span className="sm:hidden">Save Data</span>
            </Button>
          </div>
        </div>
  
        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col">
                <p className="text-xs sm:text-sm text-muted-foreground">Total Applications</p>
                <div className="flex items-center justify-between mt-1 sm:mt-2">
                  <p className="text-xl sm:text-2xl font-bold">{totalApplications}</p>
                  <User className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
  
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col">
                <p className="text-xs sm:text-sm text-muted-foreground">Approved Members</p>
                <div className="flex items-center justify-between mt-1 sm:mt-2">
                  <p className="text-xl sm:text-2xl font-bold">{approvedMemberCount}</p>
                  <UserCheck className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>
  
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col">
                <p className="text-xs sm:text-sm text-muted-foreground">Declined Requests</p>
                <div className="flex items-center justify-between mt-1 sm:mt-2">
                  <p className="text-xl sm:text-2xl font-bold">{declinedRequestCount}</p>
                  <UserX className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col">
                <p className="text-xs sm:text-sm text-muted-foreground">Blocked Members</p>
                <div className="flex items-center justify-between mt-1 sm:mt-2">
                  <p className="text-xl sm:text-2xl font-bold">{blockedMemberCount}</p>
                  <ShieldAlert className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
  
        {/* Membership Chart */}
        {apiChartData.length > 0 ? (
          <div className="mb-6">
            <MembershipStatsChart 
              data={apiChartData} 
              trendPercentage={membershipTrend}
              approvalRate={approvalRate}
              timePeriodDescription={`Last ${apiChartData.length} Months`}
            />
          </div>
        ) : loading ? (
          <Card className="mb-6">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-base sm:text-lg">Membership Applications</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Loading chart data...</CardDescription>
            </CardHeader>
            <CardContent className="h-[200px] sm:h-[300px] flex items-center justify-center">
              <p>Loading...</p>
            </CardContent>
          </Card>
        ) : (
           <Card className=" mb-6">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-base sm:text-lg">Membership Applications</CardTitle>
            </CardHeader>
            <CardContent className="h-[200px] sm:h-[300px] flex items-center justify-center">
              <p>No chart data available.</p>
            </CardContent>
          </Card>
        )}
  
        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant={activeView === "approved" ? "default" : "outline"} onClick={() => setActiveView("approved")}>
              Approved
            </Button>
            <Button size="sm" variant={activeView === "pending" ? "default" : "outline"} onClick={() => setActiveView("pending")}>
              Pending
            </Button>
            <Button size="sm" variant={activeView === "declined" ? "default" : "outline"} onClick={() => setActiveView("declined")}>
              Declined
            </Button>
            <Button size="sm" variant={activeView === "blocked" ? "default" : "outline"} onClick={() => setActiveView("blocked")}>
              Blocked
            </Button>
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search..."
                className="pl-8 w-full sm:w-80"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>
  
        {/* Member List */}
        <div className="space-y-4">
          {paginatedMembers.length > 0 ? (
            paginatedMembers.map((item: Member) => (
              <Card
                key={item.id}
                className={`overflow-hidden transition-all duration-200 hover:shadow-md cursor-pointer ${
                  activeView === 'approved' ? 'hover:opacity-70' : 
                  activeView === 'pending' ? 'hover:opacity-70' :
                  activeView === 'declined' ? 'hover:opacity-70' :
                  activeView === 'blocked' ? 'hover:opacity-70' : ''
                }`}
                onClick={() => toggleExpand(item.id)}
              >
                <div className="p-3 sm:p-4">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-3 sm:gap-0">
                    <div className="flex items-start gap-3 sm:gap-4 flex-1">
                      <Avatar className="mt-1 h-10 w-10 sm:h-12 sm:w-12">
                        <AvatarImage src={"/placeholder.svg"} alt={getDisplayName(item)} />
                        <AvatarFallback>
                          {getAvatarFallback(item)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                          <h3 className="font-medium text-sm sm:text-base">{getDisplayName(item)}</h3>
                          {activeView === "approved" && item.member_no && (
                            <Badge variant="outline" className="bg-green-100 dark:bg-green-900/30 dark:text-green-400 text-xs px-1.5 py-0.5 self-start sm:self-center">
                              {item.member_no}
                            </Badge>
                          )}
                          {activeView === "blocked" && item.member_no && (
                            <Badge variant="destructive" className="bg-orange-100 text-orange-700 text-xs px-1.5 py-0.5 self-start sm:self-center">
                              {item.member_no} - BLOCKED
                            </Badge>
                          )}
                        </div>
                        <p className={`text-xs sm:text-sm text-muted-foreground ${!expandedItems[String(item.id)] ? 'line-clamp-2 sm:line-clamp-1' : ''}`}>
                          {item.bio || 'No bio available.'}
                        </p>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 mt-1">
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs">{item.email || 'N/A'}</span>
                          </div>
                          {item.mobile && (
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs">{item.mobile}</span>
                            </div>
                          )}
                        </div>
                        <div className="mt-1 space-y-0.5 text-xs">
                          {activeView === "pending" && item.created_at && (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3 text-muted-foreground" />
                              <span>Submitted: {formatDate(item.created_at)}</span>
                            </div>
                          )}
                           {activeView === "approved" && (
                            <>
                              {item.created_at && (
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-gray-600 dark:text-gray-400">Requested: {formatDate(item.created_at)}</span>
                                </div>
                              )}
                              {item.approved_on && (
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3 text-muted-foreground" />
                                  <span>Approved: {formatDate(item.approved_on)}</span>
                                </div>
                              )}
                            </>
                          )}
                          {activeView === "declined" && item.denied_on && (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3 text-muted-foreground" />
                              <span>Declined: {formatDate(item.denied_on)}</span>
                            </div>
                          )}
                          {activeView === "blocked" && item.blocked_on && (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3 text-muted-foreground" />
                              <span className="text-orange-600">Blocked: {formatDate(item.blocked_on)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 self-start sm:self-center mt-2 sm:mt-0">
                      {activeView === "pending" && (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-green-600 hover:text-green-700 hover:bg-green-50 px-2 py-1 h-auto"
                            onClick={(e) => { e.stopPropagation(); handleApprove(item); }}
                          >
                            <Check className="h-4 w-4 sm:mr-1" /> <span className="hidden sm:inline">Approve</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 px-2 py-1 h-auto"
                            onClick={(e) => { e.stopPropagation(); handleDeclineClick(item); }}
                          >
                            <X className="h-4 w-4 sm:mr-1" /> <span className="hidden sm:inline">Decline</span>
                          </Button>
                        </>
                      )}
                      {activeView === "approved" && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 p-1.5 h-7 w-7 sm:h-8 sm:w-8"
                          onClick={(e) => { e.stopPropagation(); handleBlockClick(item); }}
                          title="Block Member"
                        >
                          <ShieldAlert className="h-4 w-4" />
                        </Button>
                      )}
                      {activeView === "blocked" && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-green-600 hover:text-green-700 hover:bg-green-50 p-1.5 h-7 w-7 sm:h-8 sm:w-8"
                          onClick={(e) => { e.stopPropagation(); handleUnblockClick(item); }}
                          title="Unblock Member"
                        >
                          <ShieldCheck className="h-4 w-4" />
                        </Button>
                      )}
                      <Button 
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                          onClick={(e) => { e.stopPropagation(); toggleExpand(item.id);}}
                      >
                        {expandedItems[String(item.id)] ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleViewDetails(item)}>View Details</DropdownMenuItem>
                          {activeView === "pending" && (
                            <>
                              <DropdownMenuItem onClick={() => handleApprove(item)}>Approve</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDeclineClick(item)}>Decline</DropdownMenuItem>
                            </>
                          )}
                          {activeView === "approved" && (
                            <>
                              <DropdownMenuItem onClick={() => { window.location.href = `mailto:${item.email}` }}>
                                Contact Member
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-orange-600 focus:bg-orange-100 focus:text-orange-700"
                                onClick={() => handleBlockClick(item)}
                              >
                                Block Member
                              </DropdownMenuItem>
                            </>
                          )}
                          {activeView === "blocked" && (
                            <DropdownMenuItem
                              className="text-green-600 focus:bg-green-100 focus:text-green-700"
                              onClick={() => handleUnblockClick(item)}
                            >
                              Unblock Member
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
        
                  {expandedItems[String(item.id)] && (
                    <div className="mt-4 pt-4 border-t">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                        <div className="space-y-4">
                          <div>
                            <h4 className="text-sm font-medium mb-2">Personal Information</h4>
                            <div className="grid grid-cols-1 gap-2 sm:gap-3">
                              {(item.dob_day && item.dob_month) && (
                                <div className="flex items-start gap-2">
                                  <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                                  <div>
                                    <Label className="text-xs text-muted-foreground">Birthday</Label>
                                    <p className="text-sm">{formatBirthday(item.dob_day, item.dob_month)}</p>
                                  </div>
                                </div>
                              )}
                              {item.lga && (
                                <div className="flex items-start gap-2">
                                  <Building className="h-4 w-4 text-muted-foreground mt-0.5" />
                                  <div>
                                    <Label className="text-xs text-muted-foreground">Local Government</Label>
                                    <p className="text-sm">{item.lga}</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
        
                          {item.address && (
                            <div>
                              <h4 className="text-sm font-medium mb-2">Address</h4>
                              <div className="flex items-start gap-2">
                                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                                <p className="text-sm">{item.address}</p>
                              </div>
                            </div>
                          )}
                        </div>
        
                        <div className="space-y-4">
                          {activeView === "pending" && item.bio && (
                            <div>
                              <h4 className="text-sm font-medium mb-2">About</h4>
                              <p className="text-sm text-muted-foreground">{item.bio}</p>
                            </div>
                          )}
        
                          {activeView === "declined" && item.denial_reason && (
                            <div>
                              <h4 className="text-sm font-medium mb-2">Decline Reason</h4>
                              <p className="text-sm text-red-500">{item.denial_reason}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="p-6 sm:p-12 flex flex-col items-center justify-center">
                <User className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mb-3 sm:mb-4" />
                <p className="text-base sm:text-lg font-medium">No records found</p>
                <p className="text-xs sm:text-sm text-muted-foreground text-center">
                  {searchQuery ? "No records match your search." :
                    activeView === "pending"
                    ? "There are no pending membership requests."
                    : activeView === "approved"
                      ? "There are no approved members yet."
                      : activeView === "declined"
                        ? "There are no declined requests."
                        : "There are no blocked members."}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
  
        {/* Pagination Controls */}
        {filteredItems.length > 0 && totalPages > 0 && (
           <div className="mt-6 mb-8 rounded-lg shadow-sm p-3 sm:p-4 border flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4 bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700/50">
              <div className="flex items-center gap-2 text-xs sm:text-sm text-green-700 dark:text-green-400">
                <span>
                    Displaying {((currentPage - 1) * pageSize) + 1}-
                    {Math.min(currentPage * pageSize, filteredItems.length)} of {filteredItems.length}
                </span>
              </div>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={pageSize}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
            />
          </div>
        )}
  
        {/* Details Dialog */}
        <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
          <DialogContent className="max-w-3xl w-[95vw] sm:w-full rounded-lg">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">Membership Details</DialogTitle>
            </DialogHeader>
  
            {selectedRequest && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 py-4 max-h-[80vh] overflow-y-auto">
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12 sm:h-16 sm:w-16">
                      <AvatarImage src={"/placeholder.svg"} alt={getDisplayName(selectedRequest)} />
                      <AvatarFallback className="text-base sm:text-lg">
                        {getAvatarFallback(selectedRequest)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h2 className="text-lg sm:text-xl font-bold">{getDisplayName(selectedRequest)}</h2>
                      <p className="text-xs sm:text-sm text-muted-foreground">{selectedRequest.bio || "N/A"}</p>
                      {selectedRequest.status === "approved" && selectedRequest.member_no && (
                        <Badge variant="outline" className="mt-1 bg-green-50 text-xs px-1.5 py-0.5">
                          {selectedRequest.member_no}
                        </Badge>
                      )}
                    </div>
                  </div>
  
                  <Separator />
  
                  <div className="space-y-2 sm:space-y-3">
                    <h3 className="font-medium text-sm sm:text-base">Personal Information</h3>
  
                    <div className="grid grid-cols-1 gap-2 sm:gap-3">
                      {(selectedRequest.dob_day && selectedRequest.dob_month) && (
                        <div className="flex items-start gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <div>
                            <Label className="text-xs text-muted-foreground">Birthday</Label>
                            <p className="text-sm">{formatBirthday(selectedRequest.dob_day, selectedRequest.dob_month)}</p>
                          </div>
                        </div>
                      )}
                      {selectedRequest.lga && (
                        <div className="flex items-start gap-2">
                          <Building className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <div>
                            <Label className="text-xs text-muted-foreground">Local Government</Label>
                            <p className="text-sm">{selectedRequest.lga}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
  
                  <div className="space-y-2 sm:space-y-3">
                    <h3 className="font-medium text-sm sm:text-base">Contact Information</h3>
  
                    <div className="flex items-start gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <Label className="text-xs text-muted-foreground">Email</Label>
                        <p className="text-sm break-all">{selectedRequest.email || "N/A"}</p>
                      </div>
                    </div>
  
                    {selectedRequest.mobile && (
                      <div className="flex items-start gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div>
                          <Label className="text-xs text-muted-foreground">Mobile</Label>
                          <p className="text-sm">{selectedRequest.mobile}</p>
                        </div>
                      </div>
                    )}
  
                    {selectedRequest.address && (
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div>
                          <Label className="text-xs text-muted-foreground">Address</Label>
                          <p className="text-sm">{selectedRequest.address}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
  
                <div className="space-y-3 sm:space-y-4">
                  {selectedRequest.status !== 'approved' && selectedRequest.status !== 'declined' && selectedRequest.status !== 'blocked' && selectedRequest.bio && (
                    <div>
                      <h3 className="font-medium text-sm sm:text-base mb-1 sm:mb-2">About</h3>
                      <p className="text-sm text-muted-foreground">{selectedRequest.bio}</p>
                    </div>
                  )}
  
                  <Separator />
  
                  <div>
                    <h3 className="font-medium text-sm sm:text-base mb-1 sm:mb-2">Application Details</h3>
                    {selectedRequest.status !== 'approved' && selectedRequest.status !== 'declined' && selectedRequest.status !== 'blocked' && selectedRequest.created_at && (
                      <div className="flex items-center justify-between text-sm">
                        <div>
                          <Label className="text-xs text-muted-foreground">Submission Date</Label>
                          <p>{formatDate(selectedRequest.created_at)}</p>
                        </div>
                        <Badge className="text-xs px-1.5 py-0.5">Pending Review</Badge>
                      </div>
                    )}
  
                    {selectedRequest.status === "approved" && (
                      <>
                        {selectedRequest.created_at && (
                          <div className="mb-2 text-sm">
                            <Label className="text-xs text-muted-foreground">Requested Date</Label>
                            <p>{formatDate(selectedRequest.created_at)}</p>
                          </div>
                        )}
                        {selectedRequest.approved_on && (
                          <div className="text-sm">
                            <Label className="text-xs text-muted-foreground">Approved Date</Label>
                            <p>{formatDate(selectedRequest.approved_on)}</p>
                          </div>
                        )}
                      </>
                    )}
  
                    {selectedRequest.status === "declined" && (
                      <div className="text-sm">
                        <div className="mb-2">
                          <Label className="text-xs text-muted-foreground">Declined Date</Label>
                          <p>{formatDate(selectedRequest.denied_on)}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Reason</Label>
                          <p className="text-red-500">{selectedRequest.denial_reason || "N/A"}</p>
                        </div>
                      </div>
                    )}

                    {selectedRequest.status === "blocked" && (
                      <div className="text-sm">
                        <div className="mb-2">
                          <Label className="text-xs text-muted-foreground">Blocked Date</Label>
                          <p className="text-orange-600">{formatDate(selectedRequest.blocked_on)}</p>
                        </div>
                        <Badge variant="destructive" className="bg-orange-100 text-orange-700 text-xs px-1.5 py-0.5">Blocked</Badge>
                      </div>
                    )}
                  </div>
  
                  {selectedRequest.status !== 'approved' && selectedRequest.status !== 'declined' && selectedRequest.status !== 'blocked' && (
                    <div className="pt-3 sm:pt-4 flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
                      <Button
                        size="sm"
                        onClick={() => { handleApprove(selectedRequest); }}
                        className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
                      >
                        <Check className="h-4 w-4 mr-2" /> Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => { handleDeclineClick(selectedRequest); }}
                        className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 w-full sm:w-auto"
                      >
                        <X className="h-4 w-4 mr-2" /> Decline
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
  
        {/* Decline Dialog */}
        <Dialog open={declineDialogOpen} onOpenChange={setDeclineDialogOpen}>
          <DialogContent className="w-[95vw] sm:w-full rounded-lg">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">Decline Membership Request</DialogTitle>
              <DialogDescription className="text-xs sm:text-sm">
                Please provide a reason for declining {getDisplayName(selectedRequest)}'s membership request. This reason will be
                included in the notification email sent to the applicant.
              </DialogDescription>
            </DialogHeader>
            <Textarea
              placeholder="Enter reason for declining..."
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              className="min-h-[100px] text-sm"
            />
            <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
              <Button size="sm" variant="outline" onClick={() => setDeclineDialogOpen(false)} className="w-full sm:w-auto">
                Cancel
              </Button>
              <Button size="sm" variant="destructive" onClick={handleDeclineSubmit} disabled={!declineReason.trim()} className="w-full sm:w-auto">
                Send Email
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Block Member Confirmation Dialog */}
        <AlertDialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
          <AlertDialogContent className="w-[95vw] sm:w-full rounded-lg">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-lg sm:text-xl">Block Member?</AlertDialogTitle>
              <AlertDialogDescription className="text-xs sm:text-sm">
                Are you sure you want to block {getDisplayName(selectedRequest)}? 
                Their access and status will be updated accordingly. This action can be undone later.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
              <AlertDialogCancel asChild>
                  <Button size="sm" variant="outline" className="w-full sm:w-auto">Cancel</Button>
              </AlertDialogCancel>
              <AlertDialogAction asChild>
                <Button 
                  size="sm"
                  onClick={handleConfirmBlock}
                  className="bg-orange-600 hover:bg-orange-700 focus:ring-orange-500 w-full sm:w-auto"
                >
                  Yes, Block Member
                </Button>
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Unblock Member Confirmation Dialog */}
        <AlertDialog open={unblockDialogOpen} onOpenChange={setUnblockDialogOpen}>
          <AlertDialogContent className="w-[95vw] sm:w-full rounded-lg">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-lg sm:text-xl">Unblock Member?</AlertDialogTitle>
              <AlertDialogDescription className="text-xs sm:text-sm">
                Are you sure you want to unblock {getDisplayName(selectedRequest)}? 
                Their status will be set to "approved".
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
               <AlertDialogCancel asChild>
                  <Button size="sm" variant="outline" className="w-full sm:w-auto">Cancel</Button>
              </AlertDialogCancel>
              <AlertDialogAction asChild>
                <Button 
                  size="sm"
                  onClick={handleConfirmUnblock}
                  className="bg-green-600 hover:bg-green-700 focus:ring-green-500 w-full sm:w-auto"
                >
                  Yes, Unblock Member
                </Button>
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    )
}