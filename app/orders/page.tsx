"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabaseClient";

const STATUS_LABELS: Record<string, string> = {
  pending: "Order placed",
  confirmed: "Confirmed",
  ready_for_pickup: "Ready for pickup",
  completed: "Completed",
  cancelled: "Cancelled",
};

export default function OrdersPage() {
  const supabase = createClient();
  const [orders, setOrders] = useState<any[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
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

      const { data } = await supabase
        .from("orders")
        .select("*, products(title, price)")
        .eq("buyer_id", user.id)
        .order("created_at", { ascending: false });

      setOrders(data ?? []);
      setLoading(false);
    })();
  }, []);

  if (loading) return <p>Loading...</p>;

  if (!userId) {
    return (
      <div>
        <h1>My orders</h1>
        <p>
          You need to be logged in to see this. <a href="/login" style={{ color: "var(--purple)", fontWeight: 600 }}>Log in</a>
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1>My orders</h1>
      {orders.length ? (
        orders.map((o) => (
          <div className="card" key={o.id} style={{ marginBottom: "0.75rem" }}>
            <strong>{o.products?.title ?? "Product"}</strong>
            <p style={{ margin: "0.3rem 0" }}>
              Qty {o.quantity} · KES {(o.products?.price ?? 0) * o.quantity}
              {o.pickup_location ? ` · Pickup: ${o.pickup_location}` : ""}
            </p>
            <span className="tag">{STATUS_LABELS[o.status] ?? o.status}</span>
          </div>
        ))
      ) : (
        <p>No orders yet — browse the catalog to find something.</p>
      )}
    </div>
  );
}