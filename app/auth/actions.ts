"use server";

import { createServerSupabaseClient } from "@/lib/supabase";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

export interface AuthState {
  error: string | null;
  /** Success message — e.g. "check your email" after a password reset request */
  message?: string | null;
}

// AC2 — Sign in with email + password
export async function signIn(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const raw = (formData.get("redirectTo") as string) || "/profile";
  const redirectTo = raw.startsWith("/") ? raw : "/profile";

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) return { error: error.message };

  redirect(redirectTo);
}

// AC1 — Sign up with email + password
export async function signUp(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const raw = (formData.get("redirectTo") as string) || "/profile";
  const redirectTo = raw.startsWith("/") ? raw : "/profile";

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.signUp({ email, password });

  if (error) return { error: error.message };

  // Supabase may require email confirmation — surface a friendly message
  redirect(redirectTo);
}

// AC3 (BH-56) — Request a password reset email
export async function requestPasswordReset(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = (formData.get("email") as string)?.trim();
  if (!email) return { error: "Email address is required." };

  // Derive origin from the incoming request headers — works on any deployment
  const headerStore = await headers();
  const host = headerStore.get("host") ?? "localhost:3000";
  const protocol = host.includes("localhost") ? "http" : "https";
  const origin = `${protocol}://${host}`;

  const supabase = await createServerSupabaseClient();
  // Edge case: always return a generic message to prevent email enumeration
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/auth/reset`,
  });

  return {
    error: null,
    message: "If that email is registered, you'll receive a reset link shortly.",
  };
}

// AC3 — Sign out clears session
export async function signOut(): Promise<never> {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  redirect("/profile");
}
