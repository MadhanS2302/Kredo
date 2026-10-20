"use client";

import { QRCodeSVG } from "qrcode.react";

export default function Qr({ url }: { url: string }) {
  return (
    <div className="inline-block rounded bg-white p-2 border border-line">
      <QRCodeSVG value={url} size={132} fgColor="#14161f" />
    </div>
  );
}
