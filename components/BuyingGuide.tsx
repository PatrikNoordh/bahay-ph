"use client";

import { useState } from "react";
import { AnimateIn } from "@/components/ui/AnimateIn";

// ── Content —————————————————————————————————————————————————————————————
// REVIEW NOTE: Update LAST_UPDATED and review all step content for accuracy
// whenever Philippine property tax rates, BIR requirements, or LRA fees change.
// Last reviewed: April 2026

const LAST_UPDATED = "April 2026";

interface GuideStep {
  id: string;
  number: number;
  title: string;
  summary: string;
  bullets: string[];
  tip?: string;
}

const STEPS: GuideStep[] = [
  {
    id: "search",
    number: 1,
    title: "Search & Shortlist",
    summary: "Find properties that match your needs and budget.",
    bullets: [
      "Filter by city, price range, and property type on Bahay.ph.",
      "Save favourites using the ❤️ button to build a shortlist.",
      "Research the barangay — check flood maps, school zones, and commute routes.",
      "Compare price per sqm across similar properties in the same area.",
    ],
    tip: "Tip: Bahay.ph only shows listings from licensed, verified brokers — every listing has a real PRC-registered agent behind it.",
  },
  {
    id: "viewings",
    number: 2,
    title: "Arrange Viewings",
    summary: "Visit properties in person before making any commitment.",
    bullets: [
      "Contact the agent via WhatsApp — tap the button on any listing.",
      "Inspect for water damage, roof leaks, mould, and drainage issues.",
      "Ask the agent for the tax declaration and title number at the viewing.",
      "Visit at different times of day to assess traffic, noise, and flooding risk.",
    ],
    tip: "Tip: Never sign anything or pay any fee before seeing the property in person.",
  },
  {
    id: "offer",
    number: 3,
    title: "Make an Offer",
    summary: "Negotiate the price and lock in the property with a reservation.",
    bullets: [
      "Negotiate directly with the agent — offers below asking price are normal.",
      "Sign a Letter of Intent (LOI) or Reservation Agreement once agreed.",
      "Pay a reservation fee (typically ₱20,000–₱100,000) to take the property off the market.",
      "Reservation fees are usually deducted from the purchase price.",
    ],
  },
  {
    id: "due-diligence",
    number: 4,
    title: "Due Diligence",
    summary: "Verify the title and check for any legal issues before signing.",
    bullets: [
      "Request a Certified True Copy of the title from the Registry of Deeds (LRA) — ₱200–₱500.",
      "Houses and land use a Transfer Certificate of Title (TCT); condos use a Condominium Certificate of Title (CCT).",
      "Check the title for encumbrances, liens, or adverse claims — the back of the title lists these.",
      "Confirm the seller's name matches the title exactly.",
      "Verify real property tax (RPT) receipts are current at the city assessor's office.",
      "For condos: request the developer's License to Sell from DHSUD.",
    ],
    tip: "Tip: Never buy a property where the title is under a special power of attorney (SPA) without consulting a property lawyer.",
  },
  {
    id: "closing",
    number: 5,
    title: "Execute the Deed of Sale",
    summary: "Sign the legal documents and complete the payment.",
    bullets: [
      "Sign the Deed of Absolute Sale (DAS) before a licensed notary public.",
      "Pay the full purchase price or arrange bank financing (home loan).",
      "The seller typically provides the original owner's duplicate title, tax receipts, and clearances.",
      "Keep a notarised copy of the DAS — you will need it for BIR and LRA.",
    ],
  },
  {
    id: "taxes",
    number: 6,
    title: "Pay Taxes & Fees",
    summary: "Settle government taxes before the title can be transferred.",
    bullets: [
      "Capital Gains Tax (CGT): 6% of the selling price or BIR zonal value (whichever is higher) — usually paid by the seller but negotiable.",
      "Documentary Stamp Tax (DST): 1.5% of the selling price — paid to BIR.",
      "Transfer Tax: 0.5%–0.75% of the selling price — paid at the city or provincial treasurer's office.",
      "Registration Fee: based on the LRA schedule (roughly 0.25% of the value).",
      "Notarial Fee: around 1% of the selling price.",
      "File and pay CGT and DST at your BIR Revenue District Office (RDO) within 30 days of notarisation.",
    ],
    tip: "Tip: Budget roughly 8%–10% of the purchase price for all taxes and fees combined.",
  },
  {
    id: "title-transfer",
    number: 7,
    title: "Title Transfer",
    summary: "Register the property in your name at the Registry of Deeds.",
    bullets: [
      "After paying CGT and DST, BIR issues a Certificate Authorising Registration (CAR) — allow 2–4 weeks.",
      "Bring the CAR, DAS, and transfer tax receipt to the Registry of Deeds (LRA).",
      "The Registry cancels the old title and issues a new TCT/CCT in your name.",
      "Update the tax declaration at the city assessor's office with your new title.",
      "The full process typically takes 1–3 months from signing to receiving the new title.",
    ],
    tip: "Tip: Follow up with BIR and LRA every 2 weeks — processing delays are common.",
  },
];

interface ExternalLink {
  label: string;
  href: string;
  description: string;
}

// AC5 — Links to relevant government websites
const GOV_LINKS: ExternalLink[] = [
  {
    label: "Bureau of Internal Revenue (BIR)",
    href: "https://www.bir.gov.ph",
    description: "File CGT, DST, and obtain the Certificate Authorising Registration.",
  },
  {
    label: "Land Registration Authority (LRA)",
    href: "https://www.lra.gov.ph",
    description: "Registry of Deeds — issue and transfer property titles.",
  },
  {
    label: "DHSUD",
    href: "https://www.dhsud.gov.ph",
    description: "Verify a developer's License to Sell for condo and subdivision projects.",
  },
];

// ── Component ————————————————————————————————————————————————————————————

export function BuyingGuide() {
  // AC4 — accordion: start with step 1 open
  const [openSteps, setOpenSteps] = useState<Set<string>>(
    new Set([STEPS[0].id])
  );

  function toggleStep(id: string) {
    setOpenSteps((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  return (
    <div className="px-3 mt-3 flex flex-col gap-4">
      {/* Page header */}
      <AnimateIn delay={0}>
        <div className="px-1">
          <h1 className="font-display font-bold text-2xl text-narra leading-tight">
            Buying Guide
          </h1>
          <p className="text-sm text-muted mt-1">
            A step-by-step guide to buying property in the Philippines.
          </p>
        </div>
      </AnimateIn>

      {/* AC2, AC3, AC4 — Accordion steps */}
      <AnimateIn delay={50}>
        <div className="flex flex-col gap-2">
          {STEPS.map((step) => {
            const isOpen = openSteps.has(step.id);
            return (
              <div
                key={step.id}
                className="bg-white rounded-[14px] shadow-card overflow-hidden"
              >
                {/* Step header — tap to expand */}
                <button
                  type="button"
                  onClick={() => toggleStep(step.id)}
                  className="w-full flex items-center gap-3 px-4 py-3.5 text-left active:bg-sand transition-colors duration-100"
                  aria-expanded={isOpen}
                >
                  {/* Step number badge */}
                  <span className="w-7 h-7 rounded-full bg-primary flex items-center justify-center shrink-0">
                    <span className="text-white text-xs font-bold leading-none">
                      {step.number}
                    </span>
                  </span>

                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-semibold text-narra leading-snug">
                      {step.title}
                    </p>
                    {!isOpen && (
                      <p className="text-[12px] text-muted mt-0.5 truncate">
                        {step.summary}
                      </p>
                    )}
                  </div>

                  {/* Chevron */}
                  <span
                    className={`text-muted text-sm leading-none shrink-0 transition-transform duration-200 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                    aria-hidden="true"
                  >
                    ▾
                  </span>
                </button>

                {/* Expanded content */}
                {isOpen && (
                  <div className="px-4 pb-4 border-t border-sand-dark">
                    <p className="text-[13px] text-muted mt-3 mb-2.5 leading-relaxed">
                      {step.summary}
                    </p>
                    <ul className="flex flex-col gap-2">
                      {step.bullets.map((bullet, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span
                            className="text-primary text-xs mt-0.5 shrink-0 leading-none"
                            aria-hidden="true"
                          >
                            ●
                          </span>
                          <span className="text-[13px] text-narra leading-relaxed">
                            {bullet}
                          </span>
                        </li>
                      ))}
                    </ul>
                    {step.tip && (
                      <div className="mt-3 bg-primary-pale rounded-xl px-3 py-2.5">
                        <p className="text-[12px] text-primary leading-relaxed">
                          {step.tip}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </AnimateIn>

      {/* AC5 — Government links */}
      <AnimateIn delay={100}>
        <div className="bg-white rounded-[14px] shadow-card p-4">
          <p className="text-[11px] text-muted-light uppercase tracking-widest mb-3">
            Useful Government Links
          </p>
          <div className="flex flex-col gap-3">
            {GOV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-3 group"
              >
                <span className="text-ocean text-sm leading-none mt-0.5 shrink-0">
                  ↗
                </span>
                <div>
                  <p className="text-[13px] font-medium text-ocean group-active:underline">
                    {link.label}
                  </p>
                  <p className="text-[12px] text-muted mt-0.5 leading-relaxed">
                    {link.description}
                  </p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </AnimateIn>

      {/* Edge case: last updated note */}
      <AnimateIn delay={150}>
        <p className="text-[11px] text-muted-light text-center px-2 pb-2 leading-relaxed">
          Last updated {LAST_UPDATED}. Tax rates and fees are indicative —
          consult a licensed property lawyer or your BIR RDO for current figures.
        </p>
      </AnimateIn>
    </div>
  );
}
