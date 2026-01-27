"use client";

import type { ReactNode } from "react";
import { useEffect, useRef } from "react";
import ReactFlow, {
  Background,
  type Edge,
  type Node,
  type ReactFlowInstance,
} from "reactflow";
import "reactflow/dist/style.css";
import styles from "./EmotionGraphSection.module.css";
import EmotionNoteNode from "./nodes/EmotionNoteNode";

const NODE_TYPES = { emotion: EmotionNoteNode };

type EmotionGraphCanvasProps = {
  children?: ReactNode;
  graphKey: string;
  displayNodes: Node[];
  displayEdges: Edge[];
  isLoading: boolean;
  needsNote: boolean;
  emptyState: boolean;
  selectedNodeId: string | null;
  onClearSelection: () => void;
  onSelectNode: (nodeId: string) => void;
};

export default function EmotionGraphCanvas({
  children,
  graphKey,
  displayNodes,
  displayEdges,
  isLoading,
  needsNote,
  emptyState,
  selectedNodeId,
  onClearSelection,
  onSelectNode,
}: EmotionGraphCanvasProps) {
  const instanceRef = useRef<ReactFlowInstance | null>(null);
  const handleInit = (instance: ReactFlowInstance) => {
    instanceRef.current = instance;
    instance.setViewport({ x: 0, y: 0, zoom: 1 }, { duration: 0 });
  };

  useEffect(() => {
    if (!selectedNodeId) return;
    const instance = instanceRef.current;
    if (!instance) return;
    const node = displayNodes.find((item) => item.id === selectedNodeId);
    if (!node) return;
    const rawWidth = typeof node.style?.width === "number" ? node.style.width : Number(node.style?.width);
    const rawHeight = typeof node.style?.height === "number" ? node.style.height : Number(node.style?.height);
    const width = Number.isFinite(rawWidth) ? rawWidth : 0;
    const height = Number.isFinite(rawHeight) ? rawHeight : 0;
    const centerX = node.position.x + width / 2;
    const centerY = node.position.y + height / 2;
    instance.setCenter(centerX, centerY, { zoom: 1, duration: 600 });
  }, [displayNodes, selectedNodeId]);

  if (isLoading) {
    return (
      <div className={styles.graphCanvas}>
        <div className={styles.placeholder}>그래프를 불러오는 중...</div>
      </div>
    );
  }

  if (needsNote) {
    return (
      <div className={styles.graphCanvas}>
        <div className={styles.placeholder}>그래프로 볼 기록을 선택하세요.</div>
      </div>
    );
  }

  if (emptyState) {
    return (
      <div className={styles.graphCanvas}>
        <div className={styles.placeholder}>그래프로 묶을 기록이 없습니다.</div>
      </div>
    );
  }

  return (
    <div className={styles.graphCanvas}>
      <ReactFlow
        key={graphKey}
        nodes={displayNodes}
        edges={displayEdges}
        onInit={handleInit}
        onPaneClick={onClearSelection}
        onNodeClick={(_, node) => {
          onSelectNode(node.id);
        }}
        className={styles.graph}
        minZoom={0.2}
        maxZoom={1.6}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        proOptions={{ hideAttribution: true }}
        nodeTypes={NODE_TYPES}
      >
        <Background gap={24} size={1} color="rgba(154,160,166,0.25)" />
      </ReactFlow>
      {children}
    </div>
  );
}
