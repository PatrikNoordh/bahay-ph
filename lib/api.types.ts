// ============================================================
// Bahay.ph — Shared API Request / Response Types
//
// Single source of truth for the shapes sent to and returned from
// API routes in app/api/. Import these in both the route handler
// (server) and the fetch() caller (client) so any shape change
// is caught by TypeScript in both places at once.
// ============================================================

import type { PriceType, PropertyType, PropertyStatus } from "@/lib/types";

// ── POST /api/listings ────────────────────────────────────────────────────────

export interface CreateListingRequest {
  title?: string;
  description?: string;
  price?: number | string;
  price_type?: PriceType;
  property_type?: PropertyType;
  bedrooms?: number | string | null;
  bathrooms?: number | string | null;
  floor_area?: number | string | null;
  lot_size?: number | string | null;
  address?: string | null;
  city?: string;
  barangay?: string | null;
}

// ── PATCH /api/listings/[id] ──────────────────────────────────────────────────
// All fields are optional — send only what changed.
// Sending only `status` is valid (status-only toggle).

export interface UpdateListingRequest {
  title?: string;
  description?: string | null;
  price?: number | string;
  price_type?: PriceType;
  property_type?: PropertyType;
  bedrooms?: number | string | null;
  bathrooms?: number | string | null;
  floor_area?: number | string | null;
  lot_size?: number | string | null;
  address?: string | null;
  city?: string;
  barangay?: string | null;
  status?: PropertyStatus;
}

// ── POST /api/saved ───────────────────────────────────────────────────────────

export interface SavePropertyRequest {
  property_id?: string;
}

// ── DELETE /api/saved ─────────────────────────────────────────────────────────

export interface DeleteSavedRequest {
  id?: string;
}
