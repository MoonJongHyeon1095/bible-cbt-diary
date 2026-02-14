"use client";

import type { EmotionMontage } from "@/lib/types/emotionNoteTypes";
import { useMemo } from "react";
import type { Edge, Node } from "reactflow";
import type { FlowDetailNodeData } from "../nodes/FlowDetailNode";
import styles from "../FlowDetailSection.module.css";

export const useFlowDetailDisplay = (
  timelineNodes: Node<FlowDetailNodeData>[],
  timelineEdges: Edge[],
  selectedNodeId: string | null,
  options?: {
    montageByNoteId?: Map<string, EmotionMontage[]>;
    onOpenMontage?: (montage: EmotionMontage) => void;
  },
) => {
  const baseNodes = useMemo(() => {
    const montageByNoteId = options?.montageByNoteId;
    const onOpenMontage = options?.onOpenMontage;

    return timelineNodes.map((node) => ({
      ...node,
      data: {
        ...node.data,
        montages: montageByNoteId?.get(node.id) ?? [],
        onOpenMontage,
      },
      selected: false,
      className: node.className,
    }));
  }, [options?.montageByNoteId, options?.onOpenMontage, timelineNodes]);

  return useMemo(() => {
    if (!selectedNodeId) {
      return {
        displayNodes: baseNodes,
        displayEdges: timelineEdges,
      };
    }

    const displayNodes = baseNodes.map((node) => {
      const isSelected = node.id === selectedNodeId;
      return {
        ...node,
        selected: isSelected,
        className: isSelected
          ? `${node.className ?? ""} ${styles.nodeSelected}`.trim()
          : node.className,
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
  }, [baseNodes, selectedNodeId, timelineEdges]);
};
