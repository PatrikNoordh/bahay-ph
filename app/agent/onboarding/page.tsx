import { redirect } from "next/navigation";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase";
import { OnboardingForm } from "@/components/OnboardingForm";

// AC1 — Prompt broker to complete their agent profile after signing up.
// If an agent row already exists, skip to the dashboard.

export default async function OnboardingPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth?redirectTo=/agent/onboarding");

  // Edge case: agent profile already exists — go straight to dashboard
  const { data: existingAgent } = await supabase
    .from("agents")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (existingAgent) redirect("/agent/dashboard");

  return (
    <div className="min-h-[100dvh] flex flex-col bg-sand px-4 pt-12 pb-10">
      {/* Logo */}
      <div className="text-center mb-8">
        <Link href="/">
          <span className="font-display text-3xl leading-none">
            <span className="text-primary font-bold">Bahay</span>
            <span className="text-narra font-normal">.ph</span>
          </span>
        </Link>
        <p className="text-sm text-muted mt-1">Broker registration</p>
      </div>

      {/* Card */}
      <div className="bg-white rounded-[20px] shadow-[var(--shadow-card)] px-5 py-6 max-w-md w-full mx-auto">
        <h1 className="font-display font-bold text-xl text-narra mb-1">
          Set up your broker profile
        </h1>
        <p className="text-sm text-muted mb-6">
          Complete your details below. Our team will verify your PRC licence
          before you can create listings — usually within 1 business day.
        </p>

        {/* AC2 — Form collects: full name, phone, company, years exp, PRC licence */}
        <OnboardingForm />
      </div>

      <p className="text-center text-xs text-muted mt-6">
        <Link href="/" className="text-primary font-medium">
          ← Back to listings
        </Link>
      </p>
    </div>
  );
}
