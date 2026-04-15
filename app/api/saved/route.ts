import { createServerSupabaseClient } from "@/lib/supabase";
import { NextResponse } from "next/server";
import type {
  SavePropertyRequest,
  DeleteSavedRequest,
  BulkDeleteSavedRequest,
  BulkDeleteSavedResponse,
} from "@/lib/api.types";

// GET /api/saved — return the current user's saved properties (id + property_id)
export async function GET() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("saved_properties")
    .select("id, property_id")
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// POST /api/saved — save a property for the authenticated user
export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as SavePropertyRequest;

  if (!body.property_id) {
    return NextResponse.json({ error: "property_id is required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("saved_properties")
    .insert({ user_id: user.id, property_id: body.property_id })
    .select()
    .single();

  if (error) {
    // Unique constraint violation — already saved; return the existing row id so
    // the client can replace the "__optimistic__" placeholder with the real id
    if (error.code === "23505") {
      const { data: existing, error: fetchError } = await supabase
        .from("saved_properties")
        .select("id")
        .eq("user_id", user.id)
        .eq("property_id", body.property_id)
        .single();
      if (fetchError || !existing) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json(
        { error: "Already saved", id: existing.id },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

// DELETE /api/saved — unsave a single property (id) or multiple (ids[])
export async function DELETE(request: Request) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as DeleteSavedRequest | BulkDeleteSavedRequest;

  // ── Bulk delete ──────────────────────────────────────────────────────────────
  if ("ids" in body) {
    const { ids } = body as BulkDeleteSavedRequest;

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "ids must be a non-empty array" }, { status: 400 });
    }

    // Attempt to delete all in one query; RLS enforces ownership
    const { error } = await supabase
      .from("saved_properties")
      .delete()
      .in("id", ids)
      .eq("user_id", user.id);

    if (error) {
      // Batch failed entirely — all IDs are reported as failed
      const response: BulkDeleteSavedResponse = { succeeded: [], failed: ids };
      return NextResponse.json(response, { status: 500 });
    }

    const response: BulkDeleteSavedResponse = { succeeded: ids, failed: [] };
    return NextResponse.json(response);
  }

  // ── Single delete (backwards-compatible) ────────────────────────────────────
  const { id } = body as DeleteSavedRequest;

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  // RLS ensures users can only delete their own saved_properties rows
  const { error } = await supabase
    .from("saved_properties")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
