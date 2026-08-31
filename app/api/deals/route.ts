import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabaseServer";
import { createAdminSupabase } from "@/lib/supabaseAdmin";

const COMMISSION_RATE = Number(process.env.ESCROW_COMMISSION_RATE ?? "0.10");

// POST { conversationId: string, agreedPrice: number, depositAmount: number }
// Either buyer or seller can call this once they've settled on terms in chat.
export async function POST(req: NextRequest) {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const { conversationId, agreedPrice, depositAmount } = await req.json();

  if (!conversationId || !agreedPrice || depositAmount == null) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const admin = createAdminSupabase();

  const { data: conversation, error: convError } = await admin
    .from("conversations")
    .select("*")
    .eq("id", conversationId)
    .single();

  if (convError || !conversation) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  if (user.id !== conversation.buyer_id && user.id !== conversation.seller_id) {
    return NextResponse.json({ error: "Not part of this conversation" }, { status: 403 });
  }

  if (conversation.status === "agreed") {
    return NextResponse.json({ error: "Deal already created for this conversation" }, { status: 409 });
  }

  const commissionAmount = Math.round(agreedPrice * COMMISSION_RATE * 100) / 100;

  const { data: deal, error: dealError } = await admin
    .from("deals")
    .insert({
      conversation_id: conversation.id,
      listing_id: conversation.listing_id,
      buyer_id: conversation.buyer_id,
      seller_id: conversation.seller_id,
      agreed_price: agreedPrice,
      commission_amount: commissionAmount,
      deposit_amount: depositAmount,
      status: "awaiting_commission",
    })
    .select()
    .single();

  if (dealError) {
    return NextResponse.json({ error: dealError.message }, { status: 500 });
  }

  await admin
    .from("conversations")
    .update({ status: "agreed" })
    .eq("id", conversation.id);

  await admin
    .from("listings")
    .update({ status: "reserved" })
    .eq("id", conversation.listing_id);

  return NextResponse.json({ deal });
}
