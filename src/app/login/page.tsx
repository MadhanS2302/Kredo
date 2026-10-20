"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Wordmark from "@/components/Wordmark";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function LoginPage() {
  const supabase = createClient();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const cleanEmail = email.trim().toLowerCase();

  async function sendCode() {
    setError("");
    if (!EMAIL_RE.test(cleanEmail)) {
      setError("Enter a valid email address.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.signInWithOtp({ email: cleanEmail });
    setBusy(false);
    if (error) {
      setError(
        error.message.toLowerCase().includes("rate")
          ? "Too many emails requested. Wait a minute and try again."
          : error.message
      );
    } else setSent(true);
  }

  async function verify() {
    setError("");
    if (code.length < 6) {
      setError("Enter the code from the email.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.verifyOtp({ email: cleanEmail, token: code, type: "email" });
    setBusy(false);
    if (error) setError("That code is not correct or has expired. Check it or request a new one.");
    else router.push("/dashboard");
  }

  return (
    <main className="mx-auto w-full max-w-md px-5 pt-6 pb-12">
      <Wordmark />
      <h1 className="font-display mt-12 text-4xl font-extrabold tracking-tight">
        {sent ? "Check your email" : "Sign in"}
      </h1>
      <p className="mt-2 text-mute">
        {sent
          ? `We sent a code to ${cleanEmail}. It can take a minute. Look in spam if you do not see it.`
          : "Enter your email address. We will email you a code, no password needed."}
      </p>

      <div className="mt-8 space-y-4">
        <div>
          <label htmlFor="email" className="label">Email address</label>
          <input
            id="email"
            type="email"
            className="field"
            autoComplete="email"
            inputMode="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={sent}
          />
        </div>

        {sent && (
          <div>
            <label htmlFor="code" className="label">Code from the email</label>
            <input
              id="code"
              className="field text-center text-2xl tracking-[0.3em]"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={10}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              autoFocus
            />
          </div>
        )}

        {error && <p className="error" role="alert">{error}</p>}

        {!sent ? (
          <button onClick={sendCode} disabled={busy} className="btn">
            {busy ? "Sending…" : "Email me a code"}
          </button>
        ) : (
          <>
            <button onClick={verify} disabled={busy} className="btn">
              {busy ? "Checking…" : "Sign in"}
            </button>
            <button
              onClick={() => { setSent(false); setCode(""); setError(""); }}
              className="w-full py-2 font-semibold text-stamp underline underline-offset-4"
            >
              Change email or send a new code
            </button>
          </>
        )}
      </div>
    </main>
  );
}
