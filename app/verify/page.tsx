"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";

function VerifyForm() {
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState(searchParams.get("email") ?? "");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: "signup",
    });

    if (verifyError) {
      setError(verifyError.message);
      setLoading(false);
      return;
    }

    router.push("/listings");
  }

  async function handleResend() {
    setError(null);
    setNotice(null);
    setResending(true);

    const { error: resendError } = await supabase.auth.resend({
      type: "signup",
      email,
    });

    setResending(false);

    if (resendError) {
      setError(resendError.message);
      return;
    }

    setNotice("Sent — check your inbox for a new code.");
  }

  return (
    <div style={{ maxWidth: 400 }}>
      <h1>Verify your email</h1>
      <p>We sent a 6-digit code to your inbox. Enter it below to finish creating your account.</p>

      <form onSubmit={handleVerify}>
        <label htmlFor="email">Email</label>
        <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />

        <label htmlFor="code">Verification code</label>
        <input
          id="code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="123456"
          inputMode="numeric"
          maxLength={6}
          required
        />

        {error && <p className="error">{error}</p>}
        {notice && <p className="tag moss">{notice}</p>}

        <button type="submit" disabled={loading}>{loading ? "Verifying..." : "Verify"}</button>
      </form>

      <button
        type="button"
        onClick={handleResend}
        disabled={resending || !email}
        style={{ background: "transparent", color: "var(--purple)", padding: "0.5rem 0", marginTop: "0.5rem" }}
      >
        {resending ? "Sending..." : "Resend code"}
      </button>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <VerifyForm />
    </Suspense>
  );
}