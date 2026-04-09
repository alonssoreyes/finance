import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ServiceWorkerRegistrar } from "@/components/pwa/service-worker-registrar";

export const metadata: Metadata = {
  title: "Pennywise",
  description: "Control financiero personal para tarjetas, deuda, ahorro y decisiones futuras con enfoque fintech.",
  applicationName: "Pennywise",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Pennywise"
  }
};

export const viewport: Viewport = {
  themeColor: "#f4f8fc",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>
        <ServiceWorkerRegistrar />
        {children}
      </body>
    </html>
  );
}
