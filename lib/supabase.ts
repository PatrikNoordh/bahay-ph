import { createServerClient } from "@supabase/ssr";
import { createBrowserClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/lib/config";

/**
 * Server-side Supabase client.
 * Use in Server Components and API routes only.
 */
export async function createServerSupabaseClient() {
  const cookieStore = await cookies();

  return createServerClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll called from a Server Component — can be safely ignored
          }
        },
      },
    }
  );
}

/**
 * Browser-side Supabase client.
 * Use in Client Components only ('use client').
 */
export function createBrowserSupabaseClient() {
  return createBrowserClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
  );
}
