import type { Metadata } from "next";
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

export const metadata: Metadata = {
  title: "Lokaya - See It. Know It. Buy It.",
  description: "Social commerce + local commerce",
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
      <body suppressHydrationWarning className="min-h-full flex flex-col bg-gray-50">
        <StoreProvider>
          <CurrencyProvider>
            <FeedSoundProvider>
              <UploadProvider>
                <OfflineDetector />
                <main className="flex-1">{children}</main>
                <Toaster position="top-center" />
              </UploadProvider>
            </FeedSoundProvider>
          </CurrencyProvider>
        </StoreProvider>
      </body>
    </html>
  );
}
