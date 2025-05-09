import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import {
  startOfMonth,
  endOfMonth,
  subMonths,
  format,
  parseISO,
  isWithinInterval,
} from "date-fns"

export async function GET(req: NextRequest) {
  const supabase = await createClient()

  // Get current user (admin) - assuming you have a way to get this
  // For now, let's assume it might come from session or be passed if needed for "approved_by" later
  // const { data: { user }, error: userError } = await supabase.auth.getUser();
  // if (userError || !user) {
  //   return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
  // }

  // 1. Fetch all members for overall statistics
  const { data: allMembers, error: allMembersError } = await supabase
    .from("membership")
    .select("id, status, created_at")

  if (allMembersError) {
    return NextResponse.json({ error: allMembersError.message }, { status: 500 })
  }

  const totalApplications = allMembers.length
  const approvedMembersCount = allMembers.filter(
    (m) => m.status === "approved"
  ).length
  const declinedRequestsCount = allMembers.filter(
    (m) => m.status === "declined"
  ).length
  const blockedMembersCount = allMembers.filter(
    (m) => m.status === "blocked"
  ).length

  // 2. Fetch members for the last 6 months for chart data
  const today = new Date()
  const startRange6Months = startOfMonth(subMonths(today, 5)) // 5 months ago to include current month (total 6 months)
  const endRange6Months = endOfMonth(today)

  const { data: recentMembers, error: recentMembersError } = await supabase
    .from("membership")
    .select("id, created_at, status")
    .gte("created_at", startRange6Months.toISOString())
    .lte("created_at", endRange6Months.toISOString())
    .order("created_at", { ascending: true })

  if (recentMembersError) {
    return NextResponse.json(
      { error: recentMembersError.message },
      { status: 500 }
    )
  }

  // 3. Chart data by month (last 6 months)
  const memberChartData = Array.from({ length: 6 }).map((_, i) => {
    const monthDate = subMonths(today, 5 - i) // 5-i: 0=>5mo ago, 1=>4mo ago, ..., 5=>this month
    const label = format(monthDate, "MMM") // e.g., Jan, Feb
    const monthStart = startOfMonth(monthDate)
    const monthEnd = endOfMonth(monthDate)

    const membersInMonth = recentMembers.filter((m) =>
      isWithinInterval(parseISO(m.created_at), {
        start: monthStart,
        end: monthEnd,
      })
    )

    const approved = membersInMonth.filter(
      (m) => m.status === "approved"
    ).length
    const pending = membersInMonth.filter(
      (m) => m.status !== "approved" && m.status !== "declined" && m.status !== "blocked"
    ).length

    return { month: label, approved, pending }
  })

  // 4. Fetch detailed member list for display (e.g., pending members)
  // This might be paginated or filtered on the client-side, or you can add params here
  const { data: memberList, error: memberListError } = await supabase
    .from("membership")
    .select("*") // Select all columns for the list
    .order("created_at", { ascending: false }) // Example: show newest first

  if (memberListError) {
    return NextResponse.json(
      { error: memberListError.message },
      { status: 500 }
    )
  }

  return NextResponse.json({
    stats: {
      totalApplications,
      approvedMembers: approvedMembersCount,
      declinedRequests: declinedRequestsCount,
      blockedMembers: blockedMembersCount,
    },
    chartData: memberChartData,
    members: memberList, // Full list of members for the table
  })
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 })
  }

  try {
    const { memberId, status, denialReason } = await req.json()

    if (!memberId || !status) {
      return NextResponse.json(
        { error: "Member ID and status are required" },
        { status: 400 }
      )
    }

    if (typeof memberId !== 'number') {
      return NextResponse.json(
        { error: "Invalid Member ID format. Expected a number." },
        { status: 400 }
      );
    }

    if (status !== "approved" && status !== "declined" && status !== "blocked") {
      return NextResponse.json(
        { error: "Invalid status value. Must be 'approved', 'declined', or 'blocked'." },
        { status: 400 }
      )
    }

    if (status === "declined" && (!denialReason || typeof denialReason !== 'string' || denialReason.trim() === "")) {
      return NextResponse.json(
        { error: "Denial reason is required and must be a non-empty string when declining" },
        { status: 400 }
      )
    }

    let updateData: any = {
      status: status,
    }
    const now = new Date().toISOString()

    if (status === "approved") {
      updateData.approved_by = user.id
      updateData.approved_on = now
      updateData.denied_by = null 
      updateData.denied_on = null
      updateData.denial_reason = null
      updateData.blocked_by = null
      updateData.blocked_on = null
    } else if (status === "declined") {
      updateData.denied_by = user.id
      updateData.denied_on = now
      updateData.denial_reason = denialReason
      updateData.approved_by = null 
      updateData.approved_on = null
      updateData.blocked_by = null
      updateData.blocked_on = null
    } else if (status === "blocked") {
      updateData.blocked_by = user.id
      updateData.blocked_on = now
      updateData.approved_by = null 
      updateData.approved_on = null
      updateData.denied_by = null
      updateData.denied_on = null
      updateData.denial_reason = null
    }

    const { data, error } = await supabase
      .from("membership")
      .update(updateData)
      .eq("id", memberId)
      .select()
      .single()

    if (error) {
      console.error("Error updating membership:", error)
      if (error.code === 'PGRST116') { 
        return NextResponse.json(
          { error: `Membership record with ID ${memberId} not found or no update was needed.` },
          { status: 404 }
        );
      }
      return NextResponse.json({ error: "Failed to update membership: " + error.message }, { status: 500 })
    }

    return NextResponse.json({ message: `Membership status updated to ${status} successfully`, data })
  } catch (e: any) {
    console.error("Error parsing request body or unexpected error in PATCH:", e)
    if (e instanceof SyntaxError) {
        return NextResponse.json({ error: "Invalid JSON in request body" }, { status: 400 });
    }
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}
