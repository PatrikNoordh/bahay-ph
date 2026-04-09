import Link from "next/link";
import { MOCK_LISTINGS } from "@/lib/mockListings";
import { PropertyCard } from "@/components/PropertyCard";
import { AnimateIn } from "@/components/ui/AnimateIn";
import { FilterTabs } from "@/components/FilterTabs";
import { Topbar } from "@/components/Topbar";

// TODO: Replace MOCK_LISTINGS with Supabase server-side queries (Phase 2 — AC9–AC14)

const AREA_CHIPS = [
  { emoji: "🏙️", name: "Cebu City", count: 124 },
  { emoji: "🌴", name: "Cordova", count: 18 },
  { emoji: "🏭", name: "Mandaue", count: 42 },
  { emoji: "✈️", name: "Mactan", count: 31 },
  { emoji: "🐟", name: "Lapu-Lapu", count: 27 },
  { emoji: "🏘️", name: "Talisay", count: 6 },
];

// TODO: connect to Supabase — filter is_featured = true (Phase 2 — AC12)
const FEATURED = MOCK_LISTINGS.slice(0, 3);

export default function Home() {
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
        {/* TODO: connect to Supabase — real counts (Phase 2 — AC10) */}
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
        {/* TODO: connect to Supabase — real listing counts per city (Phase 2 — AC11) */}
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
          {/* AC7 — See all → /search */}
          <Link href="/search" className="text-xs text-primary font-medium">
            See all
          </Link>
        </div>
        {FEATURED.length > 0 ? (
          // AC4 — horizontal scroll, snap-x mandatory; cards have snap-start
          <div className="flex gap-3 overflow-x-auto px-4 pb-2 snap-x snap-mandatory no-scrollbar">
            {FEATURED.map((listing) => (
              <PropertyCard key={listing.id} listing={listing} variant="featured" />
            ))}
          </div>
        ) : (
          // Edge case: zero featured listings — section hidden
          null
        )}
      </AnimateIn>

      {/* ── AC5: New Listings (filter tabs + grid) ─────────────── */}
      <AnimateIn delay={200} className="mt-5">
        <div className="flex items-center justify-between px-4 mb-3">
          <h2 className="font-display font-semibold text-base text-narra">New Listings</h2>
          {/* AC7 — See all → /search */}
          <Link href="/search" className="text-xs text-primary font-medium">
            See all
          </Link>
        </div>
        {/* AC5 — FilterTabs is a Client Component; handles tab state + filtered grid */}
        {/* TODO: connect to Supabase — show 6 most recent (Phase 2 — AC14) */}
        <FilterTabs listings={MOCK_LISTINGS} />
      </AnimateIn>
    </div>
  );
}
