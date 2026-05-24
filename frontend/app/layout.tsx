import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SKY MARSHAL | DYSPOZYTORNIA DRONÓW SŁUŻB",
  description: "System koordynacji floty dronów Policji, PSP, OSP i Zarządzania Kryzysowego w Stalowej Woli — dual-use cywilno-militarny.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" style={{ background: "#050505", color: "#f5f5f5" }}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&family=Share+Tech+Mono&family=JetBrains+Mono:wght@405;500;700&display=swap" rel="stylesheet" />

        {/* CesiumJS CDN Assets */}
        <link href="https://cesium.com/downloads/cesiumjs/releases/1.118/Build/Cesium/Widgets/widgets.css" rel="stylesheet" />
        <script src="https://cesium.com/downloads/cesiumjs/releases/1.118/Build/Cesium/Cesium.js"></script>
      </head>
      <body className="h-full w-full flex flex-col font-mono text-[11px] overflow-hidden" style={{ background: "#050505", color: "#f5f5f5" }}>
        {children}
      </body>
    </html>
  );
}
