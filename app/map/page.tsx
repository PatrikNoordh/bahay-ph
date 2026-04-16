import { createServerSupabaseClient } from "@/lib/supabase";
import { propertyToListing, buildImageMap, buildAgentMap } from "@/lib/listingHelpers";
import { MapScreen } from "@/components/MapScreen";
import type { Property, PropertyImage, Agent } from "@/lib/types";

export default async function MapPage({
  searchParams,
}: {
  searchParams: Promise<{ listingType?: string }>;
}) {
  const { listingType: rawListingType } = await searchParams;
  const listingType =
    rawListingType === "sale" || rawListingType === "rent" ? rawListingType : "all";
  const supabase = await createServerSupabaseClient();

  // Fetch all active listings that have coordinates for the map
  const { data: props } = await supabase
    .from("properties")
    .select("*")
    .eq("status", "active")
    .not("latitude", "is", null)
    .not("longitude", "is", null)
    .order("created_at", { ascending: false });

  const properties = (props ?? []) as Property[];
  const propertyIds = properties.map((p) => p.id);

  // Batch-fetch images and agents
  const { data: imageRows } = propertyIds.length
    ? await supabase
        .from("property_images")
        .select("*")
        .in("property_id", propertyIds)
    : { data: [] as PropertyImage[] };

  const agentIds = [...new Set(properties.map((p) => p.agent_id).filter(Boolean))] as string[];
  const { data: agentRows } = agentIds.length
    ? await supabase
        .from("agents")
        .select("*")
        .in("id", agentIds)
    : { data: [] as Agent[] };

  const imageMap = buildImageMap((imageRows ?? []) as PropertyImage[]);
  const agentMap = buildAgentMap((agentRows ?? []) as Agent[]);

  const listings = properties.map((prop, i) =>
    propertyToListing(prop, imageMap[prop.id] ?? [], agentMap[prop.agent_id ?? ""] ?? null, i)
  );

  return <MapScreen listings={listings} initialListingType={listingType} />;
}
