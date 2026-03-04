import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { BottomNav } from "@/components/ui/BottomNav";
import { Header } from "@/components/ui/Header";
import { ToastProvider } from "@/components/ToastProvider";
import { DebugPanel } from "@/components/ui/DebugPanel";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Armina - The Future of Arisan",
  description: "Platform arisan on-chain terdesentralisasi untuk komunitas Indonesia",
  keywords: ["arisan", "blockchain", "defi", "indonesia", "base", "miniapp"],
  authors: [{ name: "Armina Team" }],
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#1e2a4a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased bg-[#1e2a4a]`}>
        <Providers>
          <ToastProvider />
          <DebugPanel />
          <div className="min-h-screen">
            <Header />
            <main className="w-full mx-auto pb-20 pt-4 px-4 md:px-8">{children}</main>
            <BottomNav />
          </div>
        </Providers>
      </body>
    </html>
  );
}
