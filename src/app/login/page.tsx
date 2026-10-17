"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const supabase = createClient();
  const router = useRouter();
  const [phone, setPhone] = useState("+91");
  const [otp, setOtp] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function sendOtp() {
    setError("");
    const { error } = await supabase.auth.signInWithOtp({ phone });
    if (error) setError(error.message);
    else setSent(true);
  }

  async function verifyOtp() {
    setError("");
    const { error } = await supabase.auth.verifyOtp({
      phone,
      token: otp,
      type: "sms",
    });
    if (error) setError(error.message);
    else router.push("/onboarding");
  }

  return (
    <main className="mx-auto max-w-sm p-6 space-y-4">
      <h1 className="text-2xl font-bold">Kredo Login</h1>

      <input
        className="w-full border rounded p-2 bg-transparent"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="+91XXXXXXXXXX"
        disabled={sent}
      />

      {!sent ? (
        <button
          onClick={sendOtp}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-medium rounded p-2"
        >
          Send OTP
        </button>
      ) : (
        <>
          <input
            className="w-full border rounded p-2 bg-transparent"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder="Enter OTP"
          />
          <button
            onClick={verifyOtp}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-medium rounded p-2"
          >
            Verify
          </button>
        </>
      )}

      {error && <p className="text-red-600 text-sm">{error}</p>}
    </main>
  );
}
