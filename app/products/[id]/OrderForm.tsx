"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function OrderForm({
  productId,
  price,
  stock,
}: {
  productId: string;
  price: number;
  stock: number;
}) {
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [pickupLocation, setPickupLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, quantity, pickupLocation }),
    });

    const data = await res.json();

    if (!res.ok) {
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      setError(data.error ?? "Could not place order");
      setLoading(false);
      return;
    }

    router.push(`/orders?placed=${data.order.id}`);
  }

  if (stock < 1) {
    return <p className="tag rust">Out of stock right now</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="card" style={{ maxWidth: 340 }}>
      <label htmlFor="quantity">Quantity</label>
      <input
        id="quantity"
        type="number"
        min={1}
        max={stock}
        value={quantity}
        onChange={(e) => setQuantity(Math.max(1, Math.min(stock, Number(e.target.value))))}
      />

      <label htmlFor="pickup">Preferred pickup spot (optional)</label>
      <input
        id="pickup"
        placeholder="e.g. Main gate, library"
        value={pickupLocation}
        onChange={(e) => setPickupLocation(e.target.value)}
      />

      <p style={{ fontWeight: 700, color: "var(--ink)" }}>Total: KES {(price * quantity).toFixed(2)}</p>

      {error && <p className="error">{error}</p>}
      <button type="submit" disabled={loading}>{loading ? "Placing order..." : "Place order"}</button>
      <p style={{ fontSize: "0.82rem", marginTop: "0.6rem" }}>Pay cash or mobile money on pickup — no payment needed now.</p>
    </form>
  );
}