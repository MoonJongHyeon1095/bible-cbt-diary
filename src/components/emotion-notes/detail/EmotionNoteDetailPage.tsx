"use client";

import pageStyles from "@/app/page.module.css";
import { useCbtToast } from "@/components/cbt/common/CbtToast";
import FloatingActionButton from "@/components/common/FloatingActionButton";
import EmotionNoteDetailSectionItemModal from "@/components/emotion-notes/detail/common/EmotionNoteDetailSectionItemModal";
import AppHeader from "@/components/header/AppHeader";
import { useAuthModal } from "@/components/header/AuthModalProvider";
import SafeButton from "@/components/ui/SafeButton";
import { useAiUsageGuard } from "@/lib/hooks/useAiUsageGuard";
import { useAccessContext } from "@/lib/hooks/useAccessContext";
import { goToFlowForNote } from "@/lib/flow/goToFlowForNote";
import { formatKoreanDateTime } from "@/lib/utils/time";
import {
  AlertCircle,
  Brain,
  Footprints,
  Lightbulb,
  Pencil,
  Plus,
  Route,
  Share2,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
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
type SelectedItem = { section: SectionKey; id: number } | null;
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

export default function EmotionNoteDetailPage({
  noteId,
}: EmotionNoteDetailPageProps) {
  const router = useRouter();
  const {
    accessMode: detailAccessMode,
    note,
    isNew,
    isLoading,
    isSaving,
    isDeleting,
    message,
    error,
    title,
    setTitle,
    triggerText,
    setTriggerText,
    handleSaveNote,
    handleDeleteNote,
    thoughtSection,
    errorSection,
    alternativeSection,
    behaviorSection,
  } = useEmotionNoteDetail(noteId);
  const triggerTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const { pushToast } = useCbtToast();
  const { openAuthModal } = useAuthModal();
  const { checkUsage } = useAiUsageGuard({ enabled: false, cache: true });
  const {
    accessMode: accessStateMode,
    accessToken,
    isBlocked,
  } = useAccessContext();
  const [selectedSection, setSelectedSection] = useState<SectionKey | null>(
    null,
  );
  const [selectedItem, setSelectedItem] = useState<SelectedItem>(null);
  const [modalContent, setModalContent] = useState<ModalContent>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isGoDeeperLoading, setIsGoDeeperLoading] = useState(false);
  const createModalHandler =
    (color: string, icon: ReactNode) =>
    (title: string, body: string, badgeText?: string | null) => {
      setModalContent({
        title,
        body,
        color,
        icon,
        badgeText: badgeText ?? null,
      });
    };
  const hasTitleChange =
    (note?.title ?? "") !== title.trim() ||
    (note?.trigger_text ?? "") !== triggerText.trim();
  const hasDraft = title.trim().length > 0 || triggerText.trim().length > 0;
  const shouldShowSave = noteId ? hasTitleChange : hasDraft;
  const selectedFabStyle =
    selectedSection === "thought"
      ? { backgroundColor: "#ffd300", color: "#2b2400", borderColor: "#d7b800" }
      : selectedSection === "error"
        ? {
            backgroundColor: "#ff4fd8",
            color: "#2b0020",
            borderColor: "#d63cb8",
          }
        : selectedSection === "alternative"
          ? {
              backgroundColor: "#36d94a",
              color: "#002b08",
              borderColor: "#24b43a",
            }
          : selectedSection === "behavior"
            ? {
                backgroundColor: "#26e0ff",
                color: "#00242b",
                borderColor: "#14bcd9",
              }
            : undefined;
  const saveFabClass = selectedItem
    ? styles.fabTertiary
    : selectedSection
      ? styles.fabSecondary
      : styles.fab;

  const isEditingSelected =
    (selectedItem?.section === "thought" &&
      thoughtSection.editingThoughtId === selectedItem.id) ||
    (selectedItem?.section === "error" &&
      errorSection.editingErrorId === selectedItem.id) ||
    (selectedItem?.section === "alternative" &&
      alternativeSection.editingAlternativeId === selectedItem.id) ||
    (selectedItem?.section === "behavior" &&
      behaviorSection.editingBehaviorId === selectedItem.id);

  const isUpdatingSelected =
    (selectedItem?.section === "thought" && thoughtSection.isUpdating) ||
    (selectedItem?.section === "error" && errorSection.isUpdating) ||
    (selectedItem?.section === "alternative" &&
      alternativeSection.isUpdating) ||
    (selectedItem?.section === "behavior" && behaviorSection.isUpdating);

  const isDeletingSelected =
    (selectedItem?.section === "thought" &&
      thoughtSection.deletingId === selectedItem.id) ||
    (selectedItem?.section === "error" &&
      errorSection.deletingId === selectedItem.id) ||
    (selectedItem?.section === "alternative" &&
      alternativeSection.deletingId === selectedItem.id) ||
    (selectedItem?.section === "behavior" &&
      behaviorSection.deletingId === selectedItem.id);

  const sections = [
    {
      key: "thought" as const,
      label: "자동 사고",
      color: "#ffd300",
      count: thoughtSection.details.length,
    },
    {
      key: "error" as const,
      label: "인지 오류",
      color: "#ff4fd8",
      count: errorSection.details.length,
    },
    {
      key: "alternative" as const,
      label: "대안 사고",
      color: "#36d94a",
      count: alternativeSection.details.length,
    },
    {
      key: "behavior" as const,
      label: "행동 반응",
      color: "#26e0ff",
      count: behaviorSection.details.length,
    },
  ];

  const handleCopyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      pushToast("클립보드에 복사되었습니다.", "success");
    } catch {
      // Ignore clipboard errors silently.
    }
  };

  const clearEditing = useCallback(() => {
    thoughtSection.onCancelEditing();
    errorSection.onCancelEditing();
    alternativeSection.onCancelEditing();
    behaviorSection.onCancelEditing();
  }, [alternativeSection, behaviorSection, errorSection, thoughtSection]);


  const handleSelectDetail = (section: SectionKey, detailId: number) => {
    const isSameSelection =
      selectedItem?.section === section && selectedItem.id === detailId;
    if (!isSameSelection) {
      clearEditing();
    }
    setSelectedItem({ section, id: detailId });
  };

  const toggleItems = [
    {
      key: "thought",
      label: "자동 사고",
      color: "#ffd300",
      count: thoughtSection.details.length,
      isActive: selectedSection === "thought",
      onToggle: () => {
        setSelectedSection((prev) => (prev === "thought" ? null : "thought"));
        setSelectedItem(null);
      },
      content: (
        <EmotionNoteThoughtDetailSection
          {...thoughtSection}
          formatDateTime={formatDateTime}
          onSelectDetail={(detailId) => handleSelectDetail("thought", detailId)}
          selectedDetailId={
            selectedItem?.section === "thought" ? selectedItem.id : null
          }
          onCopyText={handleCopyText}
          onOpenModal={createModalHandler("#ffd300", <Brain size={18} />)}
        />
      ),
    },
    {
      key: "error",
      label: "인지 오류",
      color: "#ff4fd8",
      count: errorSection.details.length,
      isActive: selectedSection === "error",
      onToggle: () => {
        setSelectedSection((prev) => (prev === "error" ? null : "error"));
        setSelectedItem(null);
      },
      content: (
        <EmotionNoteErrorDetailSection
          {...errorSection}
          formatDateTime={formatDateTime}
          onSelectDetail={(detailId) => handleSelectDetail("error", detailId)}
          selectedDetailId={
            selectedItem?.section === "error" ? selectedItem.id : null
          }
          onCopyText={handleCopyText}
          onOpenModal={createModalHandler("#ff4fd8", <AlertCircle size={18} />)}
        />
      ),
    },
    {
      key: "alternative",
      label: "대안 사고",
      color: "#36d94a",
      count: alternativeSection.details.length,
      isActive: selectedSection === "alternative",
      onToggle: () => {
        setSelectedSection((prev) =>
          prev === "alternative" ? null : "alternative",
        );
        setSelectedItem(null);
      },
      content: (
        <EmotionNoteAlternativeDetailSection
          {...alternativeSection}
          formatDateTime={formatDateTime}
          onSelectDetail={(detailId) =>
            handleSelectDetail("alternative", detailId)
          }
          selectedDetailId={
            selectedItem?.section === "alternative" ? selectedItem.id : null
          }
          onCopyText={handleCopyText}
          onOpenModal={createModalHandler("#36d94a", <Lightbulb size={18} />)}
        />
      ),
    },
    {
      key: "behavior",
      label: "행동 반응",
      color: "#26e0ff",
      count: behaviorSection.details.length,
      isActive: selectedSection === "behavior",
      onToggle: () => {
        setSelectedSection((prev) => (prev === "behavior" ? null : "behavior"));
        setSelectedItem(null);
      },
      content: (
        <EmotionNoteBehaviorDetailSection
          {...behaviorSection}
          formatDateTime={formatDateTime}
          onSelectDetail={(detailId) =>
            handleSelectDetail("behavior", detailId)
          }
          selectedDetailId={
            selectedItem?.section === "behavior" ? selectedItem.id : null
          }
          onCopyText={handleCopyText}
          onOpenModal={createModalHandler("#26e0ff", <Footprints size={18} />)}
        />
      ),
    },
  ];

  const resizeTriggerTextarea = () => {
    const element = triggerTextareaRef.current;
    if (!element) {
      return;
    }
    element.style.height = "auto";
    element.style.height = `${element.scrollHeight}px`;
  };

  useEffect(() => {
    resizeTriggerTextarea();
  }, [triggerText]);

  const hasEditing =
    thoughtSection.editingThoughtId !== null ||
    errorSection.editingErrorId !== null ||
    alternativeSection.editingAlternativeId !== null ||
    behaviorSection.editingBehaviorId !== null;

  useEffect(() => {
    if (selectedItem || !hasEditing) {
      return;
    }
    clearEditing();
  }, [clearEditing, hasEditing, selectedItem]);

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
      <main className={pageStyles.main} onClick={() => setSelectedItem(null)}>
        <div className={pageStyles.shell}>
          <section className={styles.header}>
            <div className={styles.headerActions}>
              {noteId ? (
                <SafeButton
                  type="button"
                  variant="unstyled"
                  className={`${styles.iconButton} ${styles.iconDanger}`}
                  onClick={() => setConfirmDelete(true)}
                  aria-label="삭제"
                >
                  <Trash2 size={18} />
                  <span className={styles.srOnly}>삭제</span>
                </SafeButton>
              ) : null}
            </div>
          </section>
          {confirmDelete ? (
            <div className={styles.confirmBar}>
              <span>이 기록을 삭제할까요?</span>
              <div className={styles.confirmActions}>
                <SafeButton
                  variant="danger"
                  size="sm"
                  onClick={async () => {
                    const deleted = await handleDeleteNote();
                    if (deleted) {
                      setConfirmDelete(false);
                    }
                  }}
                  loading={isDeleting}
                  loadingText="삭제 중..."
                  disabled={isDeleting}
                >
                  삭제
                </SafeButton>
                <SafeButton
                  variant="outline"
                  size="sm"
                  onClick={() => setConfirmDelete(false)}
                  disabled={isDeleting}
                >
                  취소
                </SafeButton>
              </div>
            </div>
          ) : null}

          <section className={styles.noteForm}>
            <label className={styles.field}>
              <span className={styles.label}>제목</span>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="짧게 제목을 적어주세요"
                className={styles.input}
              />
            </label>
            <label className={styles.field}>
              <span className={styles.label}>트리거 텍스트</span>
              <textarea
                ref={triggerTextareaRef}
                value={triggerText}
                onChange={(event) => {
                  setTriggerText(event.target.value);
                  resizeTriggerTextarea();
                }}
                rows={3}
                placeholder="오늘 어떤 일이 있었나요?"
                className={`${styles.textarea} ${styles.triggerTextarea}`}
              />
            </label>
            <div className={styles.noteActions}>
              {message ? (
                <span className={styles.successText}>{message}</span>
              ) : null}
              {error ? <span className={styles.errorText}>{error}</span> : null}
            </div>
          </section>

          <section className={styles.sectionView}>
            <EmotionNoteDetailSectionChart
              sections={sections}
              selectedKey={selectedSection}
              onSelect={(key) =>
                setSelectedSection((prev) => {
                  const next = prev === key ? null : key;
                  setSelectedItem(null);
                  return next;
                })
              }
            />
            <EmotionNoteDetailSectionToggleList items={toggleItems} />
          </section>

          {note?.created_at ? (
            <p className={styles.footerMeta}>
              마지막 저장: {formatDateTime(note.created_at)}
            </p>
          ) : null}
        </div>
      </main>
      {shouldShowSave ? (
        <FloatingActionButton
          label={isSaving ? "저장 중..." : isNew ? "기록 저장" : "수정 저장"}
          icon={<Upload size={26} />}
          helperText="수정사항 저장"
          onClick={handleSaveNote}
          disabled={isSaving}
          loading={isSaving}
          loadingBehavior="replace"
          className={saveFabClass}
        />
      ) : null}
      {!selectedItem && !selectedSection && !shouldShowSave ? (
        <>
          <FloatingActionButton
            label="공유하기"
            icon={<Share2 size={22} />}
            helperText="공유하기"
            onClick={() => {
              if (!note?.id) {
                pushToast("먼저 기록을 저장해주세요.", "info");
                return;
              }
              router.push(`/share/create?id=${note.id}`);
            }}
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
              if (!note?.id) return;
              setIsGoDeeperLoading(true);
              await new Promise<void>((resolve) =>
                requestAnimationFrame(() => resolve()),
              );
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
      {selectedSection && !selectedItem ? (
        <FloatingActionButton
          label="추가"
          icon={<Plus size={26} />}
          helperText="새 항목 추가"
          onClick={() => {
            if (!note?.id) return;
            router.push(`/detail/add/${selectedSection}?id=${note.id}`);
          }}
          className={styles.fab}
          style={selectedFabStyle}
        />
      ) : null}
      {selectedItem && !isEditingSelected ? (
        <>
          <FloatingActionButton
            label="편집"
            icon={<Pencil size={22} />}
            helperText="선택 항목 편집"
            onClick={() => {
              const section = selectedItem.section;
              if (section === "thought") {
                const detail = thoughtSection.details.find(
                  (item) => item.id === selectedItem.id,
                );
                if (detail) {
                  thoughtSection.onStartEditing(detail);
                }
              } else if (section === "error") {
                const detail = errorSection.details.find(
                  (item) => item.id === selectedItem.id,
                );
                if (detail) {
                  errorSection.onStartEditing(detail);
                }
              } else if (section === "alternative") {
                const detail = alternativeSection.details.find(
                  (item) => item.id === selectedItem.id,
                );
                if (detail) {
                  alternativeSection.onStartEditing(detail);
                }
              } else {
                const detail = behaviorSection.details.find(
                  (item) => item.id === selectedItem.id,
                );
                if (detail) {
                  behaviorSection.onStartEditing(detail);
                }
              }
            }}
            className={styles.fabSecondary}
            style={{
              backgroundColor: "#121417",
              color: "#fff",
              borderColor: "rgba(255, 255, 255, 0.35)",
            }}
          />
          <FloatingActionButton
            label="삭제"
            icon={<Trash2 size={22} />}
            helperText="선택 항목 삭제"
            onClick={async () => {
              const section = selectedItem.section;
              if (section === "thought") {
                await thoughtSection.onDelete(selectedItem.id);
              } else if (section === "error") {
                await errorSection.onDelete(selectedItem.id);
              } else if (section === "alternative") {
                await alternativeSection.onDelete(selectedItem.id);
              } else {
                await behaviorSection.onDelete(selectedItem.id);
              }
              setSelectedItem(null);
            }}
            disabled={isDeletingSelected}
            loading={isDeletingSelected}
            loadingBehavior="replace"
            className={styles.fab}
            style={{
              backgroundColor: "#e14a4a",
              color: "#fff",
              borderColor: "#b93333",
            }}
          />
        </>
      ) : null}
      {selectedItem && isEditingSelected ? (
        <>
          <FloatingActionButton
            label="저장"
            icon={<Upload size={22} />}
            helperText="수정내용 저장"
            onClick={async () => {
              const section = selectedItem.section;
              if (section === "thought") {
                await thoughtSection.onUpdate(selectedItem.id);
              } else if (section === "error") {
                await errorSection.onUpdate(selectedItem.id);
              } else if (section === "alternative") {
                await alternativeSection.onUpdate(selectedItem.id);
              } else {
                await behaviorSection.onUpdate(selectedItem.id);
              }
            }}
            disabled={isUpdatingSelected}
            loading={isUpdatingSelected}
            loadingBehavior="replace"
            className={styles.fabSecondary}
            style={selectedFabStyle}
          />
          <FloatingActionButton
            label="취소"
            icon={<X size={22} />}
            helperText="편집 취소"
            onClick={() => {
              const section = selectedItem.section;
              if (section === "thought") {
                thoughtSection.onCancelEditing();
              } else if (section === "error") {
                errorSection.onCancelEditing();
              } else if (section === "alternative") {
                alternativeSection.onCancelEditing();
              } else {
                behaviorSection.onCancelEditing();
              }
            }}
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
