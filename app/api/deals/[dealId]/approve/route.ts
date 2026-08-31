import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabaseServer";
import { createAdminSupabase } from "@/lib/supabaseAdmin";

// POST — admin-only. Call once commission_paid, to:
//   1. reveal the buyer's phone number to the seller
//   2. move the deal into awaiting_deposit
export async function POST(
  req: NextRequest,
  { params }: { params: { dealId: string } }
) {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const admin = createAdminSupabase();

  const { data: profile } = await admin
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const { data: deal, error: dealError } = await admin
    .from("deals")
    .select("*")
    .eq("id", params.dealId)
    .single();

  if (dealError || !deal) {
    return NextResponse.json({ error: "Deal not found" }, { status: 404 });
  }

  if (deal.status !== "commission_paid") {
    return NextResponse.json(
      { error: `Deal must be commission_paid to approve (status: ${deal.status})` },
      { status: 409 }
    );
  }

  const { error: updateError } = await admin
    .from("deals")
    .update({
      status: "awaiting_deposit",
      buyer_number_revealed: true,
      approved_by: user.id,
      approved_at: new Date().toISOString(),
    })
    .eq("id", deal.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
