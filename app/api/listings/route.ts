import { createServerSupabaseClient } from "@/lib/supabase";
import { NextResponse } from "next/server";
import type { PriceType, PropertyType } from "@/lib/types";

// POST /api/listings — create a new listing for the authenticated agent
export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Resolve agent record — buyers have no agent row
  const { data: agent } = await supabase
    .from("agents")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!agent) {
    return NextResponse.json({ error: "No agent profile found" }, { status: 403 });
  }

  const body = await request.json() as {
    title?: string;
    description?: string;
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
  };

  // Validate required fields at the API boundary
  if (!body.title?.trim() || !body.price || !body.city?.trim() || !body.price_type || !body.property_type) {
    return NextResponse.json({ error: "Missing required fields: title, price, city, price_type, property_type" }, { status: 400 });
  }

  const price_period = body.price_type === "rent" ? "monthly" : "total";

  const { data, error } = await supabase
    .from("properties")
    .insert({
      title: body.title.trim(),
      description: body.description?.trim() ?? null,
      price: Number(body.price),
      price_type: body.price_type,
      price_period,
      property_type: body.property_type,
      bedrooms: body.bedrooms ? Number(body.bedrooms) : null,
      bathrooms: body.bathrooms ? Number(body.bathrooms) : null,
      floor_area: body.floor_area ? Number(body.floor_area) : null,
      lot_size: body.lot_size ? Number(body.lot_size) : null,
      address: body.address?.trim() ?? null,
      city: body.city.trim(),
      barangay: body.barangay?.trim() ?? null,
      status: "active" as const,
      is_featured: false,
      agent_id: agent.id,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
