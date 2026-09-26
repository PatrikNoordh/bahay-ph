import { createServerSupabaseClient } from "@/lib/supabase";
import { NextResponse } from "next/server";

// GET /api/images?property_id=xxx — return all images for a property
export async function GET(request: Request) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const property_id = searchParams.get("property_id");

  if (!property_id) {
    return NextResponse.json({ error: "property_id is required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("property_images")
    .select("*")
    .eq("property_id", property_id)
    .order("sort_order", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}

// POST /api/images — save an image record after uploading to Storage
export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    property_id?: string;
    image_url?: string;
    is_primary?: boolean;
    sort_order?: number;
  };

  if (!body.property_id || !body.image_url) {
    return NextResponse.json(
      { error: "property_id and image_url are required" },
      { status: 400 }
    );
  }

  // Verify the agent owns this property
  const { data: property, error: propertyError } = await supabase
    .from("properties")
    .select("id, agent_id")
    .eq("id", body.property_id)
    .single();

  if (propertyError) {
    return NextResponse.json({ error: propertyError.message }, { status: 500 });
  }

  if (!property) {
    return NextResponse.json({ error: "Property not found" }, { status: 404 });
  }

  const { data: agent, error: agentError } = await supabase
    .from("agents")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (agentError) {
    return NextResponse.json({ error: agentError.message }, { status: 500 });
  }
  if (!agent || property.agent_id !== agent.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("property_images")
    .insert({
      property_id: body.property_id,
      image_url: body.image_url,
      is_primary: body.is_primary ?? false,
      sort_order: body.sort_order ?? 0,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
