"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { CbtToastProvider } from "@/components/session/common/CbtToast";
import { AuthModalProvider } from "@/components/header/AuthModalProvider";
import NoticeGate from "@/components/gate/NoticeGate";
import UpdateNoticeGate from "@/components/gate/UpdateNoticeGate";
import { GateProvider } from "@/components/gate/GateProvider";
import { Capacitor } from "@capacitor/core";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import AppUpdateGate from "@/components/gate/AppUpdateGate";
import { useTokenUsageSync } from "@/lib/hooks/useTokenUsageSync";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

type ProvidersProps = {
  children: ReactNode;
};

export default function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            gcTime: 10 * 60_000,
            refetchOnWindowFocus: false,
            refetchOnReconnect: true,
            retry: 1,
          },
          mutations: {
            retry: 0,
          },
        },
      }),
  );

  const TokenUsageSync = () => {
    useTokenUsageSync();
    return null;
  };

  useEffect(() => {
    // Native 앱에서만 backButton/appUrlOpen 이벤트를 듣습니다.
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    // 등록된 native event listener를 정리하기 위한 콜백 목록입니다.
    const removeListeners: Array<() => void> = [];

    /**
     * 이 블록이 맡는 역할 요약
     *
     * 1) OAuth 완료 후 시스템 브라우저 탭 닫기
     * - 앱에서 Google 로그인을 시스템 브라우저로 열면,
     *   딥링크로 앱 복귀 후에도 브라우저 탭이 남아있을 수 있습니다.
     * - appUrlOpen에서 세션 교환 후 Browser.close()로 탭을 닫습니다.
     *
     * 2) 시스템 브라우저 강제 사용 (WebView 차단 회피)
     * - WebView로 OAuth를 열면 Google이 disallowed_useragent로 막는 경우가 있음.
     * - @capacitor/browser가 iOS는 ASWebAuthenticationSession,
     *   Android는 Chrome Custom Tabs를 사용하도록 보장합니다.
     *
     * 3) 외부 앱 인앱 브라우저 유입 대응
     * - Threads/카톡/인스타 인앱 브라우저에서 링크 클릭 시
     *   Universal/App Links로 앱으로 바로 유도해 실패를 줄입니다.
     *
     * 4) 도메인-앱 연결 증명 파일
     * - Universal/App Links가 동작하려면 도메인에
     *   apple-app-site-association / assetlinks.json이 필요합니다.
     */

    // Capacitor App/Broswer 모듈을 동적 로딩한 뒤 이벤트 핸들러를 등록합니다.
    const register = async () => {
      try {
        const mod = await import("@capacitor/app");
        const CapApp = mod.App;
        const supabase = getSupabaseBrowserClient();
        const browserMod = await import("@capacitor/browser");
        const CapBrowser = browserMod.Browser;

        // OAuth 콜백 딥링크 처리: 세션 교환 후 인앱 브라우저를 닫습니다.
        const appUrlListener = await CapApp.addListener(
          "appUrlOpen",
          async ({ url }) => {
          if (!url.startsWith("com.alliance617.emotionaldiary://auth-callback")) {
            return;
          }

          try {
            const u = new URL(url);
            const code = u.searchParams.get("code");
            const hashParams = new URLSearchParams(u.hash.replace(/^#/, ""));
            const accessToken = hashParams.get("access_token");
            const refreshToken = hashParams.get("refresh_token");

            if (code) {
              await supabase.auth.exchangeCodeForSession(code);
              await CapBrowser.close();
              return;
            }

            if (accessToken && refreshToken) {
              await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken,
              });
              await CapBrowser.close();
            }
          } catch (error) {
            console.log("[oauth] callback parse error:", error);
          }
        });

        removeListeners.push(() => appUrlListener.remove());

        // Android 하드웨어 뒤로가기 처리: 히스토리가 있으면 뒤로, 없으면 앱 종료.
        const backButtonListener = await CapApp.addListener("backButton", () => {
          const pathname = window.location.pathname;
          if (pathname === "/" || pathname === "/home" || pathname === "/list") {
            CapApp.exitApp();
            return;
          }

          if (window.history.length > 1) {
            window.history.back();
            return;
          }

          CapApp.exitApp();
        });

        removeListeners.push(() => backButtonListener.remove());
      } catch (error) {
        // Capacitor 모듈 로딩 실패 시 로깅만 하고 앱을 계속 구동합니다.
        console.log("[oauth] failed to load @capacitor/app:", error);
      }
    };

    register();

    return () => {
      // 등록한 모든 native event listener를 해제합니다.
      removeListeners.forEach((remove) => {
        remove();
      });
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TokenUsageSync />
      <CbtToastProvider>
        <GateProvider>
          <AuthModalProvider>
            <AppUpdateGate />
            <UpdateNoticeGate />
            <NoticeGate />
            {children}
          </AuthModalProvider>
        </GateProvider>
      </CbtToastProvider>
    </QueryClientProvider>
  );
}
