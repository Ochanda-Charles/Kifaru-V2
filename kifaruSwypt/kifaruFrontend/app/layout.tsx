import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import Providers from "./components/Providers";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  themeColor: "#7C3AED",
};

export const metadata: Metadata = {
  title: "Kifaru Beauty - Premium Beauty Products",
  description:
    "Discover premium beauty products at Kifaru Beauty. From skincare to makeup, fragrance to body care - enhance your natural radiance with our curated collection.",
  keywords:
    "beauty products, skincare, makeup, fragrance, body care, cosmetics, Kenya",
  authors: [{ name: "Kifaru Beauty" }],
  openGraph: {
    title: "Kifaru Beauty - Premium Beauty Products",
    description:
      "Discover premium beauty products at Kifaru Beauty. From skincare to makeup, enhance your natural radiance.",
    type: "website",
    images: ["/kifaru-og-image.jpg"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Kifaru Beauty - Premium Beauty Products",
    description: "Discover premium beauty products at Kifaru Beauty.",
    images: ["/kifaru-twitter-image.jpg"],
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
