import type { Metadata } from "next";
import { Inter, Baloo_Thambi_2 } from "next/font/google";
import localFont from "next/font/local";
import { Providers } from "@/components/providers";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
// Baloo Thambi 2 — rounded Tamil + Latin display family used across the UI.
const balooTamil = Baloo_Thambi_2({
  subsets: ["tamil", "latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-tamil",
  display: "swap",
});
// KFGQPC Uthmanic Hafs (v18) — the King Fahd Complex mushaf script used by
// quran.com for Uthmani Unicode text. Self-hosted from /public/fonts.
const uthmanicHafs = localFont({
  src: "../../public/fonts/uthmanic-hafs.woff2",
  variable: "--font-arabic",
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Sirat — A Clear Path to Knowledge",
    template: "%s | Sirat",
  },
  description:
    "Sirat — a clear path to knowledge, growth, and meaningful digital experiences.",
  openGraph: { type: "website", locale: "ta_IN", siteName: "Sirat" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ta" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${balooTamil.variable} ${uthmanicHafs.variable} font-sans`}
      >
        <Providers>
          <div className="flex min-h-screen flex-col">
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
