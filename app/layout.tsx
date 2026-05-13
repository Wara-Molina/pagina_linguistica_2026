import type { Metadata } from "next";

import {
  Cormorant_Garamond,
  Inter,
} from "next/font/google";

import { Analytics } from "@vercel/analytics/next";

import "./globals.css";

import { LanguageProvider } from "@/lib/language-context";

import { InstitucionProvider } from "@/context/InstitucionContext";

/*
 * FUENTES
 */

const cormorant =
  Cormorant_Garamond({
    subsets: ["latin"],

    weight: [
      "300",
      "400",
      "500",
      "600",
      "700",
    ],

    variable:
      "--font-serif",

    display: "swap",
  });

const inter = Inter({
  subsets: ["latin"],

  variable:
    "--font-sans",

  display: "swap",
});

/*
 * URL SEGURA
 */

const siteUrl =
  process.env
    .NEXT_PUBLIC_SITE_URL &&
  /^https?:\/\/.+/i.test(
    process.env
      .NEXT_PUBLIC_SITE_URL
  )
    ? process.env
        .NEXT_PUBLIC_SITE_URL
    : "http://localhost:3000";

/*
 * METADATA
 */

export const metadata: Metadata =
  {
    metadataBase:
      new URL(siteUrl),

    title: {
      default:
        "Licenciatura en Lingüística | Universidad",

      template:
        "%s | Lingüística UPEA",
    },

    description:
      "Explora el fascinante mundo del lenguaje. Programa académico de excelencia en Lingüística.",

    applicationName:
      "Lingüística UPEA",

    robots: {
      index: true,

      follow: true,
    },

    openGraph: {
      title:
        "Licenciatura en Lingüística",

      description:
        "Programa académico de excelencia en Lingüística.",

      type: "website",

      locale: "es_ES",

      siteName:
        "Lingüística UPEA",

      url: siteUrl,
    },

    twitter: {
      card:
        "summary_large_image",

      title:
        "Licenciatura en Lingüística",

      description:
        "Programa académico de excelencia en Lingüística.",
    },
  };

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({
  children,
}: Readonly<RootLayoutProps>) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={`
        ${cormorant.variable}
        ${inter.variable}
      `}
    >
      <body
        suppressHydrationWarning
        className="
          font-sans
          antialiased
          bg-background
          min-h-screen
          overflow-x-hidden
          text-foreground
        "
      >
        <LanguageProvider>
          <InstitucionProvider>
            {children}
          </InstitucionProvider>
        </LanguageProvider>

        {process.env.NODE_ENV ===
          "production" && (
          <Analytics />
        )}
      </body>
    </html>
  );
}