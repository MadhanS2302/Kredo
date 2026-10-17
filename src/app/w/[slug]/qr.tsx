"use client";

import { QRCodeSVG } from "qrcode.react";

export default function Qr({ url }: { url: string }) {
  return (
    <div className="bg-white p-3 rounded inline-block">
      <QRCodeSVG value={url} size={140} />
    </div>
  );
}
