"use client";

import { useState, useEffect, useCallback } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";
import { propertyToListing, buildImageMap, buildAgentMap } from "@/lib/listingHelpers";
import type { Property, PropertyImage, Agent, Listing, PropertyType, PriceType } from "@/lib/types";

export interface ListingFilters {
  q?: string;
  city?: string;
  property_type?: PropertyType;
  price_type?: PriceType;
  priceMin?: number;
  priceMax?: number;
  minBeds?: number;
  sort?: "newest" | "price_asc" | "price_desc";
  page?: number;
  pageSize?: number;
}

export interface UseListingsResult {
  listings: Listing[];
  totalCount: number;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

/**
 * Client-side hook for fetching active listings with optional filters.
 * Returns mapped Listing UI objects — images and agents are batch-fetched internally.
 *
 * Pass a stable (memoized) filters object to prevent unnecessary re-fetches.
 * Call refresh() to re-fetch with the current filters (e.g. after a mutation).
 */
export function useListings(filters: ListingFilters = {}): UseListingsResult {
  const [listings, setListings] = useState<Listing[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);

  const refresh = useCallback(() => setRefreshTick((n) => n + 1), []);

  // Serialize filters for a stable effect dependency — avoids object reference churn
  const filtersJson = JSON.stringify(filters);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      setLoading(true);
      setError(null);

      const supabase = createBrowserSupabaseClient();
      const pageSize = filters.pageSize ?? 20;
      const page = Math.max(1, filters.page ?? 1);

      let query = supabase
        .from("properties")
        .select("*", { count: "exact" })
        .eq("status", "active");

      if (filters.q?.trim()) {
        const q = filters.q.trim();
        query = query.or(
          `title.ilike.%${q}%,description.ilike.%${q}%,city.ilike.%${q}%,address.ilike.%${q}%`
        );
      }

      if (filters.city?.trim()) {
        query = query.ilike("city", `%${filters.city.trim()}%`);
      }

      if (filters.property_type) {
        query = query.eq("property_type", filters.property_type);
      }

      if (filters.price_type) {
        query = query.eq("price_type", filters.price_type);
      }

      if (filters.minBeds && filters.minBeds > 0) {
        query = query.gte("bedrooms", filters.minBeds);
      }

      if (filters.priceMin !== undefined && !isNaN(filters.priceMin)) {
        query = query.gte("price", filters.priceMin);
      }

      if (filters.priceMax !== undefined && !isNaN(filters.priceMax)) {
        query = query.lte("price", filters.priceMax);
      }

      if (filters.sort === "price_asc") {
        query = query.order("price", { ascending: true });
      } else if (filters.sort === "price_desc") {
        query = query.order("price", { ascending: false });
      } else {
        query = query.order("created_at", { ascending: false });
      }

      query = query.range(0, page * pageSize - 1);

      const { data: props, count, error: fetchError } = await query;

      if (cancelled) return;

      if (fetchError) {
        setError(fetchError.message);
        setLoading(false);
        return;
      }

      const properties = (props ?? []) as Property[];

      if (properties.length === 0) {
        setListings([]);
        setTotalCount(count ?? 0);
        setLoading(false);
        return;
      }

      const propertyIds = properties.map((p) => p.id);

      const { data: imageRows } = await supabase
        .from("property_images")
        .select("*")
        .in("property_id", propertyIds);

      const agentIds = [
        ...new Set(properties.map((p) => p.agent_id).filter(Boolean)),
      ] as string[];

      const { data: agentRows } = agentIds.length
        ? await supabase.from("agents").select("*").in("id", agentIds)
        : { data: [] as Agent[] };

      if (cancelled) return;

      const imageMap = buildImageMap((imageRows ?? []) as PropertyImage[]);
      const agentMap = buildAgentMap((agentRows ?? []) as Agent[]);

      const mapped = properties.map((prop, i) =>
        propertyToListing(
          prop,
          imageMap[prop.id] ?? [],
          agentMap[prop.agent_id ?? ""] ?? null,
          i
        )
      );

      setListings(mapped);
      setTotalCount(count ?? 0);
      setLoading(false);
    }

    fetchData();
    return () => {
      cancelled = true;
    };
    // filtersJson is the stable serialized form of filters; refreshTick forces a re-fetch
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersJson, refreshTick]);

  return { listings, totalCount, loading, error, refresh };
}
