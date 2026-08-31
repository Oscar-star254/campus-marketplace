import { SupabaseClient } from "@supabase/supabase-js";

// Returns the buyer's phone number for a deal ONLY if buyer_number_revealed is true
// and the caller is the seller on that deal (or an admin). This is the single
// enforcement point for the "seller can't see buyer's number until approved" rule —
// route handlers and server components should call this rather than reading
// profiles.phone_number directly.
export async function getRevealedBuyerContact(
  admin: SupabaseClient,
  dealId: string,
  requesterId: string
): Promise<{ phoneNumber: string | null; revealed: boolean }> {
  const { data: deal } = await admin
    .from("deals")
    .select("seller_id, buyer_id, buyer_number_revealed")
    .eq("id", dealId)
    .single();

  if (!deal) return { phoneNumber: null, revealed: false };

  const { data: requesterProfile } = await admin
    .from("profiles")
    .select("is_admin")
    .eq("id", requesterId)
    .single();

  const isAllowed =
    deal.buyer_number_revealed &&
    (requesterId === deal.seller_id || requesterProfile?.is_admin);

  if (!isAllowed) return { phoneNumber: null, revealed: false };

  const { data: buyer } = await admin
    .from("profiles")
    .select("phone_number")
    .eq("id", deal.buyer_id)
    .single();

  return { phoneNumber: buyer?.phone_number ?? null, revealed: true };
}
