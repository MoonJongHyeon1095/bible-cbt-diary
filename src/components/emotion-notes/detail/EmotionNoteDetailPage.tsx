"use client";

import pageStyles from "@/app/page.module.css";
import FloatingActionButton from "@/components/common/FloatingActionButton";
import AppHeader from "@/components/header/AppHeader";
import { List, Plus, Upload, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import AlternativeDetailSection from "./AlternativeDetailSection";
import BehaviorDetailSection from "./BehaviorDetailSection";
import styles from "./EmotionNoteDetailPage.module.css";
import ErrorDetailSection from "./ErrorDetailSection";
import ThoughtDetailSection from "./ThoughtDetailSection";
import EmotionNoteSectionChart from "./EmotionNoteSectionChart";
import EmotionNoteSectionToggleList from "./EmotionNoteSectionToggleList";
import useEmotionNoteDetail from "./hooks/useEmotionNoteDetail";

type EmotionNoteDetailPageProps = {
  noteId?: number | null;
};

type SectionKey = "thought" | "error" | "alternative" | "behavior";

const formatDateTime = (value: string) =>
  new Date(value).toLocaleString("ko-KR", {
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

  const toggleItems = [
    {
      key: "thought",
      label: "자동 사고",
      color: "#ffd300",
      count: thoughtSection.details.length,
      isActive: selectedSection === "thought",
      onToggle: () =>
        setSelectedSection((prev) => (prev === "thought" ? null : "thought")),
      content: (
        <ThoughtDetailSection
          {...thoughtSection}
          formatDateTime={formatDateTime}
          showAddButton={false}
        />
      ),
    },
    {
      key: "error",
      label: "인지 오류",
      color: "#ff4fd8",
      count: errorSection.details.length,
      isActive: selectedSection === "error",
      onToggle: () =>
        setSelectedSection((prev) => (prev === "error" ? null : "error")),
      content: (
        <ErrorDetailSection
          {...errorSection}
          formatDateTime={formatDateTime}
          showAddButton={false}
        />
      ),
    },
    {
      key: "alternative",
      label: "대안 사고",
      color: "#36d94a",
      count: alternativeSection.details.length,
      isActive: selectedSection === "alternative",
      onToggle: () =>
        setSelectedSection((prev) =>
          prev === "alternative" ? null : "alternative",
        ),
      content: (
        <AlternativeDetailSection
          {...alternativeSection}
          formatDateTime={formatDateTime}
          showAddButton={false}
        />
      ),
    },
    {
      key: "behavior",
      label: "행동 반응",
      color: "#26e0ff",
      count: behaviorSection.details.length,
      isActive: selectedSection === "behavior",
      onToggle: () =>
        setSelectedSection((prev) => (prev === "behavior" ? null : "behavior")),
      content: (
        <BehaviorDetailSection
          {...behaviorSection}
          formatDateTime={formatDateTime}
          showAddButton={false}
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

  if (!userEmail && !isLoading) {
    return (
      <div className={pageStyles.page}>
        <AppHeader />
        <main className={pageStyles.main}>
          <div className={pageStyles.shell}>
            <div className={pageStyles.emptyAuth}>
              <h2 className={pageStyles.emptyAuthTitle}>로그인이 필요합니다</h2>
              <p className={pageStyles.emptyAuthHint}>
                상단에서 이메일 로그인을 진행해주세요.
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className={pageStyles.page}>
      <AppHeader />
      <main className={pageStyles.main}>
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
                setSelectedSection((prev) => (prev === key ? null : key))
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
      {selectedSection ? (
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
    </div>
  );
}
