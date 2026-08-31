"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import EscrowTrail from "./EscrowTrail";

export default function DealPage({ params }: { params: { dealId: string } }) {
  const supabase = createClient();
  const [deal, setDeal] = useState<any>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function load() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    setUserId(user?.id ?? null);
    const { data } = await supabase.from("deals").select("*").eq("id", params.dealId).single();
    setDeal(data);
  }

  useEffect(() => {
    load();
  }, [params.dealId]);

  async function payCommission() {
    setLoading(true);
    setMessage(null);
    const res = await fetch("/api/mpesa/stkpush", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dealId: deal.id, type: "commission", phoneNumber: phone }),
    });
    const data = await res.json();
    setMessage(res.ok ? "Check your phone for the M-Pesa prompt." : data.error);
    setLoading(false);
  }

  async function payDeposit() {
    setLoading(true);
    setMessage(null);
    const res = await fetch("/api/mpesa/stkpush", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dealId: deal.id, type: "deposit", phoneNumber: phone }),
    });
    const data = await res.json();
    setMessage(res.ok ? "Check your phone for the M-Pesa prompt." : data.error);
    setLoading(false);
  }

  if (!deal) return <p>Loading...</p>;

  const isSeller = userId === deal.seller_id;
  const isBuyer = userId === deal.buyer_id;

  return (
    <div>
      <h1>Deal status</h1>

      <EscrowTrail status={deal.status} />

      <div className="card">
        <p><strong>Agreed price:</strong> KES {deal.agreed_price}</p>
        <p><strong>Commission (10%):</strong> KES {deal.commission_amount}</p>
        <p><strong>Deposit:</strong> KES {deal.deposit_amount}</p>
      </div>

      {isSeller && deal.status === "awaiting_commission" && (
        <div className="card">
          <p>Pay the 10% commission to move this along. Once it's confirmed, an admin will approve the deal and you'll get the buyer's number.</p>
          <label htmlFor="phone">Your M-Pesa number</label>
          <input id="phone" placeholder="2547XXXXXXXX" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <button className="primary" onClick={payCommission} disabled={loading || !phone}>{loading ? "Sending..." : `Pay KES ${deal.commission_amount}`}</button>
        </div>
      )}

      {isSeller && deal.status === "commission_paid" && (
        <p>Commission received. Waiting on approval before the buyer's number is shared with you.</p>
      )}

      {isBuyer && deal.status === "awaiting_deposit" && (
        <div className="card">
          <p>Your deposit holds the item until pickup. It stays with the platform and goes to the seller once you've confirmed pickup.</p>
          <label htmlFor="phone">Your M-Pesa number</label>
          <input id="phone" placeholder="2547XXXXXXXX" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <button className="primary" onClick={payDeposit} disabled={loading || !phone}>{loading ? "Sending..." : `Pay deposit KES ${deal.deposit_amount}`}</button>
        </div>
      )}

      {deal.status === "deposit_paid" && (
        <p>Deposit received — arrange pickup on campus. This gets marked complete once pickup is confirmed.</p>
      )}

      {deal.status === "completed" && <p>Done. Thanks for trading on The Quad.</p>}

      {message && <p className="tag gold">{message}</p>}
    </div>
  );
}
