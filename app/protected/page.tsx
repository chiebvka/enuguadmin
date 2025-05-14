import Quickactions from "@/components/dashboard/quick-actions";
import { SectionCards } from "@/components/section-cards";
import Upcomingevents from "@/components/upcoming-events";
import UpcomingBirthdays from "@/components/upcoming-birthdays";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import DashboardChart from "./_components/dashboard-chart";

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

  const { sectionCards, upcomingEventsList, upcomingBirthdaysList } = await res.json();

  return (
    <>
      <div className="flex flex-1 flex-col px-2 py-4 pt-0 sm:p-4 sm:pt-0">
        <Quickactions />
        <div className="@container/main flex flex-1 flex-col gap-2 pt-4">
            <div className="flex flex-col gap-4 md:gap-6">
              <SectionCards data={sectionCards} />
    
              {/* Combined grid for Chart, Events, and Birthdays */}
              <div className="grid grid-cols-1 gap-4 px-0 sm:px-2 md:gap-6 md:grid-cols-3 lg:px-0">
                <DashboardChart />
                <Upcomingevents events={upcomingEventsList} />
                <UpcomingBirthdays birthdays={upcomingBirthdaysList} />
              </div>
        
              {/* <DataTable data={data} /> */}
            </div>
        </div>
      </div>
    </>
  );
}
