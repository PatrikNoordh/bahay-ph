import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase";
import { propertyToListing, buildImageMap, buildAgentMap } from "@/lib/listingHelpers";
import { PropertyDetailPage } from "@/components/PropertyDetailPage";
import type { Property, PropertyImage, Agent } from "@/lib/types";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://bahay.ph";
const DEFAULT_OG_IMAGE = `${SITE_URL}/icon-512.png`;

interface PropertyPageProps {
  params: Promise<{ id: string }>;
}

async function fetchProperty(id: string) {
  const supabase = await createServerSupabaseClient();

  const { data: prop, error } = await supabase
    .from("properties")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !prop) return null;

  const property = prop as Property;

  const { data: imageRows } = await supabase
    .from("property_images")
    .select("*")
    .eq("property_id", id)
    .order("sort_order", { ascending: true });

  const images = (imageRows ?? []) as PropertyImage[];

  const agent = property.agent_id
    ? await supabase
        .from("agents")
        .select("*")
        .eq("id", property.agent_id)
        .single()
        .then(({ data }) => (data as Agent | null))
    : null;

  return { property, images, agent };
}

export async function generateMetadata({ params }: PropertyPageProps): Promise<Metadata> {
  const { id } = await params;
  const result = await fetchProperty(id);

  if (!result) {
    return {
      title: "Property Not Found | Bahay.ph",
      description: "Find verified property listings in Cebu on Bahay.ph.",
    };
  }

  const { property, images, agent } = result;
  const listing = propertyToListing(property, images, agent);

  const title = `${listing.name} — ${property.city} | Bahay.ph`;
  const bedsStr = listing.beds != null ? `${listing.beds} bed, ` : "";
  const areaStr = listing.area != null ? `${listing.area}sqm. ` : "";
  const description = `${bedsStr}${areaStr}${listing.price} in ${listing.location}.`;
  const canonicalUrl = `${SITE_URL}/property/${id}`;
  const primaryImage = images.find((img) => img.is_primary);
  const ogImage = primaryImage?.image_url ?? DEFAULT_OG_IMAGE;

  return {
    title,
    description: description.length > 160 ? description.slice(0, 157) + "..." : description,
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
  const result = await fetchProperty(id);

  if (!result) {
    notFound();
  }

  const { property, images, agent } = result;
  const listing = propertyToListing(property, images, agent);

  // Fetch up to 4 related listings in the same city, excluding current property
  const supabase = await createServerSupabaseClient();
  const { data: relatedProps } = await supabase
    .from("properties")
    .select("*")
    .eq("status", "active")
    .eq("city", property.city)
    .neq("id", id)
    .order("created_at", { ascending: false })
    .limit(4);

  const related = (relatedProps ?? []) as Property[];
  const relatedIds = related.map((p) => p.id);

  const { data: relatedImageRows } = relatedIds.length
    ? await supabase
        .from("property_images")
        .select("*")
        .in("property_id", relatedIds)
    : { data: [] as PropertyImage[] };

  const relatedAgentIds = [...new Set(related.map((p) => p.agent_id).filter(Boolean))] as string[];
  const { data: relatedAgentRows } = relatedAgentIds.length
    ? await supabase
        .from("agents")
        .select("*")
        .in("id", relatedAgentIds)
    : { data: [] as Agent[] };

  const relatedImageMap = buildImageMap((relatedImageRows ?? []) as PropertyImage[]);
  const relatedAgentMap = buildAgentMap((relatedAgentRows ?? []) as Agent[]);

  const relatedListings = related.map((p, i) =>
    propertyToListing(p, relatedImageMap[p.id] ?? [], relatedAgentMap[p.agent_id ?? ""] ?? null, i)
  );

  return (
    <div className="h-full flex flex-col">
      <PropertyDetailPage listing={listing} relatedListings={relatedListings} />
    </div>
  );
}
