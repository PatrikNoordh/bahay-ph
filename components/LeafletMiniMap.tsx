"use client";

// AC11 — Mini Leaflet map for the property detail page.
// Imported via next/dynamic with ssr: false to avoid window-access errors.
import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface LeafletMiniMapProps {
  lat: number;
  lng: number;
  title: string;
}

function buildPinIcon(title: string): L.DivIcon {
  return L.divIcon({
    className: "leaflet-pin-icon",
    iconSize: [0, 0],
    iconAnchor: [0, 0],
    html: `<div style="position:absolute;bottom:0;left:0;transform:translateX(-50%);white-space:nowrap;">
      <div style="background:#C1440E;color:#fff;font-size:10px;font-weight:700;padding:5px 8px;border-radius:8px;box-shadow:0 2px 16px rgba(44,26,14,0.08);line-height:1;max-width:140px;overflow:hidden;text-overflow:ellipsis;">${title}</div>
      <div style="width:10px;height:7px;background:#C1440E;clip-path:polygon(0 0,100% 0,50% 100%);margin:0 auto;"></div>
    </div>`,
  });
}

export function LeafletMiniMap({ lat, lng, title }: LeafletMiniMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [lat, lng],
      zoom: 15,
      zoomControl: false,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      touchZoom: false,
      keyboard: false,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    L.marker([lat, lng], { icon: buildPinIcon(title) }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={containerRef} className="absolute inset-0 rounded-[14px] overflow-hidden" />;
}
