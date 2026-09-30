import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "drive.google.com",
      },
    ],
  },
  async rewrites() {
    return [
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
        source: "/admin/settings/replies",
        destination: "/api/admin/settings/replies",
      },
      {
        source: "/admin/settings/reply",
        destination: "/api/admin/settings/reply",
      },
      {
        source: "/admin/settings/reply/delete",
        destination: "/api/admin/settings/reply/delete",
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
        source: "/papers/search",
        destination: "/api/papers/search",
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
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
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
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
        ],
      },
    ];
  },

};

export default nextConfig;
