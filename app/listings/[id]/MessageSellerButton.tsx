"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";

export default function MessageSellerButton({
  listingId,
  sellerId,
}: {
  listingId: string;
  sellerId: string;
}) {
  const supabase = createClient();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    // Reuse an existing conversation for this buyer+listing if one exists (unique constraint in schema),
    // otherwise create it.
    const { data: existing } = await supabase
      .from("conversations")
      .select("id")
      .eq("listing_id", listingId)
      .eq("buyer_id", user.id)
      .maybeSingle();

    if (existing) {
      router.push(`/chat/${existing.id}`);
      return;
    }

    const { data: created, error: insertError } = await supabase
      .from("conversations")
      .insert({ listing_id: listingId, buyer_id: user.id, seller_id: sellerId })
      .select("id")
      .single();

    if (insertError || !created) {
      setError(insertError?.message ?? "Could not start chat");
      setLoading(false);
      return;
    }

    router.push(`/chat/${created.id}`);
  }

  return (
    <div>
      <button onClick={handleClick} disabled={loading}>
        {loading ? "Starting chat..." : "Message seller"}
      </button>
      {error && <p className="error">{error}</p>}
    </div>
  );
}
