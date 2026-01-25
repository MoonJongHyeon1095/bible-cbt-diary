"use client";

import type { ReactNode } from "react";
import ReactFlow, {
  Background,
  type Edge,
  type Node,
  type ReactFlowInstance,
} from "reactflow";
import "reactflow/dist/style.css";
import styles from "./EmotionGraphSection.module.css";
import EmotionNoteNode from "./nodes/EmotionNoteNode";

type EmotionGraphCanvasProps = {
  children?: ReactNode;
  graphKey: string;
  displayNodes: Node[];
  displayEdges: Edge[];
  isLoading: boolean;
  needsNote: boolean;
  emptyState: boolean;
  isDeepSelecting: boolean;
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
  isDeepSelecting,
  onClearSelection,
  onSelectNode,
}: EmotionGraphCanvasProps) {
  const handleInit = (instance: ReactFlowInstance) => {
    instance.setViewport({ x: 0, y: 0, zoom: 1 }, { duration: 0 });
  };


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
          if (isDeepSelecting) {
            return;
          }
          onSelectNode(node.id);
        }}
        className={styles.graph}
        minZoom={0.2}
        maxZoom={1.6}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        proOptions={{ hideAttribution: true }}
        nodeTypes={{ emotion: EmotionNoteNode }}
      >
        <Background gap={24} size={1} color="rgba(154,160,166,0.25)" />
      </ReactFlow>
      {children}
    </div>
  );
}
