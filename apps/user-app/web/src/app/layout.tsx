import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, DM_Serif_Display } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
});

const dmSerif = DM_Serif_Display({
  variable: "--font-dm-serif",
  weight: "400",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#FFFFFF",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://lokaya.shop"),
  title: {
    default: "Lokaya - See It. Know It. Buy It. | Hyperlocal Social Commerce",
    template: "%s | Lokaya",
  },
  description: "Discover trending local products, verified neighborhood merchant stores, creator reels, and fast local deliveries on Lokaya.",
  keywords: [
    "hyperlocal commerce",
    "social shopping",
    "local delivery",
    "buy local products",
    "creator commerce",
    "stores nearby",
    "Lokaya shop",
    "neighborhood marketplace"
  ],
  authors: [{ name: "Lokaya Technologies Private Limited", url: "https://lokaya.shop" }],
  creator: "Lokaya Technologies Private Limited",
  publisher: "Lokaya Technologies Private Limited",
  manifest: "/site.webmanifest",
  alternates: {
    canonical: "https://lokaya.shop",
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://lokaya.shop",
    siteName: "Lokaya",
    title: "Lokaya - See It. Know It. Buy It. | Hyperlocal Social Commerce",
    description: "Discover trending local products, verified neighborhood merchant stores, creator reels, and fast local deliveries on Lokaya.",
    images: [
      {
        url: "/promo-ad.png",
        width: 1200,
        height: 630,
        alt: "Lokaya Hyperlocal Social Commerce Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@LokayaShop",
    creator: "@LokayaShop",
    title: "Lokaya - See It. Know It. Buy It.",
    description: "Discover trending local products, verified neighborhood stores, and fast deliveries.",
    images: ["/promo-ad.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/icon.png', type: 'image/png' },
      { url: '/favicon.ico' },
    ],
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
};

import { StoreProvider } from '../lib/StoreProvider';
import { UploadProvider } from '@/context/UploadContext';
import { CurrencyProvider } from '@/context/CurrencyContext';
import { FeedSoundProvider } from '@/context/FeedSoundContext';
import { Toaster } from '@/components/ui/sonner';
import { OfflineDetector } from '@/components/OfflineDetector';
import { NativeBridgeProvider } from '@/components/NativeBridgeProvider';

import Script from "next/script";

const orgAndWebSiteSchema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://lokaya.shop/#organization",
      "name": "Lokaya Technologies Private Limited",
      "alternateName": "Lokaya",
      "url": "https://lokaya.shop",
      "logo": {
        "@type": "ImageObject",
        "url": "https://lokaya.shop/logo.png",
        "caption": "Lokaya Logo"
      },
      "sameAs": [
        "https://twitter.com/LokayaShop",
        "https://www.instagram.com/lokaya.shop"
      ]
    },
    {
      "@type": "WebSite",
      "@id": "https://lokaya.shop/#website",
      "url": "https://lokaya.shop",
      "name": "Lokaya",
      "description": "Hyperlocal Social Commerce Platform - See It. Know It. Buy It.",
      "publisher": {
        "@id": "https://lokaya.shop/#organization"
      },
      "potentialAction": {
        "@type": "SearchAction",
        "target": {
          "@type": "EntryPoint",
          "urlTemplate": "https://lokaya.shop/search?q={search_term_string}"
        },
        "query-input": "required name=search_term_string"
      }
    }
  ]
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${jakarta.variable} ${dmSerif.variable} h-full antialiased`}
    >
      <head>
        <Script
          id="organization-schema"
          type="application/ld+json"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgAndWebSiteSchema) }}
        />
        <Script
          src="/180-core-sdk.js"
          strategy="afterInteractive"
        />
      </head>
      <body suppressHydrationWarning className="min-h-full flex flex-col bg-gray-50">
        <StoreProvider>
          <CurrencyProvider>
            <FeedSoundProvider>
              <UploadProvider>
                <NativeBridgeProvider>
                  <OfflineDetector />
                  <main className="flex-1">{children}</main>
                  <Toaster position="top-center" />
                </NativeBridgeProvider>
              </UploadProvider>
            </FeedSoundProvider>
          </CurrencyProvider>
        </StoreProvider>
      </body>
    </html>
  );
}
