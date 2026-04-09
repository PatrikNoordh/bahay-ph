"use client";

import Link from "next/link";

export interface TopbarAction {
  icon: string;
  label: string;
  onClick?: () => void;
  href?: string;
}

interface TopbarProps {
  actions?: TopbarAction[];
  /** AC4 — transparent bg for map screen */
  transparent?: boolean;
}

/**
 * Reusable sticky topbar with logo and optional right-side icon buttons.
 * AC1, AC2, AC3, AC4, AC5, AC6
 */
export function Topbar({ actions = [], transparent = false }: TopbarProps) {
  const btnClass =
    "flex items-center justify-center w-[38px] h-[38px] rounded-full bg-white border border-primary/10 active:scale-[0.92] transition-transform duration-100";

  return (
    // AC3 — sticky top-0 z-50 backdrop-blur
    <header
      className={`sticky top-0 z-50 flex items-center justify-between px-4 h-14 backdrop-blur-sm ${
        // AC4 — transparent prop for map screen
        transparent ? "bg-transparent" : "bg-sand/90"
      }`}
    >
      {/* AC1 — Logo: "Bahay" in primary/bold/display, ".ph" in narra/normal */}
      <span className="font-display text-xl leading-none shrink-0 select-none">
        <span className="text-primary font-bold">Bahay</span>
        <span className="text-narra font-normal">.ph</span>
      </span>

      {/* AC2 — Right-side icon buttons: 38px circular, bg-white, border border-primary/10 */}
      {actions.length > 0 && (
        <div className="flex items-center gap-2">
          {actions.map(({ icon, label, onClick, href }) => {
            // AC5 — href buttons use Link for client-side navigation (e.g. /profile)
            if (href) {
              return (
                <Link key={label} href={href} className={btnClass} aria-label={label}>
                  {/* AC6 — active:scale-[0.92] applied via btnClass */}
                  <span aria-hidden="true" className="text-base leading-none">
                    {icon}
                  </span>
                </Link>
              );
            }

            return (
              <button
                key={label}
                type="button"
                className={btnClass}
                onClick={onClick}
                aria-label={label}
              >
                {/* AC6 — active:scale-[0.92] applied via btnClass */}
                <span aria-hidden="true" className="text-base leading-none">
                  {icon}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
}
