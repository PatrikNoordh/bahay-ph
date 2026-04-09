import { createServerSupabaseClient } from "@/lib/supabase";
import { redirect } from "next/navigation";
import { Topbar } from "@/components/Topbar";

// AC6 — Protected route: middleware redirects unauthenticated users to /auth
// This check is a server-side defence-in-depth fallback
// TODO: connect to Supabase saved_properties — fetch user's saved listings (Phase 2 — BH-19)

export default async function SavedPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth?redirectTo=/saved");

  return (
    <div className="pb-16">
      <Topbar />
      <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
        <p className="text-4xl mb-3" aria-hidden="true">❤️</p>
        <p className="font-display font-semibold text-lg text-narra mb-1">
          Your saved properties
        </p>
        <p className="text-sm text-muted">
          Properties you save will appear here.
        </p>
        {/* TODO: render saved PropertyCard grid (Phase 2 — BH-19) */}
      </div>
    </div>
  );
}
