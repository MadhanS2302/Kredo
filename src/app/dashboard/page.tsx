import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LogJobForm from "./log-job-form";
import JobList, { type JobRow } from "./job-list";
import LogoutButton from "./logout-button";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: worker } = await supabase
    .from("workers")
    .select("*")
    .eq("id", user.id)
    .single();
  if (!worker) redirect("/onboarding");

  const { data: jobs } = await supabase
    .from("jobs")
    .select(
      "id, customer_name, customer_phone, job_type, amount, job_date, status, confirm_token, rating, confidence"
    )
    .order("created_at", { ascending: false })
    .limit(50);

  const list = (jobs ?? []) as JobRow[];

  // Last 6 months for income statements
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - i);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
    return { value, label };
  });
  const confirmed = list.filter((j) => j.status === "confirmed");
  const income = confirmed.reduce((sum, j) => sum + j.amount, 0);

  return (
    <main className="mx-auto max-w-md p-6 space-y-6">
      <header className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold">Vanakkam, {worker.name}</h1>
          <p className="text-gray-500">
            {worker.trade} · {worker.area}
          </p>
        </div>
        <LogoutButton />
      </header>

      <section className="grid grid-cols-2 gap-3 text-center">
        <div className="border rounded p-3">
          <p className="text-2xl font-bold">{confirmed.length}</p>
          <p className="text-xs text-gray-500">Confirmed jobs</p>
        </div>
        <div className="border rounded p-3">
          <p className="text-2xl font-bold">₹{income.toLocaleString("en-IN")}</p>
          <p className="text-xs text-gray-500">Verified income</p>
        </div>
      </section>

      <Link
        href={`/w/${worker.public_slug}`}
        className="block text-center border rounded p-2 hover:bg-green-600/20"
      >
        View my public Kredo profile
      </Link>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Income statements</h2>
        <p className="text-xs text-gray-500">
          Download a verified PDF for a month. It carries a QR code anyone can scan to check it.
        </p>
        <div className="flex flex-wrap gap-2">
          {months.map((m) => (
            <a
              key={m.value}
              href={`/api/statement?month=${m.value}`}
              className="text-sm border rounded px-3 py-1 hover:bg-green-600/20"
            >
              {m.label}
            </a>
          ))}
        </div>
      </section>

      <LogJobForm />

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Your jobs</h2>
        <JobList jobs={list} workerName={worker.name} />
      </section>
    </main>
  );
}
