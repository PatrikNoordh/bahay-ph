"use client";

import Image from "next/image";
import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import type { Listing } from "@/lib/types";
import { useSavedProperty } from "@/hooks/useSavedProperties";
import { buildWhatsAppUrl, buildPhoneUrl } from "@/lib/utils";
import { PropertyCard } from "@/components/PropertyCard";

// AC11 — Mini map is client-only (Leaflet accesses window)
const DynamicMiniMap = dynamic(
  () => import("@/components/LeafletMiniMap").then((m) => ({ default: m.LeafletMiniMap })),
  {
    ssr: false,
    loading: () => <div className="absolute inset-0 bg-lime-100 animate-pulse rounded-[14px]" />,
  }
);

// Sand-colored 1×1 SVG blur placeholder matching the Bahay.ph design system
const SAND_BLUR =
  "data:image/svg+xml;base64,PHN2Zz48cmVjdCBmaWxsPSIjRjhGM0VDIiBpZHRoaD0iMSIgaGVpZ2h0PSIxIi8+PC9zdmc+";

interface PropertyDetailPageProps {
  listing: Listing | null;
  relatedListings?: Listing[];
}

export function PropertyDetailPage({ listing, relatedListings = [] }: PropertyDetailPageProps) {
  const router = useRouter();
  // AC6 — listing.id is stable; hook reads from SavedPropertiesProvider context
  const { isSaved, toggle } = useSavedProperty(listing?.id ?? "");
  // BH-39 — track avatar load failure for 404 fallback
  const [avatarError, setAvatarError] = useState(false);
  // AC1–AC4 — Carousel state
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // AC1/AC2 — track scroll position to derive active dot index
  const handleCarouselScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const index = Math.round(el.scrollLeft / el.offsetWidth);
    setActiveIndex(index);
  }, []);

  // AC3 — open lightbox at current index
  const openLightbox = useCallback((index: number) => {
    setActiveIndex(index);
    setLightboxOpen(true);
  }, []);

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

  // BH-25 — tel: deep link for native dialler; null hides the Call button entirely
  const phoneUrl = listing.agent?.phone
    ? buildPhoneUrl(listing.agent.phone)
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
        {/* AC1–AC5 — Image carousel */}
        {(() => {
          const images = listing.images.length > 0
            ? listing.images
            : listing.image_url
            ? [listing.image_url]
            : [];
          const hasMultiple = images.length > 1;

          return (
            <div className="relative h-[280px] w-full">
              {images.length > 0 ? (
                <>
                  {/* AC4 — CSS scroll snap carousel, swipeable on mobile */}
                  <div
                    ref={scrollRef}
                    onScroll={handleCarouselScroll}
                    className="flex h-full overflow-x-auto snap-x snap-mandatory scroll-smooth scrollbar-none"
                    style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                  >
                    {images.map((url, i) => (
                      <button
                        key={url}
                        type="button"
                        aria-label={`View photo ${i + 1} of ${images.length}`}
                        onClick={() => openLightbox(i)}
                        className="relative flex-shrink-0 w-full h-full snap-center snap-always focus:outline-none"
                      >
                        <Image
                          src={url}
                          alt={`${listing.name} — photo ${i + 1}`}
                          fill
                          sizes="100vw"
                          className="object-cover"
                          placeholder="blur"
                          blurDataURL={SAND_BLUR}
                          priority={i === 0}
                        />
                      </button>
                    ))}
                  </div>

                  {/* AC1 — gradient overlay on bottom half */}
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-b from-transparent to-black/30" />

                  {/* AC2 — dot indicators (only when multiple images) */}
                  {hasMultiple && (
                    <div className="pointer-events-none absolute bottom-3 inset-x-0 flex justify-center gap-1.5">
                      {images.map((_, i) => (
                        <span
                          key={i}
                          className={`block rounded-full transition-all duration-200 ${
                            i === activeIndex
                              ? "w-4 h-1.5 bg-white"
                              : "w-1.5 h-1.5 bg-white/60"
                          }`}
                          aria-hidden="true"
                        />
                      ))}
                    </div>
                  )}
                </>
              ) : (
                /* AC5 — gradient placeholder when no images */
                <div className={`absolute inset-0 ${listing.img}`} />
              )}

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

              {/* AC2 — photo count badge (top-right, when multiple) */}
              {hasMultiple && (
                <div className="pointer-events-none absolute top-3 left-1/2 -translate-x-1/2 bg-black/70 text-white text-[11px] font-medium rounded-full px-2.5 py-1 backdrop-blur-sm">
                  {activeIndex + 1} / {images.length}
                </div>
              )}
            </div>
          );
        })()}

        {/* AC3 — Fullscreen lightbox */}
        {lightboxOpen && listing.images.length > 0 && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Photo gallery"
            className="fixed inset-0 z-[100] bg-black flex flex-col"
          >
            {/* Lightbox header */}
            <div className="flex items-center justify-between px-4 py-3 flex-shrink-0">
              <span className="text-white/70 text-sm">
                {activeIndex + 1} / {listing.images.length}
              </span>
              <button
                type="button"
                aria-label="Close gallery"
                onClick={() => setLightboxOpen(false)}
                className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 active:bg-white/20 transition-colors"
              >
                <span className="text-white text-lg leading-none">✕</span>
              </button>
            </div>

            {/* Lightbox carousel — same scroll snap pattern */}
            <div
              className="flex-1 flex overflow-x-auto snap-x snap-mandatory scroll-smooth scrollbar-none"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              onScroll={(e) => {
                const el = e.currentTarget;
                setActiveIndex(Math.round(el.scrollLeft / el.offsetWidth));
              }}
              ref={(el) => {
                // Scroll lightbox to active index on open
                if (el && el.scrollLeft === 0 && activeIndex > 0) {
                  el.scrollLeft = activeIndex * el.offsetWidth;
                }
              }}
            >
              {listing.images.map((url, i) => (
                <div
                  key={url}
                  className="relative flex-shrink-0 w-full snap-center snap-always flex items-center justify-center"
                >
                  <Image
                    src={url}
                    alt={`${listing.name} — photo ${i + 1}`}
                    fill
                    sizes="100vw"
                    className="object-contain"
                    priority={i === activeIndex}
                  />
                </div>
              ))}
            </div>

            {/* Lightbox dot indicators */}
            {listing.images.length > 1 && (
              <div className="flex justify-center gap-1.5 py-4 flex-shrink-0">
                {listing.images.map((_, i) => (
                  <span
                    key={i}
                    className={`block rounded-full transition-all duration-200 ${
                      i === activeIndex
                        ? "w-4 h-1.5 bg-white"
                        : "w-1.5 h-1.5 bg-white/40"
                    }`}
                    aria-hidden="true"
                  />
                ))}
              </div>
            )}
          </div>
        )}

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
                  {/* BH-39 — Show avatar_url if set and loaded OK, else initials fallback */}
                  {listing.agent.avatar_url && !avatarError ? (
                    <div className="w-[48px] h-[48px] rounded-full overflow-hidden flex-shrink-0">
                      <Image
                        src={listing.agent.avatar_url}
                        alt={listing.agent.name}
                        width={48}
                        height={48}
                        className="object-cover w-full h-full rounded-full"
                        onError={() => setAvatarError(true)}
                      />
                    </div>
                  ) : (
                    <div className="w-[48px] h-[48px] rounded-full bg-primary text-white flex items-center justify-center font-display font-bold text-lg flex-shrink-0">
                      {listing.agent.initials}
                    </div>
                  )}
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
                {/* Call + Chat buttons — AC3: Call hidden when no phone */}
                <div className="flex gap-2">
                  {phoneUrl && (
                    <a
                      href={phoneUrl}
                      className="flex-1 flex items-center justify-center gap-1.5 border border-sand-dark rounded-[12px] py-2.5 text-sm font-medium text-narra active:scale-[0.97] transition-transform duration-100"
                    >
                      <span aria-hidden="true">📞</span> Call
                    </a>
                  )}
                  {/* AC1–AC3 — WhatsApp deep link; AC4 — disabled when no phone */}
                  {whatsAppUrl ? (
                    <a
                      href={whatsAppUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-1.5 bg-green text-narra rounded-[12px] py-2.5 text-sm font-medium active:scale-[0.97] transition-transform duration-100"
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

          {/* AC11 — Leaflet mini-map centred on listing coords; ripple fallback when no coords */}
          <div className="mb-4">
            <h2 className="font-display font-semibold text-sm text-narra mb-2">
              Location
            </h2>
            <div className="relative h-[160px] rounded-[14px] overflow-hidden">
              {listing.lat !== null && listing.lng !== null ? (
                <DynamicMiniMap
                  lat={listing.lat}
                  lng={listing.lng}
                  title={listing.name}
                />
              ) : (
                // Fallback when lat/lng are not yet available
                <div className="absolute inset-0 bg-lime-100 flex items-center justify-center">
                  <span className="absolute inline-flex h-16 w-16 rounded-full bg-primary/20 animate-ping" />
                  <span className="absolute inline-flex h-10 w-10 rounded-full bg-primary/30 animate-ping [animation-delay:150ms]" />
                  <span className="relative inline-flex h-4 w-4 rounded-full bg-primary shadow-[var(--shadow-card)]" />
                  <span className="absolute bottom-3 left-0 right-0 text-center text-[11px] text-muted font-medium">
                    {listing.location}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* AC1/AC5 — "More in {city}" related properties section */}
          {relatedListings.length > 0 && (
            <div className="mb-4">
              <h2 className="font-display font-semibold text-sm text-narra mb-3">
                More in {listing.location.split(", ").at(-1)}
              </h2>
              {/* AC3 — 2-column grid using PropertyCard grid variant */}
              <div className="grid grid-cols-2 gap-3">
                {relatedListings.map((related) => (
                  <PropertyCard key={related.id} listing={related} variant="grid" />
                ))}
              </div>
            </div>
          )}
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
