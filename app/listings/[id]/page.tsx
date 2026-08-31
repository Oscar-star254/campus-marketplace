import { createServerSupabase } from "@/lib/supabaseServer";
import { notFound } from "next/navigation";
import MessageSellerButton from "./MessageSellerButton";
import CommentSection from "@/components/CommentSection";

export default async function ListingDetailPage({ params }: { params: { id: string } }) {
  const supabase = createServerSupabase();

  const { data: listing } = await supabase
    .from("listings")
    .select("*, profiles!listings_seller_id_fkey(full_name)")
    .eq("id", params.id)
    .single();

  if (!listing) notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div>
      {listing.image_urls?.length ? (
        <div style={{ display: "flex", gap: "0.6rem", marginBottom: "1.25rem", overflowX: "auto" }}>
          {listing.image_urls.map((url: string) => (
            <img
              key={url}
              src={url}
              alt={listing.title}
              style={{ width: 220, height: 220, objectFit: "cover", borderRadius: 14, border: "1px solid var(--line)" }}
            />
          ))}
        </div>
      ) : (
        <div className="product-thumb" style={{ height: 220, marginBottom: "1.25rem" }}>No photos yet</div>
      )}

      <h1>{listing.title}</h1>
      <p><span className="tag moss">{listing.condition.replace("_", " ")}</span></p>
      <p className="product-price" style={{ fontSize: "1.6rem" }}>KES {listing.asking_price}</p>
      <p>{listing.description}</p>
      <p>Listed by {(listing as any).profiles?.full_name ?? "a student"}</p>

      {user && user.id !== listing.seller_id && listing.status === "available" && (
        <MessageSellerButton listingId={listing.id} sellerId={listing.seller_id} />
      )}
      {listing.status !== "available" && <p className="tag rust">This item is {listing.status}</p>}
      <CommentSection listingId={listing.id} />
    </div>
  );
}
