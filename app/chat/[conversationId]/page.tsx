"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabaseClient";
import AgreeDealForm from "./AgreeDealForm";
import { containsPhoneNumberLike, PHONE_BLOCK_MESSAGE } from "@/lib/messageFilter";

interface Message {
  id: string;
  sender_id: string;
  body: string;
  created_at: string;
}

export default function ChatPage({ params }: { params: { conversationId: string } }) {
  const supabase = createClient();
  const [messages, setMessages] = useState<Message[]>([]);
  const [body, setBody] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [conversation, setConversation] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUserId(user?.id ?? null);

      const { data: conv } = await supabase
        .from("conversations")
        .select("*")
        .eq("id", params.conversationId)
        .single();
      setConversation(conv);

      const { data: msgs } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", params.conversationId)
        .order("created_at", { ascending: true });
      setMessages(msgs ?? []);
    })();

    // Live updates so both sides see new messages without a refresh.
    const channel = supabase
      .channel(`conversation-${params.conversationId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${params.conversationId}` },
        (payload) => setMessages((prev) => [...prev, payload.new as Message])
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [params.conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!body.trim() || !userId) return;

    if (containsPhoneNumberLike(body)) {
      setError(PHONE_BLOCK_MESSAGE);
      return;
    }

    const text = body;
    setBody("");

    const res = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationId: params.conversationId, body: text }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Could not send message");
      setBody(text); // give the text back so they don't lose it
    }
  }

  const isSeller = conversation && userId === conversation.seller_id;
  const isBuyer = conversation && userId === conversation.buyer_id;

  return (
    <div>
      <h1>Chat</h1>
      <div className="card" style={{ maxHeight: 400, overflowY: "auto" }}>
        {messages.map((m) => (
          <p key={m.id} style={{ textAlign: m.sender_id === userId ? "right" : "left" }}>
            <span className="tag">{m.sender_id === userId ? "You" : "Them"}</span> {m.body}
          </p>
        ))}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={sendMessage} style={{ display: "flex", gap: "0.5rem" }}>
        <input value={body} onChange={(e) => setBody(e.target.value)} placeholder="Type a message..." />
        <button type="submit">Send</button>
      </form>
      {error && <p className="error">{error}</p>}

      {conversation && conversation.status === "open" && (isSeller || isBuyer) && (
        <AgreeDealForm conversationId={params.conversationId} />
      )}
      {conversation?.status === "agreed" && (
        <p className="tag">Deal created for this chat — check your deal status page.</p>
      )}
    </div>
  );
}