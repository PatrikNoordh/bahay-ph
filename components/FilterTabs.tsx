"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { PropertyCard } from "./PropertyCard";
import type { Listing } from "@/lib/types";
import { setStoredIntent } from "@/lib/listingTypeIntent";

const TABS = ["All", "For Sale", "For Rent", "Lots", "Condos"] as const;
type Tab = (typeof TABS)[number];

// Map each tab to the URL params it represents
const TAB_PARAMS: Record<Tab, { listingType?: string; type?: string }> = {
  All:        {},
  "For Sale": { listingType: "sale" },
  "For Rent": { listingType: "rent" },
  Lots:       { type: "lot" },
  Condos:     { type: "condo" },
};

// Derive the active tab from current URL params
function tabFromParams(
  listingType: string | null,
  type: string | null
): Tab {
  if (listingType === "sale") return "For Sale";
  if (listingType === "rent") return "For Rent";
  if (type === "lot") return "Lots";
  if (type === "condo") return "Condos";
  return "All";
}

interface FilterTabsProps {
  listings: Listing[];
  // AC3 — optional cap on displayed results (used on home page)
  limit?: number;
}

// AC5 — Client Component; tab state synced to URL params via router.replace()
export function FilterTabs({ listings, limit }: FilterTabsProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // AC2 — Restore active tab from URL on mount
  const activeTab = tabFromParams(
    searchParams.get("listingType"),
    searchParams.get("type")
  );

  // AC1, AC3 — Write tab selection to URL; replace (not push) to avoid back-stack pollution
  function selectTab(tab: Tab) {
    const params = new URLSearchParams(searchParams.toString());
    // Clear both tab-related params before applying new ones
    params.delete("listingType");
    params.delete("type");

    const tabParams = TAB_PARAMS[tab];
    if (tabParams.listingType) params.set("listingType", tabParams.listingType);
    if (tabParams.type) params.set("type", tabParams.type);

    const qs = params.toString();
    // AC4/AC5 — Empty/default filters produce a clean URL
    router.replace(qs ? `${pathname}?${qs}` : pathname);

    // AC1 (BH-72) — persist listing type intent for cross-page carrying
    if (tab === "For Sale") setStoredIntent("sale");
    if (tab === "For Rent") setStoredIntent("rent");
  }

  // Client-side filter for the home page "New Listings" section
  // TODO: connect to Supabase — replace with server-filtered props (Phase 2)
  const allFiltered = listings.filter((l) => {
    if (activeTab === "All") return true;
    if (activeTab === "For Sale") return l.badge === "For Sale" || l.badge === "New";
    if (activeTab === "For Rent") return l.badge === "For Rent";
    if (activeTab === "Lots") return l.type === "lot";
    if (activeTab === "Condos") return l.type === "condo";
    return true;
  });

  // AC3 — cap at limit when provided (home page shows max 12)
  const filtered = limit !== undefined ? allFiltered.slice(0, limit) : allFiltered;

  return (
    <div>
      {/* AC1 — Tab row; active tab highlighted, click updates URL */}
      <div className="flex overflow-x-auto gap-2 px-4 pb-2 no-scrollbar">
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => selectTab(tab)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors duration-150 ${
              activeTab === tab
                ? "bg-primary text-white"
                : "bg-white text-muted border border-sand-dark"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* 2-column grid or empty state */}
      {filtered.length === 0 ? (
        <p className="text-center text-muted text-sm py-10 px-4">
          No listings yet — check back soon
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 px-4 pt-2">
          {filtered.map((listing) => (
            <PropertyCard key={listing.id} listing={listing} variant="grid" />
          ))}
        </div>
      )}
    </div>
  );
}
