import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import {
  startOfMonth,
  endOfMonth,
  subMonths,
  format,
  parseISO,
  isWithinInterval,
  addDays,
  startOfDay,
  isToday as dateFnsIsToday,
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
    { data: approvedMembersForBirthdays, error: approvedMembersError },
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
    // Fetch approved members for birthday calculation
    supabase
      .from("membership")
      .select("id, first_name, last_name, dob_day, dob_month")
      .eq("status", "approved"),
  ])

  if (approvedMembersError) {
    console.error("Error fetching approved members for birthdays:", approvedMembersError.message)
    // Decide if this error is critical or if you can proceed without birthday data
  }

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

  // Calculate upcoming birthdays
  const currentDateNormalized = startOfDay(now)
  const thirtyDaysFromNow = addDays(currentDateNormalized, 30)

  const upcomingBirthdaysList = (approvedMembersForBirthdays || [])
    .map((member) => {
      if (!member.dob_day || !member.dob_month) return null

      const day = parseInt(member.dob_day, 10)
      let monthIndex = -1

      const monthNum = parseInt(member.dob_month, 10)
      if (!isNaN(monthNum) && monthNum >= 1 && monthNum <= 12) {
        monthIndex = monthNum - 1 // 0-indexed for Date constructor
      } else {
        const monthNames = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"]
        const shortMonthNames = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"]
        const lowerMonth = member.dob_month.toLowerCase()
        monthIndex = monthNames.indexOf(lowerMonth)
        if (monthIndex === -1) {
          monthIndex = shortMonthNames.indexOf(lowerMonth)
        }
      }

      if (isNaN(day) || day < 1 || day > 31 || monthIndex === -1) {
        return null // Invalid date parts
      }

      const currentYear = currentDateNormalized.getFullYear()
      
      let birthdayCurrentYear = new Date(currentYear, monthIndex, day) // Not using startOfDay here for direct isToday check
      let birthdayNextYear = new Date(currentYear + 1, monthIndex, day)

      let actualBirthdayDateForRangeCheck: Date | null = null
      let isBirthdayToday = false

      // Check if birthday (current year) is today
      if (dateFnsIsToday(birthdayCurrentYear)) {
        isBirthdayToday = true;
        actualBirthdayDateForRangeCheck = startOfDay(birthdayCurrentYear); // Use for range check
      }

      // If not today, check if it's within the 30-day range
      if (!actualBirthdayDateForRangeCheck) {
        const bdCurrentYearNormalized = startOfDay(birthdayCurrentYear);
        if (isWithinInterval(bdCurrentYearNormalized, { start: currentDateNormalized, end: thirtyDaysFromNow })) {
          actualBirthdayDateForRangeCheck = bdCurrentYearNormalized
        } else {
          const bdNextYearNormalized = startOfDay(birthdayNextYear);
          if (isWithinInterval(bdNextYearNormalized, { start: currentDateNormalized, end: thirtyDaysFromNow })) {
            actualBirthdayDateForRangeCheck = bdNextYearNormalized;
          }
        }
      }
      
      if (actualBirthdayDateForRangeCheck) {
        return {
          id: member.id,
          first_name: member.first_name,
          last_name: member.last_name,
          dob_day: member.dob_day,
          dob_month: member.dob_month,
          isBirthdayToday: isBirthdayToday, // Add this flag
          birthday_date_for_sort: actualBirthdayDateForRangeCheck,
        }
      }
      return null
    })
    .filter(Boolean) // Remove nulls
    .sort((a: any, b: any) => {
      // Prioritize today's birthdays first, then sort by date
      if (a.isBirthdayToday && !b.isBirthdayToday) return -1;
      if (!a.isBirthdayToday && b.isBirthdayToday) return 1;
      return a.birthday_date_for_sort.getTime() - b.birthday_date_for_sort.getTime();
    }) 
    .map((b: any) => ({ 
        id: b.id,
        name: `${b.first_name || ""} ${b.last_name || ""}`.trim(),
        dob_day: b.dob_day,
        dob_month: b.dob_month,
        isBirthdayToday: b.isBirthdayToday,
    }));

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
    upcomingBirthdaysList,
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