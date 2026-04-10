import type {
  Property,
  Agent,
  PropertyImage,
  Listing,
  ListingAgent,
  PricePeriod,
} from "@/lib/types";

/**
 * Format a price in Philippine Peso.
 * Uses en-PH locale — always ₱ with comma separators.
 */
export function formatPrice(price: number): string {
  return price.toLocaleString("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
  });
}

/**
 * Compact price label: ₱18.5M, ₱8.5M, ₱25K/mo, etc.
 */
function formatPriceShort(price: number, pricePeriod: PricePeriod): string {
  const suffix = pricePeriod === "monthly" ? "/mo" : "";
  if (price >= 1_000_000) {
    const m = price / 1_000_000;
    return `₱${m % 1 === 0 ? m : m.toFixed(1)}M${suffix}`;
  }
  if (price >= 1_000) {
    const k = Math.round(price / 1_000);
    return `₱${k}K${suffix}`;
  }
  return `₱${price}${suffix}`;
}

// Placeholder gradients — cycled by property ID hash
const IMG_PLACEHOLDERS = [
  "img-placeholder-1",
  "img-placeholder-2",
  "img-placeholder-3",
  "img-placeholder-4",
  "img-placeholder-5",
  "img-placeholder-6",
] as const;

function placeholderImg(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash + id.charCodeAt(i)) % IMG_PLACEHOLDERS.length;
  }
  return IMG_PLACEHOLDERS[hash];
}

// Approximate Metro Cebu bounding box for the CSS illustrative map
const LAT_MIN = 10.0;
const LAT_MAX = 10.55;
const TOP_PCT_NORTH = 22; // top % at max lat
const TOP_PCT_SOUTH = 64; // top % at min lat
const LNG_MIN = 123.72;
const LNG_MAX = 124.02;
const LEFT_PCT_WEST = 38; // left % at min lng
const LEFT_PCT_EAST = 82; // left % at max lng

function latLngToMapPos(
  lat: number | null,
  lng: number | null
): { top: string; left: string } {
  if (lat === null || lng === null) return { top: "50%", left: "55%" };
  const top = Math.round(
    TOP_PCT_SOUTH -
      ((lat - LAT_MIN) / (LAT_MAX - LAT_MIN)) * (TOP_PCT_SOUTH - TOP_PCT_NORTH)
  );
  const left = Math.round(
    LEFT_PCT_WEST +
      ((lng - LNG_MIN) / (LNG_MAX - LNG_MIN)) * (LEFT_PCT_EAST - LEFT_PCT_WEST)
  );
  return {
    top: `${Math.max(10, Math.min(90, top))}%`,
    left: `${Math.max(10, Math.min(90, left))}%`,
  };
}

/**
 * Convert a DB Property row (+ optional joined Agent / PropertyImages)
 * into the UI Listing type consumed by PropertyCard and other components.
 * TODO: connect to Supabase Storage — render primaryImage.image_url via next/image (Phase 2 — AC14)
 */
export function propertyToListing(
  property: Property,
  agent?: Agent | null,
  images?: PropertyImage[]
): Listing {
  const isRent = property.price_type === "rent";
  const priceSuffix = isRent ? "/mo" : "";

  let badge: string;
  let badgeClass: string;
  if (isRent) {
    badge = "For Rent";
    badgeClass = "bg-ocean text-white";
  } else if (property.is_featured && property.status === "active") {
    badge = "New";
    badgeClass = "bg-green text-white";
  } else {
    badge = "For Sale";
    badgeClass = "bg-primary text-white";
  }

  const location = property.barangay
    ? `${property.barangay}, ${property.city}`
    : property.city;

  const listingAgent: ListingAgent = agent
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
      }
    : { name: "Agent", initials: "A", company: "", experience: 0 };

  // Image: use placeholder gradient — real image rendering comes in Phase 2
  void images; // available for Phase 2 next/image integration

  return {
    id: property.id,
    name: property.title,
    price: formatPrice(property.price) + priceSuffix,
    priceShort: formatPriceShort(property.price, property.price_period),
    type: property.property_type,
    badge,
    badgeClass,
    beds: property.bedrooms,
    baths: property.bathrooms,
    area: property.floor_area,
    lot: property.lot_size,
    location,
    img: placeholderImg(property.id),
    agent: listingAgent,
    description: property.description ?? "",
    features: [],
    mapPos: latLngToMapPos(property.latitude, property.longitude),
    tags: [],
  };
}

/**
 * Build a WhatsApp deep-link for an agent contact CTA.
 * Strips leading 0 from the phone number and prefixes with 63 (PH country code).
 */
export function buildWhatsAppUrl(phone: string, propertyTitle: string): string {
  const normalized = phone.replace(/^\+?0?/, "");
  const message = encodeURIComponent(
    `Hi, I'm interested in ${propertyTitle} on Bahay.ph`
  );
  return `https://wa.me/63${normalized}?text=${message}`;
}

/**
 * Return a short display label for a city in Metro Cebu.
 */
export function shortCity(city: string): string {
  const map: Record<string, string> = {
    "Cebu City": "Cebu City",
    "Lapu-Lapu City": "Lapu-Lapu",
    "Mandaue City": "Mandaue",
    "Cordova": "Cordova",
    "Mactan Island": "Mactan",
    "Talisay City": "Talisay",
  };
  return map[city] ?? city;
}
