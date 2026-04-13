/**
 * Example API route demonstrating Linear API authentication
 * 
 * Endpoint: GET /api/linear/user
 * Returns: Current Linear user info
 */

import { getLinearUser } from "@/lib/linear";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const user = await getLinearUser();
    return NextResponse.json({ success: true, user });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
