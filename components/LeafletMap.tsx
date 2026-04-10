"use client";

// AC9, AC10 — Full interactive Leaflet map for the /map screen.
// Imported via next/dynamic with ssr: false to avoid window-access errors.
import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Listing } from "@/lib/types";

interface LeafletMapProps {
  listings: Listing[];
  selectedId: string | null;
  onPinClick: (id: string) => void;
}

// Metro Cebu centre — fallback when no listings have coords
const CEBU_CENTER: [number, number] = [10.3157, 123.8854];
const DEFAULT_ZOOM = 12;

function pinColor(listing: Listing): string {
  if (listing.badge === "For Rent") return "#1A5FA8";
  if (listing.badge === "New") return "#1D9E75";
  return "#C1440E";
}

function buildIcon(listing: Listing, selected: boolean): L.DivIcon {
  const color = pinColor(listing);
  const scaleStyle = selected
    ? "transform:translateX(-50%) scale(1.15)"
    : "transform:translateX(-50%) scale(1)";
  return L.divIcon({
    className: "leaflet-pin-icon",
    iconSize: [0, 0],
    iconAnchor: [0, 0],
    html: `<div style="position:absolute;bottom:0;left:0;${scaleStyle};transform-origin:bottom center;transition:transform 150ms ease;white-space:nowrap;z-index:${selected ? 20 : 10};">
      <div style="background:${color};color:#fff;font-size:11px;font-weight:700;padding:6px 10px;border-radius:8px;box-shadow:0 2px 16px rgba(44,26,14,0.08);line-height:1;">${listing.priceShort}</div>
      <div style="width:12px;height:8px;background:${color};clip-path:polygon(0 0,100% 0,50% 100%);margin:0 auto;"></div>
    </div>`,
  });
}

export function LeafletMap({ listings, selectedId, onPinClick }: LeafletMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());

  // Stable callback ref to avoid re-registering click listeners on every render
  const onPinClickRef = useRef(onPinClick);
  useEffect(() => {
    onPinClickRef.current = onPinClick;
  });

  // Initialise map once on mount
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: CEBU_CENTER,
      zoom: DEFAULT_ZOOM,
      zoomControl: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;

    const markers = markersRef.current;
    return () => {
      markers.forEach((m) => m.remove());
      markers.clear();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Add / update markers whenever listings or selectedId change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const activeIds = new Set(
      listings.filter((l) => l.lat !== null && l.lng !== null).map((l) => l.id)
    );

    // Remove stale markers
    markersRef.current.forEach((marker, id) => {
      if (!activeIds.has(id)) {
        marker.remove();
        markersRef.current.delete(id);
      }
    });

    // Add / update each marker
    listings.forEach((listing) => {
      if (listing.lat === null || listing.lng === null) return;
      const isSelected = selectedId === listing.id;
      const icon = buildIcon(listing, isSelected);

      const existing = markersRef.current.get(listing.id);
      if (existing) {
        existing.setIcon(icon);
      } else {
        const marker = L.marker([listing.lat, listing.lng], { icon }).addTo(map);
        marker.on("click", () => onPinClickRef.current(listing.id));
        markersRef.current.set(listing.id, marker);
      }
    });
  }, [listings, selectedId]);

  return <div ref={containerRef} className="absolute inset-0" />;
}
