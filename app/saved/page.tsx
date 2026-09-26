import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase";
import { Topbar } from "@/components/Topbar";
import { SavedScreen } from "@/components/SavedScreen";
import type { Property } from "@/lib/types";
import type { Tables } from "@/lib/database.types";
import type { SavedItem } from "@/components/SavedScreen";

// AC1 — Protected: middleware redirects unauthenticated users; this is defence-in-depth
// AC2 — Fetches saved_properties joined with properties for the authenticated user

export default async function SavedPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth?redirectTo=/saved");

  // AC2 — Fetch saved_properties with joined property rows, newest first
  const { data: rows } = await supabase
    .from("saved_properties")
    .select("id, properties(*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  // Flatten into SavedItem[] — filter out orphans (property deleted after saving)
  const items: SavedItem[] = (rows ?? [])
    .filter((row): row is typeof row & { properties: Tables<"properties"> } =>
      row.properties !== null
    )
    .map((row) => ({
      savedId: row.id,
      property: row.properties as Property,
    }));

  return (
    <div className="h-full flex flex-col">
      <Topbar />
      <SavedScreen initialItems={items} />
    </div>
  );
}
