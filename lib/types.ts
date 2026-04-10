// ============================================================
// Bahay.ph — Database Types
// Matches the Supabase schema in supabase/bahay_schema.sql
// ============================================================

export type SubscriptionTier = "starter" | "pro" | "agency";
export type PriceType = "sale" | "rent";
export type PricePeriod = "total" | "monthly";
export type PropertyType = "house" | "condo" | "lot" | "townhouse" | "commercial";
export type PropertyStatus = "active" | "sold" | "rented" | "inactive";
export type InquiryStatus = "new" | "read" | "replied";

export interface Agent {
  id: string;
  created_at: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  company_name: string | null;
  years_experience: number | null;
  avatar_url: string | null;
  is_verified: boolean;
  subscription_tier: SubscriptionTier;
  user_id: string | null;
}

export interface Property {
  id: string;
  created_at: string;
  title: string;
  description: string | null;
  price: number;
  price_type: PriceType;
  price_period: PricePeriod;
  property_type: PropertyType;
  bedrooms: number | null;
  bathrooms: number | null;
  floor_area: number | null;
  lot_size: number | null;
  address: string | null;
  city: string;
  barangay: string | null;
  latitude: number | null;
  longitude: number | null;
  status: PropertyStatus;
  is_featured: boolean;
  agent_id: string | null;
}

export interface PropertyImage {
  id: string;
  created_at: string;
  property_id: string;
  image_url: string;
  is_primary: boolean;
  sort_order: number;
}

export interface SavedProperty {
  id: string;
  created_at: string;
  user_id: string;
  property_id: string;
}

export interface Inquiry {
  id: string;
  created_at: string;
  property_id: string | null;
  agent_id: string | null;
  buyer_name: string | null;
  buyer_email: string | null;
  buyer_phone: string | null;
  message: string | null;
  status: InquiryStatus;
}

// Joined types used in the UI
export interface PropertyWithAgent extends Property {
  agent: Agent | null;
}

export interface PropertyWithImages extends Property {
  property_images: PropertyImage[];
}

export interface PropertyDetail extends Property {
  agent: Agent | null;
  property_images: PropertyImage[];
}

// ============================================================
// UI display type — used by mock data and future useListings hook
// ============================================================

export interface ListingAgent {
  name: string;
  initials: string;
  company: string;
  experience: number;
  phone: string | null;
}

export interface Listing {
  id: string;
  name: string;
  price: string;         // formatted: "₱18,500,000"
  priceShort: string;    // compact: "₱18.5M"
  type: PropertyType;
  badge: string;         // "For Sale" | "For Rent" | "New"
  badgeClass: string;    // Tailwind classes for badge pill
  beds: number | null;
  baths: number | null;
  area: number | null;   // floor_area in m²
  lot: number | null;    // lot_size in m²
  location: string;      // "Barangay, City"
  img: string;           // Tailwind gradient class for placeholder image
  agent: ListingAgent;
  description: string;
  features: string[];
  mapPos: { top: string; left: string }; // CSS % position on illustrative map
  lat: number | null;   // WGS-84 latitude for Leaflet map
  lng: number | null;   // WGS-84 longitude for Leaflet map
  tags: string[];
}
