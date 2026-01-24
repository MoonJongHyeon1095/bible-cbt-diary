"use client";

import AppHeader from "@/components/header/AppHeader";
import EmotionCalendarSection from "@/components/calendar/EmotionCalendarSection";
import RequireLoginPrompt from "@/components/common/RequireLoginPrompt";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useEffect, useMemo, useState } from "react";
import styles from "../page.module.css";

export default function EmotionCalendarPage() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);

  useEffect(() => {
    const loadUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUserEmail(data.user?.email ?? null);
    };
    loadUser();
  }, [supabase]);

  return (
    <div className={styles.page}>
      <AppHeader />
      <main className={styles.main}>
        <div className={styles.shell}>
          {userEmail ? <EmotionCalendarSection /> : <RequireLoginPrompt />}
        </div>
      </main>
    </div>
  );
}
