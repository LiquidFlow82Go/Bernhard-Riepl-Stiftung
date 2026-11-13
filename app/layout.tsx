import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { CookieHinweis } from "@/components/layout/CookieHinweis";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { MotionRahmen } from "@/components/layout/MotionRahmen";
import "./globals.css";

// Schriften liegen im Projekt (SIL Open Font License) und werden selbst ausgeliefert – keine Verbindung zu Google.
const outfit = localFont({
  src: [
    { path: "./fonts/outfit-latin-200-normal.woff2", weight: "200" },
    { path: "./fonts/outfit-latin-400-normal.woff2", weight: "400" },
    { path: "./fonts/outfit-latin-500-normal.woff2", weight: "500" },
  ],
  variable: "--font-outfit",
  display: "swap",
});
const dmSans = localFont({
  src: [
    { path: "./fonts/dm-sans-latin-400-normal.woff2", weight: "400" },
    { path: "./fonts/dm-sans-latin-500-normal.woff2", weight: "500" },
  ],
  variable: "--font-dm-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: { default: "B.R. Stiftung", template: "%s · B.R. Stiftung" },
  description:
    "Die Bernhard Riepl Stiftung in Miesbach fördert kirchliche, kulturelle – insbesondere künstlerische – Zwecke, die Bildung und die Hilfe für notleidende Menschen.",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  openGraph: { title: "Bernhard Riepl Stiftung", locale: "de_DE", type: "website", images: ["/bilder/landhaus.jpg"] },
};

export const viewport: Viewport = { themeColor: "#fdfaf9" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" className={`${outfit.variable} ${dmSans.variable}`}>
      <body className="min-h-dvh flex flex-col">
        <a
          href="#inhalt"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-pill focus:bg-neutral-800 focus:px-5 focus:py-3 focus:text-neutral-100"
        >
          Zum Inhalt springen
        </a>
        <AuthProvider>
          <MotionRahmen>
            <Header />
            <main id="inhalt" tabIndex={-1} className="flex-1 focus:outline-none">
              {children}
            </main>
            <Footer />
            <CookieHinweis />
          </MotionRahmen>
        </AuthProvider>
      </body>
    </html>
  );
}
