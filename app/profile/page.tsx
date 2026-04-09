import { Topbar } from "@/components/Topbar";
import { AnimateIn } from "@/components/ui/AnimateIn";

// TODO: replace guest state with authenticated user name and avatar when session exists (AC8)
// TODO: wire Sign In item to Supabase Auth (Phase 2 — BH-16)

const MENU_GROUPS = [
  {
    label: "Account",
    items: [
      { icon: "🔑", label: "Sign in", iconBg: "bg-primary-pale" },
      { icon: "📋", label: "List your property", iconBg: "bg-green/10" },
      { icon: "🏢", label: "I'm a broker / agent", iconBg: "bg-ocean/10" },
    ],
  },
  {
    label: "Discover",
    items: [
      { icon: "📊", label: "Market trends", iconBg: "bg-primary-pale" },
      { icon: "🧮", label: "Mortgage calculator", iconBg: "bg-green/10" },
      { icon: "📖", label: "Buying guide", iconBg: "bg-ocean/10" },
    ],
  },
  {
    label: "More",
    items: [
      { icon: "⚙️", label: "Settings", iconBg: "bg-sand-dark" },
      { icon: "❓", label: "Help & support", iconBg: "bg-sand-dark" },
    ],
  },
] as const;

export default function ProfilePage() {
  return (
    <div className="pb-16">
      <Topbar />

      {/* AC1 — Profile hero */}
      <AnimateIn delay={0} className="mx-3 mt-3">
        <div className="rounded-[20px] bg-gradient-to-br from-primary via-primary-light to-primary/80 px-5 pt-6 pb-5 flex items-center gap-4">
          {/* AC1 — Avatar circle 72px */}
          <div className="w-[72px] h-[72px] rounded-full bg-white/20 border-2 border-white/40 flex items-center justify-center flex-shrink-0">
            <span className="text-3xl leading-none" aria-hidden="true">👤</span>
          </div>

          {/* AC1 — Name + subtitle */}
          <div className="min-w-0">
            <p className="font-display font-bold text-xl text-white leading-tight">
              Welcome, Guest
            </p>
            <p className="text-white/75 text-sm mt-0.5 leading-snug">
              Sign in to save your favorites
            </p>
          </div>
        </div>
      </AnimateIn>

      {/* AC2–AC6 — Three menu groups */}
      <div className="px-3 mt-5 flex flex-col gap-5">
        {MENU_GROUPS.map(({ label, items }, groupIdx) => (
          <AnimateIn key={label} delay={groupIdx === 0 ? 50 : groupIdx === 1 ? 100 : 150}>
            {/* AC2 — Section label */}
            <p className="uppercase text-[11px] text-muted-light tracking-widest mb-2 px-1">
              {label}
            </p>

            {/* AC6 — Menu items */}
            <div>
              {items.map(({ icon, label: itemLabel, iconBg }) => (
                <button
                  key={itemLabel}
                  type="button"
                  // AC7 — tap feedback: scale + bg shift via Tailwind active: utilities
                  className="w-full bg-white rounded-xl p-4 mb-1.5 flex items-center gap-3 active:scale-[0.98] active:bg-sand-dark transition-all duration-100 last:mb-0"
                >
                  {/* AC6 — Coloured icon box 38px */}
                  <div
                    className={`w-[38px] h-[38px] rounded-[10px] ${iconBg} flex items-center justify-center flex-shrink-0`}
                  >
                    <span className="text-lg leading-none" aria-hidden="true">
                      {icon}
                    </span>
                  </div>

                  {/* AC6 — Label */}
                  <span className="flex-1 text-[14px] font-medium text-narra text-left">
                    {itemLabel}
                  </span>

                  {/* AC6 — Arrow */}
                  <span className="text-muted-light text-lg leading-none" aria-hidden="true">
                    ›
                  </span>
                </button>
              ))}
            </div>
          </AnimateIn>
        ))}
      </div>
    </div>
  );
}
