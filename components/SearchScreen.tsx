"use client";

import { useState, useRef, useEffect } from "react";
import type { Listing } from "@/lib/types";
import { PropertyCard } from "@/components/PropertyCard";

// TODO: connect to Supabase — replace with real filter logic against DB (Phase 2 — AC6, AC7, AC8)

const FILTER_PILLS = [
  { id: "type", label: "🏠 Type ▾" },
  { id: "price", label: "💰 Price ▾" },
  { id: "beds", label: "🛏️ Beds ▾" },
  { id: "size", label: "📐 Size ▾" },
  { id: "more", label: "⊕ More" },
];

interface SearchScreenProps {
  listings: Listing[];
}

export function SearchScreen({ listings }: SearchScreenProps) {
  const [query, setQuery] = useState("");
  const [activePills, setActivePills] = useState<Set<string>>(new Set());
  const inputRef = useRef<HTMLInputElement>(null);

  // AC1 — auto-focus search input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // AC1 — client-side filter by name, location, description, or tags
  // TODO: replace with URL param + server query (Phase 2 — AC7, AC8)
  const filtered = listings.filter((l) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      l.name.toLowerCase().includes(q) ||
      l.location.toLowerCase().includes(q) ||
      l.description.toLowerCase().includes(q) ||
      l.tags.some((t) => t.toLowerCase().includes(q))
    );
  });

  function togglePill(id: string) {
    setActivePills((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="flex flex-col">
      {/* AC1 — Search bar */}
      <div className="px-4 pt-3 pb-2">
        <div className="flex items-center gap-2 bg-white rounded-xl shadow-[var(--shadow-card)] border border-primary/10 px-3 py-2.5">
          <span className="text-muted text-base" aria-hidden="true">🔍</span>
          <input
            ref={inputRef}
            type="search"
            placeholder="Search Cebu listings..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 text-sm text-narra bg-transparent outline-none placeholder:text-muted"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="text-muted text-sm leading-none active:scale-[0.92] transition-transform duration-100"
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* AC2 — Filter pills row: horizontal scroll, 5 pills */}
      <div className="flex gap-2 overflow-x-auto px-4 pb-3 no-scrollbar">
        {FILTER_PILLS.map(({ id, label }) => {
          const isActive = activePills.has(id);
          return (
            <button
              key={id}
              type="button"
              onClick={() => togglePill(id)}
              className={`flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-medium border transition-colors duration-150 active:scale-[0.95] ${
                isActive
                  ? "bg-primary text-white border-primary"
                  : "bg-white text-narra border-sand-dark"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* AC3 — Results count, bold number updates reactively */}
      <p className="px-4 mb-3 text-sm text-muted">
        <span className="font-bold text-narra">{filtered.length}</span>{" "}
        {filtered.length === 1 ? "property" : "properties"} found in Cebu
      </p>

      {/* AC4 — 2-column grid or empty state */}
      {filtered.length === 0 ? (
        // Edge case: empty state with reset option
        <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
          <p className="text-4xl mb-3" aria-hidden="true">🏠</p>
          <p className="font-semibold text-narra mb-1">No properties match your search</p>
          <p className="text-sm text-muted mb-4">
            Try a different keyword or area name.
          </p>
          <button
            type="button"
            onClick={() => setQuery("")}
            className="bg-primary text-white text-sm font-medium rounded-[12px] px-5 py-2 active:scale-[0.97] transition-transform duration-100"
          >
            Reset search
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 px-4 pb-4">
          {filtered.map((listing) => (
            <PropertyCard key={listing.id} listing={listing} variant="grid" />
          ))}
        </div>
      )}
    </div>
  );
}
