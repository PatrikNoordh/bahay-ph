import { createServerSupabaseClient } from "@/lib/supabase";
import { NextResponse } from "next/server";
import type { PropertyStatus, PriceType, PropertyType } from "@/lib/types";
import type { TablesUpdate } from "@/lib/database.types";

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

  // AC7 — Server-side validation mirroring client rules (only validate fields present in body)
  if (body.title !== undefined) {
    const title = body.title.trim();
    if (title.length < 5 || title.length > 200) {
      return NextResponse.json({ error: "Title must be between 5 and 200 characters." }, { status: 400 });
    }
  }
  if (body.price !== undefined) {
    const price = Number(String(body.price).replace(/[₱,\s]/g, ""));
    if (isNaN(price) || price < 1000) {
      return NextResponse.json({ error: "Price must be at least ₱1,000." }, { status: 400 });
    }
  }
  if (body.floor_area !== undefined && body.floor_area !== null && body.floor_area !== "") {
    const fa = Number(body.floor_area);
    if (isNaN(fa) || fa <= 0) {
      return NextResponse.json({ error: "Floor area must be a positive number." }, { status: 400 });
    }
  }
  if (body.lot_size !== undefined && body.lot_size !== null && body.lot_size !== "") {
    const ls = Number(body.lot_size);
    if (isNaN(ls) || ls <= 0) {
      return NextResponse.json({ error: "Lot size must be a positive number." }, { status: 400 });
    }
  }
  if (body.bedrooms !== undefined && body.bedrooms !== null && body.bedrooms !== "") {
    const bd = Number(body.bedrooms);
    if (!Number.isInteger(bd) || bd < 0 || bd > 50) {
      return NextResponse.json({ error: "Bedrooms must be between 0 and 50." }, { status: 400 });
    }
  }
  if (body.bathrooms !== undefined && body.bathrooms !== null && body.bathrooms !== "") {
    const ba = Number(body.bathrooms);
    if (!Number.isInteger(ba) || ba < 0 || ba > 50) {
      return NextResponse.json({ error: "Bathrooms must be between 0 and 50." }, { status: 400 });
    }
  }

  // Build update payload — only include fields present in the request body
  const update: TablesUpdate<"properties"> = {};
  if (body.title !== undefined) update.title = body.title.trim();
  if (body.description !== undefined) update.description = body.description?.trim() ?? null;
  if (body.price !== undefined) update.price = Number(String(body.price).replace(/[₱,\s]/g, ""));
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
