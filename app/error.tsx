"use client";

import { useEffect } from "react";
import Link from "next/link";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[var(--sand)] flex flex-col items-center justify-center px-6 text-center">
      <p className="text-7xl font-bold text-[var(--terra)] mb-4">!</p>
      <h1 className="font-playfair text-2xl text-[var(--narra)] mb-2">
        Something went wrong
      </h1>
      <p className="text-[var(--muted)] mb-8 max-w-xs">
        An unexpected error occurred. Please try again or go back to the home page.
      </p>
      <div className="flex flex-col gap-3 w-full max-w-[240px]">
        <button
          onClick={reset}
          className="bg-[var(--terra)] text-white px-6 py-3 rounded-xl text-sm font-medium"
        >
          Try again
        </button>
        <Link
          href="/"
          className="text-[var(--terra)] text-sm font-medium py-2"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
