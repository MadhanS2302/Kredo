import Link from "next/link";
import Wordmark from "@/components/Wordmark";
import Stamp from "@/components/Stamp";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-5xl px-5 pb-16 pt-6">
      <header className="flex items-center justify-between">
        <Wordmark />
        <Link href="/login" className="font-semibold text-stamp underline underline-offset-4">
          Sign in
        </Link>
      </header>

      <section className="mt-12 grid gap-12 md:mt-20 md:grid-cols-2 md:items-center">
        <div className="space-y-5">
          <h1 className="font-display text-5xl font-extrabold leading-[1.05] tracking-tight md:text-6xl">
            Your work, your proof.
          </h1>
          <p className="max-w-md text-lg text-mute">
            Log each job you finish. Your customer confirms it from an email link. Kredo turns
            the confirmed jobs into a profile and a monthly income statement that banks and
            landlords can check.
          </p>
          <div className="max-w-xs">
            <Link href="/login" className="btn">
              Sign in with your email
            </Link>
          </div>
        </div>

        <div className="sheet relative mx-auto w-full max-w-sm p-5 shadow-[0_1px_0_var(--line)]">
          <p className="hint">Job slip</p>
          <div className="ledger mt-2">
            <span className="font-display text-xl font-bold">Fan repair</span>
            <span className="dots" />
            <span className="font-display text-xl font-bold">₹800</span>
          </div>
          <p className="hint mt-1">Ramesh, RS Puram · 17 Oct</p>
          <div className="tear mt-6 flex items-center justify-between">
            <div>
              <p className="font-semibold text-ok">Confirmed by customer</p>
              <p className="hint">Rated 5 out of 5</p>
            </div>
            <Stamp count={1} size={96} press />
          </div>
        </div>
      </section>

      <section className="mt-20 grid gap-8 md:grid-cols-3">
        {[
          ["Log the job", "After the work, enter the customer’s email, the job and the amount. It takes under a minute."],
          ["Customer confirms", "They get an email with a link you cannot see, and rate the work. Only then does the job count."],
          ["Share your proof", "Show your profile with a QR code, or download an income statement that anyone can verify online."],
        ].map(([title, body], i) => (
          <div key={title} className="border-t-2 border-ink pt-4">
            <p className="font-display text-sm font-bold text-stamp">Step {i + 1}</p>
            <h2 className="font-display mt-1 text-xl font-bold">{title}</h2>
            <p className="mt-1 text-mute">{body}</p>
          </div>
        ))}
      </section>

      <p className="mt-16 max-w-xl text-sm text-mute">
        Customer names and contact details are never shown on your profile.
      </p>
    </main>
  );
}
