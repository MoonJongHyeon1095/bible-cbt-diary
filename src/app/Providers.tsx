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

type ProvidersProps = {
  children: ReactNode;
};

export default function Providers({ children }: ProvidersProps) {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    const removeListeners: Array<() => void> = [];

    const register = async () => {
      try {
        const mod = await import("@capacitor/app");
        const CapApp = mod.App;
        const supabase = getSupabaseBrowserClient();
        const browserMod = await import("@capacitor/browser");
        const CapBrowser = browserMod.Browser;

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

        const backButtonListener = await CapApp.addListener("backButton", () => {
          if (window.history.length > 1) {
            window.history.back();
            return;
          }

          CapApp.exitApp();
        });

        removeListeners.push(() => backButtonListener.remove());
      } catch (error) {
        console.log("[oauth] failed to load @capacitor/app:", error);
      }
    };

    register();

    return () => {
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
