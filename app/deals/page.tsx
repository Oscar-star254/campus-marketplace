"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabaseClient";

const STAGE_LABELS: Record<string, string> = {
  awaiting_commission: "Waiting on commission",
  commission_paid: "Waiting on approval",
  awaiting_deposit: "Waiting on deposit",
  deposit_paid: "Ready for pickup",
  completed: "Completed",
  disputed: "Disputed",
  cancelled: "Cancelled",
};

export default function MyDealsPage() {
  const supabase = createClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [deals, setDeals] = useState<any[]>([]);
  const [openConversations, setOpenConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }
      setUserId(user.id);

      const { data: dealRows } = await supabase
        .from("deals")
        .select("*, listings(title)")
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
        .order("created_at", { ascending: false });

      const { data: convoRows } = await supabase
        .from("conversations")
        .select("*, listings(title)")
        .eq("status", "open")
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
        .order("created_at", { ascending: false });

      setDeals(dealRows ?? []);
      setOpenConversations(convoRows ?? []);
      setLoading(false);
    })();
  }, []);

  if (loading) return <p>Loading...</p>;

  if (!userId) {
    return (
      <div>
        <h1>My deals</h1>
        <p>
          You need to be logged in to see this. <a href="/login" style={{ color: "var(--purple)", fontWeight: 600 }}>Log in</a>
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1>My deals</h1>

      <h2>In progress</h2>
      {deals.length ? (
        deals.map((d) => (
          <a key={d.id} href={`/deals/${d.id}`} className="card" style={{ display: "block", marginBottom: "0.75rem" }}>
            <strong>{d.listings?.title ?? "Listing"}</strong>
            <p style={{ margin: "0.3rem 0" }}>
              KES {d.agreed_price} · {userId === d.seller_id ? "You're selling" : "You're buying"}
            </p>
            <span className="tag">{STAGE_LABELS[d.status] ?? d.status}</span>
          </a>
        ))
      ) : (
        <p>No active deals yet — once you agree on a price in chat, it&apos;ll show up here.</p>
      )}

      <h2>Open conversations</h2>
      {openConversations.length ? (
        openConversations.map((c) => (
          <a key={c.id} href={`/chat/${c.id}`} className="card" style={{ display: "block", marginBottom: "0.75rem" }}>
            <strong>{c.listings?.title ?? "Listing"}</strong>
            <p style={{ margin: "0.3rem 0" }}>{userId === c.seller_id ? "You're selling" : "You're buying"}</p>
            <span className="tag moss">Still chatting</span>
          </a>
        ))
      ) : (
        <p>No open chats right now.</p>
      )}
    </div>
  );
}