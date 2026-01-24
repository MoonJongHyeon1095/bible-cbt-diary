"use client";

import { useEffect, useMemo, useState } from "react";
import AppHeader from "@/components/header/AppHeader";
import RequireLoginPrompt from "@/components/common/RequireLoginPrompt";
import SessionHistorySection from "@/components/history/SessionHistorySection";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import styles from "../page.module.css";

export default function RecordsPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
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

  return (
    <div className={styles.page}>
      <AppHeader />
      <main className={styles.main}>
        <div className={styles.shell}>
          {isLoading ? null : isAuthenticated ? (
            <SessionHistorySection />
          ) : (
            <RequireLoginPrompt
              title="로그인이 필요합니다"
              subtitle="저장된 기록을 보려면 먼저 로그인해주세요."
            />
          )}
        </div>
      </main>
    </div>
  );
}
