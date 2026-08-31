import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabaseAdmin";
import { StkCallback } from "@/lib/mpesa";

// Safaricom POSTs here after the user accepts/rejects/times out on the STK prompt.
// This is the SOURCE OF TRUTH for payment success — the STK push response only
// confirms the prompt was sent, not that money moved.
//
// Must be idempotent: Daraja can retry callbacks, so we key off mpesa_receipt_number
// (unique constraint in the schema) to avoid double-processing.
export async function POST(req: NextRequest) {
  const body: StkCallback = await req.json();
  const callback = body?.Body?.stkCallback;

  if (!callback) {
    return NextResponse.json({ error: "Malformed callback" }, { status: 400 });
  }

  const admin = createAdminSupabase();

  const { data: payment } = await admin
    .from("payments")
    .select("*")
    .eq("mpesa_checkout_request_id", callback.CheckoutRequestID)
    .single();

  if (!payment) {
    // Nothing we recognize — acknowledge anyway so Daraja stops retrying.
    return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
  }

  // Already processed (duplicate callback) — acknowledge and stop.
  if (payment.status !== "pending") {
    return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
  }

  const success = callback.ResultCode === 0;
  let receiptNumber: string | null = null;

  if (success && callback.CallbackMetadata) {
    const item = callback.CallbackMetadata.Item.find(
      (i) => i.Name === "MpesaReceiptNumber"
    );
    receiptNumber = item ? String(item.Value) : null;
  }

  await admin
    .from("payments")
    .update({
      status: success ? "success" : "failed",
      mpesa_receipt_number: receiptNumber,
      raw_callback: body,
    })
    .eq("id", payment.id);

  if (success) {
    // Advance the deal's state machine based on which payment just cleared.
    if (payment.type === "commission") {
      await admin
        .from("deals")
        .update({ status: "commission_paid" })
        .eq("id", payment.deal_id)
        .eq("status", "awaiting_commission"); // guard against racing/duplicate advances
    } else if (payment.type === "deposit") {
      await admin
        .from("deals")
        .update({ status: "deposit_paid" })
        .eq("id", payment.deal_id)
        .eq("status", "awaiting_deposit");
    }
  }

  // Daraja expects a 200 with this shape regardless of what we did with it.
  return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
}
