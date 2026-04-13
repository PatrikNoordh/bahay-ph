import { Suspense } from "react";
import { MOCK_LISTINGS } from "@/lib/mockListings";
import { Topbar } from "@/components/Topbar";
import { SearchScreen } from "@/components/SearchScreen";
import type { Listing, PropertyType } from "@/lib/types";

// TODO: connect to Supabase — replace mock filtering with createServerSupabaseClient query
// e.g. supabase.from("properties").select("*, property_images(*)").eq("type", type)...

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

// Parse "₱18,500,000" → 18500000; "₱25,000/mo" → 25000
// TODO: remove when Supabase returns numeric price column
function parseMockPrice(formatted: string): number {
  return parseInt(formatted.replace(/[₱,]/g, "").split("/")[0], 10) || 0;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const p = await searchParams;

  // Validate params — invalid values are silently ignored (AC edge case)
  const typeParam = VALID_TYPES.includes(p.type as PropertyType)
    ? (p.type as PropertyType)
    : undefined;

  // TODO: connect to Supabase — replace all filtering below with a single server query
  let listings: Listing[] = MOCK_LISTINGS;

  // Text search (q)
  if (p.q?.trim()) {
    const q = p.q.toLowerCase();
    listings = listings.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.location.toLowerCase().includes(q) ||
        l.description.toLowerCase().includes(q) ||
        l.tags.some((t) => t.toLowerCase().includes(q))
    );
  }

  // City filter
  if (p.city?.trim()) {
    const city = p.city.toLowerCase();
    listings = listings.filter((l) =>
      l.location.toLowerCase().includes(city)
    );
  }

  // Property type filter
  if (typeParam) {
    listings = listings.filter((l) => l.type === typeParam);
  }

  // Listing type filter (sale / rent)
  if (p.listingType === "sale") {
    listings = listings.filter(
      (l) => l.badge === "For Sale" || l.badge === "New"
    );
  } else if (p.listingType === "rent") {
    listings = listings.filter((l) => l.badge === "For Rent");
  }

  // Beds filter (minimum)
  const minBeds = parseInt(p.beds ?? "", 10);
  if (!isNaN(minBeds) && minBeds > 0) {
    listings = listings.filter(
      (l) => l.beds !== null && l.beds >= minBeds
    );
  }

  // Price range filter — uses parsed mock price string
  // TODO: connect to Supabase — use .gte("price", priceMin).lte("price", priceMax)
  const priceMin = parseInt(p.priceMin ?? "", 10);
  const priceMax = parseInt(p.priceMax ?? "", 10);
  if (!isNaN(priceMin)) {
    listings = listings.filter((l) => parseMockPrice(l.price) >= priceMin);
  }
  if (!isNaN(priceMax)) {
    listings = listings.filter((l) => parseMockPrice(l.price) <= priceMax);
  }

  // Sort — TODO: connect to Supabase — use .order("created_at") or .order("price")
  if (p.sort === "price_asc") {
    listings = [...listings].sort(
      (a, b) => parseMockPrice(a.price) - parseMockPrice(b.price)
    );
  } else if (p.sort === "price_desc") {
    listings = [...listings].sort(
      (a, b) => parseMockPrice(b.price) - parseMockPrice(a.price)
    );
  }
  // Default "newest" — MOCK_LISTINGS are already in newest-first order

  // AC1/AC5 — Paginate: ?page=1 shows first PAGE_SIZE, ?page=2 shows 2×PAGE_SIZE, etc.
  // TODO: connect to Supabase — use .range(0, page * PAGE_SIZE - 1) with count option
  const totalCount = listings.length;
  const page = Math.max(1, parseInt(p.page ?? "1", 10));
  const pagedListings = listings.slice(0, page * PAGE_SIZE);

  return (
    <div className="min-h-[100dvh] pb-16">
      {/* AC5 — Topbar with settings icon on right */}
      <Topbar actions={[{ icon: "⚙️", label: "Settings" }]} />

      {/* Suspense required for useSearchParams() inside SearchScreen */}
      <Suspense
        fallback={
          <div className="px-4 pt-8 text-center text-sm text-muted">
            Loading…
          </div>
        }
      >
        {/* All search interactivity lives in the Client Component */}
        <SearchScreen listings={pagedListings} totalCount={totalCount} currentPage={page} />
      </Suspense>
    </div>
  );
}
