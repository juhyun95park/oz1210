import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Geist, Geist_Mono } from "next/font/google";

import Navbar from "@/components/Navbar";
import { SyncUserProvider } from "@/components/providers/sync-user-provider";
import { ToastProvider } from "@/components/providers/toast-provider";
import { WebVitals } from "@/components/web-vitals";
import { koreanLocalization } from "@/lib/clerk/localization";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap", // 폰트 로딩 중 텍스트 표시 (FOUT 방지)
  preload: true, // 폰트 preload 활성화
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap", // 폰트 로딩 중 텍스트 표시 (FOUT 방지)
  preload: false, // 모노 폰트는 선택적이므로 preload 비활성화
});

export const metadata: Metadata = {
  title: "My Trip - 한국 관광지 정보 서비스",
  description: "전국 관광지 정보를 검색하고 지도에서 확인하며 상세 정보를 조회할 수 있는 웹 서비스",
  keywords: ["관광지", "여행", "한국", "관광정보", "지도"],
  openGraph: {
    title: "My Trip - 한국 관광지 정보 서비스",
    description: "전국 관광지 정보를 검색하고 지도에서 확인하며 상세 정보를 조회할 수 있는 웹 서비스",
    type: "website",
    locale: "ko_KR",
  },
  twitter: {
    card: "summary_large_image",
    title: "My Trip - 한국 관광지 정보 서비스",
    description: "전국 관광지 정보를 검색하고 지도에서 확인하며 상세 정보를 조회할 수 있는 웹 서비스",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      localization={koreanLocalization}
      appearance={{
        // Tailwind CSS 4 호환성을 위한 설정
        cssLayerName: "clerk",
      }}
    >
      <html lang="ko">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <SyncUserProvider>
            <ToastProvider>
              <WebVitals />
              <Navbar />
              {children}
            </ToastProvider>
          </SyncUserProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
