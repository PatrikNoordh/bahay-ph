// Shared utility for persisting listing type intent (sale | rent) across pages
// Storage: sessionStorage key "bahay_listing_type"
// Cross-component sync: custom DOM event "bahay:intent-change"

export type ListingIntent = "sale" | "rent";

export const STORAGE_KEY = "bahay_listing_type";
export const INTENT_CHANGE_EVENT = "bahay:intent-change";

/**
 * useSyncExternalStore-compatible subscribe function.
 * Notifies subscribers whenever setStoredIntent() is called on the same page.
 */
export function subscribeToIntent(callback: () => void): () => void {
  window.addEventListener(INTENT_CHANGE_EVENT, callback);
  return () => window.removeEventListener(INTENT_CHANGE_EVENT, callback);
}

/** Returns the stored intent for this session, or null if none has been explicitly set. */
export function getStoredIntent(): ListingIntent | null {
  try {
    const val = sessionStorage.getItem(STORAGE_KEY);
    if (val === "rent") return "rent";
    if (val === "sale") return "sale";
    return null;
  } catch {
    // sessionStorage unavailable (private browsing mode)
    return null;
  }
}

/**
 * Persists the intent for this session and notifies other components on the same page.
 * Dispatches "bahay:intent-change" so BottomNav and other listeners can update their hrefs.
 */
export function setStoredIntent(type: ListingIntent): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, type);
    window.dispatchEvent(
      new CustomEvent<ListingIntent>(INTENT_CHANGE_EVENT, { detail: type })
    );
  } catch {
    // sessionStorage unavailable — proceed without persistence
  }
}
