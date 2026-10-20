"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Wordmark from "@/components/Wordmark";

const TRADES = [
  ["electrician", "Electrician"],
  ["plumber", "Plumber"],
  ["painter", "Painter"],
  ["carpenter", "Carpenter"],
];

export default function OnboardingPage() {
  const supabase = createClient();
  const router = useRouter();
  const [name, setName] = useState("");
  const [trade, setTrade] = useState("electrician");
  const [area, setArea] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    setError("");
    if (name.trim().length < 2) return setError("Enter your name.");
    if (area.trim().length < 2) return setError("Enter the area where you work.");
    setBusy(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return router.push("/login");

    const { error } = await supabase
      .from("workers")
      .upsert({ id: user.id, name: name.trim(), trade, area: area.trim() });
    setBusy(false);
    if (error) setError(error.message);
    else router.push("/dashboard");
  }

  return (
    <main className="mx-auto w-full max-w-md px-5 pt-6 pb-12">
      <Wordmark href="/dashboard" />
      <h1 className="font-display mt-12 text-4xl font-extrabold tracking-tight">
        Set up your profile
      </h1>
      <p className="mt-2 text-mute">Customers and lenders will see this on your Kredo profile.</p>

      <div className="mt-8 space-y-5">
        <div>
          <label htmlFor="name" className="label">Your name</label>
          <input id="name" className="field" value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        <fieldset>
          <legend className="label">Your trade</legend>
          <div className="grid grid-cols-2 gap-2">
            {TRADES.map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setTrade(value)}
                aria-pressed={trade === value}
                className={`min-h-12 rounded-[10px] border-[1.5px] px-3 font-semibold ${
                  trade === value
                    ? "border-stamp bg-stamp text-white"
                    : "border-line bg-sheet text-ink"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </fieldset>

        <div>
          <label htmlFor="area" className="label">Area you work in</label>
          <input
            id="area"
            className="field"
            placeholder="For example RS Puram"
            value={area}
            onChange={(e) => setArea(e.target.value)}
          />
        </div>

        {error && <p className="error" role="alert">{error}</p>}
        <button onClick={save} disabled={busy} className="btn">
          {busy ? "Saving…" : "Create my profile"}
        </button>
      </div>
    </main>
  );
}
