"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ImageUploader from "@/components/ImageUploader";

export default function NewProductPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [category, setCategory] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/admin/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description, price, stock, category, imageUrls }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Could not create product");
      setLoading(false);
      return;
    }

    router.push("/admin/products/new?created=" + data.product.id);
    setTitle("");
    setDescription("");
    setPrice("");
    setStock("");
    setCategory("");
    setImageUrls([]);
    setLoading(false);
  }

  return (
    <div style={{ maxWidth: 480 }}>
      <h1>Add a product</h1>
      <p>This goes straight into the &quot;New&quot; catalog — no approval flow, since it&apos;s your own stock.</p>

      <form onSubmit={handleSubmit}>
        <label htmlFor="title">Title</label>
        <input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />

        <label htmlFor="description">Description</label>
        <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />

        <label htmlFor="price">Price (KES)</label>
        <input id="price" type="number" value={price} onChange={(e) => setPrice(e.target.value)} required min={1} />

        <label htmlFor="stock">Stock</label>
        <input id="stock" type="number" value={stock} onChange={(e) => setStock(e.target.value)} required min={0} />

        <label htmlFor="category">Category (optional)</label>
        <input id="category" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. Electronics" />

        <ImageUploader onChange={setImageUrls} />

        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={loading} style={{ marginTop: "0.5rem" }}>{loading ? "Adding..." : "Add product"}</button>
      </form>
    </div>
  );
}