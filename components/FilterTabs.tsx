"use client";

import { useState } from "react";
import { PropertyCard } from "./PropertyCard";
import type { Listing } from "@/lib/types";

const TABS = ["All", "For Sale", "For Rent", "Lots", "Condos"] as const;
type Tab = (typeof TABS)[number];

interface FilterTabsProps {
  listings: Listing[];
}

// AC5 — client component for filter tabs + grid; extracted so page stays a Server Component (Phase 2)
export function FilterTabs({ listings }: FilterTabsProps) {
  const [activeTab, setActiveTab] = useState<Tab>("All");

  // TODO: connect to Supabase — filter database results by tab (Phase 2 — AC13)
  const filtered = listings.filter((l) => {
    if (activeTab === "All") return true;
    if (activeTab === "For Sale") return l.badge === "For Sale" || l.badge === "New";
    if (activeTab === "For Rent") return l.badge === "For Rent";
    if (activeTab === "Lots") return l.type === "lot";
    if (activeTab === "Condos") return l.type === "condo";
    return true;
  });

  return (
    <div>
      {/* Filter tab row */}
      <div className="flex overflow-x-auto gap-2 px-4 pb-2 no-scrollbar">
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
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
