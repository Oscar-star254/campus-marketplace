import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabaseAdmin";
import { isAllowedCampusEmail, getAllowedCampusDomains } from "@/lib/campusEmail";

export async function POST(req: NextRequest) {
  const { fullName, email, phone, password } = await req.json();

  if (!fullName || !email || !phone || !password) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  if (!isAllowedCampusEmail(email)) {
    const domains = getAllowedCampusDomains();
    return NextResponse.json(
      { error: `Please sign up with your campus email (${domains.join(" or ")}).` },
      { status: 400 }
    );
  }

  const admin = createAdminSupabase();

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (createError || !created.user) {
    return NextResponse.json({ error: createError?.message ?? "Could not create account" }, { status: 400 });
  }

  const { error: profileError } = await admin.from("profiles").insert({
    id: created.user.id,
    full_name: fullName,
    campus_email: email,
    phone_number: phone,
  });

  if (profileError) {
    await admin.auth.admin.deleteUser(created.user.id);
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}