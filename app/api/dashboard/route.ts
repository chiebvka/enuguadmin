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

export async function GET(req: NextRequest) {
  const supabase = await createClient()

  const today = new Date()
  const startRange = startOfMonth(subMonths(today, 3))
  const endRange = endOfMonth(today)

  // Fetch members created in the last 4 months
  const { data: members, error: membersError } = await supabase
    .from("membership")
    .select("id, created_at, status")
    .gte("created_at", startRange.toISOString())
    .lte("created_at", endRange.toISOString())
    .order("created_at", { ascending: false })

  if (membersError) {
    return NextResponse.json({ error: membersError.message }, { status: 500 })
  }

  // Chart data by month (last 3 months)
  const chartData = Array.from({ length: 3 }).map((_, i) => {
    const monthDate = subMonths(today, 2 - i); // 2 - i: 0=>2mo ago, 1=>1mo ago, 2=>this month
    const label = format(monthDate, "MMMM");
    const monthStart = startOfMonth(monthDate);
    const monthEnd = endOfMonth(monthDate);

    const membersInMonth = members.filter((m) =>
      isWithinInterval(parseISO(m.created_at), { start: monthStart, end: monthEnd })
    );

    const approved = membersInMonth.filter((m) => m.status === "approved").length;
    const pending = membersInMonth.length - approved;

    return { month: label, approved, pending };
  });

  // Time ranges for trend comparison
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