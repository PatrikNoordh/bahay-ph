"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import type { Property } from "@/lib/types";
import type {
  DeleteSavedRequest,
  BulkDeleteSavedRequest,
  BulkDeleteSavedResponse,
} from "@/lib/api.types";
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
  selectionMode: boolean;
  selected: boolean;
  onToggleSelect: (savedId: string) => void;
}

function SavedCard({
  item,
  onRemove,
  removing,
  selectionMode,
  selected,
  onToggleSelect,
}: SavedCardProps) {
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

  function handleCardClick(e: React.MouseEvent) {
    if (selectionMode) {
      e.preventDefault();
      onToggleSelect(savedId);
    }
  }

  return (
    <div
      className={`relative rounded-[14px] bg-white overflow-hidden shadow-[var(--shadow-card)] transition-all duration-200 ${removing ? "opacity-40 pointer-events-none scale-95" : ""} ${selectionMode && selected ? "ring-2 ring-primary" : ""}`}
    >
      <Link href={`/property/${property.id}`} className="block" onClick={handleCardClick}>
        {/* Image placeholder */}
        <div className={`relative h-[120px] ${getPlaceholder(property.id)}`}>
          <span
            className={`absolute top-[10px] left-[10px] ${badgeClass} text-xs font-semibold rounded-lg px-2 py-0.5`}
          >
            {badgeText}
          </span>

          {/* Checkbox overlay in selection mode */}
          {selectionMode && (
            <span
              className={`absolute top-[10px] right-[10px] w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${selected ? "bg-primary border-primary" : "bg-white/90 border-sand-dark"}`}
              aria-hidden="true"
            >
              {selected && (
                <svg
                  className="w-3 h-3 text-white"
                  fill="none"
                  viewBox="0 0 12 12"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2 6l3 3 5-5"
                  />
                </svg>
              )}
            </span>
          )}
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

      {/* Heart button — only shown outside selection mode */}
      {!selectionMode && (
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
      )}
    </div>
  );
}

// ── Confirmation dialog ────────────────────────────────────────────────────────

interface ConfirmDialogProps {
  count: number;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}

function ConfirmDialog({ count, onConfirm, onCancel, loading }: ConfirmDialogProps) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-narra/40 backdrop-blur-[2px]"
        onClick={onCancel}
      />

      {/* Sheet */}
      <div className="relative w-full max-w-sm mx-auto bg-white rounded-t-2xl sm:rounded-2xl px-5 py-6 shadow-2xl">
        <h2
          id="confirm-title"
          className="font-display font-semibold text-lg text-narra text-center mb-2"
        >
          Remove {count} {count === 1 ? "property" : "properties"}?
        </h2>
        <p className="text-sm text-muted text-center mb-6">
          {count === 1
            ? "This property will be removed from your saved list."
            : `These ${count} properties will be removed from your saved list.`}
        </p>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 py-3 rounded-xl border border-sand-dark text-sm font-semibold text-narra active:scale-[0.97] transition-transform disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-3 rounded-xl bg-primary text-white text-sm font-semibold active:scale-[0.97] transition-transform disabled:opacity-60"
          >
            {loading ? "Removing…" : "Remove"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export function SavedScreen({ initialItems }: SavedScreenProps) {
  const [items, setItems] = useState<SavedItem[]>(initialItems);
  const [removing, setRemoving] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  // Selection mode state
  const [selectionMode, setSelectionMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showConfirm, setShowConfirm] = useState(false);
  const [bulkRemoving, setBulkRemoving] = useState(false);

  const { showToast } = useToast();

  // ── Single remove ──────────────────────────────────────────────────────────

  const handleRemove = useCallback(async (savedId: string) => {
    // Trigger exit animation immediately via CSS transitions on the removing set
    setRemoving((prev) => new Set(prev).add(savedId));

    try {
      const res = await fetch("/api/saved", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: savedId } satisfies DeleteSavedRequest),
      });

      if (!res.ok) {
        // API failed — clear animation state, item stays in list
        setRemoving((current) => {
          const next = new Set(current);
          next.delete(savedId);
          return next;
        });
        setError("Failed to remove. Please try again.");
        showToast("Failed to remove property.", "error");
      } else {
        // Success — remove from list after CSS transition completes (250ms)
        setTimeout(() => {
          setItems((current) => current.filter((i) => i.savedId !== savedId));
          setRemoving((current) => {
            const next = new Set(current);
            next.delete(savedId);
            return next;
          });
        }, 250);
        showToast("Property removed from saved.", "success");
      }
    } catch {
      // Network error — clear animation state, item stays in list
      setRemoving((current) => {
        const next = new Set(current);
        next.delete(savedId);
        return next;
      });
      setError("Failed to remove. Please try again.");
      showToast("Failed to remove property.", "error");
    }
  }, [showToast]);

  // ── Selection mode helpers ─────────────────────────────────────────────────

  function enterSelectionMode() {
    setSelected(new Set());
    setSelectionMode(true);
  }

  function exitSelectionMode() {
    setSelectionMode(false);
    setSelected(new Set());
  }

  function toggleSelect(savedId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(savedId)) {
        next.delete(savedId);
      } else {
        next.add(savedId);
      }
      return next;
    });
  }

  // ── Bulk remove ────────────────────────────────────────────────────────────

  async function handleBulkRemove() {
    const ids = Array.from(selected);
    setBulkRemoving(true);

    try {
      const res = await fetch("/api/saved", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids } satisfies BulkDeleteSavedRequest),
      });

      const data = (await res.json()) as BulkDeleteSavedResponse;
      const succeeded = new Set(data.succeeded ?? []);
      const failedIds = data.failed ?? [];

      if (succeeded.size > 0) {
        setItems((current) => current.filter((i) => !succeeded.has(i.savedId)));
      }

      if (failedIds.length > 0 && succeeded.size === 0) {
        // Entire batch failed
        setError("Failed to remove properties. Please try again.");
        showToast("Couldn't remove properties. Please try again.", "error");
      } else if (failedIds.length > 0) {
        // Partial failure
        const msg = `${succeeded.size} removed, ${failedIds.length} failed. Please retry the remaining.`;
        setError(msg);
        showToast(msg, "error");
        // Leave failed ones selected so user can retry
        setSelected(new Set(failedIds));
      } else {
        showToast(
          `${ids.length} ${ids.length === 1 ? "property" : "properties"} removed.`,
          "success"
        );
        exitSelectionMode();
      }
    } catch {
      setError("Failed to remove properties. Please try again.");
      showToast("Couldn't remove properties. Please try again.", "error");
    } finally {
      setBulkRemoving(false);
      setShowConfirm(false);
    }
  }

  const selectedCount = selected.size;

  return (
    <div className="flex-1 overflow-y-auto overscroll-contain">
      <div className="px-4 pb-6">
        {/* Header */}
        <div className="pt-4 pb-3 flex items-start justify-between">
          <div>
            <h1 className="font-display font-semibold text-xl text-narra">
              Saved Properties
            </h1>
            {items.length > 0 && !selectionMode && (
              <p className="text-xs text-muted mt-0.5">
                {items.length} {items.length === 1 ? "property" : "properties"} saved
              </p>
            )}
            {selectionMode && (
              <p className="text-xs text-muted mt-0.5">
                {selectedCount > 0
                  ? `${selectedCount} selected`
                  : "Tap properties to select"}
              </p>
            )}
          </div>

          {items.length > 0 && (
            <div className="flex items-center gap-2 mt-1">
              {selectionMode ? (
                <button
                  type="button"
                  onClick={exitSelectionMode}
                  className="text-sm font-semibold text-muted active:opacity-60 transition-opacity"
                >
                  Cancel
                </button>
              ) : (
                <button
                  type="button"
                  onClick={enterSelectionMode}
                  className="text-sm font-semibold text-primary active:opacity-60 transition-opacity"
                >
                  Edit
                </button>
              )}
            </div>
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
                selectionMode={selectionMode}
                selected={selected.has(item.savedId)}
                onToggleSelect={toggleSelect}
              />
            ))}
          </div>
        )}

        {/* Bulk unsave CTA — sticky bottom bar in selection mode */}
        {selectionMode && (
          <div className="fixed bottom-[calc(env(safe-area-inset-bottom)+64px)] left-0 right-0 px-4 z-40">
            <button
              type="button"
              disabled={selectedCount === 0 || bulkRemoving}
              onClick={() => setShowConfirm(true)}
              className="w-full py-3.5 rounded-xl bg-primary text-white text-sm font-semibold shadow-lg active:scale-[0.97] transition-all disabled:opacity-40 disabled:scale-100"
            >
              {selectedCount === 0
                ? "Select properties to remove"
                : `Unsave (${selectedCount})`}
            </button>
          </div>
        )}
      </div>

      {/* Confirmation dialog */}
      {showConfirm && (
        <ConfirmDialog
          count={selectedCount}
          onConfirm={handleBulkRemove}
          onCancel={() => setShowConfirm(false)}
          loading={bulkRemoving}
        />
      )}
    </div>
  );
}
