"use client";

import { signOut } from "@/app/auth/actions";
import { useSavedStore } from "@/store/useSavedStore";

// AC3 — Sign out clears session and redirects to /profile (guest state)
// AC8 — Store is cleared immediately on sign out
export function SignOutButton() {
  const clear = useSavedStore((state) => state.clear);

  return (
    <form
      action={async () => {
        clear();
        await signOut();
      }}
    >
      <button
        type="submit"
        className="w-full bg-white rounded-xl p-4 mb-1.5 flex items-center gap-3 active:scale-[0.98] active:bg-sand-dark transition-all duration-100"
      >
        <div className="w-[38px] h-[38px] rounded-[10px] bg-primary/10 flex items-center justify-center flex-shrink-0">
          <span className="text-lg leading-none" aria-hidden="true">🚪</span>
        </div>
        <span className="flex-1 text-[14px] font-medium text-narra text-left">
          Sign out
        </span>
        <span className="text-muted-light text-lg leading-none" aria-hidden="true">
          ›
        </span>
      </button>
    </form>
  );
}
