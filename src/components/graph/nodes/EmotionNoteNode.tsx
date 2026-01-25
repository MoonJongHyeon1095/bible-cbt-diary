"use client";

import type { ReactNode } from "react";
import { Handle, Position, type NodeProps } from "reactflow";
import type { EmotionNoteDetailSection } from "./EmotionNoteDetailNode";
import styles from "../EmotionGraphSection.module.css";

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
      <Handle
        type="source"
        position={Position.Top}
        id="detail-source"
        className={`${styles.graphHandle} ${styles.graphHandleCenter}`}
      />
      {data.label}
    </div>
  );
}
