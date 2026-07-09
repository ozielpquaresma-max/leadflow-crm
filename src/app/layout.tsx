import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://reycart.com.br"),
  title: {
    default: "ReyCart",
    template: "%s | ReyCart",
  },
  description:
    "Plataforma para recuperação de vendas, PIX pendente, checkout abandonado e pagamentos não finalizados.",
  applicationName: "ReyCart",
  icons: {
    icon: [
      {
        url: "/favicon.ico",
      },
      {
        url: "/icon.png",
        type: "image/png",
        sizes: "512x512",
      },
    ],
    apple: [
      {
        url: "/apple-icon.png",
        type: "image/png",
        sizes: "180x180",
      },
    ],
  },
  openGraph: {
    title: "ReyCart",
    description:
      "Recupere vendas que ficaram paradas no checkout, PIX pendente ou cartão recusado.",
    url: "https://reycart.com.br",
    siteName: "ReyCart",
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "ReyCart - Recuperação inteligente de vendas",
      },
    ],
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ReyCart",
    description:
      "Recupere vendas que ficaram paradas no checkout, PIX pendente ou cartão recusado.",
    images: ["/opengraph-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}