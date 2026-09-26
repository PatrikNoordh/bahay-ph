/**
 * Environment variable validation — Bahay.ph
 *
 * Validates required env vars at module load time so missing configuration
 * throws a clear, actionable error rather than a cryptic Supabase crash.
 *
 * AC1: Missing vars throw with the exact variable name
 * AC3: Error message guides developer to check .env.local
 * AC4: Secret values are never included in the error message
 */

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}\n` +
        `→ Add it to your .env.local file and restart the dev server.\n` +
        `  See .env.local.example for all required variables.`
    );
  }
  return value;
}

// ── Public (client + server) ─────────────────────────────────────────────────
// NOTE: NEXT_PUBLIC_ vars must be accessed with static literal strings so
// Next.js can inline them into the browser bundle at compile time.
// Dynamic access (process.env[name]) bypasses static analysis and breaks client-side.

/** Supabase project URL — required in all environments */
export const SUPABASE_URL = (() => {
  const value = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!value) throw new Error(
    "Missing required environment variable: NEXT_PUBLIC_SUPABASE_URL\n" +
    "→ Add it to your .env.local file and restart the dev server.\n" +
    "  See .env.local.example for all required variables."
  );
  return value;
})();

/** Supabase anon key — safe to expose client-side */
export const SUPABASE_ANON_KEY = (() => {
  const value = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!value) throw new Error(
    "Missing required environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY\n" +
    "→ Add it to your .env.local file and restart the dev server.\n" +
    "  See .env.local.example for all required variables."
  );
  return value;
})();

// ── Server-only ──────────────────────────────────────────────────────────────

/**
 * Supabase service role key — server-only, never expose client-side.
 * AC5: Validated in server context only (lazy getter so it doesn't run in the browser bundle).
 */
export function getServiceRoleKey(): string {
  return requireEnv("SUPABASE_SERVICE_ROLE_KEY");
}


