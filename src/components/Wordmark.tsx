import Link from "next/link";

export default function Wordmark({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="inline-flex items-center gap-2" aria-label="Kredo home">
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
        <circle cx="14" cy="14" r="12" stroke="var(--stamp)" strokeWidth="2.5" />
        <path d="M8.5 14.5l3.8 3.8 7.2-8" stroke="var(--stamp)" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="font-display text-2xl font-bold tracking-tight">Kredo</span>
    </Link>
  );
}
