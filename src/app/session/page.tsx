"use client";

import { useEffect, useMemo, useState } from "react";
import SessionPage from "@/components/cbt/SessionPage";
import RequireLoginPrompt from "@/components/common/RequireLoginPrompt";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export default function SessionRoutePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);

  useEffect(() => {
    const loadSession = async () => {
      const { data } = await supabase.auth.getSession();
      setIsAuthenticated(Boolean(data.session));
      setIsLoading(false);
    };
    loadSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setIsAuthenticated(Boolean(session));
      },
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [supabase]);

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated) {
    return (
      <RequireLoginPrompt
        title="로그인이 필요합니다"
        subtitle="세션을 시작하려면 먼저 로그인해주세요."
      />
    );
  }

  return <SessionPage />;
}
