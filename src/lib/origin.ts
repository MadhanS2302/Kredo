import { headers } from "next/headers";

// Public address of the site, used to build links inside emails.
// Set NEXT_PUBLIC_SITE_URL in production (for example https://kredo-sigma.vercel.app).
export async function getOrigin(): Promise<string> {
  const fixed = process.env.NEXT_PUBLIC_SITE_URL;
  if (fixed) return fixed.replace(/\/$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}
