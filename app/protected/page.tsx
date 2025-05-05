import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import Quickactions from "@/components/dashboard/quick-actions";
import { SectionCards } from "@/components/section-cards";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import Upcomingevents from "@/components/upcoming-events";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function ProtectedPage() {

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/dashboard`, {
    headers: {
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
    },
    cache: "no-store",
  });

  const { sectionCards, chartData, upcomingEventsList } = await res.json();
  const { membershipChange, eventChange, postChange } = sectionCards.metrics;


  console.log(chartData, sectionCards);
  return (
    <>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6">
              <SectionCards data={sectionCards} />
              <div className="grid gap-6 px-6 md:grid-cols-2 ">
                <Quickactions />
                <Upcomingevents events={upcomingEventsList} />
              </div>
              <div className="px-4 lg:px-6">
                <ChartAreaInteractive data={chartData} />
              </div>
              {/* <DataTable data={data} /> */}
            </div>
        </div>
        {/* <div className="grid auto-rows-min gap-4 md:grid-cols-3">
          <div className="aspect-video rounded-xl bg-muted/50" />
          <div className="aspect-video rounded-xl bg-muted/50" />
          <div className="aspect-video rounded-xl bg-muted/50" />
        </div>
        <div className="min-h-[100vh] flex-1 rounded-xl bg-muted/50 md:min-h-min" /> */}
      </div>
    </>
  );
}
