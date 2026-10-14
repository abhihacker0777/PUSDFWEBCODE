
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com https://accounts.google.com https://va.vercel-scripts.com",
  "style-src 'self' 'unsafe-inline' https://accounts.google.com https://fonts.googleapis.com",
  "img-src 'self' data: blob: https://*.googleusercontent.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "connect-src 'self' https://challenges.cloudflare.com https://accounts.google.com https://vitals.vercel-insights.com https://va.vercel-scripts.com",
  "frame-src https://challenges.cloudflare.com https://accounts.google.com",
  "frame-ancestors 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  "upgrade-insecure-requests",
].join("; ");

const rewriteEntries = [
  ["/papers", "/api/papers"],
  ["/admin/papers", "/api/admin/papers"],
  ["/paper-options", "/api/paper-options"],
  ["/upload", "/api/upload"],
  ["/delete", "/api/delete"],
  ["/bulk-delete", "/api/bulk-delete"],
  ["/bulk-edit", "/api/bulk-edit"],
  ["/sync", "/api/sync"],
  ["/logs", "/api/logs"],
  ["/logs/clear", "/api/logs"],
  ["/logs/delete", "/api/logs/delete"],
  ["/admin/settings/blocked", "/api/admin/settings/blocked"],
  ["/admin/settings/block", "/api/admin/settings/block"],
  ["/admin/settings/unblock", "/api/admin/settings/unblock"],
  ["/admin/queries", "/api/admin/queries"],
  ["/admin/queries/insights", "/api/admin/queries/insights"],
  ["/admin/users", "/api/admin/users"],
  ["/assistant/config", "/api/assistant/config"],
  ["/assistant/search", "/api/assistant"],
  ["/assistant/feedback", "/api/assistant/feedback"],
  ["/assistant/google/verify", "/api/assistant/verify"],
  ["/csrf-token", "/api/csrf-token"],
  ["/me", "/api/auth/me"],
  ["/logout", "/api/auth/logout"],
  ["/password-reset", "/api/auth/reset"],
  ["/password-reset/confirm", "/api/auth/reset/confirm"],
];

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  serverExternalPackages: ["nodemailer", "web-push"],
  images: {
    formats: ["image/avif", "image/webp"],
  },
  rewrites() {
    return Promise.resolve(
      rewriteEntries.map(([source, destination]) => ({ source, destination }))
    );
  },
  headers() {
    return Promise.resolve([
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: csp,
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-XSS-Protection",
            value: "0",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin-allow-popups",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains",
          },
        ],
      },
      {
        source: "/api/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'",
          },
        ],
      },
    ]);
  },
};

export default nextConfig;
