import type { Metadata, Viewport } from "next";
import { Bebas_Neue, Sora, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { NavBar } from "@/components/NavBar";

// Marquee display + refined body + mono for seat labels/prices.
const bebas = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
});
const sora = Sora({
  subsets: ["latin"],
  variable: "--font-body",
});
const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "CINETIX — Bioskop",
  description: "Pesan tiket bioskop, pilih kursi, lihat POV 3D",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "CINETIX",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0c",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="id"
      className={`${bebas.variable} ${sora.variable} ${mono.variable}`}
    >
      <body className="min-h-screen font-body grain">
        <div className="spotlight" aria-hidden />
        <NavBar />
        <main className="relative z-10 mx-auto max-w-6xl px-5 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
