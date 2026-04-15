import type { Metadata } from "next";
import { Topbar } from "@/components/Topbar";
import { AnimateIn } from "@/components/ui/AnimateIn";
import { createServerSupabaseClient } from "@/lib/supabase";

export const metadata: Metadata = {
  title: "Metro Cebu Market Trends — Bahay.ph",
  description:
    "Median sale price per sqm by city in Metro Cebu, based on active Bahay.ph listings.",
};

// ── Metro Cebu coverage (CLAUDE.md focus cities) ─────────────────────────

const METRO_CEBU_CITIES = [
  "Cebu City",
  "Mandaue",
  "Lapu-Lapu City",
  "Talisay City",
  "Cordova",
  "Mactan",
];

/** Minimum listings a city must have to appear on the chart (AC edge cases) */
const MIN_LISTINGS = 3;

// ── Types ─────────────────────────────────────────────────────────────────

interface CityStats {
  city: string;
  medianPricePerSqm: number;
  count: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────

function computeMedian(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

function formatPeso(value: number): string {
  return "₱" + Math.round(value).toLocaleString("en-PH");
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-PH", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

// ── Page ──────────────────────────────────────────────────────────────────

export default async function TrendsPage() {
  const supabase = await createServerSupabaseClient();

  // AC4 — live aggregate query on properties table (anon key, public data)
  const { data: listings } = await supabase
    .from("properties")
    .select("city, price, floor_area")
    .eq("status", "active")
    .eq("price_type", "sale")
    .gt("price", 0);

  // Compute price-per-sqm for each listing, grouped by city
  const byCityMap = new Map<string, number[]>();
  for (const row of listings ?? []) {
    const floor = row.floor_area;
    if (!floor || floor <= 0) continue;
    const pricePerSqm = row.price / floor;
    const arr = byCityMap.get(row.city) ?? [];
    arr.push(pricePerSqm);
    byCityMap.set(row.city, arr);
  }

  // Build stats — Metro Cebu cities only, with minimum listing threshold
  const stats: CityStats[] = METRO_CEBU_CITIES
    .map((city) => ({ city, values: byCityMap.get(city) ?? [] }))
    .filter(({ values }) => values.length >= MIN_LISTINGS)
    .map(({ city, values }) => ({
      city,
      medianPricePerSqm: computeMedian(values),
      count: values.length,
    }))
    .sort((a, b) => b.medianPricePerSqm - a.medianPricePerSqm);

  const totalListings = (listings ?? []).filter((r) => r.floor_area && r.floor_area > 0).length;
  const maxMedian = stats[0]?.medianPricePerSqm ?? 1;
  const today = formatDate(new Date());

  return (
    <div className="pb-16">
      <Topbar />
      <div className="px-3 mt-3 flex flex-col gap-4">
        {/* Page header */}
        <AnimateIn delay={0}>
          <div className="px-1">
            <h1 className="font-display font-bold text-2xl text-narra leading-tight">
              Metro Cebu Trends
            </h1>
            <p className="text-sm text-muted mt-1">
              Median sale price per sqm by city.
            </p>
          </div>
        </AnimateIn>

        {/* AC2, AC3 — Bar chart or empty state */}
        <AnimateIn delay={50}>
          {stats.length === 0 ? (
            // AC edge case: no cities with enough listings
            <div className="bg-white rounded-[14px] shadow-card flex items-center justify-center min-h-[180px] p-6">
              <div className="text-center">
                <p className="text-3xl mb-2" aria-hidden="true">📊</p>
                <p className="font-medium text-narra text-sm">
                  Not enough data yet
                </p>
                <p className="text-muted text-sm mt-1">
                  Check back soon as more listings are added.
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-[14px] shadow-card p-4">
              <p className="text-[11px] text-muted-light uppercase tracking-widest mb-4">
                Price per sqm — For Sale
              </p>

              <div className="flex flex-col gap-4">
                {stats.map((s) => {
                  // Minimum bar width for visual readability
                  const barPct = Math.max(
                    6,
                    (s.medianPricePerSqm / maxMedian) * 100
                  );

                  return (
                    <div key={s.city}>
                      <div className="flex items-end justify-between mb-1.5">
                        <span className="text-[13px] font-medium text-narra">
                          {s.city}
                        </span>
                        <span className="text-[11px] text-muted">
                          {s.count} listing{s.count !== 1 ? "s" : ""}
                        </span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <div className="flex-1 h-5 bg-sand rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{ width: `${barPct}%` }}
                          />
                        </div>
                        {/* w-24 handles up to ₱999,999/sqm comfortably */}
                        <span className="text-[12px] font-semibold text-narra shrink-0 w-24 text-right">
                          {formatPeso(s.medianPricePerSqm)}/sqm
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </AnimateIn>

        {/* AC5 — Recency note */}
        {stats.length > 0 && (
          <AnimateIn delay={100}>
            <p className="text-[11px] text-muted-light text-center px-2 leading-relaxed pb-2">
              Based on {totalListings} active listing
              {totalListings !== 1 ? "s" : ""} as of {today}.{" "}
              For-sale properties with floor area only. Min {MIN_LISTINGS}{" "}
              listings per city shown.
            </p>
          </AnimateIn>
        )}
      </div>
    </div>
  );
}
