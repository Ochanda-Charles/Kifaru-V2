"use client";

import { Inter } from "next/font/google";
import { CryptoProvider } from "swypt-checkout";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <CryptoProvider>
      <html lang="en">
        <head>
          <title>Kifaru Beauty - Premium Beauty Products</title>
          <meta
            name="description"
            content="Discover premium beauty products at Kifaru Beauty. From skincare to makeup, fragrance to body care - enhance your natural radiance with our curated collection."
          />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <meta name="keywords" content="beauty products, skincare, makeup, fragrance, body care, cosmetics, Kenya" />
          <meta name="author" content="Kifaru Beauty" />
          
          {/* Open Graph Meta Tags */}
          <meta property="og:title" content="Kifaru Beauty - Premium Beauty Products" />
          <meta property="og:description" content="Discover premium beauty products at Kifaru Beauty. From skincare to makeup, enhance your natural radiance." />
          <meta property="og:type" content="website" />
          <meta property="og:image" content="/kifaru-og-image.jpg" />
          
          {/* Twitter Card Meta Tags */}
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content="Kifaru Beauty - Premium Beauty Products" />
          <meta name="twitter:description" content="Discover premium beauty products at Kifaru Beauty." />
          <meta name="twitter:image" content="/kifaru-twitter-image.jpg" />
          
          {/* Favicon */}
          <link rel="icon" href="/favicon.ico" />
          <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
          <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
          <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
          
          {/* Theme Color */}
          <meta name="theme-color" content="#7C3AED" />
          <meta name="msapplication-TileColor" content="#7C3AED" />
        </head>
        <body className={inter.className}>
          {children}
        </body>
      </html>
    </CryptoProvider>
  );
}