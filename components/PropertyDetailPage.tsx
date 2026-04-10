"use client";

import { useRouter } from "next/navigation";
import type { Listing } from "@/lib/types";
import { useSavedProperty } from "@/hooks/useSavedProperties";
import { buildWhatsAppUrl } from "@/lib/utils";

// TODO: replace gradient placeholder with next/image from Supabase Storage (Phase 2 — AC14)
// TODO: WhatsApp CTA — wa.me/63XXXXXXXXXX link (Phase 2 — AC15)
// TODO: Call agent — tel: link (Phase 2 — AC16)

interface PropertyDetailPageProps {
  listing: Listing | null;
}

export function PropertyDetailPage({ listing }: PropertyDetailPageProps) {
  const router = useRouter();
  // AC6 — listing.id is stable; hook reads from SavedPropertiesProvider context
  const { isSaved, toggle } = useSavedProperty(listing?.id ?? "");

  // ── 404 fallback — unknown ID (edge case) ──────────────────
  if (!listing) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <p className="text-4xl mb-3" aria-hidden="true">🏠</p>
        <p className="font-display font-semibold text-lg text-narra mb-1">
          Listing not found
        </p>
        <p className="text-sm text-muted mb-6">
          This property may have been removed or the link is incorrect.
        </p>
        <button
          type="button"
          onClick={() => router.push("/")}
          className="bg-primary text-white text-sm font-medium rounded-[12px] px-5 py-2.5 active:scale-[0.97] transition-transform duration-100"
        >
          Back to Home
        </button>
      </div>
    );
  }

  const isLotOnly = listing.beds === null && listing.baths === null;

  // AC1–AC4 — WhatsApp deep link; null when agent has no phone on record
  const whatsAppUrl =
    listing.agent?.phone
      ? buildWhatsAppUrl(listing.agent.phone, listing.name)
      : null;

  // Specs for the specs row (AC5) — up to 4, lot-only hides beds/baths
  const specs = [
    ...(isLotOnly
      ? []
      : [
          ...(listing.beds !== null
            ? [{ label: "Bedrooms", value: String(listing.beds) }]
            : []),
          ...(listing.baths !== null
            ? [{ label: "Bathrooms", value: String(listing.baths) }]
            : []),
        ]),
    ...(listing.area !== null
      ? [{ label: "Floor Area", value: `${listing.area} m²` }]
      : []),
    ...(listing.lot !== null
      ? [{ label: "Lot Size", value: `${listing.lot} m²` }]
      : []),
  ];

  return (
    <>
      {/* ── Scrollable content (flex-1 so CTA bar sits below) ── */}
      <div className="flex-1 overflow-y-auto">
        {/* AC1 — Hero image: 280px tall gradient placeholder */}
        <div className={`relative h-[280px] w-full ${listing.img}`}>
          {/* AC1 — gradient overlay on bottom half */}
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-b from-transparent to-black/30" />

          {/* AC2 — Overlay topbar: back + heart */}
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
            <button
              type="button"
              aria-label="Go back"
              onClick={() => router.back()}
              className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center active:scale-[0.92] transition-transform duration-100 shadow-[var(--shadow-card)]"
            >
              <span className="text-narra text-base leading-none">←</span>
            </button>

            <button
              type="button"
              aria-label={isSaved ? "Remove from saved" : "Save property"}
              onClick={() => void toggle()}
              className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center active:scale-[0.92] transition-transform duration-100 shadow-[var(--shadow-card)]"
            >
              <span aria-hidden="true" className="text-base leading-none">
                {isSaved ? "❤️" : "🤍"}
              </span>
            </button>
          </div>
        </div>

        {/* ── Content body ─────────────────────────────────── */}
        <div className="px-4 pt-4 pb-6">
          {/* AC3 — Badge row */}
          <div className="flex items-center gap-2 mb-3">
            <span
              className={`${listing.badgeClass} text-xs font-semibold rounded-lg px-2.5 py-1`}
            >
              {listing.badge}
            </span>
            <span className="text-xs text-muted">{listing.location}</span>
          </div>

          {/* Title */}
          <h1 className="font-display font-semibold text-[18px] text-narra leading-snug mb-2">
            {listing.name}
          </h1>

          {/* AC4 — Price */}
          <p className="font-display text-[28px] font-bold text-primary leading-none mb-4">
            {listing.price}
          </p>

          {/* AC5 — Specs row */}
          {specs.length > 0 && (
            <div className="bg-sand rounded-[14px] py-3.5 flex mb-4">
              {specs.map((spec, i) => (
                <div key={spec.label} className="flex-1 flex">
                  <div className="flex-1 flex flex-col items-center gap-0.5">
                    <span className="font-semibold text-sm text-narra leading-none">
                      {spec.value}
                    </span>
                    <span className="text-[10px] text-muted leading-none">
                      {spec.label}
                    </span>
                  </div>
                  {/* Divider between specs */}
                  {i < specs.length - 1 && (
                    <div className="w-px bg-sand-dark self-stretch" />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* AC6 — Description */}
          {listing.description && (
            <div className="mb-4">
              <h2 className="font-display font-semibold text-sm text-narra mb-1.5">
                About this property
              </h2>
              <p className="text-[14px] leading-relaxed text-muted">
                {listing.description}
              </p>
            </div>
          )}

          {/* AC7 — Feature chips */}
          {listing.features.length > 0 && (
            <div className="mb-5">
              <h2 className="font-display font-semibold text-sm text-narra mb-2">
                Features
              </h2>
              <div className="flex flex-wrap gap-2">
                {listing.features.map((feature) => (
                  <span
                    key={feature}
                    className="bg-sand rounded-lg px-3 py-1.5 text-[12px] font-medium text-narra"
                  >
                    {feature}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* AC8 — Agent card */}
          <div className="bg-white rounded-[14px] shadow-[var(--shadow-card)] p-4 mb-4">
            <h2 className="font-display font-semibold text-sm text-narra mb-3">
              Listed by
            </h2>
            {listing.agent ? (
              <>
                <div className="flex items-center gap-3 mb-3">
                  {/* AC8 — Initials avatar */}
                  <div className="w-[52px] h-[52px] rounded-full bg-primary text-white flex items-center justify-center font-display font-bold text-lg flex-shrink-0">
                    {listing.agent.initials}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-narra leading-tight">
                      {listing.agent.name}
                    </p>
                    <p className="text-xs text-muted truncate">
                      {listing.agent.company}
                    </p>
                    <p className="text-xs text-muted">
                      {listing.agent.experience} yrs experience
                    </p>
                  </div>
                </div>
                {/* AC8 — Call + Chat buttons */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="flex-1 flex items-center justify-center gap-1.5 border border-sand-dark rounded-[12px] py-2.5 text-sm font-medium text-narra active:scale-[0.97] transition-transform duration-100"
                    onClick={() => {
                      // TODO: open tel: link — agent.phone (Phase 2 — AC16)
                    }}
                  >
                    <span aria-hidden="true">📞</span> Call
                  </button>
                  {/* AC1–AC3 — WhatsApp deep link; AC4 — disabled when no phone */}
                  {whatsAppUrl ? (
                    <a
                      href={whatsAppUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-1.5 bg-green text-white rounded-[12px] py-2.5 text-sm font-medium active:scale-[0.97] transition-transform duration-100"
                    >
                      <span aria-hidden="true">💬</span> Chat
                    </a>
                  ) : (
                    <button
                      type="button"
                      disabled
                      title="Contact info unavailable"
                      className="flex-1 flex items-center justify-center gap-1.5 bg-sand-dark text-muted rounded-[12px] py-2.5 text-sm font-medium cursor-not-allowed opacity-60"
                    >
                      <span aria-hidden="true">💬</span> Chat
                    </button>
                  )}
                </div>
              </>
            ) : (
              // Edge case: no agent
              <p className="text-sm text-muted">
                Contact{" "}
                <span className="text-primary font-medium">Bahay.ph</span> for
                more information about this listing.
              </p>
            )}
          </div>

          {/* AC9 — Map placeholder with pulsing ripple animation */}
          {/* TODO: replace with embedded Leaflet map centred on listing lat/lng (Phase 2) */}
          <div className="mb-4">
            <h2 className="font-display font-semibold text-sm text-narra mb-2">
              Location
            </h2>
            <div className="relative h-[160px] rounded-[14px] bg-lime-100 overflow-hidden flex items-center justify-center">
              {/* Ripple rings — animate-ping must not cause layout reflow */}
              <span className="absolute inline-flex h-16 w-16 rounded-full bg-primary/20 animate-ping" />
              <span className="absolute inline-flex h-10 w-10 rounded-full bg-primary/30 animate-ping [animation-delay:150ms]" />
              {/* Centre dot */}
              <span className="relative inline-flex h-4 w-4 rounded-full bg-primary shadow-[var(--shadow-card)]" />
              {/* Location label */}
              <span className="absolute bottom-3 left-0 right-0 text-center text-[11px] text-muted font-medium">
                {listing.location}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* AC10 — Sticky CTA bar at bottom of flex column */}
      <div className="flex-shrink-0 bg-white border-t border-sand-dark px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          {/* Left: label + price */}
          <div className="min-w-0">
            <p className="text-[10px] text-muted leading-none mb-0.5">
              {listing.badge === "For Rent" ? "Monthly rent" : "Asking price"}
            </p>
            <p className="font-display font-bold text-base text-primary leading-none truncate">
              {listing.price}
            </p>
          </div>
          {/* AC5 — sticky CTA: WhatsApp deep link or disabled */}
          {whatsAppUrl ? (
            <a
              href={whatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 bg-primary text-white font-medium text-sm rounded-xl px-5 py-3 active:scale-[0.97] transition-transform duration-100"
            >
              Contact agent
            </a>
          ) : (
            <button
              type="button"
              disabled
              title="Contact info unavailable"
              className="flex-shrink-0 bg-sand-dark text-muted font-medium text-sm rounded-xl px-5 py-3 cursor-not-allowed opacity-60"
            >
              Contact agent
            </button>
          )}
        </div>
      </div>
    </>
  );
}
