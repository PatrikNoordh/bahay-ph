import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase";
import { Topbar } from "@/components/Topbar";
import { AgentDashboard } from "@/components/AgentDashboard";
import type { Property } from "@/lib/types";

// AC1 — Protected: middleware already redirects unauthenticated users; this is defence-in-depth

export default async function AgentDashboardPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth?redirectTo=/agent/dashboard");

  // AC — Edge case: logged-in user with no agent record (buyers, guests who sign up)
  const { data: agent } = await supabase
    .from("agents")
    .select("id, full_name, company_name")
    .eq("user_id", user.id)
    .single();

  if (!agent) {
    return (
      <div className="pb-16">
        <Topbar />
        <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
          <p className="text-4xl mb-3" aria-hidden="true">🏢</p>
          <p className="font-display font-semibold text-lg text-narra mb-1">
            No agent profile yet
          </p>
          <p className="text-sm text-muted max-w-xs">
            Your account doesn&apos;t have an agent profile. Contact{" "}
            <span className="text-primary font-medium">Bahay.ph</span> to get
            verified as a licensed broker.
          </p>
        </div>
      </div>
    );
  }

  // AC2 — Fetch all listings belonging to this agent (RLS enforces ownership)
  const { data: listings } = await supabase
    .from("properties")
    .select("*")
    .eq("agent_id", agent.id)
    .order("created_at", { ascending: false });

  return (
    // Nested flex layout: scrollable content inside AppShell's <main>
    <div className="h-full flex flex-col">
      <Topbar />
      <AgentDashboard
        agentId={agent.id}
        initialListings={(listings ?? []) as Property[]}
      />
    </div>
  );
}
