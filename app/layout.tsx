import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ServiceWorkerRegistrar } from "@/components/pwa/service-worker-registrar";

export const metadata: Metadata = {
  title: "Gastos App",
  description: "Finanzas personales premium para deuda, tarjetas, MSI, ahorro y proyección de flujo.",
  applicationName: "Gastos App",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Gastos App"
  }
};

export const viewport: Viewport = {
  themeColor: "#f5f2ea",
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
