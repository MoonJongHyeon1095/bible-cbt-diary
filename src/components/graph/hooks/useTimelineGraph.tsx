"use client";

import { useMemo } from "react";
import type { Edge, Node } from "reactflow";
import { MarkerType } from "reactflow";
import type { EmotionNote, EmotionNoteMiddle } from "@/lib/types";
import type { EmotionNoteChip, EmotionNoteNodeData } from "../nodes/EmotionNoteNode";
import styles from "../EmotionGraphSection.module.css";

type NodeMeta = EmotionNoteNodeData & { note: EmotionNote };

const truncateText = (value: string, maxLength: number) => {
  const trimmed = value.trim();
  if (trimmed.length <= maxLength) return trimmed;
  return `${trimmed.slice(0, Math.max(0, maxLength - 3)).trim()}...`;
};

const buildInDegreeMap = (middles: EmotionNoteMiddle[]) => {
  const map = new Map<number, number>();
  middles.forEach((middle) => {
    const count = map.get(middle.to_note_id) ?? 0;
    map.set(middle.to_note_id, count + 1);
  });
  return map;
};

const buildChips = (note: EmotionNote): EmotionNoteChip[] => {
  const chips: EmotionNoteChip[] = [];
  (note.thought_details ?? []).forEach((detail) => {
    chips.push({
      id: `emotion-${detail.id}`,
      label: detail.emotion || "감정",
      body: detail.automatic_thought || "",
      section: "emotion",
    });
  });
  (note.error_details ?? []).forEach((detail) => {
    chips.push({
      id: `error-${detail.id}`,
      label: detail.error_label || "인지 오류",
      body: detail.error_description || "",
      section: "error",
    });
  });
  (note.alternative_details ?? []).forEach((detail) => {
    const label = truncateText(detail.alternative || "대안사고", 32);
    chips.push({
      id: `alternative-${detail.id}`,
      label: label || "대안사고",
      body: detail.alternative || "",
      section: "alternative",
    });
  });
  (note.behavior_details ?? []).forEach((detail) => {
    chips.push({
      id: `behavior-${detail.id}`,
      label: detail.behavior_label || "행동",
      body: detail.behavior_description || "",
      section: "behavior",
    });
  });
  return chips;
};

export const useTimelineGraph = (
  notes: EmotionNote[],
  middles: EmotionNoteMiddle[],
  elkPositions: Map<string, { x: number; y: number }>,
  getNodeSize: (noteId: number, map: Map<number, number>) => number,
) => {
  return useMemo(() => {
    const inDegreeMap = buildInDegreeMap(middles);
    const sorted = [...notes].sort((a, b) => a.id - b.id);
    const laneCount = Math.min(5, Math.max(1, Math.ceil(Math.sqrt(sorted.length))));
    const xGap = 220;
    const yGap = 180;

    const nodes: Node<NodeMeta>[] = sorted.map((note, index) => {
      const size = getNodeSize(note.id, inDegreeMap);
      const labelText =
        note.title?.trim() || note.trigger_text?.trim() || "감정 노트";
      const label = (
        <div className={styles.nodeLabel}>
          <span className={styles.nodeTitle}>{labelText}</span>
          <span className={styles.nodeMeta}>#{note.id}</span>
        </div>
      );
      const elkPosition = elkPositions.get(String(note.id));
      const baseX = elkPosition?.x ?? index * xGap;
      const baseY = elkPosition?.y ?? (index % laneCount) * yGap;
      return {
        id: String(note.id),
        type: "emotion",
        position: {
          x: baseX,
          y: baseY,
        },
        data: { note, label, size, chips: buildChips(note) },
        className: styles.node,
        style: {
          width: size,
          height: size,
          borderRadius: 999,
          zIndex: 2,
        },
      };
    });

    const nodeIdSet = new Set(nodes.map((node) => node.id));
    const edges: Edge[] = middles
      .filter(
        (middle) =>
          nodeIdSet.has(String(middle.from_note_id)) &&
          nodeIdSet.has(String(middle.to_note_id)),
      )
      .map((middle) => ({
        id: `edge-${middle.id}`,
        source: String(middle.from_note_id),
        target: String(middle.to_note_id),
        type: "smoothstep",
        sourceHandle: "right",
        targetHandle: "left",
        markerEnd: { type: MarkerType.ArrowClosed },
        style: { stroke: "var(--border-strong)", strokeWidth: 1.5 },
      }));

    return { timelineNodes: nodes, timelineEdges: edges };
  }, [notes, middles, elkPositions, getNodeSize]);
};
