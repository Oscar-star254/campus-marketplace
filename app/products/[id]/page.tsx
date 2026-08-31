import { createServerSupabase } from "@/lib/supabaseServer";
import { notFound } from "next/navigation";
import OrderForm from "./OrderForm";

export default async function ProductDetailPage({ params }: { params: { id: string } }) {
  const supabase = createServerSupabase();

  const { data: product } = await supabase
    .from("products")
    .select("*")
    .eq("id", params.id)
    .eq("is_active", true)
    .single();

  if (!product) notFound();

  return (
    <div>
      {product.image_urls?.length ? (
        <div style={{ display: "flex", gap: "0.6rem", marginBottom: "1.25rem", overflowX: "auto" }}>
          {product.image_urls.map((url: string) => (
            <img
              key={url}
              src={url}
              alt={product.title}
              style={{ width: 220, height: 220, objectFit: "cover", borderRadius: 14, border: "1px solid var(--line)" }}
            />
          ))}
        </div>
      ) : (
        <div className="product-thumb" style={{ height: 220, marginBottom: "1.25rem" }}>No photos yet</div>
      )}

      <h1>{product.title}</h1>
      <p className="product-price" style={{ fontSize: "1.6rem" }}>KES {product.price}</p>
      <p>{product.description}</p>
      <p><span className="tag">{product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}</span></p>

      <OrderForm productId={product.id} price={product.price} stock={product.stock} />
    </div>
  );
}