import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-jakarta",
});

const baseUrl = (
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.BASE_URL || ""
).replace(/\/+$/, "");

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "Poornima University — Previous Year Question Papers (PYQP)",
    template: "%s | Poornima University PYQP",
  },
  description:
    "Official examination question paper archive and student academic resource repository of Poornima University Central Library.",
  keywords: [
    "Poornima University",
    "PYQP",
    "Previous Year Question Papers",
    "Semester Exams",
    "Mid Term Examinations",
    "End Term Examinations",
    "Central Library",
    "B.Tech",
    "BCA",
    "MCA",
    "MBA",
  ],
  authors: [{ name: "Poornima University Central Library" }],
  creator: "Poornima University Central Library",
  publisher: "Poornima University",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: baseUrl,
    siteName: "Poornima University PYQP Repository",
    title: "Poornima University — Previous Year Question Papers (PYQP)",
    description:
      "Official examination question paper archive and student academic resource repository of Poornima University Central Library.",
    images: [
      {
        url: `${baseUrl}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: "Poornima University — Previous Year Question Papers (PYQP)",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Poornima University — Previous Year Question Papers (PYQP)",
    description:
      "Official examination question paper archive and student academic resource repository of Poornima University Central Library.",
    images: [`${baseUrl}/og-image.jpg`],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "PU PYQP",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
  other: {
    "strix-verification": "strix-verify-c5bf055c79722c52af8ff596b9a060aa",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "EducationalOrganization",
      "@id": `${baseUrl}/#organization`,
      name: "Poornima University",
      url: baseUrl,
      logo: `${baseUrl}/logo.png`,
      sameAs: ["https://poornima.edu.in"],
      description: "Poornima University Central Library PYQP Archive",
    },
    {
      "@type": "WebSite",
      "@id": `${baseUrl}/#website`,
      url: baseUrl,
      name: "Poornima University PYQP Archive",
      description:
        "Official digital question paper repository and academic archives for Poornima University students and faculty.",
      publisher: {
        "@id": `${baseUrl}/#organization`,
      },
      inLanguage: "en-IN",
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={jakarta.variable}>
      <head>
        <link rel="icon" href="/logo.png" type="image/png" />
        <link rel="shortcut icon" href="/logo.png" type="image/png" />
        <link rel="apple-touch-icon" href="/logo.png" />
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="theme-color" content="#05488B" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof window !== 'undefined') {
                if ('serviceWorker' in navigator) {
                  navigator.serviceWorker.getRegistrations().then(function(regs) {
                    for (var i = 0; i < regs.length; i++) { regs[i].unregister(); }
                  });
                }
                if ('caches' in window) {
                  caches.keys().then(function(names) {
                    for (var i = 0; i < names.length; i++) { caches.delete(names[i]); }
                  });
                }
              }
            `,
          }}
        />
      </head>
      <body className={`${jakarta.className} antialiased min-h-screen flex flex-col bg-slate-50 text-slate-900`}>
        {children}
        <Script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js"
          strategy="afterInteractive"
        />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
