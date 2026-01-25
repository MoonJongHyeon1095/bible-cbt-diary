"use client";

import type { ReactNode } from "react";
import { Handle, Position, type NodeProps } from "reactflow";
import styles from "../EmotionGraphSection.module.css";

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

export type EmotionNoteNodeData = {
  label: ReactNode;
  size: number;
  chips: EmotionNoteChip[];
};

export default function EmotionNoteNode({
  data,
}: NodeProps<EmotionNoteNodeData>) {
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
    </div>
  );
}
