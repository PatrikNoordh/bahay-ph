"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { Listing } from "@/lib/types";
import { Topbar } from "@/components/Topbar";
import { PropertyCard } from "@/components/PropertyCard";

// TODO: Replace MOCK_LISTINGS with real Supabase data with lat/lng coords (Phase 2 — AC11)
// TODO: Replace CSS map with Leaflet.js tile layer centred at lat 10.3157, lng 123.8854 (Phase 2 — AC9, AC10)

interface MapTransform {
  x: number;
  y: number;
  scale: number;
}

interface TouchSnapshot {
  startX: number;
  startY: number;
  dist: number;
  snapshot: MapTransform;
}

interface MapScreenProps {
  listings: Listing[];
}

// Determine pin background class from listing badge
function pinBgClass(listing: Listing): string {
  if (listing.badge === "For Rent") return "bg-ocean";
  if (listing.badge === "New") return "bg-green";
  return "bg-primary";
}

export function MapScreen({ listings }: MapScreenProps) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [transform, setTransform] = useState<MapTransform>({ x: 0, y: 0, scale: 1 });

  // Refs for strip card scroll-into-view (AC3)
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  // Ref for tracking raw touch state (AC8)
  const touchRef = useRef<TouchSnapshot | null>(null);
  // Ref for double-tap detection (AC4)
  const lastTapRef = useRef<{ id: string; time: number } | null>(null);

  // AC3 + AC4 — single tap selects pin & scrolls strip; double-tap navigates
  const handlePinTap = useCallback(
    (listing: Listing) => {
      const now = Date.now();
      const last = lastTapRef.current;

      if (last && last.id === listing.id && now - last.time < 300) {
        // Double-tap — navigate to property detail (AC4)
        router.push(`/property/${listing.id}`);
        lastTapRef.current = null;
        return;
      }

      lastTapRef.current = { id: listing.id, time: now };
      setSelectedId(listing.id);

      // Scroll corresponding strip card into view (AC3)
      const card = cardRefs.current.get(listing.id);
      card?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    },
    [router]
  );

  // AC8 — Touch start: capture initial finger positions / pinch distance
  const handleMapTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 1) {
        touchRef.current = {
          startX: e.touches[0].clientX - transform.x,
          startY: e.touches[0].clientY - transform.y,
          dist: 0,
          snapshot: transform,
        };
      } else if (e.touches.length === 2) {
        const dx = e.touches[1].clientX - e.touches[0].clientX;
        const dy = e.touches[1].clientY - e.touches[0].clientY;
        touchRef.current = {
          startX: 0,
          startY: 0,
          dist: Math.hypot(dx, dy),
          snapshot: transform,
        };
      }
    },
    [transform]
  );

  // AC8 — Touch move: pan (1 finger) or pinch-zoom (2 fingers)
  const handleMapTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchRef.current) return;

    if (e.touches.length === 1 && touchRef.current.dist === 0) {
      const x = e.touches[0].clientX - touchRef.current.startX;
      const y = e.touches[0].clientY - touchRef.current.startY;
      setTransform((prev) => ({ ...prev, x, y }));
    } else if (e.touches.length === 2 && touchRef.current.dist > 0) {
      const dx = e.touches[1].clientX - e.touches[0].clientX;
      const dy = e.touches[1].clientY - e.touches[0].clientY;
      const dist = Math.hypot(dx, dy);
      const scale = Math.min(
        Math.max(touchRef.current.snapshot.scale * (dist / touchRef.current.dist), 0.8),
        4
      );
      setTransform((prev) => ({ ...prev, scale }));
    }
  }, []);

  const handleMapTouchEnd = useCallback(() => {
    touchRef.current = null;
  }, []);

  return (
    // Full-screen map container — dvh prevents mobile keyboard issues
    <div className="relative h-[100dvh] overflow-hidden">
      {/* AC6 — Topbar overlays map with transparent background */}
      <Topbar
        transparent
        actions={[{ icon: "🔍", label: "Search", href: "/search" }]}
      />

      {/* AC1 — CSS illustrative map fills entire screen behind topbar and strip */}
      {/* TODO: Replace CSS map with Leaflet.js tile layer (Phase 2 — AC9, AC10) */}
      <div
        className="absolute inset-0 bg-lime-100 overflow-hidden"
        onTouchStart={handleMapTouchStart}
        onTouchMove={handleMapTouchMove}
        onTouchEnd={handleMapTouchEnd}
      >
        {/* Pannable / zoomable inner layer */}
        <div
          className="absolute inset-0"
          style={{
            transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
            transformOrigin: "center center",
          }}
        >
          {/* SVG: road lines + water area */}
          <svg
            className="absolute inset-0 w-full h-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            {/* Road lines — semi-transparent white (AC1) */}
            <line x1="18" y1="0" x2="62" y2="100" stroke="white" strokeWidth="0.9" strokeOpacity="0.65" />
            <line x1="0" y1="32" x2="100" y2="44" stroke="white" strokeWidth="0.9" strokeOpacity="0.65" />
            <line x1="42" y1="0" x2="68" y2="72" stroke="white" strokeWidth="0.5" strokeOpacity="0.5" />
            <line x1="0" y1="58" x2="82" y2="63" stroke="white" strokeWidth="0.5" strokeOpacity="0.5" />
            <line x1="54" y1="28" x2="100" y2="18" stroke="white" strokeWidth="0.5" strokeOpacity="0.5" />
            <line x1="28" y1="0" x2="88" y2="100" stroke="white" strokeWidth="0.4" strokeOpacity="0.4" />
            <line x1="0" y1="75" x2="60" y2="70" stroke="white" strokeWidth="0.4" strokeOpacity="0.4" />

            {/* Water area — Mactan Channel, bottom-right (AC1) */}
            <polygon
              className="fill-sky-300"
              fillOpacity="0.55"
              points="58,68 100,52 100,100 52,100"
            />

            {/* Mactan Channel label (AC1) */}
            <text
              x="78"
              y="84"
              fontSize="2.8"
              className="fill-ocean"
              fillOpacity="0.85"
              fontStyle="italic"
              textAnchor="middle"
            >
              Mactan Channel
            </text>
          </svg>

          {/* AC2 — Price pins at mock mapPos positions */}
          {listings.length === 0 ? (
            // Edge case: no listings with coords
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-muted text-sm bg-white/80 rounded-xl px-4 py-2 shadow-[var(--shadow-card)]">
                No listings available
              </p>
            </div>
          ) : (
            listings.map((listing) => {
              const isSelected = selectedId === listing.id;
              return (
                <button
                  key={listing.id}
                  type="button"
                  aria-label={`${listing.name} — ${listing.priceShort}`}
                  onClick={() => handlePinTap(listing)}
                  className="absolute focus:outline-none"
                  style={{
                    top: listing.mapPos.top,
                    left: listing.mapPos.left,
                    // Center pin horizontally; align arrow tip to map position
                    transform: `translate(-50%, -100%) scale(${isSelected ? 1.15 : 1})`,
                    transformOrigin: "bottom center",
                    transition: "transform 150ms ease",
                    // Ensure pins stay in upper 70% area (handled by mapPos values in mock data)
                    zIndex: isSelected ? 20 : 10,
                  }}
                >
                  {/* Pin label */}
                  <div
                    className={`${pinBgClass(listing)} text-white text-[11px] font-bold px-2.5 py-1.5 rounded-lg shadow-[var(--shadow-card)] leading-none whitespace-nowrap`}
                  >
                    {listing.priceShort}
                  </div>
                  {/* CSS triangle arrow pointing down (AC2) */}
                  <div
                    className={`mx-auto w-3 h-2 ${pinBgClass(listing)}`}
                    style={{ clipPath: "polygon(0 0, 100% 0, 50% 100%)" }}
                  />
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* AC5 — Bottom strip: gradient fade, horizontal PropertyCard scroll */}
      <div className="absolute bottom-0 left-0 right-0 pb-2 pointer-events-none">
        <div className="bg-gradient-to-t from-sand/95 to-transparent pt-8 pointer-events-auto">
          <div
            className="flex gap-3 overflow-x-auto px-4 pb-3 no-scrollbar"
            // Prevent strip scroll from triggering map pan (edge case)
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
