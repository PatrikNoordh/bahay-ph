"use server";

import { createServerSupabaseClient } from "@/lib/supabase";
import { redirect } from "next/navigation";

export interface AuthState {
  error: string | null;
}

// AC2 — Sign in with email + password
export async function signIn(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const redirectTo = (formData.get("redirectTo") as string) || "/profile";

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
  const redirectTo = (formData.get("redirectTo") as string) || "/profile";

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.signUp({ email, password });

  if (error) return { error: error.message };

  // Supabase may require email confirmation — surface a friendly message
  redirect(redirectTo);
}

// AC3 — Sign out clears session
export async function signOut(): Promise<never> {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  redirect("/profile");
}
