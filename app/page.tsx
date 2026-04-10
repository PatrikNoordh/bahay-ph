import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase";
import { propertyToListing } from "@/lib/utils";
import type { PropertyWithAgent } from "@/lib/types";
import { PropertyCard } from "@/components/PropertyCard";
import { AnimateIn } from "@/components/ui/AnimateIn";
import { FilterTabs } from "@/components/FilterTabs";
import { Topbar } from "@/components/Topbar";

const AREA_CHIP_DEFS = [
  { emoji: "🏙️", name: "Cebu City" },
  { emoji: "🌴", name: "Cordova" },
  { emoji: "🏭", name: "Mandaue City" },
  { emoji: "✈️", name: "Mactan Island" },
  { emoji: "🐟", name: "Lapu-Lapu City" },
  { emoji: "🏘️", name: "Talisay City" },
];

export default async function Home() {
  const supabase = await createServerSupabaseClient();

  // Featured listings — is_featured=true, status=active
  const { data: featuredData } = await supabase
    .from("properties")
    .select("*, agent:agents(*)")
    .eq("status", "active")
    .eq("is_featured", true)
    .limit(3);

  // Recent active listings for the New Listings grid
  const { data: allData } = await supabase
    .from("properties")
    .select("*, agent:agents(*)")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(20);

  // City-level counts for area chips and stats strip
  const { data: cityData } = await supabase
    .from("properties")
    .select("city")
    .eq("status", "active");

  // Agent count for stats strip
  const { count: agentCount } = await supabase
    .from("agents")
    .select("id", { count: "exact", head: true })
    .eq("is_verified", true);

  const featured = ((featuredData ?? []) as PropertyWithAgent[]).map((p) =>
    propertyToListing(p, p.agent)
  );

  const allListings = ((allData ?? []) as PropertyWithAgent[]).map((p) =>
    propertyToListing(p, p.agent)
  );

  const cityCounts = (cityData ?? []).reduce<Record<string, number>>(
    (acc, { city }) => {
      acc[city] = (acc[city] ?? 0) + 1;
      return acc;
    },
    {}
  );
  const totalActive = cityData?.length ?? 0;

  const areaChips = AREA_CHIP_DEFS.map(({ emoji, name }) => ({
    emoji,
    name,
    count: cityCounts[name] ?? 0,
  }));

  return (
    <div className="pb-16">
      <Topbar actions={[{ icon: "👤", label: "Profile", href: "/profile" }]} />

      {/* Hero */}
      <AnimateIn delay={0} className="mx-3 mt-3">
        <div className="rounded-[20px] bg-gradient-to-br from-primary via-primary-light to-primary/80 px-4 pt-5 pb-4">
          <p className="text-white/80 text-xs font-body mb-1">🌴 Maayong buntag!</p>
          <h1 className="font-display text-2xl font-bold text-white leading-snug mb-4">
            Find your home<br />in Cebu
          </h1>
          <Link
            href="/search"
            className="flex items-center gap-2 bg-white rounded-[12px] px-3 py-2.5 mb-4"
          >
            <span className="text-muted text-sm" aria-hidden="true">🔍</span>
            <span className="text-muted text-sm flex-1">Search Cebu listings...</span>
          </Link>
          <div className="flex gap-2 flex-wrap">
            {["Cebu City", "Mandaue City", "Lapu-Lapu City", "Talisay City"].map((area) => (
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

      {/* Stats Strip */}
      <AnimateIn delay={50} className="mx-3 mt-3">
        <div className="bg-white rounded-[14px] shadow-[var(--shadow-card)] px-4 py-3 flex justify-around">
          {[
            { value: String(totalActive), label: "Active Listings" },
            { value: String(Object.keys(cityCounts).length || "—"), label: "Cities" },
            { value: String(agentCount ?? "—"), label: "Trusted Agents" },
          ].map(({ value, label }) => (
            <div key={label} className="text-center">
              <p className="text-lg font-bold text-narra font-display">{value}</p>
              <p className="text-[10px] text-muted leading-tight mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </AnimateIn>

      {/* Browse by Area */}
      <AnimateIn delay={100} className="mt-5">
        <div className="flex items-center justify-between px-4 mb-2">
          <h2 className="font-display font-semibold text-base text-narra">Browse by Area</h2>
          <Link href="/search" className="text-xs text-primary font-medium">
            See all
          </Link>
        </div>
        <div className="flex gap-2 overflow-x-auto px-4 pb-1 no-scrollbar">
          {areaChips.map(({ emoji, name, count }) => (
            <Link
              key={name}
              href={`/search?city=${encodeURIComponent(name)}`}
              className="flex-shrink-0 flex items-center gap-1.5 bg-white rounded-full px-3 py-2 shadow-[var(--shadow-card)] active:scale-[0.97] transition-transform duration-150"
            >
              <span className="text-sm" aria-hidden="true">{emoji}</span>
              <span className="text-xs font-medium text-narra">{name}</span>
              {count > 0 && (
                <span className="text-[10px] text-white bg-primary rounded-full px-1.5 py-0.5 font-semibold leading-none">
                  {count}
                </span>
              )}
            </Link>
          ))}
        </div>
      </AnimateIn>

      {/* Featured Listings */}
      {featured.length > 0 && (
        <AnimateIn delay={150} className="mt-5">
          <div className="flex items-center justify-between px-4 mb-2">
            <h2 className="font-display font-semibold text-base text-narra">Featured</h2>
            <Link href="/search" className="text-xs text-primary font-medium">
              See all
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto px-4 pb-2 snap-x snap-mandatory no-scrollbar">
            {featured.map((listing) => (
              <PropertyCard key={listing.id} listing={listing} variant="featured" />
            ))}
          </div>
        </AnimateIn>
      )}

      {/* New Listings */}
      <AnimateIn delay={200} className="mt-5">
        <div className="flex items-center justify-between px-4 mb-3">
          <h2 className="font-display font-semibold text-base text-narra">New Listings</h2>
          <Link href="/search" className="text-xs text-primary font-medium">
            See all
          </Link>
        </div>
        {allListings.length > 0 ? (
          <FilterTabs listings={allListings} />
        ) : (
          <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
            <p className="text-4xl mb-3" aria-hidden="true">🏠</p>
            <p className="font-semibold text-narra mb-1">No listings yet</p>
            <p className="text-sm text-muted">Check back soon for new properties in Cebu.</p>
          </div>
        )}
      </AnimateIn>
    </div>
  );
}
