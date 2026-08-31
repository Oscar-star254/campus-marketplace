"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";
import ImageUploader from "@/components/ImageUploader";

export default function SellPage() {
  const supabase = createClient();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [condition, setCondition] = useState("good");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const { data, error: insertError } = await supabase
      .from("listings")
      .insert({
        seller_id: user.id,
        title,
        description,
        asking_price: Number(price),
        condition,
        image_urls: imageUrls,
      })
      .select("id")
      .single();

    if (insertError || !data) {
      setError(insertError?.message ?? "Could not create listing");
      setLoading(false);
      return;
    }

    router.push(`/listings/${data.id}`);
  }

  return (
    <div style={{ maxWidth: 480 }}>
      <h1>List an item</h1>
      <form onSubmit={handleSubmit}>
        <label htmlFor="title">Title</label>
        <input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />

        <label htmlFor="description">Description</label>
        <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />

        <label htmlFor="price">Asking price (KES)</label>
        <input id="price" type="number" value={price} onChange={(e) => setPrice(e.target.value)} required min={1} />

        <label htmlFor="condition">Condition</label>
        <select id="condition" value={condition} onChange={(e) => setCondition(e.target.value)}>
          <option value="new">New</option>
          <option value="like_new">Like new</option>
          <option value="good">Good</option>
          <option value="fair">Fair</option>
          <option value="worn">Worn</option>
        </select>

        <ImageUploader onChange={setImageUrls} />

        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={loading} style={{ marginTop: "0.5rem" }}>{loading ? "Posting..." : "Post listing"}</button>
      </form>
    </div>
  );
}
