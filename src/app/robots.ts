import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const rawBaseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.BASE_URL || "";
  const baseUrl = rawBaseUrl.endsWith("/") ? rawBaseUrl.slice(0, -1) : rawBaseUrl;
  const effectiveBaseUrl = baseUrl || "https://pyqp.poornima.edu.in";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/api/"],
      },
    ],
    sitemap: `${effectiveBaseUrl}/sitemap.xml`,
  };
}
