"use client";

import pageStyles from "@/app/page.module.css";
import FloatingActionButton from "@/components/common/FloatingActionButton";
import RequireLoginPrompt from "@/components/common/RequireLoginPrompt";
import AppHeader from "@/components/header/AppHeader";
import {
  AlertCircle,
  Brain,
  Footprints,
  Lightbulb,
  List,
  Pencil,
  Plus,
  Upload,
  X,
  Trash2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { formatKoreanDateTime } from "@/lib/time";
import AlternativeDetailSection from "./AlternativeDetailSection";
import BehaviorDetailSection from "./BehaviorDetailSection";
import styles from "./EmotionNoteDetailPage.module.css";
import ErrorDetailSection from "./ErrorDetailSection";
import ThoughtDetailSection from "./ThoughtDetailSection";
import EmotionNoteSectionChart from "./EmotionNoteSectionChart";
import EmotionNoteSectionToggleList from "./EmotionNoteSectionToggleList";
import useEmotionNoteDetail from "./hooks/useEmotionNoteDetail";
import DetailSectionItemModal from "@/components/emotion-notes/detail/common/DetailSectionItemModal";

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
  const {
    userEmail,
    note,
    isNew,
    isLoading,
    isSaving,
    message,
    error,
    title,
    setTitle,
    triggerText,
    setTriggerText,
    handleSaveNote,
    handleGoToList,
    handleDeleteNote,
    thoughtSection,
    errorSection,
    alternativeSection,
    behaviorSection,
  } = useEmotionNoteDetail(noteId);
  const triggerTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [selectedSection, setSelectedSection] = useState<SectionKey | null>(null);
  const [selectedItem, setSelectedItem] = useState<SelectedItem>(null);
  const [modalContent, setModalContent] = useState<ModalContent>(null);
  const [copyMessage, setCopyMessage] = useState<string | null>(null);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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
        ? { backgroundColor: "#ff4fd8", color: "#2b0020", borderColor: "#d63cb8" }
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

  const isEditingSelected =
    (selectedItem?.section === "thought" &&
      thoughtSection.editingThoughtId === selectedItem.id) ||
    (selectedItem?.section === "error" &&
      errorSection.editingErrorId === selectedItem.id) ||
    (selectedItem?.section === "alternative" &&
      alternativeSection.editingAlternativeId === selectedItem.id) ||
    (selectedItem?.section === "behavior" &&
      behaviorSection.editingBehaviorId === selectedItem.id);

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
      setCopyMessage("클립보드에 복사되었습니다.");
      if (copyTimerRef.current) {
        clearTimeout(copyTimerRef.current);
      }
      copyTimerRef.current = setTimeout(() => {
        setCopyMessage(null);
      }, 1600);
    } catch {
      // Ignore clipboard errors silently.
    }
  };

  const clearEditing = () => {
    thoughtSection.onCancelEditing();
    errorSection.onCancelEditing();
    alternativeSection.onCancelEditing();
    behaviorSection.onCancelEditing();
  };

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
        <ThoughtDetailSection
          {...thoughtSection}
          formatDateTime={formatDateTime}
          onSelectDetail={(detailId) =>
            handleSelectDetail("thought", detailId)
          }
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
        <ErrorDetailSection
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
        <AlternativeDetailSection
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
        <BehaviorDetailSection
          {...behaviorSection}
          formatDateTime={formatDateTime}
          onSelectDetail={(detailId) => handleSelectDetail("behavior", detailId)}
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
  }, [hasEditing, selectedItem]);

  if (!userEmail && !isLoading) {
    return (
      <div className={pageStyles.page}>
        <AppHeader />
        <main className={pageStyles.main}>
          <div className={pageStyles.shell}>
            <RequireLoginPrompt />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className={pageStyles.page}>
      <AppHeader />
      <main className={pageStyles.main} onClick={() => setSelectedItem(null)}>
        <div className={pageStyles.shell}>
          <section className={styles.header}>
            <div>
              <p className={styles.subtitle}>
                {isNew ? "새 기록" : "감정 기록 상세"}
              </p>
              <h2 className={styles.title}>
                {note?.title || (isNew ? "새로운 감정을 적어볼까요?" : "기록")}
              </h2>
            </div>
            <div className={styles.headerActions}>
              {noteId ? (
                <button
                  type="button"
                  className={styles.iconButton}
                  onClick={handleGoToList}
                  aria-label="목록으로"
                >
                  <List size={18} />
                  <span className={styles.srOnly}>목록으로</span>
                </button>
              ) : null}
              {noteId ? (
                <button
                  type="button"
                  className={`${styles.iconButton} ${styles.iconDanger}`}
                  onClick={handleDeleteNote}
                  aria-label="삭제"
                >
                  <Trash2 size={18} />
                  <span className={styles.srOnly}>삭제</span>
                </button>
              ) : null}
            </div>
          </section>

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
            <EmotionNoteSectionChart
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
            <EmotionNoteSectionToggleList items={toggleItems} />
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
        />
      ) : null}
      {selectedSection && !selectedItem ? (
        <FloatingActionButton
          label="추가"
          icon={<Plus size={26} />}
          helperText="새 항목 추가"
          onClick={() => {}}
          style={{
            bottom: shouldShowSave ? "18vh" : "25vh",
            ...selectedFabStyle,
          }}
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
            style={{
              bottom: shouldShowSave ? "26vh" : "33vh",
              backgroundColor: "#121417",
              color: "#fff",
              borderColor: "rgba(255, 255, 255, 0.35)",
            }}
          />
          <FloatingActionButton
            label="삭제"
            icon={<Trash2 size={22} />}
            helperText="선택 항목 삭제"
            onClick={() => {
              const section = selectedItem.section;
              if (section === "thought") {
                thoughtSection.onDelete(selectedItem.id);
              } else if (section === "error") {
                errorSection.onDelete(selectedItem.id);
              } else if (section === "alternative") {
                alternativeSection.onDelete(selectedItem.id);
              } else {
                behaviorSection.onDelete(selectedItem.id);
              }
              setSelectedItem(null);
            }}
            style={{
              bottom: shouldShowSave ? "10vh" : "17vh",
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
            onClick={() => {
              const section = selectedItem.section;
              if (section === "thought") {
                thoughtSection.onUpdate(selectedItem.id);
              } else if (section === "error") {
                errorSection.onUpdate(selectedItem.id);
              } else if (section === "alternative") {
                alternativeSection.onUpdate(selectedItem.id);
              } else {
                behaviorSection.onUpdate(selectedItem.id);
              }
            }}
            style={{
              bottom: shouldShowSave ? "26vh" : "33vh",
              ...selectedFabStyle,
            }}
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
            style={{
              bottom: shouldShowSave ? "10vh" : "17vh",
              backgroundColor: "#121417",
              color: "#fff",
              borderColor: "rgba(255, 255, 255, 0.35)",
            }}
          />
        </>
      ) : null}
      <DetailSectionItemModal
        isOpen={Boolean(modalContent)}
        title={modalContent?.title ?? ""}
        body={modalContent?.body ?? ""}
        accentColor={modalContent?.color ?? "#fff"}
        icon={modalContent?.icon ?? null}
        badgeText={modalContent?.badgeText ?? null}
        onClose={() => setModalContent(null)}
      />
      {copyMessage ? (
        <div className={styles.copyToast}>{copyMessage}</div>
      ) : null}
    </div>
  );
}
