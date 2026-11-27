import type { Metadata, Viewport } from "next";
import { Inter, Noto_Nastaliq_Urdu } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { LanguageProvider } from "@/components/common/LanguageProvider";
import "./globals.css";

// Fonts are downloaded at build time and self-hosted, so runtime stays offline-safe.
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const urdu = Noto_Nastaliq_Urdu({
  subsets: ["arabic"],
  weight: ["400", "700"],
  variable: "--font-urdu",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Awaaz",
  description:
    "Civic hazard reporting for Islamabad — speak in Urdu, get it triaged, see it fixed.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#070b12",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`dark ${inter.variable} ${urdu.variable}`}>
      <body className="min-h-dvh font-sans">
        <LanguageProvider>
          {/* Mobile-first container, centered on desktop */}
          <div className="relative mx-auto flex min-h-dvh max-w-md flex-col border-x border-civic-border/60 bg-civic-surface shadow-2xl shadow-black/50">
            {children}
          </div>
          <Toaster />
        </LanguageProvider>
      </body>
    </html>
  );
}
