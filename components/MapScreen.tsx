"use client";

import { useState, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
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

interface MapScreenProps {
  listings: Listing[];
}

export function MapScreen({ listings }: MapScreenProps) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Refs for strip card scroll-into-view (AC3)
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  // Ref for double-tap detection on pins (AC4)
  const lastTapRef = useRef<{ id: string; time: number } | null>(null);

  // Listings that have real coordinates — only these appear on the Leaflet map
  const mappableListings = listings.filter(
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

      {/* AC9, AC10 — Leaflet tile map fills the full screen */}
      <div className="absolute inset-0">
        {mappableListings.length === 0 ? (
          // Edge case: no listings with coordinates
          <div className="absolute inset-0 bg-lime-100 flex items-center justify-center">
            <p className="text-muted text-sm bg-white/80 rounded-xl px-4 py-2 shadow-[var(--shadow-card)]">
              No listings available
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
            {listings.map((listing) => (
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
