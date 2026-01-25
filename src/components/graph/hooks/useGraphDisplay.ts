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

    const displayNodes = timelineNodes.map((node) => ({
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

    return {
      displayNodes,
      displayEdges: timelineEdges,
    };
  }, [selectedNodeId, timelineEdges, timelineNodes]);
};
