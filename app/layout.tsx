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

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),

  title: {
    default:
      "Lingüística e Idiomas | UPEA",

    template:
      "%s | Lingüística e Idiomas UPEA",
  },

  description:
    "Sitio oficial de la Carrera de Lingüística e Idiomas de la Universidad Pública de El Alto.",

  applicationName:
    "Lingüística e Idiomas UPEA",

  keywords: [
    "UPEA",
    "Lingüística",
    "Idiomas",
    "Lenguas",
    "Universidad Pública de El Alto",
    "Carrera UPEA",
    "Lenguaje",
    "Idiomas UPEA",
  ],

  authors: [
    {
      name:
        "Universidad Pública de El Alto",
    },
  ],

  creator:
    "Universidad Pública de El Alto",

  publisher:
    "Universidad Pública de El Alto",

  robots: {
    index: true,
    follow: true,
  },

  icons: {
    icon: [
      {
        url: "/logo_upea.png",

        type: "image/png",

        sizes: "32x32",
      },

      {
        url: "/logo_upea.png",

        type: "image/png",

        sizes: "192x192",
      },
    ],

    shortcut:
      "/logo_upea.png",

    apple:
      "/logo_upea.png",
  },

  openGraph: {
    title:
      "Lingüística e Idiomas | UPEA",

    description:
      "Sitio oficial de la Carrera de Lingüística e Idiomas de la Universidad Pública de El Alto.",

    type: "website",

    locale: "es_ES",

    siteName:
      "Lingüística e Idiomas UPEA",

    url: siteUrl,

    images: [
      {
        url: "/logo_upea.png",

        width: 1200,

        height: 630,

        alt:
          "Lingüística e Idiomas UPEA",
      },
    ],
  },

  twitter: {
    card:
      "summary_large_image",

    title:
      "Lingüística e Idiomas | UPEA",

    description:
      "Sitio oficial de la Carrera de Lingüística e Idiomas de la Universidad Pública de El Alto.",

    images: [
      "/logo_upea.png",
    ],
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