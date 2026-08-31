import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabaseServer";
import { createAdminSupabase } from "@/lib/supabaseAdmin";
import { containsPhoneNumberLike, PHONE_BLOCK_MESSAGE } from "@/lib/messageFilter";

export async function POST(req: NextRequest) {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const { conversationId, body } = await req.json();

  if (!conversationId || !body || !body.trim()) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  if (containsPhoneNumberLike(body)) {
    return NextResponse.json({ error: PHONE_BLOCK_MESSAGE }, { status: 400 });
  }

  const admin = createAdminSupabase();

  const { data: conversation } = await admin
    .from("conversations")
    .select("buyer_id, seller_id")
    .eq("id", conversationId)
    .single();

  if (!conversation || (user.id !== conversation.buyer_id && user.id !== conversation.seller_id)) {
    return NextResponse.json({ error: "Not part of this conversation" }, { status: 403 });
  }

  const { error } = await admin.from("messages").insert({
    conversation_id: conversationId,
    sender_id: user.id,
    body,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}