"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";

// property_id → saved_properties.id
type SavedMap = Record<string, string>;

interface SavedContextValue {
  savedMap: SavedMap;
  toggle: (propertyId: string) => Promise<void>;
}

const SavedContext = createContext<SavedContextValue>({
  savedMap: {},
  toggle: async () => {},
});

interface SavedEntry {
  id: string;
  property_id: string;
}

// AC5 — Provider fetches GET /api/saved on mount; shared across all cards on the page
export function SavedPropertiesProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [savedMap, setSavedMap] = useState<SavedMap>({});

  useEffect(() => {
    fetch("/api/saved")
      .then((res) => {
        if (!res.ok) return null; // 401 = not logged in — empty map is correct
        return res.json() as Promise<SavedEntry[]>;
      })
      .then((data) => {
        if (!data) return;
        const map: SavedMap = {};
        data.forEach(({ id, property_id }) => {
          map[property_id] = id;
        });
        setSavedMap(map);
      })
      .catch(() => {
        // Network error on load — continue with empty saved map
      });
  }, []);

  // AC1–AC4 — optimistic toggle with revert on failure, redirect on 401
  const toggle = useCallback(
    async (propertyId: string) => {
      const savedId = savedMap[propertyId] ?? null;
      const wasSaved = savedId !== null;

      // AC3 — optimistic update
      setSavedMap((prev) => {
        if (wasSaved) {
          const next = { ...prev };
          delete next[propertyId];
          return next;
        }
        return { ...prev, [propertyId]: "__optimistic__" };
      });

      try {
        const res = await (wasSaved
          ? fetch("/api/saved", {
              method: "DELETE",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ id: savedId }),
            })
          : fetch("/api/saved", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ property_id: propertyId }),
            }));

        // AC4 — not authenticated → revert + redirect to /auth
        if (res.status === 401) {
          setSavedMap((prev) => {
            if (wasSaved) return { ...prev, [propertyId]: savedId! };
            const next = { ...prev };
            delete next[propertyId];
            return next;
          });
          router.push("/auth");
          return;
        }

        // 409 = duplicate save — optimistic state (isSaved=true) is already correct
        if (res.status === 409) return;

        if (!res.ok) throw new Error("API error");

        // AC1 — update placeholder with real saved_properties.id from POST response
        if (!wasSaved) {
          const data = (await res.json()) as { id: string };
          setSavedMap((prev) => ({ ...prev, [propertyId]: data.id }));
        }
      } catch {
        // AC3 — revert optimistic update on network/API failure
        setSavedMap((prev) => {
          if (wasSaved) return { ...prev, [propertyId]: savedId! };
          const next = { ...prev };
          delete next[propertyId];
          return next;
        });
      }
    },
    [savedMap, router]
  );

  return (
    <SavedContext.Provider value={{ savedMap, toggle }}>
      {children}
    </SavedContext.Provider>
  );
}

// AC6 — used in PropertyCard (all 3 variants) and PropertyDetailPage
export function useSavedProperty(propertyId: string) {
  const { savedMap, toggle } = useContext(SavedContext);
  return {
    isSaved: Boolean(savedMap[propertyId]),
    toggle: () => toggle(propertyId),
  };
}
