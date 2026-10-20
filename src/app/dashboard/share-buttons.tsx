"use client";

import { useState, useTransition } from "react";
import { getJobLink } from "./actions";
import { whatsappUrl, type ShareInfo } from "@/lib/share";

// Pass `info` when the link is already known (right after saving a job),
// or `jobId` to fetch it on tap (jobs list).
export default function ShareButtons({ info, jobId }: { info?: ShareInfo; jobId?: string }) {
  const [note, setNote] = useState("");
  const [manual, setManual] = useState("");
  const [pending, start] = useTransition();

  async function resolve(): Promise<ShareInfo | null> {
    if (info) return info;
    const r = await getJobLink(jobId ?? "");
    if (r.error || !r.share) {
      setNote(r.error ?? "Could not get the link.");
      return null;
    }
    return r.share;
  }

  function copy() {
    setNote("");
    setManual("");
    start(async () => {
      const s = await resolve();
      if (!s) return;
      try {
        await navigator.clipboard.writeText(s.link);
        setNote("Link copied. Paste it in a message to the customer.");
      } catch {
        setManual(s.link);
        setNote("Could not copy automatically. Copy the link below.");
      }
    });
  }

  function whatsapp() {
    setNote("");
    setManual("");
    // Open the tab right away (inside the tap) so phone browsers do not block it.
    const tab = window.open("", "_blank");
    start(async () => {
      const s = await resolve();
      if (!s) {
        tab?.close();
        return;
      }
      const url = whatsappUrl(s.phone, s.message);
      if (tab) tab.location.href = url;
      else window.open(url, "_blank");
    });
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={whatsapp} disabled={pending} className="btn btn-small">
          Share on WhatsApp
        </button>
        <button type="button" onClick={copy} disabled={pending} className="btn btn-quiet btn-small">
          Copy link
        </button>
      </div>
      {manual && (
        <input readOnly value={manual} onFocus={(e) => e.currentTarget.select()} className="field" />
      )}
      {note && <p className="hint">{note}</p>}
    </div>
  );
}
