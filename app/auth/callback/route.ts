// BH-56 — PKCE auth callback route
// Exchanges the one-time `code` in the URL for a Supabase session, then
// redirects to the `next` parameter (default: /profile).
//
// Used by: password reset emails (next=/auth/reset) and any future
// email confirmation or magic-link flows.

import { createServerSupabaseClient } from "@/lib/supabase";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/profile";

  if (code) {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(new URL(next, origin));
    }
  }

  // Code missing or exchange failed (expired / already used)
  // Redirect to auth with an error hint so the user can request a new link
  return NextResponse.redirect(new URL("/auth?error=link_expired", origin));
}
