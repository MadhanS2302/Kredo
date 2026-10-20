import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import Wordmark from "@/components/Wordmark";
import Stamp from "@/components/Stamp";
import ConfidenceDots from "@/components/ConfidenceDots";
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
      <main className="mx-auto w-full max-w-md px-5 pt-6">
        <Wordmark />
        <h1 className="font-display mt-12 text-3xl font-extrabold">Profile not found</h1>
        <p className="mt-2 text-mute">Check the link or scan the QR code again.</p>
      </main>
    );

  const { data: jobs } = await admin
    .from("jobs")
    .select("job_type, amount, job_date, rating, customer_email, customer_phone, confidence")
    .eq("worker_id", worker.id)
    .eq("status", "confirmed")
    .order("job_date", { ascending: false });

  const confirmed = jobs ?? [];
  const income = confirmed.reduce((s, j) => s + j.amount, 0);
  const rated = confirmed.filter((j) => j.rating);
  const avg = rated.length ? rated.reduce((s, j) => s + (j.rating ?? 0), 0) / rated.length : 0;

  const perCustomer = new Map<string, number>();
  confirmed.forEach((j) => {
    const key = (j.customer_email ?? j.customer_phone ?? "").toLowerCase();
    perCustomer.set(key, (perCustomer.get(key) ?? 0) + 1);
  });
  const distinct = perCustomer.size;
  const repeat = [...perCustomer.values()].filter((n) => n >= 2).length;

  const conf = { high: 0, medium: 0, low: 0 } as Record<string, number>;
  confirmed.forEach((j) => {
    if (j.confidence) conf[j.confidence] += 1;
  });
  const scored = conf.high + conf.medium + conf.low;

  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const proto = host.startsWith("localhost") ? "http" : "https";
  const url = `${proto}://${host}/w/${slug}`;

  const lines: [string, string][] = [
    ["Verified jobs", String(confirmed.length)],
    ["Verified income", `₹${income.toLocaleString("en-IN")}`],
    ["Average rating", avg ? `${avg.toFixed(1)} out of 5` : "No ratings yet"],
    ["Different customers", String(distinct)],
    ["Customers who came back", String(repeat)],
  ];

  return (
    <main className="mx-auto w-full max-w-md px-4 pb-14 pt-5">
      <Wordmark />

      <article className="sheet mt-5 p-6" style={{ ["--pad" as string]: "1.5rem" }}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="hint">Kredo work profile</p>
            <h1 className="font-display text-3xl font-extrabold leading-[1.1] tracking-tight">
              {worker.name}
            </h1>
            <p className="mt-1 text-mute capitalize">
              {worker.trade}, {worker.area}
            </p>
            <p className="hint">
              On Kredo since{" "}
              {new Date(worker.created_at).toLocaleDateString("en-IN", {
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
          <div className="-mr-2 shrink-0">
            <Stamp count={confirmed.length} size={96} press />
          </div>
        </div>

        <div className="mt-6 space-y-1.5">
          {lines.map(([k, v]) => (
            <div key={k} className="ledger">
              <span className="text-mute">{k}</span>
              <span className="dots" />
              <span className="font-display text-lg font-bold">{v}</span>
            </div>
          ))}
        </div>

        {scored > 0 && (
          <div className="mt-6">
            <p className="font-semibold">How sure are we about these jobs?</p>
            <div
              className="mt-2 flex h-3 overflow-hidden rounded-full"
              role="img"
              aria-label={`${conf.high} high, ${conf.medium} medium, ${conf.low} low confidence`}
            >
              <span style={{ width: `${(conf.high / scored) * 100}%`, background: "var(--ok)" }} />
              <span style={{ width: `${(conf.medium / scored) * 100}%`, background: "var(--warn)" }} />
              <span style={{ width: `${(conf.low / scored) * 100}%`, background: "var(--bad)" }} />
            </div>
            <p className="hint mt-1">
              {conf.high} high, {conf.medium} medium, {conf.low} low. Based on checks like repeat
              customers and unusual patterns, not only the confirmation.
            </p>
          </div>
        )}

        <div className="tear">
          <h2 className="font-display text-lg font-bold">Recent verified work</h2>
          {confirmed.length === 0 ? (
            <p className="mt-1 text-mute">No verified jobs yet.</p>
          ) : (
            <ul className="mt-2 divide-y divide-line">
              {confirmed.slice(0, 8).map((j, i) => (
                <li key={i} className="flex items-center justify-between gap-3 py-2">
                  <div className="min-w-0">
                    <p className="font-semibold capitalize truncate">{j.job_type}</p>
                    <p className="hint">{j.job_date}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <ConfidenceDots level={j.confidence} />
                    <span className="font-display font-bold">₹{j.amount.toLocaleString("en-IN")}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="tear flex items-center gap-4">
          <Qr url={url} />
          <p className="hint">
            Scan to open this profile. Customer names and contact details are never shown.
          </p>
        </div>
      </article>
    </main>
  );
}
