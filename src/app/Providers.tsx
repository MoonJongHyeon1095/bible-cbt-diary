"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { CbtToastProvider } from "@/components/cbt/common/CbtToast";
import { AuthModalProvider } from "@/components/header/AuthModalProvider";
import Notice from "@/components/Notice";
import { Capacitor } from "@capacitor/core";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type ProvidersProps = {
  children: ReactNode;
};

export default function Providers({ children }: ProvidersProps) {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    let removeListener: (() => void) | null = null;

    const register = async () => {
      try {
        const mod = await import("@capacitor/app");
        const CapApp = mod.App;
        const supabase = getSupabaseBrowserClient();
        const browserMod = await import("@capacitor/browser");
        const CapBrowser = browserMod.Browser;

        const listener = await CapApp.addListener("appUrlOpen", async ({ url }) => {
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

        removeListener = () => listener.remove();
      } catch (error) {
        console.log("[oauth] failed to load @capacitor/app:", error);
      }
    };

    register();

    return () => {
      if (removeListener) {
        removeListener();
      }
    };
  }, []);

  return (
    <CbtToastProvider>
      <AuthModalProvider>
        <Notice />
        {children}
      </AuthModalProvider>
    </CbtToastProvider>
  );
}
