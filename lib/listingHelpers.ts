// ============================================================
// Bahay.ph — Listing Helpers
// Maps raw Supabase Property + images + agent → UI Listing type
// ============================================================

import type { Property, PropertyImage, Agent, Listing, PriceType } from "@/lib/types";

const PLACEHOLDER_IMGS = [
  "img-placeholder-1",
  "img-placeholder-2",
  "img-placeholder-3",
  "img-placeholder-4",
  "img-placeholder-5",
  "img-placeholder-6",
] as const;

function formatPrice(price: number, priceType: PriceType): string {
  return `₱${price.toLocaleString("en-PH")}${priceType === "rent" ? "/mo" : ""}`;
}

function formatPriceShort(price: number, priceType: PriceType): string {
  let short: string;
  if (price >= 1_000_000) {
    short = `₱${(price / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  } else if (price >= 1_000) {
    short = `₱${(price / 1_000).toFixed(0)}K`;
  } else {
    short = `₱${price}`;
  }
  return priceType === "rent" ? `${short}/mo` : short;
}

function getBadge(property: Property): { badge: string; badgeClass: string } {
  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const isNew = new Date(property.created_at) > cutoff;
  if (property.price_type === "rent") return { badge: "For Rent", badgeClass: "bg-ocean text-white" };
  if (isNew) return { badge: "New", badgeClass: "bg-green text-white" };
  return { badge: "For Sale", badgeClass: "bg-primary text-white" };
}

/**
 * Maps a Supabase Property row + its images + its agent to the UI Listing type.
 * index is used to cycle through placeholder gradient classes when image_url is null.
 */
export function propertyToListing(
  property: Property,
  images: PropertyImage[],
  agent: Agent | null,
  index = 0
): Listing {
  const sortedImages = [...images].sort((a, b) => a.sort_order - b.sort_order);
  const primaryImage = sortedImages.find((img) => img.is_primary) ?? sortedImages[0] ?? null;
  const { badge, badgeClass } = getBadge(property);
  const location = [property.barangay, property.city].filter(Boolean).join(", ");

  const agentListing = agent
    ? {
        name: agent.full_name,
        initials: agent.full_name
          .split(" ")
          .map((n) => n[0] ?? "")
          .join("")
          .slice(0, 2)
          .toUpperCase(),
        company: agent.company_name ?? "",
        experience: agent.years_experience ?? 0,
        phone: agent.phone,
        avatar_url: agent.avatar_url,
      }
    : {
        name: "Unknown Agent",
        initials: "UA",
        company: "",
        experience: 0,
        phone: null,
        avatar_url: null,
      };

  return {
    id: property.id,
    name: property.title,
    price: formatPrice(property.price, property.price_type),
    priceShort: formatPriceShort(property.price, property.price_type),
    type: property.property_type,
    badge,
    badgeClass,
    beds: property.bedrooms,
    baths: property.bathrooms,
    area: property.floor_area,
    lot: property.lot_size,
    location,
    img: PLACEHOLDER_IMGS[index % PLACEHOLDER_IMGS.length],
    image_url: primaryImage?.image_url ?? null,
    images: sortedImages.map((img) => img.image_url),
    agent: agentListing,
    description: property.description ?? "",
    features: [],
    mapPos: { top: "50%", left: "50%" },
    lat: property.latitude,
    lng: property.longitude,
    tags: [],
  };
}

/**
 * Builds a lookup map: property_id → primary image URL.
 * Used for list pages where images are fetched in a single batch query.
 */
export function buildImageMap(images: PropertyImage[]): Record<string, PropertyImage[]> {
  const map: Record<string, PropertyImage[]> = {};
  for (const img of images) {
    if (!map[img.property_id]) map[img.property_id] = [];
    map[img.property_id].push(img);
  }
  return map;
}

/**
 * Builds a lookup map: agent_id → Agent row.
 */
export function buildAgentMap(agents: Agent[]): Record<string, Agent> {
  const map: Record<string, Agent> = {};
  for (const agent of agents) {
    map[agent.id] = agent;
  }
  return map;
}
