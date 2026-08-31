"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import { containsPhoneNumberLike, PHONE_BLOCK_MESSAGE } from "@/lib/messageFilter";

interface Comment {
  id: string;
  author_id: string;
  body: string;
  created_at: string;
  profiles?: { full_name: string };
}

export default function CommentSection({ listingId }: { listingId: string }) {
  const supabase = createClient();
  const [comments, setComments] = useState<Comment[]>([]);
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    const { data } = await supabase
      .from("listing_comments")
      .select("*, profiles(full_name)")
      .eq("listing_id", listingId)
      .order("created_at", { ascending: true });
    setComments((data as any) ?? []);
  }

  useEffect(() => {
    load();
  }, [listingId]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!body.trim()) return;

    if (containsPhoneNumberLike(body)) {
      setError(PHONE_BLOCK_MESSAGE);
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Log in to join the conversation.");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/listing-comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId, body }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Could not post comment");
      setLoading(false);
      return;
    }

    setBody("");
    setLoading(false);
    load();
  }

  return (
    <div style={{ marginTop: "2rem" }}>
      <h2>Bargain on this listing</h2>
      <p>Public to anyone browsing — great for haggling in the open. Phone numbers aren&apos;t allowed here; once you agree on a price, message the seller directly to start the deal.</p>

      {comments.map((c) => (
        <div className="card" key={c.id} style={{ marginBottom: "0.6rem" }}>
          <strong style={{ fontSize: "0.85rem" }}>{c.profiles?.full_name ?? "A student"}</strong>
          <p style={{ margin: "0.3rem 0 0" }}>{c.body}</p>
        </div>
      ))}
      {!comments.length && <p>No offers yet — be the first to make one.</p>}

      <form onSubmit={submit} style={{ marginTop: "1rem" }}>
        <textarea
          placeholder="Make an offer or ask a question..."
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={2}
        />
        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={loading}>{loading ? "Posting..." : "Post"}</button>
      </form>
    </div>
  );
}