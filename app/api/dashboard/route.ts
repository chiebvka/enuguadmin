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

function calculateChange(current: number, past: number): number {
  if (past === 0) return current === 0 ? 0 : 100
  return ((current - past) / past) * 100
}

// Helper function to calculate membership trend for the chart
function calculateMembershipTrend(chartDataForTrend: { month: string, approved: number, pending: number }[]): number | null {
  if (!chartDataForTrend || chartDataForTrend.length < 2) {
    return null;
  }
  // Use the last two available months from the chart data for trend calculation
  const currentMonthData = chartDataForTrend[chartDataForTrend.length - 1];
  const previousMonthData = chartDataForTrend[chartDataForTrend.length - 2];

  if (!currentMonthData || !previousMonthData) return null;

  const currentTotal = (currentMonthData.approved || 0) + (currentMonthData.pending || 0);
  const previousTotal = (previousMonthData.approved || 0) + (previousMonthData.pending || 0);

  if (previousTotal === 0) {
    return currentTotal > 0 ? 100 : 0; // Avoid division by zero, show 100% if current is positive
  }
  
  const trend = ((currentTotal - previousTotal) / previousTotal) * 100;
  return trend;
}

export async function GET(req: NextRequest) {
  const supabase = await createClient()

  const today = new Date()
  // Fetch members created in the last 6 months for the chart
  const startRangeChart = startOfMonth(subMonths(today, 5)) // 5 months ago to include current month (total 6 months)
  const endRangeChart = endOfMonth(today)

  // Fetch members for chart
  const { data: membersForChart, error: membersError } = await supabase
    .from("membership")
    .select("id, created_at, status")
    .gte("created_at", startRangeChart.toISOString())
    .lte("created_at", endRangeChart.toISOString())
    .order("created_at", { ascending: false })

  if (membersError) {
    console.error("Error fetching members:", membersError.message)
    return NextResponse.json({ error: membersError.message }, { status: 500 })
  }


  // Chart data by month (last 6 months)
  const chartData = Array.from({ length: 6 }).map((_, i) => {
    const monthDate = subMonths(today, 5 - i); // 5 - i: 0=>5mo ago, ..., 5=>this month
    const label = format(monthDate, "MMM"); // e.g., Jan, Feb
    const monthStart = startOfMonth(monthDate);
    const monthEnd = endOfMonth(monthDate);

    const membersInMonth = (membersForChart || []).filter((m) =>
      isWithinInterval(parseISO(m.created_at), { start: monthStart, end: monthEnd })
    );

    const approved = membersInMonth.filter((m) => m.status === "approved").length;
    // Consistent with how members page defines pending for its chart
    const pending = membersInMonth.filter(
        (m) => m.status !== "approved" && m.status !== "declined" && m.status !== "blocked"
      ).length;


    return { month: label, approved, pending };
  });
  
  const membershipTrend = calculateMembershipTrend(chartData);

  // Time ranges for trend comparison for cards (remains 1 month vs previous month)
  const now = new Date()
  const oneMonthFromNow = new Date(now)
  oneMonthFromNow.setMonth(now.getMonth() + 1)

  const recentStart = subMonths(now, 1)
  const recentEnd = now
  const pastStart = subMonths(now, 2)
  const pastEnd = subMonths(now, 1)


// Replace "start_date" with "event_date"
const [
    { count: upcomingEvents = 0 },
    { count: previousEvents = 0 },
    { count: recentPosts = 0 },
    { count: pastPosts = 0 },
    { count: approvedCount = 0 },
    { count: recentMembers = 0 },
    { count: pastMembers = 0 },
  ] = await Promise.all([
    supabase
      .from("events")
      .select("*", { count: "exact", head: true })
      .gte("event_date", now.toISOString())
      .lte("event_date", oneMonthFromNow.toISOString()),
  
    supabase
      .from("events")
      .select("*", { count: "exact", head: true })
      .gte("event_date", pastStart.toISOString())
      .lte("event_date", pastEnd.toISOString()),
  
    supabase
      .from("blogposts")
      .select("*", { count: "exact", head: true })
      .gte("created_at", recentStart.toISOString())
      .lte("created_at", recentEnd.toISOString()),
  
    supabase
      .from("blogposts")
      .select("*", { count: "exact", head: true })
      .gte("created_at", pastStart.toISOString())
      .lte("created_at", pastEnd.toISOString()),
  
    supabase
      .from("membership")
      .select("*", { count: "exact", head: true })
      .eq("status", "approved")
      .gte("created_at", recentStart.toISOString())
      .lte("created_at", recentEnd.toISOString()),
  
    supabase
      .from("membership")
      .select("*", { count: "exact", head: true })
      .gte("created_at", recentStart.toISOString())
      .lte("created_at", recentEnd.toISOString()),
  
    supabase
      .from("membership")
      .select("*", { count: "exact", head: true })
      .gte("created_at", pastStart.toISOString())
      .lte("created_at", pastEnd.toISOString()),
  ])  // Parallel counts


//   const [
//     { count: upcomingEvents = 0 },
//     { count: previousEvents = 0 },
//     { count: recentPosts = 0 },
//     { count: pastPosts = 0 },
//     { count: approvedCount = 0 },
//     { count: recentMembers = 0 },
//     { count: pastMembers = 0 },
//   ] = await Promise.all([
//     supabase
//       .from("events")
//       .select("*", { count: "exact", head: true })
//       .gte("start_date", now.toISOString())
//       .lte("start_date", oneMonthFromNow.toISOString()),

//     supabase
//       .from("events")
//       .select("*", { count: "exact", head: true })
//       .gte("start_date", pastStart.toISOString())
//       .lte("start_date", pastEnd.toISOString()),

//     supabase
//       .from("blogposts")
//       .select("*", { count: "exact", head: true })
//       .gte("created_at", recentStart.toISOString())
//       .lte("created_at", recentEnd.toISOString()),

//     supabase
//       .from("blogposts")
//       .select("*", { count: "exact", head: true })
//       .gte("created_at", pastStart.toISOString())
//       .lte("created_at", pastEnd.toISOString()),

//     supabase
//       .from("membership")
//       .select("*", { count: "exact", head: true })
//       .eq("status", "approved")
//       .gte("created_at", recentStart.toISOString())
//       .lte("created_at", recentEnd.toISOString()),

//     supabase
//       .from("membership")
//       .select("*", { count: "exact", head: true })
//       .gte("created_at", recentStart.toISOString())
//       .lte("created_at", recentEnd.toISOString()),

//     supabase
//       .from("membership")
//       .select("*", { count: "exact", head: true })
//       .gte("created_at", pastStart.toISOString())
//       .lte("created_at", pastEnd.toISOString()),
//   ])


  // Metric calculations
  const membershipChange = calculateChange(recentMembers ?? 0, pastMembers ?? 0)
  const eventChange = calculateChange(upcomingEvents ?? 0, previousEvents ?? 0)
  const postChange = calculateChange(recentPosts ?? 0, pastPosts ?? 0)
  const approvalRate = (recentMembers ?? 0) === 0 ? 0 : ((approvedCount ?? 0) / (recentMembers ?? 0)) * 100

  // Fetch upcoming events within the next 30 days
  const { data: upcomingEventsList = [] } = await supabase
    .from("events")
    .select("id, name, event_date, event_time, venue")
    .gte("event_date", now.toISOString())
    .lte("event_date", oneMonthFromNow.toISOString())
    .order("event_date", { ascending: true });

  return NextResponse.json({
    chartData,
    membershipTrend,
    sectionCards: {
      totalMembers: recentMembers,
      upcomingEvents,
      blogPosts: recentPosts,
      growthRate: approvalRate,
      metrics: {
        membershipChange,
        eventChange,
        postChange,
      },
    },
    upcomingEventsList,
  })
}










// import { NextRequest, NextResponse } from "next/server"
// import { createClient } from "@/utils/supabase/server"
// import {
//   startOfMonth,
//   endOfMonth,
//   subMonths,
//   format,
//   parseISO,
//   isWithinInterval,
// } from "date-fns"

// export async function GET(req: NextRequest) {
//   const supabase = await createClient()

//   const today = new Date()
//   const startRange = startOfMonth(subMonths(today, 3))
//   const endRange = endOfMonth(today)

//   const { data: members, error: membersError } = await supabase
//     .from("membership")
//     .select("id, created_at, status")
//     .gte("created_at", startRange.toISOString())
//     .lte("created_at", endRange.toISOString())
//     .order("created_at", { ascending: false })

//   if (membersError) {
//     return NextResponse.json({ error: membersError.message }, { status: 500 })
//   }

//   const chartData = Array.from({ length: 4 }).map((_, i) => {
//     const monthDate = subMonths(today, 3 - i)
//     const label = format(monthDate, "MMMM")
//     const monthStart = startOfMonth(monthDate)
//     const monthEnd = endOfMonth(monthDate)

//     const membersInMonth = members.filter((m) =>
//       isWithinInterval(parseISO(m.created_at), { start: monthStart, end: monthEnd })
//     )

//     const total = membersInMonth.length
//     const pending = membersInMonth.filter((m) => m.status === "pending").length

//     return { month: label, total, pending }
//   })

//   // Time ranges
//   const now = new Date()
//   const oneMonthFromNow = new Date(now)
//   oneMonthFromNow.setMonth(now.getMonth() + 1)

//   const recentStart = subMonths(now, 1)
//   const recentEnd = now

//   const pastStart = subMonths(now, 2)
//   const pastEnd = subMonths(now, 1)

//   // Count queries in parallel
//   const [
//     { count: upcomingEvents = 0 },
//     { count: previousEvents = 0 },
//     { count: recentPosts = 0 },
//     { count: pastPosts = 0 },
//     { count: approvedCount = 0 },
//     { count: recentMembers = 0 },
//     { count: pastMembers = 0 },
//   ] = await Promise.all([
//     supabase
//       .from("events")
//       .select("*", { count: "exact", head: true })
//       .gte("start_date", now.toISOString())
//       .lte("start_date", oneMonthFromNow.toISOString()),

//     supabase
//       .from("events")
//       .select("*", { count: "exact", head: true })
//       .gte("start_date", pastStart.toISOString())
//       .lte("start_date", pastEnd.toISOString()),

//     supabase
//       .from("blogposts")
//       .select("*", { count: "exact", head: true })
//       .gte("created_at", recentStart.toISOString())
//       .lte("created_at", recentEnd.toISOString()),

//     supabase
//       .from("blogposts")
//       .select("*", { count: "exact", head: true })
//       .gte("created_at", pastStart.toISOString())
//       .lte("created_at", pastEnd.toISOString()),

//     supabase
//       .from("membership")
//       .select("*", { count: "exact", head: true })
//       .eq("status", "approved")
//       .gte("created_at", recentStart.toISOString())
//       .lte("created_at", recentEnd.toISOString()),

//     supabase
//       .from("membership")
//       .select("*", { count: "exact", head: true })
//       .gte("created_at", recentStart.toISOString())
//       .lte("created_at", recentEnd.toISOString()),

//     supabase
//       .from("membership")
//       .select("*", { count: "exact", head: true })
//       .gte("created_at", pastStart.toISOString())
//       .lte("created_at", pastEnd.toISOString()),
//   ])

//   // Percent changes
//   const membershipChange =
//     pastMembers === 0 ? 100 : (((recentMembers ?? 0) - (pastMembers ?? 0)) / (pastMembers ?? 0)) * 100

//   const eventChange =
//     (previousEvents ?? 0) === 0 ? 0 : (((upcomingEvents ?? 0) - (previousEvents ?? 0)) / (previousEvents ?? 0)) * 100
//   const postChange =
//     (pastPosts ?? 0) === 0 ? 100 : (((recentPosts ?? 0) - (pastPosts ?? 0)) / (pastPosts ?? 0)) * 100

//   const approvalRate =
//     (recentMembers ?? 0) === 0 ? 0 : ((approvedCount ?? 0) / (recentMembers ?? 0)) * 100

//   return NextResponse.json({
//     chartData,
//     sectionCards: {
//       totalMembers: recentMembers,
//       upcomingEvents,
//       blogPosts: recentPosts,
//       growthRate: approvalRate,
//       metrics: {
//         membershipChange,
//         eventChange,
//         postChange,
//       },
//     },
//   })
// }