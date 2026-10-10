import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Poornima University Examination Question Papers",
    short_name: "PU PYQP",
    description: "Official previous year question papers archive and examination resources for Poornima University students.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#05488B",
    icons: [
      {
        src: "/pulogo.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/pulogo.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
