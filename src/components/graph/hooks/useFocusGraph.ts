"use client";

import { useMemo } from "react";
import type { Edge, Node } from "reactflow";
import type {
  EmotionNoteDetailItem,
  EmotionNoteDetailNodeData,
} from "../nodes/EmotionNoteDetailNode";
import type {
  EmotionNoteChip,
  EmotionNoteNodeData,
} from "../nodes/EmotionNoteNode";

type TimelineNode = Node<EmotionNoteNodeData & { note: { id: number } }>;

const splitChipsBySection = (chips: EmotionNoteChip[]) => ({
  emotion: chips.filter((chip) => chip.section === "emotion"),
  error: chips.filter((chip) => chip.section === "error"),
  alternative: chips.filter((chip) => chip.section === "alternative"),
  behavior: chips.filter((chip) => chip.section === "behavior"),
});

const buildDetailItems = (chips: EmotionNoteChip[]) => {
  const sections = splitChipsBySection(chips);
  const buildItems = (items: EmotionNoteChip[]): EmotionNoteDetailItem[] =>
    items.map((chip) => ({
      id: chip.id,
      label: chip.label,
      body: chip.body,
    }));
  return {
    emotion: buildItems(sections.emotion),
    error: buildItems(sections.error),
    alternative: buildItems(sections.alternative),
    behavior: buildItems(sections.behavior),
  };
};

export const useFocusGraph = (
  timelineNodes: TimelineNode[],
  timelineEdges: Edge[],
  selectedNodeId: string | null,
  centerOverride: { x: number; y: number } | null,
  detailSize: { width: number; height: number } | null,
) => {
  return useMemo(() => {
    if (!selectedNodeId) {
      return {
        displayNodes: timelineNodes.map((node) => ({
          ...node,
          selected: false,
        })),
        displayEdges: timelineEdges,
      };
    }

    const nodes = timelineNodes.map((node) => ({
      ...node,
      selected: node.id === selectedNodeId,
      style: {
        ...node.style,
        borderColor:
          node.id === selectedNodeId ? "var(--accent)" : "var(--border-strong)",
        boxShadow:
          node.id === selectedNodeId
            ? "0 0 0 3px rgba(143, 167, 200, 0.25)"
            : "none",
        zIndex: node.id === selectedNodeId ? 3 : 2,
      },
    }));

    const edges = timelineEdges;

    const selectedNode = timelineNodes.find(
      (node) => node.id === selectedNodeId,
    );
    const center = centerOverride
      ? centerOverride
      : selectedNode
        ? {
            x: selectedNode.position.x + selectedNode.data.size / 2,
            y: selectedNode.position.y + selectedNode.data.size / 2,
          }
        : { x: 0, y: 0 };
    const radius = selectedNode ? selectedNode.data.size / 2 : 55;
    const detailWidth = detailSize?.width ?? 280;
    const detailHeight = detailSize?.height ?? 320;
    const detailDistance = radius + 100;
    const detailAngle = (210 * Math.PI) / 180;
    const detailCenter = {
      x: center.x + Math.cos(detailAngle) * detailDistance,
      y: center.y + Math.sin(detailAngle) * detailDistance,
    };
    const detailItems = buildDetailItems(selectedNode?.data.chips ?? []);
    const detailNodeId = `detail-${selectedNodeId}`;
    const detailNodes: Node<EmotionNoteDetailNodeData>[] = [
      {
        id: detailNodeId,
        type: "detail",
        position: {
          x: detailCenter.x - detailWidth / 2,
          y: detailCenter.y - detailHeight / 2,
        },
        data: {
          items: detailItems,
        },
        draggable: false,
        selectable: false,
        style: {
          width: detailWidth,
        },
      },
    ];

    return {
      displayNodes: [...nodes, ...detailNodes],
      displayEdges: edges,
    };
  }, [
    centerOverride,
    detailSize,
    selectedNodeId,
    timelineEdges,
    timelineNodes,
  ]);
};
