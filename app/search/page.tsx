import { Suspense } from "react";
import { createServerSupabaseClient } from "@/lib/supabase";
import { propertyToListing, buildImageMap, buildAgentMap } from "@/lib/listingHelpers";
import { Topbar } from "@/components/Topbar";
import { SearchScreen } from "@/components/SearchScreen";
import type { Property, PropertyImage, Agent, PropertyType } from "@/lib/types";

// AC1 — 20 results per page
const PAGE_SIZE = 20;

interface SearchPageProps {
  searchParams: Promise<{
    q?: string;
    type?: string;
    listingType?: string;
    priceMin?: string;
    priceMax?: string;
    beds?: string;
    sort?: string;
    city?: string;
    page?: string;
  }>;
}

const VALID_TYPES: PropertyType[] = [
  "house",
  "condo",
  "lot",
  "townhouse",
  "commercial",
];

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const p = await searchParams;
  const supabase = await createServerSupabaseClient();

  // Validate params — invalid values are silently ignored
  const typeParam = VALID_TYPES.includes(p.type as PropertyType)
    ? (p.type as PropertyType)
    : undefined;

  const page = Math.max(1, parseInt(p.page ?? "1", 10));
  const priceMin = parseInt(p.priceMin ?? "", 10);
  const priceMax = parseInt(p.priceMax ?? "", 10);
  const minBeds = parseInt(p.beds ?? "", 10);

  // Build Supabase query with all filters applied server-side
  let query = supabase
    .from("properties")
    .select("*", { count: "exact" })
    .eq("status", "active");

  // Text search across title, description, city, address
  if (p.q?.trim()) {
    const q = p.q.trim();
    query = query.or(
      `title.ilike.%${q}%,description.ilike.%${q}%,city.ilike.%${q}%,address.ilike.%${q}%`
    );
  }

  // City filter
  if (p.city?.trim()) {
    query = query.ilike("city", `%${p.city.trim()}%`);
  }

  // Property type filter
  if (typeParam) {
    query = query.eq("property_type", typeParam);
  }

  // Listing type filter (sale / rent)
  if (p.listingType === "sale") {
    query = query.eq("price_type", "sale");
  } else if (p.listingType === "rent") {
    query = query.eq("price_type", "rent");
  }

  // Minimum beds filter
  if (!isNaN(minBeds) && minBeds > 0) {
    query = query.gte("bedrooms", minBeds);
  }

  // Price range filter — uses numeric price column
  if (!isNaN(priceMin)) {
    query = query.gte("price", priceMin);
  }
  if (!isNaN(priceMax)) {
    query = query.lte("price", priceMax);
  }

  // Sort
  if (p.sort === "price_asc") {
    query = query.order("price", { ascending: true });
  } else if (p.sort === "price_desc") {
    query = query.order("price", { ascending: false });
  } else {
    // Default: newest first
    query = query.order("created_at", { ascending: false });
  }

  // Pagination: return up to page * PAGE_SIZE results (cumulative load-more)
  query = query.range(0, page * PAGE_SIZE - 1);

  const { data: props, count, error } = await query;

  const properties = (error ? [] : (props ?? [])) as Property[];
  const totalCount = count ?? 0;

  // Batch-fetch images and agents for the result set
  const propertyIds = properties.map((p) => p.id);
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

  return (
    <div className="min-h-[100dvh] pb-16">
      <Topbar actions={[{ icon: "⚙️", label: "Settings" }]} />

      <Suspense
        fallback={
          <div className="px-4 pt-8 text-center text-sm text-muted">
            Loading…
          </div>
        }
      >
        <SearchScreen listings={listings} totalCount={totalCount} currentPage={page} />
      </Suspense>
    </div>
  );
}
