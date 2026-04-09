import Link from "next/link";
import { Topbar } from "@/components/Topbar";
import { AnimateIn } from "@/components/ui/AnimateIn";
import { SignOutButton } from "@/components/SignOutButton";
import { createServerSupabaseClient } from "@/lib/supabase";

// AC4, AC7 — Auth state read server-side; passed as props to Client Components
// AC8 — TODO: replace guest state with authenticated user name and avatar when session exists

const GUEST_MENU_GROUPS = [
  {
    label: "Account",
    items: [
      { icon: "🔑", label: "Sign in", iconBg: "bg-primary-pale", href: "/auth" },
      { icon: "📋", label: "List your property", iconBg: "bg-green/10", href: null },
      { icon: "🏢", label: "I'm a broker / agent", iconBg: "bg-ocean/10", href: null },
    ],
  },
  {
    label: "Discover",
    items: [
      { icon: "📊", label: "Market trends", iconBg: "bg-primary-pale", href: null },
      { icon: "🧮", label: "Mortgage calculator", iconBg: "bg-green/10", href: null },
      { icon: "📖", label: "Buying guide", iconBg: "bg-ocean/10", href: null },
    ],
  },
  {
    label: "More",
    items: [
      { icon: "⚙️", label: "Settings", iconBg: "bg-sand-dark", href: null },
      { icon: "❓", label: "Help & support", iconBg: "bg-sand-dark", href: null },
    ],
  },
] as const;

const AUTH_MENU_GROUPS = [
  {
    label: "My Account",
    items: [
      { icon: "❤️", label: "Saved properties", iconBg: "bg-primary-pale", href: "/saved" },
      { icon: "📋", label: "List your property", iconBg: "bg-green/10", href: null },
      { icon: "🏢", label: "Agent dashboard", iconBg: "bg-ocean/10", href: "/agent/dashboard" },
    ],
  },
  {
    label: "Discover",
    items: [
      { icon: "📊", label: "Market trends", iconBg: "bg-primary-pale", href: null },
      { icon: "🧮", label: "Mortgage calculator", iconBg: "bg-green/10", href: null },
      { icon: "📖", label: "Buying guide", iconBg: "bg-ocean/10", href: null },
    ],
  },
  {
    label: "More",
    items: [
      { icon: "⚙️", label: "Settings", iconBg: "bg-sand-dark", href: null },
      { icon: "❓", label: "Help & support", iconBg: "bg-sand-dark", href: null },
    ],
  },
] as const;

export default async function ProfilePage() {
  // AC4, AC7 — read auth state in Server Component
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isLoggedIn = !!user;
  const menuGroups = isLoggedIn ? AUTH_MENU_GROUPS : GUEST_MENU_GROUPS;

  return (
    <div className="pb-16">
      <Topbar />

      {/* AC4 — Hero changes based on auth state */}
      <AnimateIn delay={0} className="mx-3 mt-3">
        <div className="rounded-[20px] bg-gradient-to-br from-primary via-primary-light to-primary/80 px-5 pt-6 pb-5 flex items-center gap-4">
          <div className="w-[72px] h-[72px] rounded-full bg-white/20 border-2 border-white/40 flex items-center justify-center flex-shrink-0">
            <span className="text-3xl leading-none" aria-hidden="true">👤</span>
          </div>
          <div className="min-w-0">
            {isLoggedIn ? (
              <>
                <p className="font-display font-bold text-xl text-white leading-tight truncate">
                  {user.email}
                </p>
                <p className="text-white/75 text-sm mt-0.5">Bahay.ph member</p>
              </>
            ) : (
              <>
                <p className="font-display font-bold text-xl text-white leading-tight">
                  Welcome, Guest
                </p>
                <p className="text-white/75 text-sm mt-0.5">
                  Sign in to save your favorites
                </p>
              </>
            )}
          </div>
        </div>
      </AnimateIn>

      {/* Menu groups */}
      <div className="px-3 mt-5 flex flex-col gap-5">
        {menuGroups.map(({ label, items }, groupIdx) => (
          <AnimateIn
            key={label}
            delay={groupIdx === 0 ? 50 : groupIdx === 1 ? 100 : 150}
          >
            <p className="uppercase text-[11px] text-muted-light tracking-widest mb-2 px-1">
              {label}
            </p>

            <div>
              {items.map(({ icon, label: itemLabel, iconBg, href }) => {
                const inner = (
                  <>
                    <div
                      className={`w-[38px] h-[38px] rounded-[10px] ${iconBg} flex items-center justify-center flex-shrink-0`}
                    >
                      <span className="text-lg leading-none" aria-hidden="true">
                        {icon}
                      </span>
                    </div>
                    <span className="flex-1 text-[14px] font-medium text-narra text-left">
                      {itemLabel}
                    </span>
                    <span className="text-muted-light text-lg leading-none" aria-hidden="true">
                      ›
                    </span>
                  </>
                );

                // Items with an href use Link; others are placeholder buttons
                if (href) {
                  return (
                    <Link
                      key={itemLabel}
                      href={href}
                      className="w-full bg-white rounded-xl p-4 mb-1.5 flex items-center gap-3 active:scale-[0.98] active:bg-sand-dark transition-all duration-100 last:mb-0"
                    >
                      {inner}
                    </Link>
                  );
                }

                return (
                  <button
                    key={itemLabel}
                    type="button"
                    className="w-full bg-white rounded-xl p-4 mb-1.5 flex items-center gap-3 active:scale-[0.98] active:bg-sand-dark transition-all duration-100 last:mb-0"
                  >
                    {inner}
                  </button>
                );
              })}

              {/* AC3 — Show sign out at end of first group when logged in */}
              {isLoggedIn && groupIdx === menuGroups.length - 1 && (
                <SignOutButton />
              )}
            </div>
          </AnimateIn>
        ))}
      </div>
    </div>
  );
}
