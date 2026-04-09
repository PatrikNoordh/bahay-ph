"use client";

import { useActionState, useState } from "react";
import { signIn, signUp, type AuthState } from "@/app/auth/actions";

interface AuthFormProps {
  redirectTo: string;
}

const initialState: AuthState = { error: null };

export function AuthForm({ redirectTo }: AuthFormProps) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");

  // AC1, AC2 — separate action state per mode so errors don't bleed across
  const [signInState, signInAction, signInPending] = useActionState(
    signIn,
    initialState
  );
  const [signUpState, signUpAction, signUpPending] = useActionState(
    signUp,
    initialState
  );

  const action = mode === "signin" ? signInAction : signUpAction;
  const state = mode === "signin" ? signInState : signUpState;
  const isPending = signInPending || signUpPending;

  return (
    <div className="bg-white rounded-[20px] shadow-[var(--shadow-card)] p-5">
      {/* Mode toggle */}
      <div className="flex bg-sand rounded-xl p-1 mb-5">
        {(["signin", "signup"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`flex-1 rounded-[10px] py-2 text-sm font-medium transition-colors duration-150 ${
              mode === m
                ? "bg-white text-narra shadow-[var(--shadow-card)]"
                : "text-muted"
            }`}
          >
            {m === "signin" ? "Sign in" : "Create account"}
          </button>
        ))}
      </div>

      <form action={action} noValidate>
        {/* Pass redirectTo so the server action knows where to go after auth */}
        <input type="hidden" name="redirectTo" value={redirectTo} />

        {/* Email */}
        <div className="mb-3">
          <label
            htmlFor="email"
            className="block text-xs font-medium text-muted mb-1"
          >
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            className="w-full bg-sand rounded-[12px] px-3 py-3 text-sm text-narra placeholder:text-muted outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        {/* Password */}
        <div className="mb-4">
          <label
            htmlFor="password"
            className="block text-xs font-medium text-muted mb-1"
          >
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            placeholder={
              mode === "signin" ? "Your password" : "Minimum 8 characters"
            }
            className="w-full bg-sand rounded-[12px] px-3 py-3 text-sm text-narra placeholder:text-muted outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        {/* Error message (AC — wrong password, email in use, weak password) */}
        {state?.error && (
          <div
            role="alert"
            className="mb-4 bg-primary/10 text-primary text-sm rounded-[12px] px-3 py-2.5"
          >
            {state.error}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={isPending}
          className="w-full bg-primary text-white font-medium text-sm rounded-[12px] py-3.5 active:scale-[0.97] transition-transform duration-100 disabled:opacity-60"
        >
          {isPending
            ? mode === "signin"
              ? "Signing in…"
              : "Creating account…"
            : mode === "signin"
            ? "Sign in"
            : "Create account"}
        </button>
      </form>
    </div>
  );
}
