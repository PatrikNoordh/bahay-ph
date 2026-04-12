"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useState, useRef, useEffect, useTransition } from "react";
import type { Listing } from "@/lib/types";
import { PropertyCard } from "@/components/PropertyCard";
import { SkeletonPropertyCard } from "@/components/ui/Skeleton";

// Filter options — values map to URL param values expected by the server
const LISTING_TYPE_OPTIONS = [
  { value: "", label: "📋 Any type" },
  { value: "sale", label: "For Sale" },
  { value: "rent", label: "For Rent" },
];

const PROPERTY_TYPE_OPTIONS = [
  { value: "", label: "🏠 Any" },
  { value: "house", label: "House" },
  { value: "condo", label: "Condo" },
  { value: "lot", label: "Lot" },
  { value: "townhouse", label: "Townhouse" },
  { value: "commercial", label: "Commercial" },
];

const BEDS_OPTIONS = [
  { value: "", label: "🛏️ Beds" },
  { value: "1", label: "1+ beds" },
  { value: "2", label: "2+ beds" },
  { value: "3", label: "3+ beds" },
  { value: "4", label: "4+ beds" },
];

const SORT_OPTIONS = [
  { value: "", label: "⬇️ Newest" },
  { value: "price_asc", label: "Price ↑" },
  { value: "price_desc", label: "Price ↓" },
];

interface FilterSelectProps {
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}

function FilterSelect({ value, options, onChange }: FilterSelectProps) {
  const isActive = value !== "";
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-medium border outline-none cursor-pointer transition-colors duration-150 ${
        isActive
          ? "bg-primary text-white border-primary"
          : "bg-white text-narra border-sand-dark"
      }`}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

interface SearchScreenProps {
  listings: Listing[]; // Already filtered server-side
}

export function SearchScreen({ listings }: SearchScreenProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  // Local state for the text input — syncs with URL on Enter/blur
  const [localQ, setLocalQ] = useState(searchParams.get("q") ?? "");

  // Auto-focus on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Build a new URL with one param updated (or removed if value is empty)
  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  // Push text search to URL — called on Enter or blur
  function submitSearch() {
    updateParam("q", localQ.trim());
  }

  // Clear every filter and search param
  function clearAllFilters() {
    setLocalQ("");
    startTransition(() => {
      router.push(pathname);
    });
  }

  const hasActiveFilters = searchParams.toString().length > 0;

  return (
    <div className="flex flex-col">
      {/* AC1 — Search bar; local state for smooth typing, URL push on submit */}
      <div className="px-4 pt-3 pb-2">
        <div className="flex items-center gap-2 bg-white rounded-xl shadow-[var(--shadow-card)] border border-primary/10 px-3 py-2.5">
          <span className="text-muted text-base" aria-hidden="true">🔍</span>
          <input
            ref={inputRef}
            type="search"
            placeholder="Search Cebu listings..."
            value={localQ}
            onChange={(e) => setLocalQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submitSearch();
            }}
            onBlur={submitSearch}
            className="flex-1 text-sm text-narra bg-transparent outline-none placeholder:text-muted"
          />
          {(localQ || hasActiveFilters) && (
            <button
              type="button"
              onClick={clearAllFilters}
              className="text-muted text-sm leading-none active:scale-[0.92] transition-transform duration-100"
              aria-label="Clear all filters"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* AC5 — Filter pills: update URL params on change, active state from URL */}
      <div className="flex gap-2 overflow-x-auto px-4 pb-3 no-scrollbar">
        <FilterSelect
          value={searchParams.get("listingType") ?? ""}
          options={LISTING_TYPE_OPTIONS}
          onChange={(v) => updateParam("listingType", v)}
        />
        <FilterSelect
          value={searchParams.get("type") ?? ""}
          options={PROPERTY_TYPE_OPTIONS}
          onChange={(v) => updateParam("type", v)}
        />
        <FilterSelect
          value={searchParams.get("beds") ?? ""}
          options={BEDS_OPTIONS}
          onChange={(v) => updateParam("beds", v)}
        />
        <FilterSelect
          value={searchParams.get("sort") ?? ""}
          options={SORT_OPTIONS}
          onChange={(v) => updateParam("sort", v)}
        />
      </div>

      {/* AC4 — Result count */}
      <p className="px-4 mb-3 text-sm text-muted">
        <span className="font-bold text-narra">{listings.length}</span>{" "}
        {listings.length === 1 ? "property" : "properties"} found in Cebu
      </p>

      {/* AC1 — Skeleton grid while server re-renders on filter change */}
      {isPending ? (
        <div className="grid grid-cols-2 gap-3 px-4 pb-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonPropertyCard key={i} />
          ))}
        </div>
      ) : listings.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
          <p className="text-4xl mb-3" aria-hidden="true">🏠</p>
          <p className="font-semibold text-narra mb-1">
            No properties match your filters
          </p>
          <p className="text-sm text-muted mb-4">
            Try adjusting your filters or search for a different area.
          </p>
          <button
            type="button"
            onClick={clearAllFilters}
            className="bg-primary text-white text-sm font-medium rounded-[12px] px-5 py-2 active:scale-[0.97] transition-transform duration-100"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 px-4 pb-4">
          {listings.map((listing) => (
            <PropertyCard key={listing.id} listing={listing} variant="grid" />
          ))}
        </div>
      )}
    </div>
  );
}
