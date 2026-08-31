import { createServerSupabase } from "@/lib/supabaseServer";

export default async function ListingsPage() {
  const supabase = createServerSupabase();

  const [{ data: products }, { data: listings }] = await Promise.all([
    supabase.from("products").select("*").eq("is_active", true).order("created_at", { ascending: false }),
    supabase.from("listings").select("*").eq("status", "available").order("created_at", { ascending: false }),
  ]);

  return (
    <div>
      <h1>Browse</h1>

      <h2>New</h2>
      <div className="grid">
        {products?.length ? products.map((p) => (
          <a className="card" key={p.id} href={`/products/${p.id}`} style={{ display: "block" }}>
            <span className="product-badge">New</span>
            <div className="product-thumb" style={p.image_urls?.[0] ? { backgroundImage: `url(${p.image_urls[0]})`, backgroundSize: "cover", backgroundPosition: "center", color: "transparent" } : {}}>
              {!p.image_urls?.[0] && "Photo"}
            </div>
            <strong>{p.title}</strong>
            <p className="product-price">KES {p.price}</p>
            <span className="tag">{p.stock > 0 ? "In stock" : "Out of stock"}</span>
          </a>
        )) : <p>Nothing stocked yet — check back soon.</p>}
      </div>

      <h2>Secondhand</h2>
      <div className="grid">
        {listings?.length ? listings.map((l) => (
          <a className="card" key={l.id} href={`/listings/${l.id}`} style={{ display: "block" }}>
            <span className="product-badge secondhand">Used</span>
            <div className="product-thumb" style={l.image_urls?.[0] ? { backgroundImage: `url(${l.image_urls[0]})`, backgroundSize: "cover", backgroundPosition: "center", color: "transparent" } : {}}>
              {!l.image_urls?.[0] && "Photo"}
            </div>
            <strong>{l.title}</strong>
            <p className="product-price">KES {l.asking_price}</p>
            <span className="tag moss">{l.condition.replace("_", " ")}</span>
          </a>
        )) : <p>No one&apos;s listed anything secondhand yet — be the first.</p>}
      </div>
    </div>
  );
}