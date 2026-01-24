"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

function CallbackHandler() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const run = async () => {
      const code = searchParams.get("code");
      const redirect = searchParams.get("redirect");
      const supabase = createSupabaseBrowserClient();

      if (code) {
        await supabase.auth.exchangeCodeForSession(code);
      }

      if (redirect && redirect.startsWith("myapp://")) {
        window.location.href = redirect;
        return;
      }

      window.location.replace("/");
    };

    run();
  }, [searchParams]);

  return null;
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div style={{ padding: "32px", color: "var(--muted)" }}>
          로그인 처리 중입니다...
        </div>
      }
    >
      <CallbackHandler />
    </Suspense>
  );
}
