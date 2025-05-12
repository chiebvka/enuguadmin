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
        <div className="container mx-auto py-6 text-center text-red-500">
          <p>{error}</p>
          <Button onClick={fetchMembersData} className="mt-4">Try Again</Button>
        </div>
      );
    }
  
    return (
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Membership Management</h1>
            <p className="text-muted-foreground">Review and manage membership applications</p>
          </div>
          <div>
            <Button onClick={downloadApprovedMembersPDF} >
              <Download className="mr-2 h-4 w-4" />
              Save Members Data
            </Button>
          </div>
        </div>
  
        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-white">
            <CardContent className="p-6">
              <div className="flex flex-col">
                <p className="text-sm text-muted-foreground">Total Applications</p>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-2xl font-bold">{totalApplications}</p>
                  <User className="h-5 w-5 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
  
          <Card className="bg-white">
            <CardContent className="p-6">
              <div className="flex flex-col">
                <p className="text-sm text-muted-foreground">Approved Members</p>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-2xl font-bold">{approvedMemberCount}</p>
                  <UserCheck className="h-5 w-5 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>
  
          <Card className="bg-white">
            <CardContent className="p-6">
              <div className="flex flex-col">
                <p className="text-sm text-muted-foreground">Declined Requests</p>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-2xl font-bold">{declinedRequestCount}</p>
                  <UserX className="h-5 w-5 text-red-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardContent className="p-6">
              <div className="flex flex-col">
                <p className="text-sm text-muted-foreground">Blocked Members</p>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-2xl font-bold">{blockedMemberCount}</p>
                  <ShieldAlert className="h-5 w-5 text-orange-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
  
        {/* Membership Chart - Replaced */}
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
          <Card className="bg-white mb-6">
            <CardHeader>
              <CardTitle>Membership Applications</CardTitle>
              <CardDescription>Loading chart data...</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px] flex items-center justify-center">
              <p>Loading...</p>
            </CardContent>
          </Card>
        ) : (
           <Card className="bg-white mb-6">
            <CardHeader>
              <CardTitle>Membership Applications</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px] flex items-center justify-center">
              <p>No chart data available.</p>
            </CardContent>
          </Card>
        )}
  
        {/* Filter Bar */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-2">
            <Button variant={activeView === "approved" ? "default" : "outline"} onClick={() => setActiveView("approved")}>
              Approved
            </Button>
            <Button variant={activeView === "pending" ? "default" : "outline"} onClick={() => setActiveView("pending")}>
              Pending
            </Button>
            <Button variant={activeView === "declined" ? "default" : "outline"} onClick={() => setActiveView("declined")}>
              Declined
            </Button>
            <Button variant={activeView === "blocked" ? "default" : "outline"} onClick={() => setActiveView("blocked")}>
              Blocked
            </Button>
          </div>
          <div className="flex gap-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by name, email, or membership no..."
                className="pl-8 w-80"
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
                className={`bg-white overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-md ${
                  activeView === 'approved' ? 'hover:bg-green-50' : 
                  activeView === 'pending' ? 'hover:bg-yellow-50' :
                  activeView === 'declined' ? 'hover:bg-red-50' :
                  activeView === 'blocked' ? 'hover:bg-orange-50' : ''
                }`}
                onClick={() => toggleExpand(item.id)}
              >
                <div className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-start gap-4">
                      <Avatar className="mt-1">
                        <AvatarImage src={"/placeholder.svg"} alt={getDisplayName(item)} />
                        <AvatarFallback>
                          {getAvatarFallback(item)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{getDisplayName(item)}</h3>
                          {activeView === "approved" && item.member_no && (
                            <Badge variant="outline" className="bg-green-50">
                              {item.member_no}
                            </Badge>
                          )}
                          {activeView === "blocked" && item.member_no && (
                            <Badge variant="destructive" className="bg-orange-100 text-orange-700">
                              {item.member_no} - BLOCKED
                            </Badge>
                          )}
                        </div>
                        <p className={`text-sm text-muted-foreground ${!expandedItems[String(item.id)] ? 'line-clamp-1' : ''}`}>
                          {item.bio || 'No bio available.'}
                        </p>
                        <div className="flex items-center gap-4 mt-1">
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
                        <div className="mt-1 space-y-0.5">
                          {activeView === "pending" && item.created_at && (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs">Submitted: {formatDate(item.created_at)}</span>
                            </div>
                          )}
                          {activeView === "approved" && (
                            <>
                              {item.created_at && (
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-xs text-gray-600 dark:text-gray-400">Requested: {formatDate(item.created_at)}</span>
                                </div>
                              )}
                              {item.approved_on && (
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-xs">Approved: {formatDate(item.approved_on)}</span>
                                </div>
                              )}
                            </>
                          )}
                          {activeView === "declined" && item.denied_on && (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs">Declined: {formatDate(item.denied_on)}</span>
                            </div>
                          )}
                          {activeView === "blocked" && item.blocked_on && (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs text-orange-600">Blocked: {formatDate(item.blocked_on)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {activeView === "pending" && (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleApprove(item)
                            }}
                          >
                            <Check className="h-4 w-4 mr-1" /> Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeclineClick(item)
                            }}
                          >
                            <X className="h-4 w-4 mr-1" /> Decline
                          </Button>
                        </>
                      )}
                      {activeView === "approved" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 p-1.5"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleBlockClick(item);
                          }}
                          title="Block Member"
                        >
                          <ShieldAlert className="h-4 w-4" />
                        </Button>
                      )}
                      {activeView === "blocked" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-green-600 hover:text-green-700 hover:bg-green-50 p-1.5"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUnblockClick(item);
                          }}
                          title="Unblock Member"
                        >
                          <ShieldCheck className="h-4 w-4" />
                        </Button>
                      )}
                      <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
                        {expandedItems[String(item.id)] ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
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
                              <DropdownMenuItem
                                onClick={() => {
                                  window.location.href = `mailto:${item.email}`
                                }}
                              >
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
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div>
                            <h4 className="text-sm font-medium mb-2">Personal Information</h4>
                            <div className="grid grid-cols-2 gap-3">
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
              <CardContent className="p-12 flex flex-col items-center justify-center">
                <User className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">No records found</p>
                <p className="text-muted-foreground">
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
           <div className="mt-6 mb-8 rounded-lg shadow-sm p-4 border flex flex-col sm:flex-row justify-between items-center gap-4 bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700/50">
              <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
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
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Membership Details</DialogTitle>
            </DialogHeader>
  
            {selectedRequest && (
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={"/placeholder.svg"} alt={getDisplayName(selectedRequest)} />
                      <AvatarFallback className="text-lg">
                        {getAvatarFallback(selectedRequest)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h2 className="text-xl font-bold">{getDisplayName(selectedRequest)}</h2>
                      <p className="text-muted-foreground">{selectedRequest.bio || "N/A"}</p>
                      {selectedRequest.status === "approved" && selectedRequest.member_no && (
                        <Badge variant="outline" className="mt-1 bg-green-50">
                          {selectedRequest.member_no}
                        </Badge>
                      )}
                    </div>
                  </div>
  
                  <Separator />
  
                  <div className="space-y-3">
                    <h3 className="font-medium">Personal Information</h3>
  
                    <div className="grid grid-cols-2 gap-3">
                      {(selectedRequest.dob_day && selectedRequest.dob_month) && (
                        <div className="flex items-start gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <div>
                            <Label className="text-xs text-muted-foreground">Birthday</Label>
                            <p>{formatBirthday(selectedRequest.dob_day, selectedRequest.dob_month)}</p>
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
  
                  <div className="space-y-3">
                    <h3 className="font-medium">Contact Information</h3>
  
                    <div className="flex items-start gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <Label className="text-xs text-muted-foreground">Email</Label>
                        <p>{selectedRequest.email || "N/A"}</p>
                      </div>
                    </div>
  
                    {selectedRequest.mobile && (
                      <div className="flex items-start gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div>
                          <Label className="text-xs text-muted-foreground">Mobile</Label>
                          <p>{selectedRequest.mobile}</p>
                        </div>
                      </div>
                    )}
  
                    {selectedRequest.address && (
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div>
                          <Label className="text-xs text-muted-foreground">Address</Label>
                          <p>{selectedRequest.address}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
  
                <div className="space-y-4">
                  {selectedRequest.status !== 'approved' && selectedRequest.status !== 'declined' && selectedRequest.status !== 'blocked' && selectedRequest.bio && (
                    <div>
                      <h3 className="font-medium mb-2">About</h3>
                      <p className="text-muted-foreground">{selectedRequest.bio}</p>
                    </div>
                  )}
  
                  <Separator />
  
                  <div>
                    <h3 className="font-medium mb-2">Application Details</h3>
                    {selectedRequest.status !== 'approved' && selectedRequest.status !== 'declined' && selectedRequest.status !== 'blocked' && selectedRequest.created_at && (
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-xs text-muted-foreground">Submission Date</Label>
                          <p>{formatDate(selectedRequest.created_at)}</p>
                        </div>
                        <Badge>Pending Review</Badge>
                      </div>
                    )}
  
                    {selectedRequest.status === "approved" && (
                      <>
                        {selectedRequest.created_at && (
                          <div className="mb-2">
                            <Label className="text-xs text-muted-foreground">Requested Date</Label>
                            <p>{formatDate(selectedRequest.created_at)}</p>
                          </div>
                        )}
                        {selectedRequest.approved_on && (
                          <div>
                            <Label className="text-xs text-muted-foreground">Approved Date</Label>
                            <p>{formatDate(selectedRequest.approved_on)}</p>
                          </div>
                        )}
                      </>
                    )}
  
                    {selectedRequest.status === "declined" && (
                      <div>
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
                      <div>
                        <div className="mb-2">
                          <Label className="text-xs text-muted-foreground">Blocked Date</Label>
                          <p className="text-orange-600">{formatDate(selectedRequest.blocked_on)}</p>
                        </div>
                        <Badge variant="destructive" className="bg-orange-100 text-orange-700">Blocked</Badge>
                      </div>
                    )}
                  </div>
  
                  {selectedRequest.status !== 'approved' && selectedRequest.status !== 'declined' && selectedRequest.status !== 'blocked' && (
                    <div className="pt-4 flex justify-end gap-3">
                      <Button
                        onClick={() => {
                          handleApprove(selectedRequest)
                        }}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Check className="h-4 w-4 mr-2" /> Approve
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          handleDeclineClick(selectedRequest)
                        }}
                        className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
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
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Decline Membership Request</DialogTitle>
              <DialogDescription>
                Please provide a reason for declining {getDisplayName(selectedRequest)}'s membership request. This reason will be
                included in the notification email sent to the applicant.
              </DialogDescription>
            </DialogHeader>
            <Textarea
              placeholder="Enter reason for declining..."
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              className="min-h-[100px]"
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeclineDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDeclineSubmit} disabled={!declineReason.trim()}>
                Send Email
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Block Member Confirmation Dialog */}
        <AlertDialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Block Member?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to block {getDisplayName(selectedRequest)}? 
                Their access and status will be updated accordingly. This action can be undone later.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setBlockDialogOpen(false)}>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleConfirmBlock}
                className="bg-orange-600 hover:bg-orange-700 focus:ring-orange-500"
              >
                Yes, Block Member
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Unblock Member Confirmation Dialog */}
        <AlertDialog open={unblockDialogOpen} onOpenChange={setUnblockDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Unblock Member?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to unblock {getDisplayName(selectedRequest)}? 
                Their status will be set to "approved".
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setUnblockDialogOpen(false)}>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleConfirmUnblock}
                className="bg-green-600 hover:bg-green-700 focus:ring-green-500"
              >
                Yes, Unblock Member
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    )
}