import { create } from "zustand";
import type { SavePropertyRequest, DeleteSavedRequest } from "@/lib/api.types";

// property_id → saved_properties.id (or "__optimistic__" during in-flight saves)
type SavedMap = Record<string, string>;

// Per-property sequence counters — module-level, survive re-renders
const seqMap: Record<string, number> = {};

export type ToggleResult = "ok" | "unauthorized" | "error";

interface SavedStore {
  savedMap: SavedMap;
  isInitialized: boolean;
  /** Fetch the current user's saved properties on app mount. Idempotent. */
  init: () => Promise<void>;
  /**
   * Optimistically toggle saved state for a property.
   * Returns "unauthorized" if the user is not logged in — caller handles redirect.
   */
  toggleSaved: (propertyId: string) => Promise<ToggleResult>;
  /** Clear store on sign out. */
  clear: () => void;
}

interface SavedEntry {
  id: string;
  property_id: string;
}

export const useSavedStore = create<SavedStore>((set, get) => ({
  savedMap: {},
  isInitialized: false,

  init: async () => {
    if (get().isInitialized) return;

    try {
      const res = await fetch("/api/saved");

      if (res.status === 401) {
        // Not logged in — empty map is correct
        set({ isInitialized: true });
        return;
      }

      if (!res.ok) {
        set({ isInitialized: true });
        return;
      }

      const data = (await res.json()) as SavedEntry[];
      const savedMap: SavedMap = {};
      data.forEach(({ id, property_id }) => {
        savedMap[property_id] = id;
      });
      set({ savedMap, isInitialized: true });
    } catch {
      // Network error on mount — start with empty map
      set({ isInitialized: true });
    }
  },

  toggleSaved: async (propertyId: string): Promise<ToggleResult> => {
    const { savedMap } = get();
    const savedId = savedMap[propertyId] ?? null;
    const wasSaved = savedId !== null;

    // Skip if a previous save is still in-flight (placeholder not yet resolved)
    if (savedId === "__optimistic__") return "ok";

    // Bump per-property sequence counter — discard stale async responses
    const seq = (seqMap[propertyId] ?? 0) + 1;
    seqMap[propertyId] = seq;
    const isStale = () => seqMap[propertyId] !== seq;

    // Optimistic update
    set((state) => {
      if (wasSaved) {
        const next = { ...state.savedMap };
        delete next[propertyId];
        return { savedMap: next };
      }
      return { savedMap: { ...state.savedMap, [propertyId]: "__optimistic__" } };
    });

    const revert = () => {
      if (isStale()) return;
      set((state) => {
        if (wasSaved)
          return { savedMap: { ...state.savedMap, [propertyId]: savedId! } };
        const next = { ...state.savedMap };
        delete next[propertyId];
        return { savedMap: next };
      });
    };

    try {
      const res = await (wasSaved
        ? fetch("/api/saved", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: savedId } satisfies DeleteSavedRequest),
          })
        : fetch("/api/saved", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ property_id: propertyId } satisfies SavePropertyRequest),
          }));

      if (isStale()) return "ok";

      if (res.status === 401) {
        revert();
        return "unauthorized";
      }

      // 409 = already saved — resolve placeholder with real saved_properties.id
      if (res.status === 409) {
        const data = (await res.json()) as { id?: string };
        if (data.id && !isStale()) {
          set((state) => ({
            savedMap: { ...state.savedMap, [propertyId]: data.id as string },
          }));
        }
        return "ok";
      }

      if (!res.ok) {
        revert();
        return "error";
      }

      // Resolve placeholder with real saved_properties.id from POST response
      if (!wasSaved) {
        const data = (await res.json()) as { id: string };
        if (!isStale()) {
          set((state) => ({
            savedMap: { ...state.savedMap, [propertyId]: data.id },
          }));
        }
      }

      return "ok";
    } catch {
      revert();
      return "error";
    }
  },

  clear: () => set({ savedMap: {}, isInitialized: false }),
}));
