"use client";

import { useState, useEffect, useCallback } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";
import type { Property } from "@/lib/types";

export interface UseAgentListingsResult {
  listings: Property[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

/**
 * Fetches all listings belonging to the currently logged-in agent, newest first.
 * Returns an empty list (not an error) when the user has no session.
 * Returns an error when the user is logged in but has no agent profile.
 * Call refresh() to re-sync after creating, updating, or deleting a listing.
 */
export function useAgentListings(): UseAgentListingsResult {
  const [listings, setListings] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);

  const refresh = useCallback(() => setRefreshTick((n) => n + 1), []);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      setLoading(true);
      setError(null);

      const supabase = createBrowserSupabaseClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // No authenticated user — return empty list, not an error
      if (!user) {
        if (!cancelled) {
          setListings([]);
          setLoading(false);
        }
        return;
      }

      const { data: agent, error: agentError } = await supabase
        .from("agents")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (cancelled) return;

      if (agentError || !agent) {
        setError(agentError?.message ?? "No agent profile found");
        setLoading(false);
        return;
      }

      const { data, error: listingsError } = await supabase
        .from("properties")
        .select("*")
        .eq("agent_id", agent.id)
        .order("created_at", { ascending: false });

      if (cancelled) return;

      if (listingsError) {
        setError(listingsError.message);
        setLoading(false);
        return;
      }

      setListings((data ?? []) as Property[]);
      setLoading(false);
    }

    fetchData();
    return () => {
      cancelled = true;
    };
  }, [refreshTick]);

  return { listings, loading, error, refresh };
}
