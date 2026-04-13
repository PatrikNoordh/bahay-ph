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

/** Supabase project URL — required in all environments */
export const SUPABASE_URL = requireEnv("NEXT_PUBLIC_SUPABASE_URL");

/** Supabase anon key — safe to expose client-side */
export const SUPABASE_ANON_KEY = requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");

// ── Server-only ──────────────────────────────────────────────────────────────

/**
 * Supabase service role key — server-only, never expose client-side.
 * AC5: Validated in server context only (lazy getter so it doesn't run in the browser bundle).
 */
export function getServiceRoleKey(): string {
  return requireEnv("SUPABASE_SERVICE_ROLE_KEY");
}

/**
 * Linear API key — server-only for direct API calls.
 * Never expose this to the client. Use in API routes and server actions only.
 */
export function getLinearApiKey(): string {
  return requireEnv("LINEAR_API_KEY");
}

