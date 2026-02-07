"use client";

import AppHeader from "@/components/header/AppHeader";
import EmotionNoteFlowGroupList from "@/components/flow/EmotionNoteFlowGroupList";
import EmotionNoteFlowSection from "@/components/flow/EmotionNoteFlowSection";
import { useAccessContext } from "@/lib/hooks/useAccessContext";
import { useSearchParams } from "next/navigation";
import { Suspense, useMemo } from "react";
import styles from "@/app/page.module.css";

function EmotionNoteFlowPageContent() {
  const { accessMode, accessToken, isLoading } = useAccessContext();
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

  const access = useMemo(
    () => ({ mode: accessMode, accessToken }),
    [accessMode, accessToken],
  );

  return (
    <div className={styles.page}>
      <AppHeader />
      <main className={styles.main}>
        <div className={styles.shell}>
          {isLoading ? null : accessMode !== "blocked" ? (
            flowId ? (
              <EmotionNoteFlowSection
                access={access}
                noteId={noteId}
                flowId={flowId}
              />
            ) : (
              <EmotionNoteFlowGroupList
                access={access}
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
