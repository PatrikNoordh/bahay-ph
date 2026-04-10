"use client";

// BH-30 — Interactive location picker used in the agent listing form.
// Imported via next/dynamic with ssr: false (Leaflet requires window).
import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const CEBU_CENTER: [number, number] = [10.3157, 123.8854];
const CEBU_ZOOM = 11;
const PIN_ZOOM = 15;

interface LocationPickerMapProps {
  lat: number | null;
  lng: number | null;
  onPick: (lat: number, lng: number) => void;
  onClear: () => void;
}

function buildPinIcon(): L.DivIcon {
  return L.divIcon({
    className: "leaflet-pin-icon",
    iconSize: [0, 0],
    iconAnchor: [0, 0],
    html: `<div style="position:absolute;bottom:0;left:0;transform:translateX(-50%);">
      <div style="width:14px;height:14px;background:#C1440E;border:2.5px solid #fff;border-radius:50%;box-shadow:0 2px 8px rgba(44,26,14,0.35);"></div>
    </div>`,
  });
}

export function LocationPickerMap({ lat, lng, onPick, onClear }: LocationPickerMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  // Stable ref so the click handler always calls the latest onPick
  const onPickRef = useRef(onPick);
  onPickRef.current = onPick;

  const [query, setQuery] = useState("");
  const [geocodeStatus, setGeocodeStatus] = useState<"idle" | "loading" | "not_found" | "error">("idle");

  // ── Initialise map once ────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const center: [number, number] = lat !== null && lng !== null ? [lat, lng] : CEBU_CENTER;
    const zoom = lat !== null && lng !== null ? PIN_ZOOM : CEBU_ZOOM;

    const map = L.map(containerRef.current, { center, zoom });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    if (lat !== null && lng !== null) {
      markerRef.current = L.marker([lat, lng], { icon: buildPinIcon() }).addTo(map);
    }

    map.on("click", (e) => {
      const pickedLat = Math.round(e.latlng.lat * 1e6) / 1e6;
      const pickedLng = Math.round(e.latlng.lng * 1e6) / 1e6;

      if (markerRef.current) {
        markerRef.current.setLatLng([pickedLat, pickedLng]);
      } else {
        markerRef.current = L.marker([pickedLat, pickedLng], { icon: buildPinIcon() }).addTo(map);
      }

      onPickRef.current(pickedLat, pickedLng);
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Sync marker when coordinates change from outside (geocoding / edit) ────
  const prevLat = useRef(lat);
  const prevLng = useRef(lng);
  useEffect(() => {
    if (prevLat.current === lat && prevLng.current === lng) return;
    prevLat.current = lat;
    prevLng.current = lng;

    const map = mapRef.current;
    if (!map) return;

    if (lat === null || lng === null) {
      markerRef.current?.remove();
      markerRef.current = null;
      map.setView(CEBU_CENTER, CEBU_ZOOM);
    } else {
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
      } else {
        markerRef.current = L.marker([lat, lng], { icon: buildPinIcon() }).addTo(map);
      }
      map.setView([lat, lng], PIN_ZOOM);
    }
  }, [lat, lng]);

  // ── Nominatim geocoding ────────────────────────────────────────────────────
  async function handleGeocode() {
    const trimmed = query.trim();
    if (!trimmed) return;

    setGeocodeStatus("loading");
    try {
      const searchQuery = `${trimmed}, Cebu, Philippines`;
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=1&countrycodes=ph`;
      const res = await fetch(url, { headers: { "Accept-Language": "en" } });

      if (!res.ok) throw new Error("Network error");

      const results = await res.json() as Array<{ lat: string; lon: string }>;

      if (results.length === 0) {
        setGeocodeStatus("not_found");
        return;
      }

      const resultLat = Math.round(Number(results[0].lat) * 1e6) / 1e6;
      const resultLng = Math.round(Number(results[0].lon) * 1e6) / 1e6;
      onPickRef.current(resultLat, resultLng);
      setGeocodeStatus("idle");
    } catch {
      setGeocodeStatus("error");
    }
  }

  function handleClear() {
    onClear();
    setGeocodeStatus("idle");
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Address search */}
      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setGeocodeStatus("idle"); }}
          onKeyDown={(e) => e.key === "Enter" && handleGeocode()}
          placeholder="Search address to locate…"
          className="flex-1 bg-sand rounded-[12px] px-3 py-2.5 text-sm text-narra placeholder:text-muted outline-none focus:ring-2 focus:ring-primary/30"
        />
        <button
          type="button"
          onClick={handleGeocode}
          disabled={geocodeStatus === "loading" || !query.trim()}
          className="bg-sand-dark text-narra text-xs font-medium rounded-[12px] px-3 py-2.5 active:scale-[0.97] transition-transform duration-100 disabled:opacity-50 whitespace-nowrap"
        >
          {geocodeStatus === "loading" ? "…" : "Search"}
        </button>
      </div>

      {/* Status messages */}
      {geocodeStatus === "not_found" && (
        <p className="text-xs text-muted">Address not found — tap the map to pin manually.</p>
      )}
      {geocodeStatus === "error" && (
        <p className="text-xs text-primary">Geocoding unavailable — tap the map to pin manually.</p>
      )}

      {/* Map */}
      <div className="relative h-[200px] rounded-[14px] overflow-hidden border border-sand-dark">
        <div ref={containerRef} className="absolute inset-0" />
      </div>

      {/* Coordinates or hint */}
      {lat !== null && lng !== null ? (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted font-mono">
            {lat.toFixed(6)}, {lng.toFixed(6)}
          </p>
          <button
            type="button"
            onClick={handleClear}
            className="text-xs text-primary font-medium"
          >
            Clear pin
          </button>
        </div>
      ) : (
        <p className="text-xs text-muted">Search an address above or tap the map to drop a pin.</p>
      )}
    </div>
  );
}
