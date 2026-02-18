"use client";

import SafeButton from "@/components/ui/SafeButton";
import { Waypoints } from "lucide-react";
import type { CSSProperties } from "react";
import styles from "../FlowListSection.module.css";

export type FlowListNodeViewModel = {
  id: number;
  noteCount: number;
  title: string;
  description: string | null;
  radius: number;
  color: string;
  rgb: [number, number, number];
  selected: boolean;
  isMetaEditing: boolean;
  isMetaSaving: boolean;
  metaTitleDraft: string;
  metaDescriptionDraft: string;
  onSelect: () => void;
  onStartMetaEdit: () => void;
  onCancelMetaEdit: () => void;
  onSaveMeta: () => void;
  onChangeMetaTitle: (value: string) => void;
  onChangeMetaDescription: (value: string) => void;
};

export default function FlowListNode({
  id,
  noteCount,
  title,
  description,
  radius,
  color,
  rgb,
  selected,
  isMetaEditing,
  isMetaSaving,
  metaTitleDraft,
  metaDescriptionDraft,
  onSelect,
  onStartMetaEdit,
  onCancelMetaEdit,
  onSaveMeta,
  onChangeMetaTitle,
  onChangeMetaDescription,
}: FlowListNodeViewModel) {
  const displayTitle = title.trim() || `플로우 ${id}`;

  return (
    <div className={styles.nodeWrap}>
      <SafeButton
        mode="native"
        type="button"
        className={`${styles.node} ${selected ? styles.nodeSelected : ""}`.trim()}
        onClick={onSelect}
        style={{
          width: radius * 2,
          height: radius * 2,
          backgroundColor: color,
          ["--node-r" as string]: rgb[0],
          ["--node-g" as string]: rgb[1],
          ["--node-b" as string]: rgb[2],
        } as CSSProperties}
      >
        <span className={styles.nodeGroup}>
          <Waypoints size={12} className={styles.nodeGroupIcon} />
          #{id}
        </span>
        <span className={styles.nodeTitle}>{displayTitle}</span>
        <span className={styles.nodeCountLine}>
          <span className={styles.nodeCount}>{noteCount}</span> 개의 기록
        </span>
      </SafeButton>

      {selected ? (
        <div
          className={`${styles.nodeTooltip} ${isMetaEditing ? styles.nodeTooltipEditing : ""}`.trim()}
          role="status"
          onClick={(event) => event.stopPropagation()}
        >
          {isMetaEditing ? (
            <>
              <input
                type="text"
                value={metaTitleDraft}
                onChange={(event) => onChangeMetaTitle(event.target.value)}
                className={styles.nodeTooltipInput}
                placeholder="플로우 제목"
                maxLength={40}
              />
              <textarea
                value={metaDescriptionDraft}
                onChange={(event) => onChangeMetaDescription(event.target.value)}
                className={styles.nodeTooltipTextarea}
                placeholder="플로우 설명"
                rows={3}
                maxLength={40}
              />
              <div className={styles.nodeTooltipActions}>
                <SafeButton
                  size="sm"
                  variant="outline"
                  onClick={onCancelMetaEdit}
                  disabled={isMetaSaving}
                >
                  취소
                </SafeButton>
                <SafeButton
                  size="sm"
                  onClick={onSaveMeta}
                  loading={isMetaSaving}
                  loadingText="저장 중..."
                >
                  저장
                </SafeButton>
              </div>
            </>
          ) : (
            <>
              <button
                type="button"
                className={styles.nodeTooltipEditTrigger}
                onClick={onStartMetaEdit}
              >
                <div className={styles.nodeTooltipTitle}>{displayTitle}</div>
              </button>
              <button
                type="button"
                className={styles.nodeTooltipEditTrigger}
                onClick={onStartMetaEdit}
              >
                <div className={styles.nodeTooltipBody}>
                {description?.trim() || "설명이 아직 없습니다."}
                </div>
              </button>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
