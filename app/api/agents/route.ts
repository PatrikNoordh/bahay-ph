import { createServerSupabaseClient } from "@/lib/supabase";
import { NextResponse } from "next/server";
import { Resend } from "resend";

// POST /api/agents — create or update the authenticated user's agent profile
export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json() as {
    full_name?: string;
    phone?: string;
    company_name?: string;
    years_experience?: string | number;
    prc_license_number?: string;
  };

  // Validate required fields at the API boundary
  const full_name = body.full_name?.trim() ?? "";
  const phone = body.phone?.trim() ?? "";
  const prc_license_number = body.prc_license_number?.trim() ?? "";

  if (!full_name) {
    return NextResponse.json({ error: "Full name is required." }, { status: 400 });
  }
  if (!phone) {
    return NextResponse.json({ error: "Phone number is required." }, { status: 400 });
  }
  if (!prc_license_number) {
    return NextResponse.json({ error: "PRC licence number is required." }, { status: 400 });
  }

  const years_experience = body.years_experience
    ? Number(body.years_experience)
    : null;
  if (
    body.years_experience !== undefined &&
    body.years_experience !== "" &&
    (isNaN(years_experience!) || years_experience! < 0)
  ) {
    return NextResponse.json({ error: "Years of experience must be a non-negative number." }, { status: 400 });
  }

  // Upsert: update existing row if one already exists for this user_id (edge case)
  const { data: agent, error } = await supabase
    .from("agents")
    .upsert(
      {
        user_id: user.id,
        email: user.email ?? null,
        full_name,
        phone,
        company_name: body.company_name?.trim() || null,
        years_experience,
        prc_license_number,
        is_verified: false,
      },
      { onConflict: "user_id" }
    )
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // AC4 — Notify admin for manual verification via Resend
  // TODO: replace with real admin email (set ADMIN_EMAIL in .env.local)
  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@bahay.ph";
  const resendKey = process.env.RESEND_API_KEY;

  if (resendKey) {
    const resend = new Resend(resendKey);
    await resend.emails.send({
      from: "Bahay.ph <noreply@bahay.ph>",
      to: adminEmail,
      subject: `New broker registration: ${full_name}`,
      html: `
        <h2>New Broker Registration</h2>
        <p>A new broker has submitted their profile for verification on Bahay.ph.</p>
        <table>
          <tr><td><strong>Name</strong></td><td>${full_name}</td></tr>
          <tr><td><strong>Phone</strong></td><td>${phone}</td></tr>
          <tr><td><strong>Company</strong></td><td>${body.company_name?.trim() || "—"}</td></tr>
          <tr><td><strong>Years exp.</strong></td><td>${years_experience ?? "—"}</td></tr>
          <tr><td><strong>PRC Licence</strong></td><td>${prc_license_number}</td></tr>
          <tr><td><strong>Email</strong></td><td>${user.email ?? "—"}</td></tr>
          <tr><td><strong>User ID</strong></td><td>${user.id}</td></tr>
        </table>
        <p>Log in to Supabase and set <code>is_verified = true</code> on their agents row to approve.</p>
      `,
    }).catch(() => {
      // Non-fatal: profile is saved regardless of email delivery
    });
  }

  return NextResponse.json(agent, { status: 201 });
}
