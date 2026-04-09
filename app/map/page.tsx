import { MOCK_LISTINGS } from "@/lib/mockListings";
import { MapScreen } from "@/components/MapScreen";

// TODO: connect to Supabase — server-side query with lat/lng coords, filter active only (Phase 2 — AC11)

export default function MapPage() {
  return <MapScreen listings={MOCK_LISTINGS} />;
}
