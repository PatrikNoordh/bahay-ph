// BH-56 — AC4: New password form, reached after clicking a reset link.
// The /auth/callback route exchanges the code and sets the session before
// redirecting here, so the browser Supabase client in PasswordResetForm
// has a valid recovery session to call updateUser() against.

import type { Metadata } from "next";
import Link from "next/link";
import { PasswordResetForm } from "@/components/PasswordResetForm";

export const metadata: Metadata = {
  title: "Set New Password — Bahay.ph",
};

export default function ResetPage() {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-sand px-4 pt-12 pb-8">
      {/* Logo — mirrors the auth page layout */}
      <div className="text-center mb-8">
        <Link href="/">
          <span className="font-display text-3xl leading-none">
            <span className="text-primary font-bold">Bahay</span>
            <span className="text-narra font-normal">.ph</span>
          </span>
        </Link>
        <p className="text-sm text-muted mt-1">Find your home in Cebu</p>
      </div>

      {/* AC4, AC5 — set new password form */}
      <PasswordResetForm />

      <p className="text-center text-xs text-muted mt-6">
        <Link href="/auth" className="text-primary font-medium">
          ← Back to sign in
        </Link>
      </p>
    </div>
  );
}
