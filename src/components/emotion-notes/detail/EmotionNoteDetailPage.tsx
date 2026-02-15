"use client";

import pageStyles from "@/app/page.module.css";
import FloatingActionButton from "@/components/common/FloatingActionButton";
import { goToFlowForNote } from "@/components/flow/domain/navigation/goToFlowForNote";
import AppHeader from "@/components/header/AppHeader";
import { useAuthModal } from "@/components/header/AuthModalProvider";
import EmotionNoteDetailSectionItemModal from "@/components/emotion-notes/detail/common/EmotionNoteDetailSectionItemModal";
import { useCbtToast } from "@/components/session/common/CbtToast";
import { useAiUsageGuard } from "@/lib/hooks/useAiUsageGuard";
import { useAccessContext } from "@/lib/hooks/useAccessContext";
import { queryKeys } from "@/lib/queryKeys";
import { formatKoreanDateTime } from "@/lib/utils/time";
import { useQueryClient } from "@tanstack/react-query";
import { Lightbulb, NotebookPen, Route, Share2, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import EmotionNoteAlternativeDetailSection from "./EmotionNoteAlternativeDetailSection";
import styles from "./EmotionNoteDetailPage.module.css";
import useEmotionNoteDetail from "./hooks/useEmotionNoteDetail";

type EmotionNoteDetailPageProps = {
  noteId?: number | null;
};

type ModalContent = {
  title: string;
  body: string;
  color: string;
  icon: ReactNode;
  badgeText?: string | null;
} | null;

const formatDateTime = (value: string) =>
  formatKoreanDateTime(value, {
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export default function EmotionNoteDetailPage({ noteId }: EmotionNoteDetailPageProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { note, isLoading, detailAccessMode } = useEmotionNoteDetail(noteId);
  const { pushToast } = useCbtToast();
  const { openAuthModal } = useAuthModal();
  const { checkUsage } = useAiUsageGuard({ enabled: false, cache: true, redirectTo: null });
  const { accessMode: accessStateMode, accessToken, isBlocked } = useAccessContext();

  const [modalContent, setModalContent] = useState<ModalContent>(null);
  const [isGoDeeperLoading, setIsGoDeeperLoading] = useState(false);
  const latestAlternative = useMemo(
    () =>
      [...(note?.alternative_details ?? [])].sort((a, b) =>
        b.created_at.localeCompare(a.created_at),
      )[0] ?? null,
    [note?.alternative_details],
  );

  const createModalHandler =
    (color: string, icon: ReactNode) =>
    (title: string, body: string, badgeText?: string | null) => {
      setModalContent({ title, body, color, icon, badgeText: badgeText ?? null });
    };

  const handleCopyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      pushToast("클립보드에 복사되었습니다.", "success");
    } catch {
      // noop
    }
  };

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
        <div className={pageStyles.shell}>
          <section className={styles.noteForm}>
            <div className={styles.notePin} aria-hidden />
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
              details={note?.alternative_details ?? []}
              thoughtDetails={note?.thought_details ?? []}
              errorDetails={note?.error_details ?? []}
              formatDateTime={formatDateTime}
              onCopyText={handleCopyText}
              onOpenModal={createModalHandler("#36d94a", <Lightbulb size={18} />)}
            />
          </section>

          {note?.created_at ? (
            <p className={styles.footerMeta}>마지막 저장: {formatDateTime(note.created_at)}</p>
          ) : null}
        </div>
      </main>

      {note?.id ? (
        <>
          <FloatingActionButton
            label="공유하기"
            icon={<Share2 size={22} />}
            helperText="공유하기"
            onClick={() => router.push(`/share/create?id=${note.id}`)}
            className={styles.fabSecondary}
            style={{
              backgroundColor: "#fff",
              color: "#121417",
              borderColor: "rgba(18, 20, 23, 0.35)",
            }}
          />
          <FloatingActionButton
            label="행동 제안"
            icon={<Sparkles size={22} />}
            helperText="행동 제안 (준비중)"
            disabled
            onClick={() => undefined}
            className={styles.fabBehavior}
            style={{
              left: "24px",
              right: "auto",
              backgroundColor: "#121417",
              color: "#fff",
              borderColor: "rgba(255, 255, 255, 0.35)",
            }}
          />
          <FloatingActionButton
            label="Flow"
            icon={<Route size={22} />}
            helperText="Flow"
            onClick={async () => {
              setIsGoDeeperLoading(true);
              await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
              const allowed = await checkUsage();
              if (!allowed) {
                setIsGoDeeperLoading(false);
                return;
              }
              if (isBlocked) {
                openAuthModal();
                setIsGoDeeperLoading(false);
                return;
              }
              const access = { mode: accessStateMode, accessToken };
              const ok = await goToFlowForNote({
                noteId: note.id,
                flowIds: note.flow_ids,
                access,
                router,
                onError: (message) => pushToast(message, "error"),
                onCreated: () => {
                  void queryClient.invalidateQueries({ queryKey: queryKeys.flow.all });
                },
              });
              if (!ok) {
                setIsGoDeeperLoading(false);
                return;
              }
            }}
            loadingRing={isGoDeeperLoading}
            className={styles.fab}
            style={{
              backgroundColor: "#121417",
              color: "#fff",
              borderColor: "rgba(255, 255, 255, 0.35)",
            }}
          />
        </>
      ) : null}

      <EmotionNoteDetailSectionItemModal
        isOpen={Boolean(modalContent)}
        title={modalContent?.title ?? (latestAlternative ? "대안 사고" : "")}
        body={modalContent?.body ?? latestAlternative?.alternative ?? ""}
        accentColor={modalContent?.color ?? "#fff"}
        icon={modalContent?.icon ?? null}
        badgeText={modalContent?.badgeText ?? null}
        onClose={() => setModalContent(null)}
      />
    </div>
  );
}
