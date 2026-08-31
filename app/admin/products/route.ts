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

  const admin = createAdminSupabase();
  const { data: profile } = await admin
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const { title, description, price, stock, category, imageUrls } = await req.json();

  if (!title || price == null || stock == null) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const { data: product, error } = await admin
    .from("products")
    .insert({
      title,
      description: description || null,
      price: Number(price),
      stock: Number(stock),
      category: category || null,
      image_urls: imageUrls || [],
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ product });
}