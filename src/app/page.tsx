"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import AppHeader from "@/components/header/AppHeader";
import EmotionNotesSection from "@/components/emotion-notes/EmotionNotesSection";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { CreateEmotionNoteState, EmotionNote } from "@/lib/types";
import styles from "./page.module.css";

type SessionUser = {
  id: string;
  email: string | null;
};

const getTodayLabel = () => {
  const now = new Date();
  return new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(now);
};

export default function EmotionNotesPage() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [notes, setNotes] = useState<EmotionNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [formState, setFormState] = useState<CreateEmotionNoteState>({
    ok: false,
    message: "",
  });
  const todayLabel = useMemo(() => getTodayLabel(), []);
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

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
    const response = await fetch("/api/emotion-notes", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    if (!response.ok) {
      setNotes([]);
      return;
    }
    const data = (await response.json()) as { notes: EmotionNote[] };
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

  const handleCreateEmotionNote = useCallback(
    async (formData: FormData) => {
      setFormState({ ok: false, message: "" });
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) {
        setFormState({ ok: false, message: "로그인이 필요합니다." });
        return;
      }
      const payload = {
        title: String(formData.get("title") ?? ""),
        trigger_text: String(formData.get("trigger_text") ?? ""),
        behavior: String(formData.get("behavior") ?? ""),
        frequency: Number(formData.get("frequency") ?? 1),
      };

      const response = await fetch("/api/emotion-notes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      });
      const data = (await response.json()) as CreateEmotionNoteState;

      setFormState(data);
      if (response.ok) {
        await fetchNotes();
      }
    },
    [fetchNotes, supabase],
  );

  return (
    <div className={styles.page}>
      <AppHeader />
      <main className={styles.main}>
        <div className={styles.shell}>
          {user ? (
            <EmotionNotesSection
              notes={notes}
              todayLabel={todayLabel}
              userEmail={user.email ?? null}
              onCreateEmotionNote={handleCreateEmotionNote}
              formState={formState}
              isLoading={isLoading}
            />
          ) : (
            <div className={styles.emptyAuth}>
              <h2 className={styles.emptyAuthTitle}>로그인이 필요합니다</h2>
              <p className={styles.emptyAuthHint}>
                우측 상단에서 이메일 로그인을 진행해주세요.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
