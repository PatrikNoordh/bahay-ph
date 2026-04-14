import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase";
import { Topbar } from "@/components/Topbar";
import { AgentDashboard } from "@/components/AgentDashboard";
import type { Property, PropertyImage } from "@/lib/types";

// AC1 — Protected: middleware already redirects unauthenticated users; this is defence-in-depth

export default async function AgentDashboardPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth?redirectTo=/agent/dashboard");

  // AC1 — No agent row → send user through broker onboarding
  const { data: agent } = await supabase
    .from("agents")
    .select("id, full_name, company_name, is_verified")
    .eq("user_id", user.id)
    .single();

  if (!agent) redirect("/agent/onboarding");

  // AC2 — Fetch all listings belonging to this agent (RLS enforces ownership)
  const { data: listings } = await supabase
    .from("properties")
    .select("*")
    .eq("agent_id", agent.id)
    .order("created_at", { ascending: false });

  const propertyIds = (listings ?? []).map((l) => l.id);

  // AC6 — Fetch primary images for all listings so thumbnails show in the list
  const { data: primaryImageRows } = propertyIds.length
    ? await supabase
        .from("property_images")
        .select("property_id, image_url")
        .in("property_id", propertyIds)
        .eq("is_primary", true)
    : { data: [] as Pick<PropertyImage, "property_id" | "image_url">[] };

  const initialPrimaryImages: Record<string, string> = {};
  (primaryImageRows ?? []).forEach((row) => {
    initialPrimaryImages[row.property_id] = row.image_url;
  });

  return (
    // Nested flex layout: scrollable content inside AppShell's <main>
    <div className="h-full flex flex-col">
      <Topbar />
      <AgentDashboard
        agentId={agent.id}
        isVerified={agent.is_verified}
        initialListings={(listings ?? []) as Property[]}
        initialPrimaryImages={initialPrimaryImages}
      />
    </div>
  );
}
