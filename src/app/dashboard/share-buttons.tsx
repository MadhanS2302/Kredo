"use client";

import { useState } from "react";
import { whatsappAppUrl, whatsappWebUrl, type ShareInfo } from "@/lib/share";

export default function ShareButtons({ info }: { info: ShareInfo }) {
  const [note, setNote] = useState("");
  const [manual, setManual] = useState("");

  // On phones the link itself launches the WhatsApp app (no web page, no new tab).
  // On a computer we open WhatsApp Web in a new tab instead.
  function onWhatsApp(e: React.MouseEvent<HTMLAnchorElement>) {
    const phone = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (!phone) {
      e.preventDefault();
      window.open(whatsappWebUrl(info.phone, info.message), "_blank");
    }
  }

  async function copy() {
    setManual("");
    try {
      await navigator.clipboard.writeText(info.link);
      setNote("Link copied. Paste it in a message to the customer.");
    } catch {
      setManual(info.link);
      setNote("Could not copy automatically. Copy the link below.");
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <a
          href={whatsappAppUrl(info.phone, info.message)}
          onClick={onWhatsApp}
          className="btn btn-small"
        >
          Share on WhatsApp
        </a>
        <button type="button" onClick={copy} className="btn btn-quiet btn-small">
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
