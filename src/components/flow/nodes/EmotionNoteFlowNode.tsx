"use client";

import type { ReactNode } from "react";
import { Handle, Position, type NodeProps } from "reactflow";
import styles from "../EmotionNoteFlowSection.module.css";
import type { EmotionMontage } from "@/lib/types/emotionNoteTypes";
import { Video } from "lucide-react";
import type { CSSProperties } from "react";
import { useLayoutEffect, useRef, useState } from "react";

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
  montages?: EmotionMontage[];
  onOpenMontage?: (montage: EmotionMontage) => void;
};

export default function EmotionNoteFlowNode({
  data,
  selected,
}: NodeProps<EmotionNoteFlowNodeData>) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [nodeSize, setNodeSize] = useState({ width: 0, height: 0 });
  const montages = data.montages ?? [];
  const montageCount = montages.length;
  const baseRadius = Math.max(
    80,
    Math.max(nodeSize.width, nodeSize.height) / 2 + 32,
  );
  const spreadDegrees = Math.min(190, 80 + Math.max(0, montageCount - 2) * 18);
  const radius = baseRadius + Math.min(56, Math.max(0, montageCount - 3) * 10);
  const startAngle = montageCount <= 1 ? 0 : -spreadDegrees / 2;
  const stepAngle = montageCount <= 1 ? 0 : spreadDegrees / (montageCount - 1);

  useLayoutEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const updateSize = () => {
      const rect = element.getBoundingClientRect();
      setNodeSize((prev) => {
        if (prev.width === rect.width && prev.height === rect.height) {
          return prev;
        }
        return { width: rect.width, height: rect.height };
      });
    };

    updateSize();

    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(() => updateSize());
      observer.observe(element);
      return () => observer.disconnect();
    }

    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  return (
    <div className={styles.nodeContent} ref={containerRef}>
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
      {montageCount === 1 ? (
        <button
          type="button"
          className={styles.nodeMontageButton}
          onClick={(event) => {
            event.stopPropagation();
            data.onOpenMontage?.(montages[0]);
          }}
          aria-label="몽타주 보기"
        >
          <Video size={32} />
        </button>
      ) : null}
      {montageCount > 1
        ? montages.map((montage, index) => {
            const angle = (startAngle + stepAngle * index) * (Math.PI / 180);
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            const style = {
              ["--montage-x" as string]: `${x}px`,
              ["--montage-y" as string]: `${y}px`,
            } satisfies CSSProperties;
            return (
              <button
                key={montage.id}
                type="button"
                className={`${styles.nodeMontageButton} ${styles.nodeMontageOrbitalButton}`}
                style={style}
                onClick={(event) => {
                  event.stopPropagation();
                  data.onOpenMontage?.(montage);
                }}
                aria-label={`몽타주 보기 ${index + 1}`}
              >
                <Video size={28} />
              </button>
            );
          })
        : null}
      {selected ? (
        <div className={styles.nodeTooltip} role="status" aria-live="polite">
          <div className={styles.nodeTooltipTitle}>{data.titleText}</div>
          <div className={styles.nodeTooltipBody}>{data.triggerText}</div>
        </div>
      ) : null}
    </div>
  );
}
