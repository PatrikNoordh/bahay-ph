"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";
import { useSavedStore } from "@/store/useSavedStore";
import { useToast } from "@/components/ui/Toast";

/**
 * Per-property hook used by PropertyCard (all variants).
 * Reads from and writes to the global Zustand saved-properties store.
 *
 * AC5  — heart button reads isSaved from store, not local state
 * AC6  — state is in sync across Home, Search, Map, and Saved screens
 * AC7  — unauthenticated tap redirects to /auth
 */
export function useSavedProperty(propertyId: string) {
  const router = useRouter();
  const savedMap = useSavedStore((state) => state.savedMap);
  const toggleSaved = useSavedStore((state) => state.toggleSaved);
  const { showToast } = useToast();

  const isSaved = Boolean(savedMap[propertyId]);

  const toggle = async () => {
    const wasSaved = isSaved;
    const result = await toggleSaved(propertyId);
    if (result === "unauthorized") {
      router.push("/auth");
    } else if (result === "error") {
      showToast("Failed to update saved properties.", "error");
    } else {
      showToast(wasSaved ? "Removed from saved." : "Property saved!", "success");
    }
  };

  return { isSaved, toggle };
}

// ─────────────────────────────────────────────────────────────────────────────

export interface UseSavedPropertiesResult {
  savedIds: string[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

/**
 * Fetches all saved property IDs for the currently authenticated user.
 * Returns an empty list (not an error) when the user is not logged in.
 * Call refresh() to re-sync after toggling saves externally.
 */
export function useSavedProperties(): UseSavedPropertiesResult {
  const [savedIds, setSavedIds] = useState<string[]>([]);
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
          setSavedIds([]);
          setLoading(false);
        }
        return;
      }

      const { data, error: fetchError } = await supabase
        .from("saved_properties")
        .select("property_id")
        .eq("user_id", user.id);

      if (cancelled) return;

      if (fetchError) {
        setError(fetchError.message);
        setLoading(false);
        return;
      }

      setSavedIds((data ?? []).map((row) => row.property_id));
      setLoading(false);
    }

    fetchData();
    return () => {
      cancelled = true;
    };
  }, [refreshTick]);

  return { savedIds, loading, error, refresh };
}
