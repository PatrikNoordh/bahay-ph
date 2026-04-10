import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase";
import { propertyToListing } from "@/lib/utils";
import type { PropertyDetail } from "@/lib/types";
import { PropertyDetailPage } from "@/components/PropertyDetailPage";

interface PropertyPageProps {
  params: Promise<{ id: string }>;
}

export default async function PropertyPage({ params }: PropertyPageProps) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("properties")
    .select("*, agent:agents(*), property_images(*)")
    .eq("id", id)
    .single();

  // AC edge case: property not found → 404
  if (error || !data) {
    notFound();
  }

  const detail = data as PropertyDetail;
  const listing = propertyToListing(detail, detail.agent, detail.property_images);

  return (
    <div className="h-full flex flex-col">
      <PropertyDetailPage listing={listing} />
    </div>
  );
}
