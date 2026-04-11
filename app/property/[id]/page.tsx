import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MOCK_LISTINGS } from "@/lib/mockListings";
import { PropertyDetailPage } from "@/components/PropertyDetailPage";
import type { Listing } from "@/lib/types";

// TODO: connect to Supabase — fetch property + agent + images by ID (Phase 2 — AC13)

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://bahay.ph";
// TODO: connect to Supabase — replace with real OG image from property_images (is_primary = true)
const DEFAULT_OG_IMAGE = `${SITE_URL}/icon-512.png`;

interface PropertyPageProps {
  params: Promise<{ id: string }>;
}

function buildMetaDescription(listing: Listing): string {
  const [barangay, city] = listing.location.split(", ");
  const beds = listing.beds != null ? `${listing.beds} bed, ` : "";
  const area = listing.area != null ? `${listing.area}sqm. ` : "";
  const desc = `${beds}${area}${listing.price} in ${barangay}, ${city}.`;
  return desc.length > 160 ? desc.slice(0, 157) + "..." : desc;
}

export async function generateMetadata({
  params,
}: PropertyPageProps): Promise<Metadata> {
  const { id } = await params;

  // TODO: connect to Supabase — replace MOCK_LISTINGS lookup with server client query
  const listing = MOCK_LISTINGS.find((l) => l.id === id) ?? null;

  if (!listing) {
    return {
      title: "Property Not Found | Bahay.ph",
      description: "Find verified property listings in Cebu on Bahay.ph.",
    };
  }

  const [, city] = listing.location.split(", ");
  const title = `${listing.name} — ${city} | Bahay.ph`;
  const description = buildMetaDescription(listing);
  const canonicalUrl = `${SITE_URL}/property/${id}`;
  // TODO: connect to Supabase — use primary property_images[0].image_url when available
  const ogImage = DEFAULT_OG_IMAGE;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: "website",
      images: [{ url: ogImage }],
    },
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

export default async function PropertyPage({ params }: PropertyPageProps) {
  const { id } = await params;

  // TODO: replace with Supabase server query (Phase 2 — AC13)
  // When connecting to Supabase: distinguish network errors (throw) from missing records (notFound())
  const listing = MOCK_LISTINGS.find((l) => l.id === id) ?? null;

  if (!listing) {
    notFound();
  }

  // Nested flex layout: scrollable content + sticky CTA both inside <main>
  // Avoids position:fixed issues inside the AppShell frame on desktop
  return (
    <div className="h-full flex flex-col">
      <PropertyDetailPage listing={listing} />
    </div>
  );
}
