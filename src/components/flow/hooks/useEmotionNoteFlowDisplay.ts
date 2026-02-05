"use client";

import { useMemo } from "react";
import type { Edge, Node } from "reactflow";
import type { EmotionNoteFlowNodeData } from "../nodes/EmotionNoteFlowNode";

type TimelineNode = Node<EmotionNoteFlowNodeData & { note: { id: number } }>;

export const useEmotionNoteFlowDisplay = (
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
          opacity: 1,
          zIndex: isSelected ? 3 : 2,
        },
      };
    });

    const displayEdges = timelineEdges.map((edge) => {
      const isConnected =
        edge.source === selectedNodeId || edge.target === selectedNodeId;
      return {
        ...edge,
        style: {
          ...edge.style,
          stroke: isConnected ? "var(--accent)" : edge.style?.stroke,
          strokeWidth: isConnected ? 3.2 : edge.style?.strokeWidth ?? 2,
          opacity: isConnected ? 1 : 0.2,
        },
      };
    });

    return {
      displayNodes,
      displayEdges,
    };
  }, [selectedNodeId, timelineEdges, timelineNodes]);
};
