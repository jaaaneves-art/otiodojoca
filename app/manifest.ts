import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "O Tio do Joca",
    short_name: "Tio do Joca",
    description:
      "A comunidade portuguesa para partilhar conhecimento, descobrir serviços e participar na vida da terra.",
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    lang: "pt-PT",
    orientation: "any",
    theme_color: "#4d3a28",
    background_color: "#f7f5f0",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
