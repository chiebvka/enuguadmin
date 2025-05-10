import { createClient } from "@/utils/supabase/server";
import Memberfeedwizard from './_components/member-feed-wizard'

export default async function Page() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("membership_feed")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(5);

  const posts = data ?? [];

  return (
    <div>
      <Memberfeedwizard posts={posts} />
    </div>
  )
}