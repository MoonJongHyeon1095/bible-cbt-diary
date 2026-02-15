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
import { AlertCircle, Brain, Footprints, Lightbulb, Route, Share2 } from "lucide-react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useState } from "react";
import EmotionNoteAlternativeDetailSection from "./EmotionNoteAlternativeDetailSection";
import EmotionNoteBehaviorDetailSection from "./EmotionNoteBehaviorDetailSection";
import styles from "./EmotionNoteDetailPage.module.css";
import EmotionNoteDetailSectionChart from "./EmotionNoteDetailSectionChart";
import EmotionNoteDetailSectionToggleList from "./EmotionNoteDetailSectionToggleList";
import EmotionNoteErrorDetailSection from "./EmotionNoteErrorDetailSection";
import useEmotionNoteDetail from "./hooks/useEmotionNoteDetail";
import EmotionNoteThoughtDetailSection from "./EmotionNoteThoughtDetailSection";

type EmotionNoteDetailPageProps = {
  noteId?: number | null;
};

type SectionKey = "thought" | "error" | "alternative" | "behavior";
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

  const [selectedSection, setSelectedSection] = useState<SectionKey | null>(null);
  const [modalContent, setModalContent] = useState<ModalContent>(null);
  const [isGoDeeperLoading, setIsGoDeeperLoading] = useState(false);

  const createModalHandler =
    (color: string, icon: ReactNode) =>
    (title: string, body: string, badgeText?: string | null) => {
      setModalContent({ title, body, color, icon, badgeText: badgeText ?? null });
    };

  const sections = [
    {
      key: "thought" as const,
      label: "자동 사고",
      color: "#ffd300",
      count: note?.thought_details?.length ?? 0,
    },
    {
      key: "error" as const,
      label: "인지 오류",
      color: "#ff4fd8",
      count: note?.error_details?.length ?? 0,
    },
    {
      key: "alternative" as const,
      label: "대안 사고",
      color: "#36d94a",
      count: note?.alternative_details?.length ?? 0,
    },
    {
      key: "behavior" as const,
      label: "행동 반응",
      color: "#26e0ff",
      count: note?.behavior_details?.length ?? 0,
    },
  ];

  const handleCopyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      pushToast("클립보드에 복사되었습니다.", "success");
    } catch {
      // noop
    }
  };

  const toggleItems = [
    {
      key: "thought",
      label: "자동 사고",
      color: "#ffd300",
      count: note?.thought_details?.length ?? 0,
      isActive: selectedSection === "thought",
      onToggle: () => setSelectedSection((prev) => (prev === "thought" ? null : "thought")),
      content: (
        <EmotionNoteThoughtDetailSection
          details={note?.thought_details ?? []}
          formatDateTime={formatDateTime}
          onCopyText={handleCopyText}
          onOpenModal={createModalHandler("#ffd300", <Brain size={18} />)}
        />
      ),
    },
    {
      key: "error",
      label: "인지 오류",
      color: "#ff4fd8",
      count: note?.error_details?.length ?? 0,
      isActive: selectedSection === "error",
      onToggle: () => setSelectedSection((prev) => (prev === "error" ? null : "error")),
      content: (
        <EmotionNoteErrorDetailSection
          details={note?.error_details ?? []}
          formatDateTime={formatDateTime}
          onCopyText={handleCopyText}
          onOpenModal={createModalHandler("#ff4fd8", <AlertCircle size={18} />)}
        />
      ),
    },
    {
      key: "alternative",
      label: "대안 사고",
      color: "#36d94a",
      count: note?.alternative_details?.length ?? 0,
      isActive: selectedSection === "alternative",
      onToggle: () =>
        setSelectedSection((prev) => (prev === "alternative" ? null : "alternative")),
      content: (
        <EmotionNoteAlternativeDetailSection
          details={note?.alternative_details ?? []}
          formatDateTime={formatDateTime}
          onCopyText={handleCopyText}
          onOpenModal={createModalHandler("#36d94a", <Lightbulb size={18} />)}
        />
      ),
    },
    {
      key: "behavior",
      label: "행동 반응",
      color: "#26e0ff",
      count: note?.behavior_details?.length ?? 0,
      isActive: selectedSection === "behavior",
      onToggle: () => setSelectedSection((prev) => (prev === "behavior" ? null : "behavior")),
      content: (
        <EmotionNoteBehaviorDetailSection
          details={note?.behavior_details ?? []}
          formatDateTime={formatDateTime}
          onCopyText={handleCopyText}
          onOpenModal={createModalHandler("#26e0ff", <Footprints size={18} />)}
        />
      ),
    },
  ];

  if (detailAccessMode === "blocked" && !isLoading) {
    return (
      <div className={pageStyles.page}>
        <AppHeader />
        <main className={pageStyles.main}>
          <div className={pageStyles.shell} />
        </main>
      </div>
    );
  }

  return (
    <div className={`${pageStyles.page} ${styles.root}`}>
      <AppHeader />
      <main className={pageStyles.main}>
        <div className={pageStyles.shell}>
          <section className={styles.noteForm}>
            <label className={styles.field}>
              <span className={styles.label}>제목</span>
              <div className={styles.readonlyValue}>{note?.title?.trim() || "-"}</div>
            </label>
            <label className={styles.field}>
              <span className={styles.label}>트리거 텍스트</span>
              <div className={styles.readonlyValue}>{note?.trigger_text?.trim() || "-"}</div>
            </label>
          </section>

          <section className={styles.sectionView}>
            <EmotionNoteDetailSectionChart
              sections={sections}
              selectedKey={selectedSection}
              onSelect={(key) => setSelectedSection((prev) => (prev === key ? null : key))}
            />
            <EmotionNoteDetailSectionToggleList items={toggleItems} />
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
        title={modalContent?.title ?? ""}
        body={modalContent?.body ?? ""}
        accentColor={modalContent?.color ?? "#fff"}
        icon={modalContent?.icon ?? null}
        badgeText={modalContent?.badgeText ?? null}
        onClose={() => setModalContent(null)}
      />
    </div>
  );
}
