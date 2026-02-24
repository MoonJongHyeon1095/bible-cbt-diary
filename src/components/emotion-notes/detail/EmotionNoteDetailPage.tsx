"use client";

import pageStyles from "@/app/page.module.css";
import FloatingActionButton from "@/components/common/FloatingActionButton";
import AppHeader from "@/components/header/AppHeader";
import { formatKoreanDateTime } from "@/lib/utils/time";
import { NotebookPen, Share2 } from "lucide-react";
import { useRouter } from "next/navigation";
import EmotionNoteAlternativeDetailSection from "./EmotionNoteAlternativeDetailSection";
import styles from "./EmotionNoteDetailPage.module.css";
import useEmotionNoteDetail from "./hooks/useEmotionNoteDetail";

type EmotionNoteDetailPageProps = {
  noteId?: number | null;
  hideFloatingActions?: boolean;
};

const formatDateTime = (value: string) =>
  formatKoreanDateTime(value, {
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export default function EmotionNoteDetailPage({
  noteId,
  hideFloatingActions = false,
}: EmotionNoteDetailPageProps) {
  const router = useRouter();
  const { note, isLoading, detailAccessMode } = useEmotionNoteDetail(noteId);

  if (detailAccessMode === "blocked" && !isLoading) {
    return (
      <div className={pageStyles.page}>
        <AppHeader showDisclaimer={false} />
        <main className={pageStyles.main}>
          <div className={pageStyles.shell} />
        </main>
      </div>
    );
  }

  return (
    <div className={`${pageStyles.page} ${styles.root}`}>
      <AppHeader showDisclaimer={false} />
      <main className={`${pageStyles.main} ${styles.pageMain}`}>
        <div className={`${pageStyles.shell} ${styles.contentShell}`}>
          <section className={styles.noteForm} data-tour="detail-memory-box">
            <div className={styles.noteHeader}>
              <span className={styles.noteHeaderIcon} aria-hidden>
                <NotebookPen size={16} />
              </span>
              <div>
                <p className={styles.noteEyebrow}>Emotion Note Report</p>
                <h2 className={styles.noteTitle}>{note?.title?.trim() || "-"}</h2>
              </div>
            </div>
            <div className={styles.field}>
              <span className={styles.label}>Incident</span>
              <div className={styles.readonlyValue}>{note?.trigger_text?.trim() || "-"}</div>
            </div>
          </section>

          <section className={styles.sectionView}>
            <EmotionNoteAlternativeDetailSection
              alternative={note?.alternative ?? ""}
              innerBelief={note?.inner_belief ?? ""}
              emotionTags={note?.emotion_tags ?? []}
              errorLabel={note?.error_label ?? ""}
              errorDescription={note?.error_description ?? ""}
              createdAt={note?.created_at ?? new Date().toISOString()}
              formatDateTime={formatDateTime}
            />
          </section>
        </div>
      </main>

      {note?.id ? (
        <>
          <FloatingActionButton
            label="공유하기"
            icon={<Share2 size={22} />}
            helperText="공유하기"
            placement="tab"
            onClick={() => router.push(`/share/create?id=${note.id}`)}
            className={[hideFloatingActions ? styles.fabHidden : ""]
              .filter(Boolean)
              .join(" ")}
          />
        </>
      ) : null}
    </div>
  );
}
