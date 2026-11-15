import type { Metadata } from "next";
import { Playfair_Display, Be_Vietnam_Pro } from "next/font/google";
import "./globals.css";

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
  title: {
    default: "Anniversary Flower Shop — Hoa kỷ niệm & hoa tình yêu",
    template: "%s | Anniversary Flower Shop",
  },
  description:
    "Cửa hàng hoa chuyên hoa sinh nhật, hoa kỷ niệm, hoa tình yêu và hoa sự kiện. Liên hệ để được tư vấn và đặt hoa.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={`${display.variable} ${body.variable}`}>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
