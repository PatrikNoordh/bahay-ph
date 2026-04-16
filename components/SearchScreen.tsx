"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useState, useRef, useEffect, useTransition } from "react";
import type { Listing } from "@/lib/types";
import { PropertyCard } from "@/components/PropertyCard";
import { SkeletonPropertyCard } from "@/components/ui/Skeleton";

// Price range defaults — differ between sale (total) and rent (monthly)
const SALE_PRICE_CONFIG = { min: 500_000, max: 50_000_000, suffix: "" } as const;
const RENT_PRICE_CONFIG = { min: 5_000, max: 150_000, suffix: "/mo" } as const;

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
  listings: Listing[]; // Already filtered + paginated server-side
  totalCount: number;  // AC4 — total matching results across all pages
  currentPage: number; // AC5 — current page, drives "Load more"
}

export function SearchScreen({ listings, totalCount, currentPage }: SearchScreenProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  // Local state for the text input — syncs with URL on Enter/blur
  const [localQ, setLocalQ] = useState(searchParams.get("q") ?? "");

  // AC1, AC2 — price range local state; initialised from URL params
  const [localPriceMin, setLocalPriceMin] = useState(searchParams.get("priceMin") ?? "");
  const [localPriceMax, setLocalPriceMax] = useState(searchParams.get("priceMax") ?? "");

  // AC1, AC3 — derive price config from current listingType param
  const isRent = searchParams.get("listingType") === "rent";
  const priceConfig = isRent ? RENT_PRICE_CONFIG : SALE_PRICE_CONFIG;

  // Auto-focus on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Build a new URL with one param updated (or removed if value is empty)
  // AC5 edge case — filter change resets to page 1
  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    // Reset to page 1 when any filter changes
    params.delete("page");
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  // Push text search to URL — called on Enter or blur
  function submitSearch() {
    updateParam("q", localQ.trim());
  }

  // AC4 — switching listing type resets price range to correct defaults
  function updateListingType(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set("listingType", value);
    } else {
      params.delete("listingType");
    }
    // Reset price range so defaults match the new type
    params.delete("priceMin");
    params.delete("priceMax");
    params.delete("page");
    setLocalPriceMin("");
    setLocalPriceMax("");
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  // Clear every filter and search param (including page)
  function clearAllFilters() {
    setLocalQ("");
    setLocalPriceMin("");
    setLocalPriceMax("");
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
      <div className="flex gap-2 overflow-x-auto px-4 pb-2 no-scrollbar">
        {/* AC4 — listingType uses specialized handler that resets price range */}
        <FilterSelect
          value={searchParams.get("listingType") ?? ""}
          options={LISTING_TYPE_OPTIONS}
          onChange={updateListingType}
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

      {/* AC1, AC2, AC3 — Price range inputs; defaults and "/mo" label adapt to listingType */}
      <div className="flex items-center gap-1.5 px-4 pb-3">
        <span className="text-xs text-muted shrink-0">₱</span>
        <input
          type="number"
          inputMode="numeric"
          placeholder={priceConfig.min.toLocaleString("en-PH")}
          value={localPriceMin}
          onChange={(e) => setLocalPriceMin(e.target.value)}
          onBlur={() => updateParam("priceMin", localPriceMin)}
          onKeyDown={(e) => { if (e.key === "Enter") updateParam("priceMin", localPriceMin); }}
          min={0}
          className={`w-full rounded-full px-3 py-1.5 text-xs border outline-none transition-colors duration-150 bg-white text-narra ${
            localPriceMin ? "border-primary" : "border-sand-dark"
          }`}
          aria-label="Minimum price"
        />
        <span className="text-xs text-muted shrink-0">–</span>
        <span className="text-xs text-muted shrink-0">₱</span>
        <input
          type="number"
          inputMode="numeric"
          placeholder={priceConfig.max.toLocaleString("en-PH")}
          value={localPriceMax}
          onChange={(e) => setLocalPriceMax(e.target.value)}
          onBlur={() => updateParam("priceMax", localPriceMax)}
          onKeyDown={(e) => { if (e.key === "Enter") updateParam("priceMax", localPriceMax); }}
          min={0}
          className={`w-full rounded-full px-3 py-1.5 text-xs border outline-none transition-colors duration-150 bg-white text-narra ${
            localPriceMax ? "border-primary" : "border-sand-dark"
          }`}
          aria-label="Maximum price"
        />
        {/* AC3 — "/mo" suffix shown only for rent */}
        {isRent && (
          <span className="text-xs text-muted shrink-0">/mo</span>
        )}
      </div>

      {/* AC4 — Result count: "Showing N of total properties" */}
      <p className="px-4 mb-3 text-sm text-muted">
        Showing{" "}
        <span className="font-bold text-narra">{listings.length}</span>
        {" "}of{" "}
        <span className="font-bold text-narra">{totalCount}</span>{" "}
        {totalCount === 1 ? "property" : "properties"}
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
        <>
          <div className="grid grid-cols-2 gap-3 px-4 pb-4">
            {listings.map((listing) => (
              <PropertyCard key={listing.id} listing={listing} variant="grid" />
            ))}
          </div>

          {/* AC2 — "Load more" button; hidden when all results are visible */}
          {listings.length < totalCount && (
            <div className="px-4 pb-6 flex justify-center">
              <button
                type="button"
                onClick={() => {
                  const params = new URLSearchParams(searchParams.toString());
                  params.set("page", String(currentPage + 1));
                  startTransition(() => {
                    router.push(`${pathname}?${params.toString()}`);
                  });
                }}
                disabled={isPending}
                className="bg-primary text-white text-sm font-medium rounded-xl px-6 py-3 active:scale-[0.97] transition-transform duration-100 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isPending ? "Loading…" : `Load more (${totalCount - listings.length} remaining)`}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
