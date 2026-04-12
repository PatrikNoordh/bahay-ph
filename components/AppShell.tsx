import { BottomNav } from "./BottomNav";
import { ToastProvider } from "./ui/Toast";

interface AppShellProps {
  children: React.ReactNode;
}

/**
 * App shell — wraps every screen in a 420px phone frame.
 * - Mobile  (≤420px): full-screen, bg-sand
 * - Desktop (>420px): centred phone frame, 92dvh, rounded-3xl, bg-narra behind
 *
 * AC1, AC2, AC10
 */
export function AppShell({ children }: AppShellProps) {
  return (
    // AC2 — bg-narra behind the frame on desktop; invisible on mobile (same as sand)
    <div className="flex items-start justify-center min-h-dvh bg-sand md:bg-narra md:py-[4dvh]">
      {/* AC1 — max-w-[420px], 100dvh mobile / 92dvh desktop, bg-sand, overflow-hidden */}
      <div className="relative w-full max-w-[420px] h-[100dvh] md:h-[92dvh] md:rounded-3xl bg-sand overflow-hidden flex flex-col">
        {/* ToastProvider wraps content so toast renders inside the shell frame (AC4) */}
        <ToastProvider>
          {/* Scrollable content area — flex-1 so nav stays at bottom */}
          <main className="flex-1 overflow-y-auto overscroll-contain">
            {children}
          </main>

          {/* AC7 — fixed at bottom of shell, full width, white bg, top border */}
          <BottomNav />
        </ToastProvider>
      </div>
    </div>
  );
}
