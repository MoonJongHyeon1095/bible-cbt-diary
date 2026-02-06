"use client";

import AppHeader from "@/components/header/AppHeader";
import EmotionNoteFlowGroupList from "@/components/flow/EmotionNoteFlowGroupList";
import EmotionNoteFlowSection from "@/components/flow/EmotionNoteFlowSection";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import styles from "@/app/page.module.css";

type SessionUser = {
  id: string;
  email: string | null;
};

function EmotionNoteFlowPageContent() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const searchParams = useSearchParams();
  const flowId = useMemo(() => {
    const flowIdParam = searchParams.get("flowId");
    const parsed = Number(flowIdParam);
    if (!flowIdParam || Number.isNaN(parsed)) {
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
            flowId ? (
              <EmotionNoteFlowSection
                accessToken={accessToken}
                noteId={noteId}
                flowId={flowId}
              />
            ) : (
              <EmotionNoteFlowGroupList
                accessToken={accessToken}
                noteId={noteId}
              />
            )
          ) : (
            <div className={styles.emptyAuth}>
              로그인 후 플로우를 확인할 수 있어요.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function EmotionNoteFlowPage() {
  return (
    <Suspense
      fallback={
        <div className={styles.page}>
          <AppHeader />
          <main className={styles.main}>
            <div className={styles.shell}>
              <div className={styles.emptyAuth}>플로우를 불러오는 중...</div>
            </div>
          </main>
        </div>
      }
    >
      <EmotionNoteFlowPageContent />
    </Suspense>
  );
}
