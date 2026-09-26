"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
} from "react";

// ── Types ────────────────────────────────────────────────────────────────────

type ToastVariant = "success" | "error";

interface ToastState {
  id: number;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  showToast: (message: string, variant?: ToastVariant) => void;
}

// ── Context ──────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}

// ── Provider ─────────────────────────────────────────────────────────────────

/**
 * Wrap the app shell with this provider.
 * AC6 — at most 1 toast visible at a time (new call replaces current toast).
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // AC3 — auto-dismiss after 3 s; replace any existing toast immediately
  const showToast = useCallback((message: string, variant: ToastVariant = "success") => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast({ id: Date.now(), message, variant });
    timerRef.current = setTimeout(() => setToast(null), 3000);
  }, []);

  // Cleanup on unmount
  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* AC4 — fixed to top of the shell frame, above BottomNav */}
      {toast && <ToastBanner key={toast.id} message={toast.message} variant={toast.variant} onDismiss={() => setToast(null)} />}
    </ToastContext.Provider>
  );
}

// ── Toast banner UI ──────────────────────────────────────────────────────────

interface ToastBannerProps {
  message: string;
  variant: ToastVariant;
  onDismiss: () => void;
}

function ToastBanner({ message, variant, onDismiss }: ToastBannerProps) {
  // AC5 — success = green token, error = primary (terra) token
  const colorClass =
    variant === "success"
      ? "bg-green text-narra"
      : "bg-primary text-white";

  return (
    // AC4 — absolute top of the shell; z-50 so it sits above modals and map
    <div
      role="status"
      aria-live="polite"
      className={`absolute top-3 left-3 right-3 z-[60] flex items-center justify-between gap-3 rounded-[14px] px-4 py-3 shadow-[var(--shadow-card)] ${colorClass} animate-toast-in`}
    >
      <span className="text-sm font-medium leading-snug">{message}</span>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        className="flex-shrink-0 opacity-80 hover:opacity-100 active:scale-[0.92] transition-transform duration-100 text-base leading-none"
      >
        ✕
      </button>
    </div>
  );
}
