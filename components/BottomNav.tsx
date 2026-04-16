"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";
import {
  type ListingIntent,
  getStoredIntent,
  subscribeToIntent,
} from "@/lib/listingTypeIntent";

const BASE_NAV_ITEMS = [
  { href: "/", label: "Home", icon: "🏠" },
  { href: "/search", label: "Search", icon: "🔍" },
  { href: "/map", label: "Map", icon: "📍" },
  { href: "/saved", label: "Saved", icon: "❤️" },
  { href: "/profile", label: "Profile", icon: "👤" },
] as const;

// Pages whose nav links should carry the listing type intent param
const INTENT_ROUTES = new Set(["/search", "/map"]);

export function BottomNav() {
  const pathname = usePathname();
  // AC2 (BH-72) — read intent from sessionStorage; server snapshot is null so SSR
  // and client agree on first render, then hydrates to the real stored value
  const intent = useSyncExternalStore<ListingIntent | null>(
    subscribeToIntent,
    getStoredIntent,
    () => null
  );

  // AC8 — hidden on property detail pages
  if (pathname.startsWith("/property/")) return null;

  return (
    <nav
      className="flex-shrink-0 bg-white border-t border-sand-dark"
      // AC9 — safe area for iPhone notch
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="flex">
        {BASE_NAV_ITEMS.map(({ href, label, icon }) => {
          // AC2 (BH-72) — append listingType param to Search and Map links when intent is set
          const navHref =
            INTENT_ROUTES.has(href) && intent
              ? `${href}?listingType=${intent}`
              : href;

          const isActive =
            href === "/" ? pathname === "/" : pathname.startsWith(href);

          return (
            <li key={href} className="flex-1">
              {/* AC6 — min 44px tap area */}
              <Link
                href={navHref}
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
