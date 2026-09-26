"use client";

// AC9, AC10 — Full interactive Leaflet map for the /map screen.
// Imported via next/dynamic with ssr: false to avoid window-access errors.
import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
// BH-46 — marker clustering for dense property areas
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import "leaflet.markercluster";
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
  // BH-46 — cluster group holds all price-chip markers
  const clusterRef = useRef<L.MarkerClusterGroup | null>(null);

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

    // BH-46 AC1/AC2/AC4 — create cluster group with design-token styled cluster icons
    const cluster = L.markerClusterGroup({
      // AC2 — clicking cluster zooms to reveal individual pins (default behaviour)
      showCoverageOnHover: false,
      // AC4 — terra background (#C1440E) + white text matching design system
      iconCreateFunction(c) {
        const count = c.getChildCount();
        return L.divIcon({
          className: "leaflet-cluster-icon",
          iconSize: [40, 40],
          html: `<div style="
            width:40px;height:40px;border-radius:50%;
            background:#C1440E;color:#fff;
            font-size:13px;font-weight:700;
            display:flex;align-items:center;justify-content:center;
            box-shadow:0 2px 16px rgba(44,26,14,0.18);
            border:2px solid #fff;
          ">${count}</div>`,
        });
      },
    });

    cluster.addTo(map);
    clusterRef.current = cluster;
    mapRef.current = map;

    const markers = markersRef.current;
    return () => {
      markers.forEach((m) => m.remove());
      markers.clear();
      cluster.clearLayers();
      map.remove();
      mapRef.current = null;
      clusterRef.current = null;
    };
  }, []);

  // Add / update markers whenever listings or selectedId change
  useEffect(() => {
    const map = mapRef.current;
    const cluster = clusterRef.current;
    if (!map || !cluster) return;

    const activeIds = new Set(
      listings.filter((l) => l.lat !== null && l.lng !== null).map((l) => l.id)
    );

    // Remove stale markers from cluster + ref
    markersRef.current.forEach((marker, id) => {
      if (!activeIds.has(id)) {
        cluster.removeLayer(marker);
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
        // AC3 — single pins remain as price chips (buildIcon unchanged)
        const marker = L.marker([listing.lat, listing.lng], { icon });
        marker.on("click", () => onPinClickRef.current(listing.id));
        cluster.addLayer(marker);
        markersRef.current.set(listing.id, marker);
      }
    });
  }, [listings, selectedId]);

  return <div ref={containerRef} className="absolute inset-0" />;
}
