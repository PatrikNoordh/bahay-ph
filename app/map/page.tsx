import { createServerSupabaseClient } from "@/lib/supabase";
import { propertyToListing } from "@/lib/utils";
import type { PropertyWithAgent } from "@/lib/types";
import { MapScreen } from "@/components/MapScreen";

export default async function MapPage() {
  const supabase = await createServerSupabaseClient();

  // Fetch active properties with lat/lng for map pin rendering
  const { data } = await supabase
    .from("properties")
    .select("*, agent:agents(*)")
    .eq("status", "active")
    .not("latitude", "is", null)
    .not("longitude", "is", null);

  const listings = ((data ?? []) as PropertyWithAgent[]).map((p) =>
    propertyToListing(p, p.agent)
  );

  return <MapScreen listings={listings} />;
}
