import { createServerSupabaseClient } from "@/lib/supabase";
import { NextResponse } from "next/server";
import type { PropertyStatus, PriceType, PropertyType } from "@/lib/types";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PATCH /api/listings/[id] — update a listing (full edit or status-only change)
// RLS ensures agents can only update their own listings
export async function PATCH(request: Request, { params }: RouteParams) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json() as {
    title?: string;
    description?: string | null;
    price?: number | string;
    price_type?: PriceType;
    property_type?: PropertyType;
    bedrooms?: number | string | null;
    bathrooms?: number | string | null;
    floor_area?: number | string | null;
    lot_size?: number | string | null;
    address?: string | null;
    city?: string;
    barangay?: string | null;
    status?: PropertyStatus;
  };

  // Build update payload — only include fields present in the request body
  const update: Record<string, unknown> = {};
  if (body.title !== undefined) update.title = body.title.trim();
  if (body.description !== undefined) update.description = body.description?.trim() ?? null;
  if (body.price !== undefined) update.price = Number(body.price);
  if (body.price_type !== undefined) {
    update.price_type = body.price_type;
    update.price_period = body.price_type === "rent" ? "monthly" : "total";
  }
  if (body.property_type !== undefined) update.property_type = body.property_type;
  if (body.bedrooms !== undefined) update.bedrooms = body.bedrooms ? Number(body.bedrooms) : null;
  if (body.bathrooms !== undefined) update.bathrooms = body.bathrooms ? Number(body.bathrooms) : null;
  if (body.floor_area !== undefined) update.floor_area = body.floor_area ? Number(body.floor_area) : null;
  if (body.lot_size !== undefined) update.lot_size = body.lot_size ? Number(body.lot_size) : null;
  if (body.address !== undefined) update.address = body.address?.trim() ?? null;
  if (body.city !== undefined) update.city = body.city.trim();
  if (body.barangay !== undefined) update.barangay = body.barangay?.trim() ?? null;
  if (body.status !== undefined) update.status = body.status;

  // RLS policy rejects rows where agent_id doesn't belong to auth.uid()
  const { data, error } = await supabase
    .from("properties")
    .update(update)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// DELETE /api/listings/[id] — delete a listing
// RLS ensures agents can only delete their own listings
export async function DELETE(_request: Request, { params }: RouteParams) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const { error } = await supabase.from("properties").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
