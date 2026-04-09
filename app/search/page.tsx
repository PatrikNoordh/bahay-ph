import { MOCK_LISTINGS } from "@/lib/mockListings";
import { Topbar } from "@/components/Topbar";
import { SearchScreen } from "@/components/SearchScreen";

// TODO: connect to Supabase — server-side query, pass real listings as props (Phase 2 — AC6)

export default function SearchPage() {
  return (
    // dvh units prevent layout shift when mobile keyboard opens (edge case)
    <div className="min-h-[100dvh] pb-16">
      {/* AC5 — Topbar with settings icon on right */}
      <Topbar actions={[{ icon: "⚙️", label: "Settings" }]} />

      {/* All search interactivity lives in the Client Component */}
      <SearchScreen listings={MOCK_LISTINGS} />
    </div>
  );
}
