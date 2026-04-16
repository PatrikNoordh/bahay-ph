import { Suspense } from "react";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase";
import { propertyToListing, buildImageMap, buildAgentMap } from "@/lib/listingHelpers";
import { PropertyCard } from "@/components/PropertyCard";
import { AnimateIn } from "@/components/ui/AnimateIn";
import { FilterTabs } from "@/components/FilterTabs";
import { Topbar } from "@/components/Topbar";
import type { Property, PropertyImage, Agent } from "@/lib/types";

const AREA_CHIPS = [
  { emoji: "🏙️", name: "Cebu City", count: 124 },
  { emoji: "🌴", name: "Cordova", count: 18 },
  { emoji: "🏭", name: "Mandaue", count: 42 },
  { emoji: "✈️", name: "Mactan", count: 31 },
  { emoji: "🐟", name: "Lapu-Lapu", count: 27 },
  { emoji: "🏘️", name: "Talisay", count: 6 },
];

export default async function Home() {
  const supabase = await createServerSupabaseClient();

  // Fetch featured listings, featured rentals, and newest listings in parallel
  const [
    { data: featuredProps },
    { data: featuredRentalProps },
    { data: newProps },
  ] = await Promise.all([
    supabase
      .from("properties")
      .select("*")
      .eq("status", "active")
      .eq("is_featured", true)
      .order("created_at", { ascending: false })
      .limit(6),
    // AC2 — featured rentals: is_featured=true AND price_type=rent
    supabase
      .from("properties")
      .select("*")
      .eq("status", "active")
      .eq("is_featured", true)
      .eq("price_type", "rent")
      .order("created_at", { ascending: false })
      .limit(6),
    supabase
      .from("properties")
      .select("*")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(12),
  ]);

  const allProps = [
    ...(featuredProps ?? []),
    ...(featuredRentalProps ?? []),
    ...(newProps ?? []),
  ] as Property[];

  // De-duplicate so we don't double-fetch images for featured that also appear in new
  const uniqueIds = [...new Set(allProps.map((p) => p.id))];

  // Batch-fetch images and agents for all properties in two queries
  const { data: imageRows } = uniqueIds.length
    ? await supabase
        .from("property_images")
        .select("*")
        .in("property_id", uniqueIds)
    : { data: [] as PropertyImage[] };

  const agentIds = [...new Set(allProps.map((p) => p.agent_id).filter(Boolean))] as string[];
  const { data: agentRows } = agentIds.length
    ? await supabase
        .from("agents")
        .select("*")
        .in("id", agentIds)
    : { data: [] as Agent[] };

  const imageMap = buildImageMap((imageRows ?? []) as PropertyImage[]);
  const agentMap = buildAgentMap((agentRows ?? []) as Agent[]);

  const featuredListings = (featuredProps ?? [] as Property[]).map((p, i) =>
    propertyToListing(p as Property, imageMap[p.id] ?? [], agentMap[p.agent_id ?? ""] ?? null, i)
  );

  // AC2 — featured rental listings for the dedicated section
  const featuredRentalListings = (featuredRentalProps ?? [] as Property[]).map((p, i) =>
    propertyToListing(p as Property, imageMap[p.id] ?? [], agentMap[p.agent_id ?? ""] ?? null, i)
  );

  const newListings = (newProps ?? [] as Property[]).map((p, i) =>
    propertyToListing(p as Property, imageMap[p.id] ?? [], agentMap[p.agent_id ?? ""] ?? null, i)
  );

  return (
    // AC8 — bottom padding to clear BottomNav
    <div className="pb-16">
      {/* Topbar */}
      <Topbar actions={[{ icon: "👤", label: "Profile", href: "/profile" }]} />

      {/* ── AC1: Hero ──────────────────────────────────────────── */}
      <AnimateIn delay={0} className="mx-3 mt-3">
        <div className="rounded-[20px] bg-gradient-to-br from-primary via-primary-light to-primary/80 px-4 pt-5 pb-4">
          <p className="text-white/80 text-xs font-body mb-1">🌴 Maayong buntag!</p>
          <h1 className="font-display text-2xl font-bold text-white leading-snug mb-4">
            Find your home<br />in Cebu
          </h1>

          {/* AC7 — tappable search bar navigates to /search */}
          <Link
            href="/search"
            className="flex items-center gap-2 bg-white rounded-[12px] px-3 py-2.5 mb-4"
          >
            <span className="text-muted text-sm" aria-hidden="true">🔍</span>
            <span className="text-muted text-sm flex-1">Search Cebu listings...</span>
          </Link>

          {/* AC1 + AC7 — 4 area quick-filter tags */}
          <div className="flex gap-2 flex-wrap">
            {["Cebu City", "Mandaue", "Lapu-Lapu", "Talisay"].map((area) => (
              <Link
                key={area}
                href={`/search?city=${encodeURIComponent(area)}`}
                className="bg-white/20 text-white text-xs rounded-full px-3 py-1 font-medium active:scale-[0.95] transition-transform duration-100"
              >
                {area}
              </Link>
            ))}
          </div>
        </div>
      </AnimateIn>

      {/* ── AC2: Stats Strip ───────────────────────────────────── */}
      <AnimateIn delay={50} className="mx-3 mt-3">
        {/* TODO: connect to Supabase — real counts via COUNT queries */}
        <div className="bg-white rounded-[14px] shadow-[var(--shadow-card)] px-4 py-3 flex justify-around">
          {[
            { value: "248", label: "Active Listings" },
            { value: "12", label: "Cities" },
            { value: "45", label: "Trusted Agents" },
          ].map(({ value, label }) => (
            <div key={label} className="text-center">
              <p className="text-lg font-bold text-narra font-display">{value}</p>
              <p className="text-[10px] text-muted leading-tight mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </AnimateIn>

      {/* ── AC3: Browse by Area ────────────────────────────────── */}
      <AnimateIn delay={100} className="mt-5">
        <div className="flex items-center justify-between px-4 mb-2">
          <h2 className="font-display font-semibold text-base text-narra">Browse by Area</h2>
          {/* AC7 — See all → /search */}
          <Link href="/search" className="text-xs text-primary font-medium">
            See all
          </Link>
        </div>
        {/* TODO: connect to Supabase — real listing counts per city */}
        <div className="flex gap-2 overflow-x-auto px-4 pb-1 no-scrollbar">
          {AREA_CHIPS.map(({ emoji, name, count }) => (
            <Link
              key={name}
              href={`/search?city=${encodeURIComponent(name)}`}
              className="flex-shrink-0 flex items-center gap-1.5 bg-white rounded-full px-3 py-2 shadow-[var(--shadow-card)] active:scale-[0.97] transition-transform duration-150"
            >
              <span className="text-sm" aria-hidden="true">{emoji}</span>
              <span className="text-xs font-medium text-narra">{name}</span>
              <span className="text-[10px] text-white bg-primary rounded-full px-1.5 py-0.5 font-semibold leading-none">
                {count}
              </span>
            </Link>
          ))}
        </div>
      </AnimateIn>

      {/* ── AC4: Featured Listings ─────────────────────────────── */}
      <AnimateIn delay={150} className="mt-5">
        <div className="flex items-center justify-between px-4 mb-2">
          <h2 className="font-display font-semibold text-base text-narra">Featured</h2>
          <Link href="/search" className="text-xs text-primary font-medium">
            See all
          </Link>
        </div>
        {featuredListings.length > 0 ? (
          <div className="flex gap-3 overflow-x-auto px-4 pb-2 snap-x snap-mandatory no-scrollbar">
            {featuredListings.map((listing) => (
              <PropertyCard key={listing.id} listing={listing} variant="featured" />
            ))}
          </div>
        ) : (
          // Fallback: if no featured listings, show newest instead
          newListings.length > 0 ? (
            <div className="flex gap-3 overflow-x-auto px-4 pb-2 snap-x snap-mandatory no-scrollbar">
              {newListings.slice(0, 3).map((listing) => (
                <PropertyCard key={listing.id} listing={listing} variant="featured" />
              ))}
            </div>
          ) : null
        )}
      </AnimateIn>

      {/* ── AC1: Featured Rentals ─────────────────────────────── */}
      {/* AC3 — section hidden entirely when no featured rentals exist */}
      {featuredRentalListings.length > 0 && (
        <AnimateIn delay={200} className="mt-5">
          <div className="flex items-center justify-between px-4 mb-2">
            <h2 className="font-display font-semibold text-base text-narra">Featured Rentals</h2>
            <Link href="/search?listingType=rent" className="text-xs text-ocean font-medium">
              See all
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto px-4 pb-2 snap-x snap-mandatory no-scrollbar">
            {featuredRentalListings.map((listing) => (
              <PropertyCard key={listing.id} listing={listing} variant="featured" />
            ))}
          </div>
        </AnimateIn>
      )}

      {/* ── AC5: New Listings (filter tabs + grid) ─────────────── */}
      <AnimateIn delay={250} className="mt-5">
        <div className="flex items-center justify-between px-4 mb-3">
          <h2 className="font-display font-semibold text-base text-narra">New Listings</h2>
          <Link href="/search" className="text-xs text-primary font-medium">
            See all
          </Link>
        </div>
        {newListings.length > 0 ? (
          <Suspense fallback={<div className="h-[200px] bg-sand animate-pulse rounded-[14px] mx-4" />}>
            <FilterTabs listings={newListings} limit={12} />
          </Suspense>
        ) : (
          <div className="px-4 py-8 text-center text-sm text-muted">
            No listings yet — check back soon
          </div>
        )}
      </AnimateIn>
    </div>
  );
}
