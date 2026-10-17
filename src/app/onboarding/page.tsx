"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function OnboardingPage() {
  const supabase = createClient();
  const router = useRouter();
  const [name, setName] = useState("");
  const [trade, setTrade] = useState("electrician");
  const [area, setArea] = useState("");
  const [error, setError] = useState("");

  async function save() {
    setError("");
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return router.push("/login");

    const { error } = await supabase
      .from("workers")
      .upsert({ id: user.id, name, phone: user.phone, trade, area });

    if (error) setError(error.message);
    else router.push("/dashboard");
  }

  return (
    <main className="mx-auto max-w-sm p-6 space-y-4">
      <h1 className="text-2xl font-bold">Set up your profile</h1>
      <input
        className="w-full border rounded p-2 bg-transparent"
        placeholder="Your name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <select
        className="w-full border rounded p-2 bg-transparent"
        value={trade}
        onChange={(e) => setTrade(e.target.value)}
      >
        <option value="electrician">Electrician</option>
        <option value="plumber">Plumber</option>
        <option value="painter">Painter</option>
        <option value="carpenter">Carpenter</option>
      </select>
      <input
        className="w-full border rounded p-2 bg-transparent"
        placeholder="Area (e.g. RS Puram)"
        value={area}
        onChange={(e) => setArea(e.target.value)}
      />
      <button onClick={save} className="w-full bg-green-600 hover:bg-green-700 text-white font-medium rounded p-2">
        Save
      </button>
      {error && <p className="text-red-600 text-sm">{error}</p>}
    </main>
  );
}
