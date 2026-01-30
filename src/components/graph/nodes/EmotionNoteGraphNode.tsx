"use client";

import type { ReactNode } from "react";
import { Handle, Position, type NodeProps } from "reactflow";
import styles from "../EmotionNoteGraphSection.module.css";

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

export type EmotionNoteGraphNodeData = {
  label: ReactNode;
  size: number;
  chips: EmotionNoteChip[];
  titleText: string;
  triggerText: string;
};

export default function EmotionNoteGraphNode({
  data,
  selected,
}: NodeProps<EmotionNoteGraphNodeData>) {
  return (
    <div className={styles.nodeContent}>
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className={styles.graphHandle}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className={styles.graphHandle}
      />
      {data.label}
      {selected ? (
        <div className={styles.nodeTooltip} role="status" aria-live="polite">
          <div className={styles.nodeTooltipTitle}>{data.titleText}</div>
          <div className={styles.nodeTooltipBody}>{data.triggerText}</div>
        </div>
      ) : null}
    </div>
  );
}
