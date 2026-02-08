"use client";

import type { ReactNode } from "react";
import { Handle, Position, type NodeProps } from "reactflow";
import styles from "../EmotionNoteFlowSection.module.css";
import type { EmotionMontage } from "@/lib/types/emotionNoteTypes";
import { Video } from "lucide-react";

export type EmotionNoteDetailSection =
  | "emotion"
  | "error"
  | "alternative"
  | "behavior";

export type EmotionNoteChip = {
  id: string;
  label: string;
  body: string;
  section: EmotionNoteDetailSection;
};

export type EmotionNoteFlowNodeData = {
  label: ReactNode;
  size: number;
  chips: EmotionNoteChip[];
  titleText: string;
  triggerText: string;
  montage?: EmotionMontage | null;
  onOpenMontage?: (montage: EmotionMontage) => void;
};

export default function EmotionNoteFlowNode({
  data,
  selected,
}: NodeProps<EmotionNoteFlowNodeData>) {
  return (
    <div className={styles.nodeContent}>
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className={styles.flowHandle}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className={styles.flowHandle}
      />
      {data.label}
      {data.montage ? (
        <button
          type="button"
          className={styles.nodeMontageButton}
          onClick={(event) => {
            event.stopPropagation();
            data.onOpenMontage?.(data.montage as EmotionMontage);
          }}
          aria-label="몽타주 보기"
        >
          <Video size={32} />
        </button>
      ) : null}
      {selected ? (
        <div className={styles.nodeTooltip} role="status" aria-live="polite">
          <div className={styles.nodeTooltipTitle}>{data.titleText}</div>
          <div className={styles.nodeTooltipBody}>{data.triggerText}</div>
        </div>
      ) : null}
    </div>
  );
}
