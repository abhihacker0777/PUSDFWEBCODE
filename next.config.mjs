/** @type {import('next').NextConfig} */
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
].join("; ");

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  serverExternalPackages: ["nodemailer"],
  images: {
    formats: ["image/avif", "image/webp"],
  },
  rewrites() {
    return Promise.resolve([
      {
        source: "/papers",
        destination: "/api/papers",
      },
      {
        source: "/admin/papers",
        destination: "/api/admin/papers",
      },
      {
        source: "/paper-options",
        destination: "/api/paper-options",
      },
      {
        source: "/upload",
        destination: "/api/upload",
      },
      {
        source: "/delete",
        destination: "/api/delete",
      },
      {
        source: "/bulk-delete",
        destination: "/api/bulk-delete",
      },
      {
        source: "/bulk-edit",
        destination: "/api/bulk-edit",
      },
      {
        source: "/sync",
        destination: "/api/sync",
      },
      {
        source: "/logs",
        destination: "/api/logs",
      },
      {
        source: "/logs/clear",
        destination: "/api/logs",
      },
      {
        source: "/logs/delete",
        destination: "/api/logs/delete",
      },
      {
        source: "/admin/settings/blocked",
        destination: "/api/admin/settings/blocked",
      },
      {
        source: "/admin/settings/block",
        destination: "/api/admin/settings/block",
      },
      {
        source: "/admin/settings/unblock",
        destination: "/api/admin/settings/unblock",
      },
      {
        source: "/admin/queries",
        destination: "/api/admin/queries",
      },
      {
        source: "/admin/queries/insights",
        destination: "/api/admin/queries/insights",
      },
      {
        source: "/admin/users",
        destination: "/api/admin/users",
      },
      {
        source: "/assistant/config",
        destination: "/api/assistant/config",
      },
      {
        source: "/assistant/search",
        destination: "/api/assistant",
      },
      {
        source: "/assistant/feedback",
        destination: "/api/assistant/feedback",
      },
      {
        source: "/assistant/google/verify",
        destination: "/api/assistant/verify",
      },
      {
        source: "/csrf-token",
        destination: "/api/csrf-token",
      },
      {
        source: "/me",
        destination: "/api/auth/me",
      },
      {
        source: "/logout",
        destination: "/api/auth/logout",
      },
      {
        source: "/password-reset",
        destination: "/api/auth/reset",
      },
      {
        source: "/password-reset/confirm",
        destination: "/api/auth/reset/confirm",
      },
    ]);
  },
  headers() {
    return Promise.resolve([
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy-Report-Only",
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
    ]);
  },
};

export default nextConfig;
