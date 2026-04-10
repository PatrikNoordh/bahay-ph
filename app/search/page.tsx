import { createServerSupabaseClient } from "@/lib/supabase";
import { propertyToListing } from "@/lib/utils";
import type { PropertyWithAgent } from "@/lib/types";
import { Topbar } from "@/components/Topbar";
import { SearchScreen } from "@/components/SearchScreen";

interface SearchPageProps {
  searchParams: Promise<{ city?: string }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { city } = await searchParams;
  const supabase = await createServerSupabaseClient();

  let query = supabase
    .from("properties")
    .select("*, agent:agents(*)")
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (city) {
    query = query.eq("city", city);
  }

  const { data } = await query;

  const listings = ((data ?? []) as PropertyWithAgent[]).map((p) =>
    propertyToListing(p, p.agent)
  );

  return (
    <div className="min-h-[100dvh] pb-16">
      <Topbar actions={[{ icon: "⚙️", label: "Settings" }]} />
      <SearchScreen listings={listings} />
    </div>
  );
}
