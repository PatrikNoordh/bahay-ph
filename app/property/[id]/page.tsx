import { notFound } from "next/navigation";
import { MOCK_LISTINGS } from "@/lib/mockListings";
import { PropertyDetailPage } from "@/components/PropertyDetailPage";

// TODO: connect to Supabase — fetch property + agent + images by ID (Phase 2 — AC13)
// TODO: add generateMetadata for SEO (Phase 2 — AC18)

interface PropertyPageProps {
  params: Promise<{ id: string }>;
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
