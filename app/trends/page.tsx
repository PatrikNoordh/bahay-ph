import type { Metadata } from "next";
import { Topbar } from "@/components/Topbar";
import { AnimateIn } from "@/components/ui/AnimateIn";
import { TrendsChart } from "@/components/TrendsChart";
import type { CityStats } from "@/components/TrendsChart";
import { createServerSupabaseClient } from "@/lib/supabase";

export const metadata: Metadata = {
  title: "Metro Cebu Market Trends — Bahay.ph",
  description:
    "Median sale price and rental rates per sqm by city in Metro Cebu, based on active Bahay.ph listings.",
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

/** Minimum listings a city must have to appear on the chart */
const MIN_LISTINGS = 3;

// ── Helpers ───────────────────────────────────────────────────────────────

function computeMedian(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-PH", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

type RawListing = { city: string; price: number; floor_area: number | null };

function buildCityStats(listings: RawListing[]): {
  stats: CityStats[];
  totalListings: number;
} {
  const byCityMap = new Map<string, number[]>();
  for (const row of listings) {
    const floor = row.floor_area;
    if (!floor || floor <= 0) continue;
    const pricePerSqm = row.price / floor;
    const arr = byCityMap.get(row.city) ?? [];
    arr.push(pricePerSqm);
    byCityMap.set(row.city, arr);
  }

  const stats: CityStats[] = METRO_CEBU_CITIES
    .map((city) => ({ city, values: byCityMap.get(city) ?? [] }))
    .filter(({ values }) => values.length >= MIN_LISTINGS)
    .map(({ city, values }) => ({
      city,
      medianPricePerSqm: computeMedian(values),
      count: values.length,
    }))
    .sort((a, b) => b.medianPricePerSqm - a.medianPricePerSqm);

  const totalListings = listings.filter(
    (r) => r.floor_area && r.floor_area > 0
  ).length;

  return { stats, totalListings };
}

// ── Page ──────────────────────────────────────────────────────────────────

export default async function TrendsPage() {
  const supabase = await createServerSupabaseClient();

  // Fetch sale and rent listings independently — no hardcoded price_type filter
  const [{ data: saleListings }, { data: rentListings }] = await Promise.all([
    supabase
      .from("properties")
      .select("city, price, floor_area")
      .eq("status", "active")
      .eq("price_type", "sale")
      .gt("price", 0),
    supabase
      .from("properties")
      .select("city, price, floor_area")
      .eq("status", "active")
      .eq("price_type", "rent")
      .gt("price", 0),
  ]);

  const { stats: saleStats, totalListings: saleTotalListings } =
    buildCityStats(saleListings ?? []);
  const { stats: rentStats, totalListings: rentTotalListings } =
    buildCityStats(rentListings ?? []);

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
              Median price per sqm by city — sale and rental.
            </p>
          </div>
        </AnimateIn>

        {/* AC2 toggle + AC3 chart — handled by TrendsChart Client Component */}
        <AnimateIn delay={50}>
          <TrendsChart
            saleStats={saleStats}
            rentStats={rentStats}
            saleTotalListings={saleTotalListings}
            rentTotalListings={rentTotalListings}
            minListings={MIN_LISTINGS}
            today={today}
          />
        </AnimateIn>
      </div>
    </div>
  );
}
