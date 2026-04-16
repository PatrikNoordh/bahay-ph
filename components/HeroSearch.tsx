"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type ListingIntent = "sale" | "rent";

const TOGGLE_OPTIONS: { label: string; value: ListingIntent }[] = [
  { label: "For Sale", value: "sale" },
  { label: "For Rent", value: "rent" },
];

// AC1–AC4 — Hero toggle pill + tappable search bar
// Toggle defaults to "For Sale"; search navigation carries the selected intent
export function HeroSearch() {
  const router = useRouter();
  // AC2 — default to "For Sale"
  const [intent, setIntent] = useState<ListingIntent>("sale");

  function handleSearch() {
    // AC3/AC4 — carry listingType into search URL
    router.push(`/search?listingType=${intent}`);
  }

  return (
    <div className="mb-4">
      {/* AC1 — For Sale / For Rent toggle pills */}
      <div className="flex gap-2 mb-3">
        {TOGGLE_OPTIONS.map(({ label, value }) => {
          const isActive = intent === value;
          const activeClass =
            value === "rent"
              ? "bg-ocean text-white"
              : "bg-primary text-white";
          return (
            <button
              key={value}
              type="button"
              onClick={() => setIntent(value)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-medium font-body transition-colors duration-150 ${
                isActive
                  ? activeClass
                  : "bg-white/20 text-white hover:bg-white/30"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Tappable search bar — navigates to /search with listingType param */}
      <button
        type="button"
        onClick={handleSearch}
        className="flex items-center gap-2 w-full bg-white rounded-[12px] px-3 py-2.5 text-left"
      >
        <span className="text-muted text-sm" aria-hidden="true">🔍</span>
        <span className="text-muted text-sm flex-1">Search Cebu listings...</span>
      </button>
    </div>
  );
}
