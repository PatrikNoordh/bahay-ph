"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import type { Property } from "@/lib/types";
import type { DeleteSavedRequest } from "@/lib/api.types";
import { useToast } from "@/components/ui/Toast";

export interface SavedItem {
  savedId: string;
  property: Property;
}

interface SavedScreenProps {
  initialItems: SavedItem[];
}

// Map property_type index to placeholder gradient (cycles through 6 classes)
const IMG_PLACEHOLDERS = [
  "img-placeholder-1",
  "img-placeholder-2",
  "img-placeholder-3",
  "img-placeholder-4",
  "img-placeholder-5",
  "img-placeholder-6",
] as const;

function getPlaceholder(id: string): string {
  // Stable gradient based on last char of id
  const code = id.charCodeAt(id.length - 1) % 6;
  return IMG_PLACEHOLDERS[code];
}

function formatPriceShort(price: number, priceType: "sale" | "rent"): string {
  let short: string;
  if (price >= 1_000_000) {
    short = `₱${(price / 1_000_000).toFixed(price % 1_000_000 === 0 ? 0 : 1)}M`;
  } else if (price >= 1_000) {
    short = `₱${(price / 1_000).toFixed(0)}K`;
  } else {
    short = `₱${price}`;
  }
  return priceType === "rent" ? `${short}/mo` : short;
}

interface SavedCardProps {
  item: SavedItem;
  onRemove: (savedId: string) => void;
  removing: boolean;
}

function SavedCard({ item, onRemove, removing }: SavedCardProps) {
  const { property, savedId } = item;
  const isLotOnly = property.bedrooms === null && property.bathrooms === null;
  const location = property.barangay
    ? `${property.barangay}, ${property.city}`
    : property.city;
  const badgeText = property.price_type === "rent" ? "For Rent" : "For Sale";
  const badgeClass =
    property.price_type === "rent"
      ? "bg-ocean/10 text-ocean"
      : "bg-primary/10 text-primary";

  return (
    <div
      className={`relative rounded-[14px] bg-white overflow-hidden shadow-[var(--shadow-card)] transition-all duration-200 ${removing ? "opacity-40 pointer-events-none scale-95" : ""}`}
    >
      <Link href={`/property/${property.id}`} className="block">
        {/* Image placeholder */}
        <div className={`relative h-[120px] ${getPlaceholder(property.id)}`}>
          <span
            className={`absolute top-[10px] left-[10px] ${badgeClass} text-xs font-semibold rounded-lg px-2 py-0.5`}
          >
            {badgeText}
          </span>
        </div>

        {/* Content */}
        <div className="p-2.5">
          <p className="text-xs font-semibold text-primary leading-none">
            {formatPriceShort(property.price, property.price_type)}
          </p>
          <p className="text-xs font-medium text-narra truncate mt-0.5">
            {property.title}
          </p>
          <p className="text-[10px] text-muted truncate mt-0.5">{location}</p>

          {/* Specs row */}
          <div className="flex items-center gap-1.5 mt-1.5 text-[10px] text-muted">
            {isLotOnly ? (
              property.lot_size && <span>{property.lot_size} m²</span>
            ) : (
              <>
                {property.bedrooms !== null && (
                  <span>{property.bedrooms} bd</span>
                )}
                {property.bathrooms !== null && (
                  <span>{property.bathrooms} ba</span>
                )}
                {property.floor_area !== null && (
                  <span>{property.floor_area} m²</span>
                )}
              </>
            )}
          </div>
        </div>
      </Link>

      {/* Heart button — removes from saved */}
      <button
        type="button"
        aria-label="Remove from saved"
        className="absolute top-[10px] right-[10px] w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center active:scale-[0.92] transition-transform duration-100"
        onClick={() => onRemove(savedId)}
      >
        <span aria-hidden="true" className="text-sm leading-none">
          ❤️
        </span>
      </button>
    </div>
  );
}

export function SavedScreen({ initialItems }: SavedScreenProps) {
  const [items, setItems] = useState<SavedItem[]>(initialItems);
  const [removing, setRemoving] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();

  const handleRemove = useCallback(async (savedId: string) => {
    // Optimistic remove
    setRemoving((prev) => new Set(prev).add(savedId));
    const prev = items;

    // Delay actual removal for animation
    setTimeout(() => {
      setItems((current) => current.filter((i) => i.savedId !== savedId));
      setRemoving((current) => {
        const next = new Set(current);
        next.delete(savedId);
        return next;
      });
    }, 250);

    try {
      const res = await fetch("/api/saved", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: savedId } satisfies DeleteSavedRequest),
      });

      if (!res.ok) {
        // Revert on failure
        setItems(prev);
        setRemoving((current) => {
          const next = new Set(current);
          next.delete(savedId);
          return next;
        });
        setError("Failed to remove. Please try again.");
        showToast("Failed to remove property.", "error");
      } else {
        showToast("Property removed from saved.", "success");
      }
    } catch {
      // Revert on network error
      setItems(prev);
      setRemoving((current) => {
        const next = new Set(current);
        next.delete(savedId);
        return next;
      });
      setError("Failed to remove. Please try again.");
      showToast("Failed to remove property.", "error");
    }
  }, [items, showToast]);

  return (
    <div className="flex-1 overflow-y-auto overscroll-contain">
      <div className="px-4 pb-6">
        {/* Header */}
        <div className="pt-4 pb-3">
          <h1 className="font-display font-semibold text-xl text-narra">
            Saved Properties
          </h1>
          {items.length > 0 && (
            <p className="text-xs text-muted mt-0.5">
              {items.length} {items.length === 1 ? "property" : "properties"} saved
            </p>
          )}
        </div>

        {/* Error banner */}
        {error && (
          <div
            role="alert"
            className="mb-3 rounded-xl bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700 flex items-center justify-between"
          >
            <span>{error}</span>
            <button
              type="button"
              className="ml-3 text-red-400 hover:text-red-600"
              onClick={() => setError(null)}
              aria-label="Dismiss"
            >
              ✕
            </button>
          </div>
        )}

        {/* Empty state */}
        {items.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-4xl mb-3" aria-hidden="true">
              🤍
            </p>
            <p className="font-display font-semibold text-lg text-narra mb-1">
              No saved properties yet
            </p>
            <p className="text-sm text-muted max-w-xs">
              Tap ❤️ on any listing to save it here for later.
            </p>
            <Link
              href="/"
              className="mt-6 inline-flex items-center gap-2 bg-primary text-white text-sm font-semibold px-5 py-2.5 rounded-xl active:scale-[0.97] transition-transform"
            >
              Browse listings
            </Link>
          </div>
        )}

        {/* 2-column grid */}
        {items.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            {items.map((item) => (
              <SavedCard
                key={item.savedId}
                item={item}
                onRemove={handleRemove}
                removing={removing.has(item.savedId)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
