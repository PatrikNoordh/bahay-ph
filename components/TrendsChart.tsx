"use client";

import { useState } from "react";

// ── Types ─────────────────────────────────────────────────────────────────

export interface CityStats {
  city: string;
  medianPricePerSqm: number;
  count: number;
}

interface TrendsChartProps {
  saleStats: CityStats[];
  rentStats: CityStats[];
  saleTotalListings: number;
  rentTotalListings: number;
  minListings: number;
  today: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────

function formatPeso(value: number): string {
  return "₱" + Math.round(value).toLocaleString("en-PH");
}

// ── Component ─────────────────────────────────────────────────────────────

export function TrendsChart({
  saleStats,
  rentStats,
  saleTotalListings,
  rentTotalListings,
  minListings,
  today,
}: TrendsChartProps) {
  // AC1 — defaults to "For Sale"
  const [priceType, setPriceType] = useState<"sale" | "rent">("sale");

  const isSale = priceType === "sale";
  const stats = isSale ? saleStats : rentStats;
  const totalListings = isSale ? saleTotalListings : rentTotalListings;
  const maxMedian = stats[0]?.medianPricePerSqm ?? 1;

  // AC4 — label and unit change per type
  const chartLabel = isSale
    ? "Price per sqm — For Sale"
    : "Monthly rent per sqm — For Rent";
  const priceUnit = isSale ? "/sqm" : "/sqm/mo";
  const footerNote = isSale
    ? `Based on ${totalListings} active listing${totalListings !== 1 ? "s" : ""} as of ${today}. For-sale properties with floor area only. Min ${minListings} listings per city shown.`
    : `Based on ${totalListings} active rental listing${totalListings !== 1 ? "s" : ""} as of ${today}. Rental properties with floor area only. Min ${minListings} listings per city shown.`;

  return (
    <>
      {/* AC2 — Sale / Rent toggle pill */}
      <div className="flex gap-2 px-1">
        <button
          type="button"
          onClick={() => setPriceType("sale")}
          className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors duration-150 ${
            isSale
              ? "bg-primary text-white"
              : "bg-white text-muted border border-sand-dark"
          }`}
        >
          For Sale
        </button>
        <button
          type="button"
          onClick={() => setPriceType("rent")}
          className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors duration-150 ${
            !isSale
              ? "bg-ocean text-white"
              : "bg-white text-muted border border-sand-dark"
          }`}
        >
          For Rent
        </button>
      </div>

      {/* AC2, AC3 — Bar chart or empty state */}
      {stats.length === 0 ? (
        <div className="bg-white rounded-[14px] shadow-card flex items-center justify-center min-h-[180px] p-6">
          <div className="text-center">
            <p className="text-3xl mb-2" aria-hidden="true">📊</p>
            <p className="font-medium text-narra text-sm">
              Not enough data yet
            </p>
            <p className="text-muted text-sm mt-1">
              {isSale
                ? "Check back soon as more listings are added."
                : "No rental listings with enough data yet."}
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-[14px] shadow-card p-4">
          {/* AC4 — chart label updates per type */}
          <p className="text-[11px] text-muted-light uppercase tracking-widest mb-4">
            {chartLabel}
          </p>

          <div className="flex flex-col gap-4">
            {stats.map((s) => {
              const barPct = Math.max(6, (s.medianPricePerSqm / maxMedian) * 100);
              const barColor = isSale ? "bg-primary" : "bg-ocean";

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
                        className={`h-full rounded-full ${barColor}`}
                        style={{ width: `${barPct}%` }}
                      />
                    </div>
                    {/* w-28 handles ₱999,999/sqm/mo comfortably */}
                    <span className="text-[12px] font-semibold text-narra shrink-0 w-28 text-right">
                      {formatPeso(s.medianPricePerSqm)}{priceUnit}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recency note */}
      {stats.length > 0 && (
        <p className="text-[11px] text-muted-light text-center px-2 leading-relaxed pb-2">
          {footerNote}
        </p>
      )}
    </>
  );
}
