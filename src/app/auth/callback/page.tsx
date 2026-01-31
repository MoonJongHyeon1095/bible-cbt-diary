"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const parseCallbackUrl = (url: string) => {
  const u = new URL(url);
  const code = u.searchParams.get("code");
  const hashParams = new URLSearchParams(u.hash.replace(/^#/, ""));
  const accessToken = hashParams.get("access_token");
  const refreshToken = hashParams.get("refresh_token");
  return { code, accessToken, refreshToken };
};

export default function AuthCallbackPage() {
  const router = useRouter();
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [message, setMessage] = useState("로그인 처리 중...");

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        const { code, accessToken, refreshToken } = parseCallbackUrl(
          window.location.href,
        );

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            throw error;
          }
        } else if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error) {
            throw error;
          }
        }
      } catch (error) {
        console.log("[oauth] web callback error:", error);
        if (!cancelled) {
          setMessage("로그인에 실패했습니다. 다시 시도해주세요.");
          return;
        }
      }

      if (!cancelled) {
        router.replace("/today");
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [router, supabase]);

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "16px",
      }}
    >
      {message}
    </main>
  );
}
