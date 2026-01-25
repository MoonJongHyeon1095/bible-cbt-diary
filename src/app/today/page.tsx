"use client";

import RequireLoginPrompt from "@/components/common/RequireLoginPrompt";
import EmotionNotesSection from "@/components/emotion-notes/EmotionNotesSection";
import { fetchEmotionNotes } from "@/components/emotion-notes/utils/emotionNotesListApi";
import AppHeader from "@/components/header/AppHeader";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { EmotionNote } from "@/lib/types/types";
import { formatKoreanDateTime } from "@/lib/utils/time";
import { useCallback, useEffect, useMemo, useState } from "react";
import styles from "../page.module.css";

type SessionUser = {
  id: string;
  email: string | null;
};

const getTodayLabel = () => {
  return formatKoreanDateTime(new Date(), {
    month: "long",
    day: "numeric",
    weekday: "short",
  });
};

export default function EmotionNotesPage() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [notes, setNotes] = useState<EmotionNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const todayLabel = useMemo(() => getTodayLabel(), []);
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);

  const fetchSession = useCallback(async () => {
    const { data } = await supabase.auth.getUser();
    setUser(
      data.user ? { id: data.user.id, email: data.user.email ?? null } : null,
    );
  }, [supabase]);

  const fetchNotes = useCallback(async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;
    if (!accessToken) {
      setNotes([]);
      return;
    }
    const { response, data } = await fetchEmotionNotes(accessToken);
    if (!response.ok) {
      setNotes([]);
      return;
    }
    setNotes(data.notes ?? []);
  }, [supabase]);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      await fetchSession();
      await fetchNotes();
      setIsLoading(false);
    };
    load();
    const { data: authListener } = supabase.auth.onAuthStateChange(() => {
      fetchSession().then(fetchNotes);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [fetchNotes, fetchSession, supabase]);

  return (
    <div className={styles.page}>
      <AppHeader />
      <main className={styles.main}>
        <div className={styles.shell}>
          {user ? (
            <EmotionNotesSection
              notes={notes}
              todayLabel={todayLabel}
              isLoading={isLoading}
            />
          ) : (
            <RequireLoginPrompt />
          )}
        </div>
      </main>
    </div>
  );
}
