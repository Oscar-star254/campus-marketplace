"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabaseClient";

const ORDER_ACTION_LABEL: Record<string, string> = {
  pending: "Confirm order",
  confirmed: "Mark ready for pickup",
  ready_for_pickup: "Mark picked up",
};

export default function AdminPage() {
  const supabase = createClient();
  const [deals, setDeals] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  async function load() {
    const { data: dealRows } = await supabase
      .from("deals")
      .select("*")
      .in("status", ["commission_paid", "deposit_paid", "awaiting_commission", "awaiting_deposit"])
      .order("created_at", { ascending: true });
    setDeals(dealRows ?? []);

    const { data: orderRows } = await supabase
      .from("orders")
      .select("*, products(title)")
      .in("status", ["pending", "confirmed", "ready_for_pickup"])
      .order("created_at", { ascending: true });
    setOrders(orderRows ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  async function approve(dealId: string) {
    const res = await fetch(`/api/deals/${dealId}/approve`, { method: "POST" });
    const data = await res.json();
    setMessage(res.ok ? "Approved." : data.error);
    load();
  }

  async function complete(dealId: string) {
    const res = await fetch(`/api/deals/${dealId}/complete`, { method: "POST" });
    const data = await res.json();
    setMessage(res.ok ? "Marked complete — release the deposit payout manually." : data.error);
    load();
  }

  async function advanceOrder(orderId: string) {
    const res = await fetch(`/api/orders/${orderId}/advance`, { method: "POST" });
    const data = await res.json();
    setMessage(res.ok ? `Order moved to: ${data.status.replace(/_/g, " ")}` : data.error);
    load();
  }

  return (
    <div>
      <a href="/admin/products/new" className="btn" style={{ marginBottom: "1.5rem", display: "inline-block" }}>+ Add a product</a>

      <h1>Deals needing action</h1>
      {message && <p className="tag gold">{message}</p>}
      {deals.map((d) => (
        <div className="card" key={d.id}>
          <p><strong>Deal {d.id.slice(0, 8)}</strong> — KES {d.agreed_price} <span className="tag">{d.status.replace(/_/g, " ")}</span></p>
          <p>Commission KES {d.commission_amount} · Deposit KES {d.deposit_amount}</p>
          {d.status === "commission_paid" && (
            <button className="primary" onClick={() => approve(d.id)}>Approve — reveal buyer&apos;s number</button>
          )}
          {d.status === "deposit_paid" && (
            <button className="primary" onClick={() => complete(d.id)}>Mark complete — pickup confirmed</button>
          )}
        </div>
      ))}
      {!deals.length && <p>No deals need attention right now.</p>}

      <h2>Orders needing action</h2>
      {orders.map((o) => (
        <div className="card" key={o.id}>
          <p><strong>{o.products?.title ?? "Product"}</strong> — qty {o.quantity} <span className="tag">{o.status.replace(/_/g, " ")}</span></p>
          {o.pickup_location && <p>Pickup: {o.pickup_location}</p>}
          <button className="primary" onClick={() => advanceOrder(o.id)}>{ORDER_ACTION_LABEL[o.status] ?? "Advance"}</button>
        </div>
      ))}
      {!orders.length && <p>No orders need attention right now.</p>}
    </div>
  );
}