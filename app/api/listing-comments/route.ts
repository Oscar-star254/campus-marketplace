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

  const { listingId, body } = await req.json();

  if (!listingId || !body || !body.trim()) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  if (containsPhoneNumberLike(body)) {
    return NextResponse.json({ error: PHONE_BLOCK_MESSAGE }, { status: 400 });
  }

  const admin = createAdminSupabase();
  const { error } = await admin.from("listing_comments").insert({
    listing_id: listingId,
    author_id: user.id,
    body,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}