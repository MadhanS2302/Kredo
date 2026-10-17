import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import Qr from "./qr";

export default async function PublicProfile({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const admin = createAdminClient();

  const { data: worker } = await admin
    .from("workers")
    .select("id, name, trade, area, created_at")
    .eq("public_slug", slug)
    .single();

  if (!worker)
    return (
      <main className="mx-auto max-w-sm p-6">
        <h1 className="text-xl font-bold">Profile not found</h1>
      </main>
    );

  const { data: jobs } = await admin
    .from("jobs")
    .select("job_type, amount, job_date, rating, customer_phone")
    .eq("worker_id", worker.id)
    .eq("status", "confirmed")
    .order("job_date", { ascending: false });

  const confirmed = jobs ?? [];
  const income = confirmed.reduce((s, j) => s + j.amount, 0);
  const rated = confirmed.filter((j) => j.rating);
  const avg = rated.length
    ? rated.reduce((s, j) => s + (j.rating ?? 0), 0) / rated.length
    : 0;

  const perCustomer = new Map<string, number>();
  confirmed.forEach((j) =>
    perCustomer.set(j.customer_phone, (perCustomer.get(j.customer_phone) ?? 0) + 1)
  );
  const distinct = perCustomer.size;
  const repeat = [...perCustomer.values()].filter((n) => n >= 2).length;

  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const proto = host.startsWith("localhost") ? "http" : "https";
  const url = `${proto}://${host}/w/${slug}`;

  const stats = [
    { label: "Verified jobs", value: confirmed.length },
    { label: "Verified income", value: `₹${income.toLocaleString("en-IN")}` },
    { label: "Avg rating", value: avg ? `${avg.toFixed(1)} ★` : "-" },
    { label: "Distinct customers", value: distinct },
    { label: "Repeat customers", value: repeat },
  ];

  return (
    <main className="mx-auto max-w-md p-6 space-y-6">
      <header className="text-center space-y-1">
        <p className="text-sm text-green-500 font-medium">Kredo verified profile</p>
        <h1 className="text-3xl font-bold">{worker.name}</h1>
        <p className="text-gray-500 capitalize">
          {worker.trade} · {worker.area}
        </p>
        <p className="text-xs text-gray-500">
          Member since {new Date(worker.created_at).toLocaleDateString("en-IN")}
        </p>
      </header>

      <section className="grid grid-cols-2 gap-3 text-center">
        {stats.map((s) => (
          <div key={s.label} className="border rounded p-3">
            <p className="text-xl font-bold">{s.value}</p>
            <p className="text-xs text-gray-500">{s.label}</p>
          </div>
        ))}
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold">Recent verified work</h2>
        {confirmed.length === 0 && (
          <p className="text-sm text-gray-500">No verified jobs yet.</p>
        )}
        {confirmed.slice(0, 10).map((j, i) => (
          <div key={i} className="flex justify-between border rounded p-2 text-sm">
            <span className="capitalize">
              {j.job_type} <span className="text-gray-500">· {j.job_date}</span>
            </span>
            <span>
              ₹{j.amount.toLocaleString("en-IN")}
              {j.rating ? ` · ${j.rating}★` : ""}
            </span>
          </div>
        ))}
      </section>

      <div className="text-center space-y-2">
        <Qr url={url} />
        <p className="text-xs text-gray-500">Scan to open this profile</p>
      </div>

      <p className="text-xs text-gray-500 text-center">
        Each job is confirmed by the customer. Customer names and numbers are never shown.
      </p>
    </main>
  );
}
