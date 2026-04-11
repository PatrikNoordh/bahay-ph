"use client";

import { useEffect } from "react";
import { useSavedStore } from "@/store/useSavedStore";

/**
 * Mounts in the app shell and initialises the Zustand saved-properties store
 * by fetching the current user's saved_properties from the API.
 * Renders nothing — side-effect only.
 */
export function SavedStoreInitializer() {
  const init = useSavedStore((state) => state.init);

  useEffect(() => {
    void init();
  }, [init]);

  return null;
}
