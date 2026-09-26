"use client";

// BH-56 — AC4: Set new password after clicking the reset link.
// Uses the browser Supabase client — the session was established by
// /auth/callback before redirecting here.

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";

export function PasswordResetForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setIsPending(true);
    const supabase = createBrowserSupabaseClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setIsPending(false);

    if (updateError) {
      // AC5 edge case: expired / invalid recovery session
      const msg = updateError.message.toLowerCase();
      if (msg.includes("expired") || msg.includes("invalid") || msg.includes("token")) {
        setError("This reset link has expired.");
      } else {
        setError(updateError.message);
      }
      return;
    }

    setSuccess(true);
    // Redirect after a brief pause so the user sees the confirmation
    setTimeout(() => router.push("/profile"), 1500);
  }

  // AC5 — Success state
  if (success) {
    return (
      <div className="bg-white rounded-[20px] shadow-[var(--shadow-card)] p-5 text-center">
        <p className="text-3xl mb-2" aria-hidden="true">✅</p>
        <p className="font-semibold text-narra text-sm">Password updated!</p>
        <p className="text-muted text-xs mt-1">Redirecting to your profile…</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[20px] shadow-[var(--shadow-card)] p-5">
      <h2 className="font-display font-bold text-xl text-narra mb-1">
        Set new password
      </h2>
      <p className="text-sm text-muted mb-5">
        Choose a strong password for your Bahay.ph account.
      </p>

      <form onSubmit={handleSubmit} noValidate>
        <div className="mb-3">
          <label
            htmlFor="rp-password"
            className="block text-xs font-medium text-muted mb-1"
          >
            New password
          </label>
          <input
            id="rp-password"
            type="password"
            required
            autoComplete="new-password"
            placeholder="Minimum 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-sand rounded-[12px] px-3 py-3 text-sm text-narra placeholder:text-muted outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <div className="mb-4">
          <label
            htmlFor="rp-confirm"
            className="block text-xs font-medium text-muted mb-1"
          >
            Confirm password
          </label>
          <input
            id="rp-confirm"
            type="password"
            required
            autoComplete="new-password"
            placeholder="Repeat your new password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="w-full bg-sand rounded-[12px] px-3 py-3 text-sm text-narra placeholder:text-muted outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        {/* AC5 — Error state; expired link gets a direct "request new one" link */}
        {error && (
          <div
            role="alert"
            className="mb-4 bg-primary/10 text-primary text-sm rounded-[12px] px-3 py-2.5"
          >
            {error}{" "}
            {error.includes("expired") && (
              <Link href="/auth" className="underline font-medium">
                Request a new link
              </Link>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="w-full bg-primary text-white font-medium text-sm rounded-[12px] py-3.5 active:scale-[0.97] transition-transform duration-100 disabled:opacity-60"
        >
          {isPending ? "Updating password…" : "Set new password"}
        </button>
      </form>
    </div>
  );
}
