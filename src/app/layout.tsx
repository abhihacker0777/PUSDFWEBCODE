import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Poornima University — Previous Year Question Papers (PYQP)",
  description: "Official examination question paper archive and student academic resource repository of Poornima University Central Library.",
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
other: {
    "strix-verification": "strix-verify-c5bf055c79722c52af8ff596b9a060aa",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/logo.png" type="image/png" sizes="any" />
        <link rel="apple-touch-icon" href="/logo.png" />
        <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
      </head>
      <body className="antialiased min-h-screen flex flex-col bg-slate-50 text-slate-900">
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
