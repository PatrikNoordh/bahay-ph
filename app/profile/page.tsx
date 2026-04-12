import Image from "next/image";
import Link from "next/link";
import { Topbar } from "@/components/Topbar";
import { AnimateIn } from "@/components/ui/AnimateIn";
import { SignOutButton } from "@/components/SignOutButton";
import { createServerSupabaseClient } from "@/lib/supabase";

// AC4, AC7 — Auth state read server-side; passed as props to Client Components

/** Derive initials from a display name or email prefix */
function getInitials(nameOrEmail: string): string {
  const name = nameOrEmail.includes("@")
    ? nameOrEmail.split("@")[0]
    : nameOrEmail;
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

/** AC5 — Prefer full_name from agents table, fall back to auth metadata, then email prefix */
function getDisplayName(
  agentName: string | null,
  metaName: string | null | undefined,
  email: string | null | undefined
): string {
  if (agentName) return agentName;
  if (metaName) return metaName;
  if (email) return email.split("@")[0];
  return "Member";
}

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

  // AC5 — fetch agent record for verified brokers (best-effort, never crashes on miss)
  let agentName: string | null = null;
  let agentAvatarUrl: string | null = null;

  if (user) {
    const { data: agent } = await supabase
      .from("agents")
      .select("full_name, avatar_url")
      .eq("user_id", user.id)
      .single();

    agentName = agent?.full_name ?? null;
    agentAvatarUrl = agent?.avatar_url ?? null;
  }

  // AC5 — resolve display name and avatar
  const metaName =
    (user?.user_metadata?.full_name as string | undefined) ??
    (user?.user_metadata?.name as string | undefined) ??
    null;
  const avatarUrl: string | null =
    agentAvatarUrl ??
    (user?.user_metadata?.avatar_url as string | undefined) ??
    null;
  const displayName = user
    ? getDisplayName(agentName, metaName, user.email)
    : null;
  const initials = displayName ? getInitials(displayName) : null;
  const isBroker = !!agentName;

  return (
    <div className="pb-16">
      <Topbar />

      {/* AC1, AC2, AC4 — Hero changes based on auth state */}
      <AnimateIn delay={0} className="mx-3 mt-3">
        <div className="rounded-[20px] bg-gradient-to-br from-primary via-primary-light to-primary/80 px-5 pt-6 pb-5 flex items-center gap-4">
          {/* AC2 — Real avatar or initials circle fallback; guest shows 👤 */}
          <div className="w-[72px] h-[72px] rounded-full border-2 border-white/40 flex-shrink-0 overflow-hidden">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={displayName ?? "Profile photo"}
                width={72}
                height={72}
                className="w-full h-full object-cover"
              />
            ) : initials ? (
              // AC4 — same initials circle style as AgentCard in PropertyDetailPage
              <div className="w-full h-full bg-white/20 flex items-center justify-center">
                <span className="font-display font-bold text-2xl text-white leading-none">
                  {initials}
                </span>
              </div>
            ) : (
              <div className="w-full h-full bg-white/20 flex items-center justify-center">
                <span className="text-3xl leading-none" aria-hidden="true">👤</span>
              </div>
            )}
          </div>

          <div className="min-w-0">
            {isLoggedIn && displayName ? (
              <>
                {/* AC1 — Show display name */}
                <p className="font-display font-bold text-xl text-white leading-tight truncate">
                  {displayName}
                </p>
                <p className="text-white/75 text-sm mt-0.5">
                  {isBroker ? "Licensed broker · Bahay.ph" : "Bahay.ph member"}
                </p>
              </>
            ) : (
              // AC3 — Guest state unchanged
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
