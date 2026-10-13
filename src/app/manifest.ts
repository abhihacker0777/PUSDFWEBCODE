import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Poornima University - Examination Question Papers",
    short_name: "PU - PYQP",
    description: "Official Previous Year Question Papers For Poornima University Students.",
    start_url: "/?source=pwa",
    id: "/?source=pwa",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#ffffff",
    theme_color: "#05488B",
    categories: ["education", "reference"],
    icons: [
      ...([72, 96, 128, 144, 152, 192, 384, 512] as const).map((s) => ({
        src: `/icons/icon-${s}x${s}.png`,
        sizes: `${s}x${s}`,
        type: "image/png",
        purpose: "any" as const,
      })),
      ...([192, 512] as const).map((s) => ({
        src: `/icons/maskable-icon-${s}x${s}.png`,
        sizes: `${s}x${s}`,
        type: "image/png",
        purpose: "maskable" as const,
      })),
    ],
    related_applications: [
      {
        platform: "webapp",
        url: "/manifest.webmanifest",
        id: "/?source=pwa",
      },
    ],
  };
}
