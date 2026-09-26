"use client";

import { useState, useRef, useCallback, useSyncExternalStore } from "react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { getStoredIntent, setStoredIntent, subscribeToIntent } from "@/lib/listingTypeIntent";
import type { Listing } from "@/lib/types";
import { Topbar } from "@/components/Topbar";
import { PropertyCard } from "@/components/PropertyCard";

// AC9, AC10 — Leaflet is client-only (accesses window); ssr:false prevents SSR errors
const DynamicLeafletMap = dynamic(
  () => import("@/components/LeafletMap").then((m) => ({ default: m.LeafletMap })),
  {
    ssr: false,
    loading: () => <div className="absolute inset-0 bg-lime-100 animate-pulse" />,
  }
);

type ListingTypeFilter = "all" | "sale" | "rent";

const TYPE_PILLS: { label: string; value: ListingTypeFilter }[] = [
  { label: "All", value: "all" },
  { label: "For Sale", value: "sale" },
  { label: "For Rent", value: "rent" },
];

interface MapScreenProps {
  listings: Listing[];
  initialListingType?: ListingTypeFilter;
}

export function MapScreen({ listings, initialListingType = "all" }: MapScreenProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // AC3 (BH-72) — track explicit user selections (including "all") in local state
  // null means "no explicit selection yet — defer to URL param or sessionStorage"
  const [localType, setLocalType] = useState<ListingTypeFilter | null>(null);

  // Read sessionStorage with SSR-safe useSyncExternalStore; server snapshot is null
  const storedIntent = useSyncExternalStore<"sale" | "rent" | null>(
    subscribeToIntent,
    getStoredIntent,
    () => null
  );

  // Effective type: explicit user selection wins, then URL param, then sessionStorage
  const listingType: ListingTypeFilter =
    localType ?? (initialListingType !== "all" ? initialListingType : (storedIntent ?? "all"));

  function selectType(type: ListingTypeFilter) {
    setLocalType(type);
    setSelectedId(null);
    // AC5 (BH-68) — sync listingType to URL query param
    const params = new URLSearchParams(searchParams.toString());
    if (type === "all") {
      params.delete("listingType");
    } else {
      params.set("listingType", type);
    }
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
    // AC1/AC5 (BH-72) — persist explicit sale/rent selection
    if (type === "sale" || type === "rent") setStoredIntent(type);
  }

  // Client-side filter by listing type (badge-based, mirrors FilterTabs logic)
  function matchesType(listing: Listing): boolean {
    if (listingType === "all") return true;
    if (listingType === "sale") return listing.badge === "For Sale" || listing.badge === "New";
    if (listingType === "rent") return listing.badge === "For Rent";
    return true;
  }

  // Refs for strip card scroll-into-view (AC3)
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  // Ref for double-tap detection on pins (AC4)
  const lastTapRef = useRef<{ id: string; time: number } | null>(null);

  // Client-side filter by listing type, then restrict to coordinate-bearing listings
  const filteredListings = listings.filter(matchesType);
  const mappableListings = filteredListings.filter(
    (l) => l.lat !== null && l.lng !== null
  );

  // AC3 + AC4 — single tap selects pin & scrolls strip; double-tap navigates to detail
  const handlePinClick = useCallback(
    (id: string) => {
      const now = Date.now();
      const last = lastTapRef.current;

      if (last && last.id === id && now - last.time < 400) {
        router.push(`/property/${id}`);
        lastTapRef.current = null;
        return;
      }

      lastTapRef.current = { id, time: now };
      setSelectedId(id);

      const card = cardRefs.current.get(id);
      card?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    },
    [router]
  );

  return (
    // Full-screen map container — dvh prevents mobile keyboard issues
    <div className="relative h-[100dvh] overflow-hidden">
      {/* AC6 — Topbar overlays map with transparent background */}
      <Topbar
        transparent
        actions={[{ icon: "🔍", label: "Search", href: "/search" }]}
      />

      {/* AC1, AC5 — For Sale / For Rent / All toggle pills, overlaid above map */}
      <div className="absolute top-14 left-0 right-0 z-[1000] flex justify-center px-4 pt-2 pointer-events-none">
        <div className="flex gap-2 bg-white/90 backdrop-blur-sm rounded-full px-2 py-1.5 shadow-[var(--shadow-card)] pointer-events-auto">
          {TYPE_PILLS.map(({ label, value }) => {
            const isActive = listingType === value;
            let activeClass = "bg-primary text-white";
            if (value === "rent" && isActive) activeClass = "bg-ocean text-white";
            if (value === "all" && isActive) activeClass = "bg-narra text-white";
            return (
              <button
                key={value}
                type="button"
                onClick={() => selectType(value)}
                className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors duration-150 ${
                  isActive ? activeClass : "text-muted hover:bg-sand-dark"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* AC9, AC10 — Leaflet tile map fills the full screen */}
      <div className="absolute inset-0">
        {mappableListings.length === 0 ? (
          // Edge case: no listings with coordinates (incl. empty after filter)
          <div className="absolute inset-0 bg-lime-100 flex items-center justify-center">
            <p className="text-muted text-sm bg-white/80 rounded-xl px-4 py-2 shadow-[var(--shadow-card)]">
              {listingType === "all"
                ? "No listings available"
                : `No ${listingType === "rent" ? "rental" : "sale"} listings on the map`}
            </p>
          </div>
        ) : (
          <DynamicLeafletMap
            listings={mappableListings}
            selectedId={selectedId}
            onPinClick={handlePinClick}
          />
        )}
      </div>

      {/* AC5 — Bottom strip: gradient fade, horizontal PropertyCard scroll */}
      <div className="absolute bottom-0 left-0 right-0 pb-2 pointer-events-none">
        <div className="bg-gradient-to-t from-sand/95 to-transparent pt-8 pointer-events-auto">
          <div
            className="flex gap-3 overflow-x-auto px-4 pb-3 no-scrollbar"
            // Prevent strip scroll from triggering map pan
            onTouchStart={(e) => e.stopPropagation()}
          >
            {filteredListings.map((listing) => (
              <div
                key={listing.id}
                ref={(el) => {
                  if (el) cardRefs.current.set(listing.id, el);
                  else cardRefs.current.delete(listing.id);
                }}
                className="w-[280px] flex-shrink-0"
              >
                <PropertyCard listing={listing} variant="strip" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
