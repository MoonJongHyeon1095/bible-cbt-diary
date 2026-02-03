import TermsGate from "@/components/common/TermsGate";
import AppUpdateGate from "@/components/AppUpdateGate";
import type { Metadata } from "next";
import { Noto_Sans_KR } from "next/font/google";
import Providers from "./Providers";
import "./globals.css";

const notoSansKr = Noto_Sans_KR({
  variable: "--font-noto-sans-kr",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  preload: false,
});

export const metadata: Metadata = {
  title: "에디(EDi)와의 감정일기",
  description: "오늘의 감정 기록을 차분하게 쌓아가는 일기",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={notoSansKr.variable}>
        <AppUpdateGate />
        <Providers>
          <TermsGate />
          {children}
        </Providers>
      </body>
    </html>
  );
}
