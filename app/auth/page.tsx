import Link from "next/link";
import { AuthForm } from "@/components/AuthForm";

// AC3 — Redirect if already signed in handled in middleware.ts

interface AuthPageProps {
  searchParams: Promise<{ redirectTo?: string }>;
}

export default async function AuthPage({ searchParams }: AuthPageProps) {
  const { redirectTo } = await searchParams;

  return (
    <div className="min-h-[100dvh] flex flex-col bg-sand px-4 pt-12 pb-8">
      {/* Logo */}
      <div className="text-center mb-8">
        <Link href="/">
          <span className="font-display text-3xl leading-none">
            <span className="text-primary font-bold">Bahay</span>
            <span className="text-narra font-normal">.ph</span>
          </span>
        </Link>
        <p className="text-sm text-muted mt-1">Find your home in Cebu</p>
      </div>

      {/* AC1, AC2 — Sign in / sign up form */}
      <AuthForm redirectTo={redirectTo ?? "/profile"} />

      {/* Back link */}
      <p className="text-center text-xs text-muted mt-6">
        <Link href="/" className="text-primary font-medium">
          ← Back to listings
        </Link>
      </p>
    </div>
  );
}
