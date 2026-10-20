import type { Metadata, Viewport } from "next";
import "@fontsource-variable/bricolage-grotesque";
import "@fontsource/hind-madurai/400.css";
import "@fontsource/hind-madurai/500.css";
import "@fontsource/hind-madurai/600.css";
import "@fontsource/hind-madurai/700.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kredo",
  description: "Your work, your proof.",
};

export const viewport: Viewport = {
  themeColor: "#1b2ba8",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
