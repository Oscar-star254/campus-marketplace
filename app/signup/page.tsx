"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { isAllowedCampusEmail } from "@/lib/campusEmail";

export default function SignupPage() {
  const supabase = createClient();
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!isAllowedCampusEmail(email)) {
      setError("Please sign up with your campus email address.");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName, email, phone, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Sign up failed");
      setLoading(false);
      return;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    router.push("/listings");
  }

  return (
    <div style={{ maxWidth: 400 }}>
      <h1>Create an account</h1>
      <form onSubmit={handleSubmit}>
        <input placeholder="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
        <input placeholder="Campus email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input placeholder="Phone number (e.g. 2547XXXXXXXX)" value={phone} onChange={(e) => setPhone(e.target.value)} required />
        <input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={loading}>{loading ? "Creating account..." : "Sign up"}</button>
      </form>
    </div>
  );
}