"use client";

import { useRouter } from "next/navigation";
import { AlertCircle, Brain, Footprints, Lightbulb } from "lucide-react";
import AddModeSelector, { AddMode } from "./AddModeSelector";
import useEmotionNoteDetail from "../../hooks/useEmotionNoteDetail";
import EmotionNoteAddPageLayout from "./EmotionNoteAddPageLayout";
import styles from "./EmotionNoteAddPage.module.css";

type EmotionNoteAddModePageProps = {
  noteId: number;
  section: "thought" | "error" | "alternative" | "behavior";
  tone: "amber" | "rose" | "green" | "blue";
};

export default function EmotionNoteAddModePage({
  noteId,
  section,
  tone: _tone,
}: EmotionNoteAddModePageProps) {
  const router = useRouter();
  const { accessMode } = useEmotionNoteDetail(noteId);
  const aiLocked = accessMode !== "auth";
  const icon =
    section === "thought"
      ? Brain
      : section === "error"
        ? AlertCircle
        : section === "alternative"
          ? Lightbulb
          : Footprints;
  const title =
    section === "thought"
      ? "배후의 자동 사고 추가"
      : section === "error"
        ? "인지오류 추가"
        : section === "alternative"
          ? "대안적 접근 추가"
          : "행동 반응 추가";
  const handleSelectMode = (mode: AddMode) => {
    router.push(`/detail/${noteId}/add/${section}/${mode}`);
  };

  return (
    <EmotionNoteAddPageLayout
      title={title}
      tone={_tone}
      icon={icon}
      onClose={() => router.push(`/detail/${noteId}`)}
    >
      <div className={styles.modeSelectOnly}>
        <AddModeSelector
          value={null}
          onSelect={handleSelectMode}
          aiLocked={aiLocked}
        />
      </div>
    </EmotionNoteAddPageLayout>
  );
}
