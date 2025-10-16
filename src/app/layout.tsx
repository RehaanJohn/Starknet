import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ChipiProvider, ChipiClientProvider } from "@chipi-stack/nextjs";
import { ClerkProvider } from '@clerk/nextjs';
import SessionOverlay from '@/components/SessionOverlay';
import Header from '@/components/Header';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Nimbus - Smart Financial Management",
  description: "Manage your budget, savings, and investments easily, securely, and effectively with Braavos & Chipi Pay integration",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-900`}
        >
          <ChipiClientProvider apiPublicKey={process.env.NEXT_PUBLIC_CHIPI_API_KEY!} environment={(process.env.NEXT_PUBLIC_CHIPI_ENV as 'development' | 'production') || 'production'}>
            <Header />
            {children}
            <SessionOverlay />
          </ChipiClientProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
