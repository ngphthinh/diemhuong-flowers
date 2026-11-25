import type { Metadata } from "next";
import { Playfair_Display, Be_Vietnam_Pro } from "next/font/google";
import "./globals.css";
import { getSiteUrl } from "@/lib/site";

// Cả hai font đều hỗ trợ tiếng Việt (subset "vietnamese")
const display = Playfair_Display({
  subsets: ["latin", "vietnamese"],
  variable: "--font-display",
  display: "swap",
});
const body = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  alternates: { canonical: "./" },
  verification: {
    // Dán mã trong thẻ <meta name="google-site-verification" content="..."> do Google Search Console cấp
    google: process.env.GOOGLE_SITE_VERIFICATION,
  },
  title: {
    default: "Diễm Hương Flowers — Hoa kỷ niệm & hoa tình yêu",
    template: "%s | Diễm Hương Flowers",
  },
  description:
    "Cửa hàng hoa chuyên hoa sinh nhật, hoa kỷ niệm, hoa tình yêu và hoa sự kiện. Liên hệ để được tư vấn và đặt hoa.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className={`${display.variable} ${body.variable}`}>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
