"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AgreeDealForm({ conversationId }: { conversationId: string }) {
  const router = useRouter();
  const [agreedPrice, setAgreedPrice] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/deals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        conversationId,
        agreedPrice: Number(agreedPrice),
        depositAmount: Number(depositAmount),
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Could not create deal");
      setLoading(false);
      return;
    }

    router.push(`/deals/${data.deal.id}`);
  }

  return (
    <div className="card">
      <h3>Ready to lock this in?</h3>
      <p>Once you both agree on a price and deposit, either of you can start the deal here. The seller will then be asked to pay a 10% commission before the buyer's number is shared.</p>
      <form onSubmit={handleSubmit}>
        <input
          type="number"
          placeholder="Agreed price (KES)"
          value={agreedPrice}
          onChange={(e) => setAgreedPrice(e.target.value)}
          required
          min={1}
        />
        <input
          type="number"
          placeholder="Deposit amount (KES)"
          value={depositAmount}
          onChange={(e) => setDepositAmount(e.target.value)}
          required
          min={0}
        />
        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={loading}>{loading ? "Creating..." : "We've agreed — start the deal"}</button>
      </form>
    </div>
  );
}
