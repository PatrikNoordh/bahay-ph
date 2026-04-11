import { createServerSupabaseClient } from "@/lib/supabase";
import { NextResponse } from "next/server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// DELETE /api/images/[id] — delete image record from DB and file from Storage
export async function DELETE(_request: Request, { params }: RouteParams) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Fetch image to get the URL (needed for Storage delete) and verify ownership
  const { data: image } = await supabase
    .from("property_images")
    .select("id, image_url, property_id")
    .eq("id", id)
    .single();

  if (!image) {
    return NextResponse.json({ error: "Image not found" }, { status: 404 });
  }

  // Verify agent owns the parent property
  const { data: agent } = await supabase
    .from("agents")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!agent) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: property } = await supabase
    .from("properties")
    .select("agent_id")
    .eq("id", image.property_id)
    .single();

  if (!property || property.agent_id !== agent.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Delete DB record first
  const { error: dbError } = await supabase
    .from("property_images")
    .delete()
    .eq("id", id);

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  // Extract storage path from the public URL and remove from Storage
  // URL format: .../storage/v1/object/public/property-images/{path}
  const marker = "/property-images/";
  const markerIdx = image.image_url.indexOf(marker);
  if (markerIdx !== -1) {
    const storagePath = image.image_url.slice(markerIdx + marker.length);
    // Best-effort — don't fail the response if Storage delete fails
    await supabase.storage.from("property-images").remove([storagePath]);
  }

  return NextResponse.json({ success: true });
}
