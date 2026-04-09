"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "Home", icon: "🏠" },
  { href: "/search", label: "Search", icon: "🔍" },
  { href: "/map", label: "Map", icon: "📍" },
  { href: "/saved", label: "Saved", icon: "❤️" },
  { href: "/profile", label: "Profile", icon: "👤" },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  // AC8 — hidden on property detail pages
  if (pathname.startsWith("/property/")) return null;

  return (
    <nav
      className="flex-shrink-0 bg-white border-t border-sand-dark"
      // AC9 — safe area for iPhone notch
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="flex">
        {NAV_ITEMS.map(({ href, label, icon }) => {
          const isActive =
            href === "/" ? pathname === "/" : pathname.startsWith(href);

          return (
            <li key={href} className="flex-1">
              {/* AC6 — min 44px tap area */}
              <Link
                href={href}
                className="flex flex-col items-center justify-center min-h-[44px] py-2 gap-0.5"
              >
                {/* AC4 — full opacity active, 40% inactive */}
                <span
                  className={isActive ? "opacity-100" : "opacity-40"}
                  aria-hidden="true"
                >
                  {icon}
                </span>
                {/* AC4 — text-primary font-semibold active, text-muted inactive */}
                <span
                  className={`text-[10px] leading-none ${
                    isActive
                      ? "text-primary font-semibold"
                      : "text-muted font-normal"
                  }`}
                >
                  {label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
