import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AIMap - AI-Powered Mind Mapping",
    short_name: "AIMap",
    description: "Generate intelligent mind maps with AI",
    start_url: "/",
    display: "standalone",
    background_color: "#081a2f",
    theme_color: "#081a2f",
    icons: [
      {
        src: "/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  }
}
