"use client";

import AppHeader from "@/components/header/AppHeader";
import RequireLoginPrompt from "@/components/common/RequireLoginPrompt";
import EmotionNoteGraphGroupList from "@/components/graph/EmotionNoteGraphGroupList";
import EmotionNoteGraphSection from "@/components/graph/EmotionNoteGraphSection";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import styles from "@/app/page.module.css";

type SessionUser = {
  id: string;
  email: string | null;
};

function EmotionNoteGraphPageContent() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const searchParams = useSearchParams();
  const groupId = useMemo(() => {
    const groupIdParam = searchParams.get("groupId");
    const parsed = Number(groupIdParam);
    if (!groupIdParam || Number.isNaN(parsed)) {
      return null;
    }
    return parsed;
  }, [searchParams]);
  const noteId = useMemo(() => {
    const noteIdParam = searchParams.get("noteId");
    const parsed = Number(noteIdParam);
    if (!noteIdParam || Number.isNaN(parsed)) {
      return null;
    }
    return parsed;
  }, [searchParams]);

  const fetchSession = useCallback(async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    setAccessToken(sessionData.session?.access_token ?? null);
    setUser(
      sessionData.session?.user
        ? {
            id: sessionData.session.user.id,
            email: sessionData.session.user.email ?? null,
          }
        : null,
    );
  }, [supabase]);

  useEffect(() => {
    fetchSession();
    const { data: authListener } = supabase.auth.onAuthStateChange(() => {
      fetchSession();
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [fetchSession, supabase]);

  return (
    <div className={styles.page}>
      <AppHeader />
      <main className={styles.main}>
        <div className={styles.shell}>
          {user && accessToken ? (
            groupId || noteId ? (
              <EmotionNoteGraphSection
                accessToken={accessToken}
                noteId={noteId}
                groupId={groupId}
              />
            ) : (
              <EmotionNoteGraphGroupList accessToken={accessToken} />
            )
          ) : (
            <RequireLoginPrompt />
          )}
        </div>
      </main>
    </div>
  );
}

export default function EmotionNoteGraphPage() {
  return (
    <Suspense
      fallback={
        <div className={styles.page}>
          <AppHeader />
          <main className={styles.main}>
            <div className={styles.shell}>
              <div className={styles.emptyAuth}>그래프를 불러오는 중...</div>
            </div>
          </main>
        </div>
      }
    >
      <EmotionNoteGraphPageContent />
    </Suspense>
  );
}
