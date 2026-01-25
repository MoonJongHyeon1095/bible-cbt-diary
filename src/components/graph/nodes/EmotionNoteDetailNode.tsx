"use client";

import { useState } from "react";
import { Handle, Position, type NodeProps } from "reactflow";
import styles from "../EmotionGraphSection.module.css";

export type EmotionNoteDetailSection =
  | "emotion"
  | "error"
  | "alternative"
  | "behavior";

export type EmotionNoteDetailItem = {
  id: string;
  label: string;
  body: string;
};

export type EmotionNoteDetailNodeData = {
  items: {
    emotion: EmotionNoteDetailItem[];
    error: EmotionNoteDetailItem[];
    alternative: EmotionNoteDetailItem[];
    behavior: EmotionNoteDetailItem[];
  };
};

const SECTION_LABELS: Record<EmotionNoteDetailSection, string> = {
  emotion: "감정",
  error: "인지오류",
  alternative: "대안사고",
  behavior: "행동 반응",
};

const SECTION_ORDER: EmotionNoteDetailSection[] = [
  "emotion",
  "error",
  "alternative",
  "behavior",
];

type OpenState = {
  section: EmotionNoteDetailSection;
  itemId: string;
} | null;

const buildSectionClass = (section: EmotionNoteDetailSection) => {
  if (section === "emotion") {
    return styles.detailSectionEmotion;
  }
  if (section === "error") {
    return styles.detailSectionError;
  }
  if (section === "alternative") {
    return styles.detailSectionAlternative;
  }
  return styles.detailSectionBehavior;
};

const buildItemClass = (section: EmotionNoteDetailSection) => {
  if (section === "emotion") {
    return styles.detailItemEmotion;
  }
  if (section === "error") {
    return styles.detailItemError;
  }
  if (section === "alternative") {
    return styles.detailItemAlternative;
  }
  return styles.detailItemBehavior;
};

export default function EmotionNoteDetailNode({
  data,
}: NodeProps<EmotionNoteDetailNodeData>) {
  const [open, setOpen] = useState<OpenState>(null);

  return (
    <div className={styles.detailPanel} role="group">
      <Handle
        type="target"
        position={Position.Left}
        id="detail-target"
        className={`${styles.graphHandle} ${styles.graphHandleCenter}`}
      />
      <div className={styles.detailPanelHeader}>
        <div>
          <p className={styles.detailPanelLabel}>노트 상세</p>
          <h3 className={styles.detailPanelTitle}>감정 기록 요약</h3>
        </div>
        <span className={styles.detailPanelCount}>
          {SECTION_ORDER.reduce(
            (sum, section) => sum + data.items[section].length,
            0,
          )}
        </span>
      </div>
      <div className={styles.detailPanelBody}>
        {SECTION_ORDER.map((section) => {
          const items = data.items[section];
          return (
            <div
              key={section}
              className={`${styles.detailSection} ${buildSectionClass(section)}`}
            >
              <div className={styles.detailSectionHeader}>
                <span className={styles.detailSectionTitle}>
                  {SECTION_LABELS[section]}
                </span>
                <span className={styles.detailSectionCount}>{items.length}</span>
              </div>
              <div className={styles.detailSectionItems}>
                {items.length === 0 ? (
                  <span className={styles.detailSectionEmpty}>없음</span>
                ) : (
                  items.map((item) => {
                    const isOpen =
                      open?.section === section && open?.itemId === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        className={`${styles.detailItem} ${buildItemClass(
                          section,
                        )} ${isOpen ? styles.detailItemOpen : ""}`}
                        onClick={(event) => {
                          event.stopPropagation();
                          setOpen((prev) =>
                            prev?.itemId === item.id &&
                            prev.section === section
                              ? null
                              : { section, itemId: item.id },
                          );
                        }}
                      >
                        {item.label}
                        {isOpen ? (
                          <span className={styles.detailItemBody}>
                            {item.body || "내용 없음"}
                          </span>
                        ) : null}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
