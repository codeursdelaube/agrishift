import type { MetadataRoute } from "next";
import { t } from "@/lib/i18n";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: t.app.name,
    short_name: t.app.shortName,
    description: t.app.description,
    start_url: "/accueil",
    display: "standalone",
    orientation: "portrait",
    lang: "fr",
    theme_color: "#2f7d32",
    background_color: "#fffdf7",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
