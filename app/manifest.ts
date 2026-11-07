import type { MetadataRoute } from "next";

// Web app manifest so iOS and Android can install the site as a standalone
// web app (no browser bars) from "Add to Home Screen" (owner decision 2026-11-07).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Hybrid Training Tracker",
    short_name: "Training",
    description: "Personal athletic training tracker",
    start_url: "/",
    display: "standalone",
    background_color: "#0a0a0a",
    theme_color: "#0a0a0a",
    icons: [{ src: "/icon", sizes: "512x512", type: "image/png" }],
  };
}
