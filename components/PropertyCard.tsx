"use client";

import Link from "next/link";
import type { Listing } from "@/lib/types";
import { useSavedProperty } from "@/hooks/useSavedProperties";

export interface PropertyCardProps {
  listing: Listing;
  variant: "featured" | "grid" | "strip";
}

// AC1 — accepts Listing (UI display type) and variant
export function PropertyCard({ listing, variant }: PropertyCardProps) {
  const { isSaved, toggle } = useSavedProperty(listing.id);

  const isLotOnly = listing.beds === null && listing.baths === null;

  // Shared badge element (AC5)
  const badge = (
    <span
      className={`absolute top-[10px] left-[10px] ${listing.badgeClass} text-xs font-semibold rounded-lg px-2 py-0.5`}
    >
      {listing.badge}
    </span>
  );

  // AC6 — heart button, stops tap propagation to prevent navigation
  const heart = (
    <button
      type="button"
      aria-label={isSaved ? "Remove from saved" : "Save property"}
      className="absolute top-[10px] right-[10px] w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center active:scale-[0.92] transition-transform duration-100"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        void toggle();
      }}
    >
      <span aria-hidden="true" className="text-sm leading-none">
        {isSaved ? "❤️" : "🤍"}
      </span>
    </button>
  );

  // ── Featured variant (AC2) ──────────────────────────────────
  if (variant === "featured") {
    return (
      <Link
        href={`/property/${listing.id}`}
        // AC8 — whole card navigates; AC9 — press scale; snap-start for horizontal scroll
        className="block w-[260px] flex-shrink-0 snap-start rounded-[14px] bg-white overflow-hidden shadow-[var(--shadow-card)] active:scale-[0.97] transition-all duration-200"
      >
        {/* AC2 — image 150px tall */}
        <div className={`relative h-[150px] ${listing.img}`}>
          {badge}
          {heart}
        </div>

        {/* Content */}
        <div className="p-3">
          {/* AC10 — price; /mo already embedded in listing.price for rentals */}
          <p className="text-sm font-semibold text-primary leading-none">
            {listing.price}
          </p>
          <p className="text-sm font-medium text-narra truncate mt-1">
            {listing.name}
          </p>
          <p className="text-xs text-muted truncate mt-0.5">{listing.location}</p>

          {/* Specs row — hide beds/baths for lot-only (AC — edge case) */}
          <div className="flex items-center gap-2 mt-2 text-xs text-muted">
            {isLotOnly ? (
              listing.lot && <span>{listing.lot} m² lot</span>
            ) : (
              <>
                {listing.beds !== null && <span>{listing.beds} bd</span>}
                {listing.baths !== null && <span>{listing.baths} ba</span>}
                {listing.area !== null && <span>{listing.area} m²</span>}
              </>
            )}
          </div>
        </div>
      </Link>
    );
  }

  // ── Grid variant (AC3) ─────────────────────────────────────
  if (variant === "grid") {
    return (
      <Link
        href={`/property/${listing.id}`}
        // AC8, AC9
        className="block w-full rounded-[14px] bg-white overflow-hidden shadow-[var(--shadow-card)] active:scale-[0.97] transition-all duration-200"
      >
        {/* AC3 — image 120px tall */}
        <div className={`relative h-[120px] ${listing.img}`}>
          {badge}
          {heart}
        </div>

        {/* Content — reduced font sizes (AC3) */}
        <div className="p-2.5">
          {/* AC10 — shortened price (AC3) */}
          <p className="text-xs font-semibold text-primary leading-none">
            {listing.priceShort}
          </p>
          <p className="text-xs font-medium text-narra truncate mt-0.5">
            {listing.name}
          </p>
          <p className="text-[10px] text-muted truncate mt-0.5">
            {listing.location}
          </p>

          {/* Specs row */}
          <div className="flex items-center gap-1.5 mt-1.5 text-[10px] text-muted">
            {isLotOnly ? (
              listing.lot && <span>{listing.lot} m²</span>
            ) : (
              <>
                {listing.beds !== null && <span>{listing.beds} bd</span>}
                {listing.baths !== null && <span>{listing.baths} ba</span>}
                {listing.area !== null && <span>{listing.area} m²</span>}
              </>
            )}
          </div>
        </div>
      </Link>
    );
  }

  // ── Strip variant (AC4) ────────────────────────────────────
  return (
    <Link
      href={`/property/${listing.id}`}
      // AC8, AC9 — horizontal card for map screen
      className="flex items-center gap-3 bg-white rounded-[14px] overflow-hidden shadow-[var(--shadow-card)] active:scale-[0.97] transition-all duration-200 p-0"
    >
      {/* AC4 — 80px image on left */}
      <div className={`relative h-20 w-20 flex-shrink-0 ${listing.img}`}>
        {badge}
      </div>

      {/* Content on right */}
      <div className="flex-1 min-w-0 py-2.5 pr-3">
        <p className="text-xs font-semibold text-primary leading-none">
          {listing.priceShort}
        </p>
        <p className="text-xs font-medium text-narra truncate mt-0.5">
          {listing.name}
        </p>
        <p className="text-[10px] text-muted truncate mt-0.5">
          {listing.location}
        </p>
      </div>

      {/* Heart sits outside the image in strip — top-right of card */}
      <div className="pr-3 flex-shrink-0">
        <button
          type="button"
          aria-label={isSaved ? "Remove from saved" : "Save property"}
          className="w-8 h-8 rounded-full bg-sand flex items-center justify-center active:scale-[0.92] transition-transform duration-100"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            void toggle();
          }}
        >
          <span aria-hidden="true" className="text-sm leading-none">
            {isSaved ? "❤️" : "🤍"}
          </span>
        </button>
      </div>
    </Link>
  );
}
