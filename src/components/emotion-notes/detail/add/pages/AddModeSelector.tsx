"use client";

import { Sparkles, PencilLine } from "lucide-react";
import styles from "./EmotionNoteAddPage.module.css";

export type AddMode = "ai" | "direct";

type AddModeSelectorProps = {
  value: AddMode | null;
  onSelect: (mode: AddMode) => void;
  aiLocked?: boolean;
};

export default function AddModeSelector({
  value,
  onSelect,
  aiLocked,
}: AddModeSelectorProps) {
  return (
    <div className={styles.modeSelectGrid}>
      <button
        type="button"
        onClick={() => onSelect("ai")}
        disabled={aiLocked}
        className={[
          styles.modeSelectButton,
          value === "ai" ? styles.modeSelectSelected : "",
          aiLocked ? styles.modeSelectDisabled : "",
        ]
          .filter(Boolean)
          .join(" ")}
        data-mode="ai"
      >
        <span className={styles.modeSelectIcon}>
          <Sparkles size={18} />
        </span>
        <span className={styles.modeSelectTitle}>AI 제안</span>
        <span className={styles.modeSelectDesc}>
          필요한 것들을 고른 뒤 제안을 받아보세요.
        </span>
        {aiLocked ? (
          <span className={styles.modeSelectMeta}>
            로그인 후 사용할 수 있어요.
          </span>
        ) : null}
      </button>
      <button
        type="button"
        onClick={() => onSelect("direct")}
        className={[
          styles.modeSelectButton,
          value === "direct" ? styles.modeSelectSelected : "",
        ]
          .filter(Boolean)
          .join(" ")}
        data-mode="direct"
      >
        <span className={styles.modeSelectIcon}>
          <PencilLine size={18} />
        </span>
        <span className={styles.modeSelectTitle}>직접 작성</span>
        <span className={styles.modeSelectDesc}>
          필요한 것들을 선택한 뒤 직접 입력합니다.
        </span>
      </button>
    </div>
  );
}
