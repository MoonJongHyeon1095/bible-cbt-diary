import TermsGate from "@/components/gate/TermsGate";
import "driver.js/dist/driver.css";
import type { Metadata } from "next";
import localFont from "next/font/local";
import Providers from "./Providers";
import "./globals.css";

const notoSansKr = localFont({
  variable: "--font-noto-sans-kr",
  src: [
    {
      path: "../../public/fonts/noto-sans-kr/NotoSansKR-Regular.woff2",
      weight: "400",
    },
    {
      path: "../../public/fonts/noto-sans-kr/NotoSansKR-Medium.woff2",
      weight: "500",
    },
    {
      path: "../../public/fonts/noto-sans-kr/NotoSansKR-SemiBold.woff2",
      weight: "600",
    },
    {
      path: "../../public/fonts/noto-sans-kr/NotoSansKR-Bold.woff2",
      weight: "700",
    },
  ],
  display: "swap",
});

const notoSerifKr = localFont({
  variable: "--font-noto-serif-kr",
  src: [
    {
      path: "../../public/fonts/noto-serif-kr/NotoSerifKR-Regular.woff2",
      weight: "400",
    },
    {
      path: "../../public/fonts/noto-serif-kr/NotoSerifKR-Medium.woff2",
      weight: "500",
    },
    {
      path: "../../public/fonts/noto-serif-kr/NotoSerifKR-SemiBold.woff2",
      weight: "600",
    },
    {
      path: "../../public/fonts/noto-serif-kr/NotoSerifKR-Bold.woff2",
      weight: "700",
    },
  ],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Flow : AI 일기 · 감정 그래프",
  description: "오늘의 감정 기록을 차분하게 쌓아가는 일기",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`${notoSansKr.variable} ${notoSerifKr.variable}`}>
        <Providers>
          <TermsGate />
          {children}
        </Providers>
      </body>
    </html>
  );
}
