import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabaseServer";
import { createAdminSupabase } from "@/lib/supabaseAdmin";
import { requestStkPush } from "@/lib/mpesa";

// POST { dealId: string, type: "commission" | "deposit", phoneNumber: string }
//
// "commission" is charged to the seller once buyer+seller agree in chat.
// "deposit" is charged to the buyer once the admin has approved the deal.
export async function POST(req: NextRequest) {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const { dealId, type, phoneNumber } = await req.json();

  if (!dealId || !["commission", "deposit"].includes(type) || !phoneNumber) {
    return NextResponse.json({ error: "Missing or invalid fields" }, { status: 400 });
  }

  const admin = createAdminSupabase();
  const { data: deal, error: dealError } = await admin
    .from("deals")
    .select("*")
    .eq("id", dealId)
    .single();

  if (dealError || !deal) {
    return NextResponse.json({ error: "Deal not found" }, { status: 404 });
  }

  // Guard: only the right party, at the right stage, can trigger each payment type.
  if (type === "commission") {
    if (user.id !== deal.seller_id) {
      return NextResponse.json({ error: "Only the seller pays the commission" }, { status: 403 });
    }
    if (deal.status !== "awaiting_commission") {
      return NextResponse.json({ error: `Deal is not awaiting commission (status: ${deal.status})` }, { status: 409 });
    }
  } else {
    if (user.id !== deal.buyer_id) {
      return NextResponse.json({ error: "Only the buyer pays the deposit" }, { status: 403 });
    }
    if (deal.status !== "awaiting_deposit") {
      return NextResponse.json({ error: `Deal is not awaiting deposit (status: ${deal.status})` }, { status: 409 });
    }
  }

  const amount = type === "commission" ? deal.commission_amount : deal.deposit_amount;

  try {
    const stk = await requestStkPush({
      phoneNumber,
      amount,
      accountReference: `deal-${dealId.slice(0, 8)}`,
      transactionDesc: type === "commission" ? "Marketplace commission" : "Marketplace deposit",
    });

    // Record a pending payment row now; the callback will flip it to success/failed
    // and is matched back to this row via mpesa_checkout_request_id.
    const { error: insertError } = await admin.from("payments").insert({
      deal_id: dealId,
      type,
      phone_number: phoneNumber,
      amount,
      status: "pending",
      mpesa_checkout_request_id: stk.checkoutRequestId,
    });

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, checkoutRequestId: stk.checkoutRequestId });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 502 });
  }
}
