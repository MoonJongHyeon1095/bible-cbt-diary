"use client";

import { useMemo } from "react";
import type { Edge, Node } from "reactflow";
import type { EmotionNoteNodeData } from "../nodes/EmotionNoteNode";

type TimelineNode = Node<EmotionNoteNodeData & { note: { id: number } }>;

export const useGraphDisplay = (
  timelineNodes: TimelineNode[],
  timelineEdges: Edge[],
  selectedNodeId: string | null,
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

    const displayNodes = timelineNodes.map((node) => {
      const isSelected = node.id === selectedNodeId;
      return {
        ...node,
        selected: isSelected,
        style: {
          ...node.style,
          borderColor: isSelected ? "var(--accent)" : "var(--border-strong)",
          borderWidth: isSelected ? 2 : 1,
          boxShadow: isSelected
            ? "0 0 0 6px rgba(143, 167, 200, 0.25), 0 16px 32px rgba(0, 0, 0, 0.28)"
            : "none",
          opacity: isSelected ? 1 : 0.6,
          zIndex: isSelected ? 3 : 2,
        },
      };
    });

    return {
      displayNodes,
      displayEdges: timelineEdges,
    };
  }, [selectedNodeId, timelineEdges, timelineNodes]);
};
