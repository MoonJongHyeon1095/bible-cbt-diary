"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { CbtToastProvider } from "@/components/cbt/common/CbtToast";
import { AuthModalProvider } from "@/components/header/AuthModalProvider";
import NoticeGate from "@/components/gate/NoticeGate";
import UpdateNoticeGate from "@/components/gate/UpdateNoticeGate";
import { GateProvider } from "@/components/gate/GateProvider";
import { Capacitor } from "@capacitor/core";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import AppUpdateGate from "@/components/gate/AppUpdateGate";
import { useTokenUsageSync } from "@/lib/hooks/useTokenUsageSync";

type ProvidersProps = {
  children: ReactNode;
};

export default function Providers({ children }: ProvidersProps) {
  useTokenUsageSync();

  useEffect(() => {
    // Native 앱에서만 backButton/appUrlOpen 이벤트를 듣습니다.
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    // 등록된 native event listener를 정리하기 위한 콜백 목록입니다.
    const removeListeners: Array<() => void> = [];

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
          if (pathname === "/" || pathname === "/today") {
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
  );
}
