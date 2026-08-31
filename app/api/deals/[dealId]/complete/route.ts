import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabaseServer";
import { createAdminSupabase } from "@/lib/supabaseAdmin";

// POST — admin-only. Call once the buyer confirms pickup, to mark the deal
// completed. Actual deposit payout to the seller is a manual M-Pesa send for
// now (B2C API needs extra Safaricom approval) — this just records that the
// payout is owed and stamps the deal complete. Wire up B2C later without
// changing this contract.
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

  if (deal.status !== "deposit_paid") {
    return NextResponse.json(
      { error: `Deal must be deposit_paid to complete (status: ${deal.status})` },
      { status: 409 }
    );
  }

  const { error: updateError } = await admin
    .from("deals")
    .update({
      status: "completed",
      deposit_released_at: new Date().toISOString(),
    })
    .eq("id", deal.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // Record the outgoing payout as its own ledger row for reconciliation.
  // Marked "success" once you've actually sent it — flip this to a real
  // status if you automate B2C later.
  await admin.from("payments").insert({
    deal_id: deal.id,
    type: "payout",
    phone_number: "", // fill in from the seller's profile at send time
    amount: deal.deposit_amount,
    status: "pending",
  });

  return NextResponse.json({ success: true });
}
