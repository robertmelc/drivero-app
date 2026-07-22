import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Drivero",
    short_name: "Drivero",
    description: "Předávací protokoly, STK, pojištění, servis a kniha jízd na jednom místě.",
    start_url: "/",
    display: "standalone",
    background_color: "#05070A",
    theme_color: "#34E37A",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
