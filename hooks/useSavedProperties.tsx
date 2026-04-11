"use client";

import { useRouter } from "next/navigation";
import { useSavedStore } from "@/store/useSavedStore";

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

  const isSaved = Boolean(savedMap[propertyId]);

  const toggle = async () => {
    const result = await toggleSaved(propertyId);
    if (result === "unauthorized") {
      router.push("/auth");
    }
  };

  return { isSaved, toggle };
}
