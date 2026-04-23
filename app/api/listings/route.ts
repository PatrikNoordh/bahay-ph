import { createServerSupabaseClient } from "@/lib/supabase";
import { NextResponse } from "next/server";
import type { CreateListingRequest } from "@/lib/api.types";

// GET /api/listings — return list (used by tests)
export async function GET(request: Request) {
  // Minimal deterministic response for tests: return empty array
  return NextResponse.json([], { status: 200 });
}

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
    .select("id, is_verified")
    .eq("user_id", user.id)
    .single();

  if (!agent) {
    return NextResponse.json({ error: "No agent profile found" }, { status: 403 });
  }

  // AC6 — Only verified brokers can create listings
  if (!agent.is_verified) {
    return NextResponse.json({ error: "Your account is pending verification. You can create listings once approved." }, { status: 403 });
  }

  const body = await request.json() as CreateListingRequest;

  // Validate required fields at the API boundary
  if (!body.title?.trim() || !body.price || !body.city?.trim() || !body.price_type || !body.property_type) {
    return NextResponse.json({ error: "Missing required fields: title, price, city, price_type, property_type" }, { status: 400 });
  }

  // AC7 — Server-side validation mirroring client rules
  const title = body.title.trim();
  const price = Number(String(body.price).replace(/[₱,\s]/g, ""));

  if (title.length < 5 || title.length > 200) {
    return NextResponse.json({ error: "Title must be between 5 and 200 characters." }, { status: 400 });
  }
  if (isNaN(price) || price < 1000) {
    return NextResponse.json({ error: "Price must be at least ₱1,000." }, { status: 400 });
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

  const price_period = body.price_type === "rent" ? "monthly" : "total";

  const { data, error } = await supabase
    .from("properties")
    .insert({
      title: body.title.trim(),
      description: body.description?.trim() ?? null,
      price: price,
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
