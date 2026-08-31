import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabaseServer";
import { createAdminSupabase } from "@/lib/supabaseAdmin";

export async function POST(req: NextRequest) {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const { productId, quantity, pickupLocation } = await req.json();

  if (!productId || !quantity || quantity < 1) {
    return NextResponse.json({ error: "Missing or invalid fields" }, { status: 400 });
  }

  const admin = createAdminSupabase();

  const { data: product, error: productError } = await admin
    .from("products")
    .select("*")
    .eq("id", productId)
    .single();

  if (productError || !product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  if (!product.is_active) {
    return NextResponse.json({ error: "This product is no longer available" }, { status: 409 });
  }

  if (product.stock < quantity) {
    return NextResponse.json({ error: `Only ${product.stock} left in stock` }, { status: 409 });
  }

  const { data: updatedProduct, error: stockError } = await admin
    .from("products")
    .update({ stock: product.stock - quantity })
    .eq("id", productId)
    .gte("stock", quantity)
    .select()
    .single();

  if (stockError || !updatedProduct) {
    return NextResponse.json({ error: "That item just sold out — try a smaller quantity" }, { status: 409 });
  }

  const { data: order, error: orderError } = await admin
    .from("orders")
    .insert({
      buyer_id: user.id,
      product_id: productId,
      quantity,
      pickup_location: pickupLocation || null,
      status: "pending",
    })
    .select()
    .single();

  if (orderError) {
    await admin.from("products").update({ stock: product.stock }).eq("id", productId);
    return NextResponse.json({ error: orderError.message }, { status: 500 });
  }

  return NextResponse.json({ order });
}