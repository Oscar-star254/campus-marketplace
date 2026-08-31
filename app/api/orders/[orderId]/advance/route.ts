import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabaseServer";
import { createAdminSupabase } from "@/lib/supabaseAdmin";

const NEXT_STATUS: Record<string, string> = {
  pending: "confirmed",
  confirmed: "ready_for_pickup",
  ready_for_pickup: "completed",
};

export async function POST(
  req: NextRequest,
  { params }: { params: { orderId: string } }
) {
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

  const { data: order, error: orderError } = await admin
    .from("orders")
    .select("*")
    .eq("id", params.orderId)
    .single();

  if (orderError || !order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const next = NEXT_STATUS[order.status];
  if (!next) {
    return NextResponse.json({ error: `Order is already at a final status (${order.status})` }, { status: 409 });
  }

  const { error: updateError } = await admin
    .from("orders")
    .update({ status: next })
    .eq("id", order.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, status: next });
}