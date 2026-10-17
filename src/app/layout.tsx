import type { Metadata } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import "./globals.css";

const beVietnam = Be_Vietnam_Pro({
  variable: "--font-be-vietnam",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "MEN / DAILY — Chăm sóc nam mỗi ngày",
    template: "%s | MEN / DAILY",
  },
  description:
    "Cửa hàng chăm sóc nam: dầu gội, sữa rửa mặt, khử mùi, chống nắng và chăm sóc râu. Khám phá thương hiệu và đặt hàng dễ dàng.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="vi" className={`${beVietnam.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">{children}</body>
    </html>
  );
}
