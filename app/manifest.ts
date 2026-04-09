import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Pennywise",
    short_name: "Pennywise",
    description: "Control financiero personal para deuda, tarjetas, MSI, metas y flujo proyectado.",
    start_url: "/",
    display: "standalone",
    background_color: "#f4f8fc",
    theme_color: "#f4f8fc",
    orientation: "portrait",
    lang: "es-MX",
    icons: [
      {
        src: "/icon?size=192",
        sizes: "192x192",
        type: "image/png"
      },
      {
        src: "/icon?size=512",
        sizes: "512x512",
        type: "image/png"
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png"
      }
    ]
  };
}
