"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import ReactFlow, {
  Background,
  type Edge,
  type Node,
  type ReactFlowInstance,
} from "reactflow";
import "reactflow/dist/style.css";
import styles from "./EmotionNoteFlowSection.module.css";
import EmotionNoteFlowNode from "./nodes/EmotionNoteFlowNode";

// ReactFlow node/edge component registries.
const NODE_TYPES = { emotion: EmotionNoteFlowNode };
const EDGE_TYPES = {};

// Props for the canvas wrapper around ReactFlow.
type EmotionNoteFlowCanvasProps = {
  children?: ReactNode;
  flowKey: string;
  displayNodes: Node[];
  displayEdges: Edge[];
  axisLabels: { id: string; x: number; label: string }[];
  axisY: number | null;
  isLoading: boolean;
  needsNote: boolean;
  emptyState: boolean;
  selectedNodeId: string | null;
  focusNodeId?: string | null;
  focusToken?: number;
  onClearSelection: () => void;
  onSelectNode: (nodeId: string) => void;
};

// Axis overlay inputs are computed in world coordinates by the layout hook.
type AxisLayerProps = {
  axisLabels: { id: string; x: number; label: string }[];
  axisY: number | null;
  viewport: { x: number; y: number; zoom: number };
};

// Render X-axis labels in screen coordinates by converting from world coords.
const AxisLayer = ({ axisLabels, axisY, viewport }: AxisLayerProps) => {
  if (axisY === null || axisLabels.length === 0) {
    return null;
  }
  const axisPadding = 36;
  const { x, y, zoom } = viewport;
  const screenPoints = axisLabels
    .map((item) => ({
      id: item.id,
      label: item.label,
      x: item.x * zoom + x,
    }))
    .filter((item) => Number.isFinite(item.x));
  if (screenPoints.length === 0) {
    return null;
  }
  const positions = screenPoints.map((item) => item.x);
  const minX = Math.min(...positions);
  const maxX = Math.max(...positions);
  const lineWidth = Math.max(0, maxX - minX);
  const screenY = axisY * zoom + y;

  return (
    <div className={styles.axisLayer} style={{ top: screenY }}>
      <div
        className={styles.axisLine}
        style={{
          left: minX - axisPadding,
          width: lineWidth + axisPadding * 2,
        }}
      />
      {screenPoints.map((item) => (
        <div
          key={item.id}
          className={styles.axisTick}
          style={{ left: item.x }}
        >
          <span className={styles.axisLabel}>{item.label}</span>
        </div>
      ))}
    </div>
  );
};

export default function EmotionNoteFlowCanvas({
  children,
  flowKey,
  displayNodes,
  displayEdges,
  axisLabels = [],
  axisY = null,
  isLoading,
  needsNote,
  emptyState,
  selectedNodeId,
  focusNodeId,
  focusToken,
  onClearSelection,
  onSelectNode,
}: EmotionNoteFlowCanvasProps) {
  const instanceRef = useRef<ReactFlowInstance | null>(null);
  const pendingFocusRef = useRef<string | null>(null);
  // Viewport state is the single source of truth for pan/zoom.
  const [viewport, setViewport] = useState({ x: 0, y: 0, zoom: 1 });
  const centerOnNode = useCallback(
    (nodeId: string) => {
      const instance = instanceRef.current;
      if (!instance) {
        pendingFocusRef.current = nodeId;
        return;
      }
      const node = displayNodes.find((item) => item.id === nodeId);
      if (!node) {
        pendingFocusRef.current = nodeId;
        return;
      }
      const rawWidth =
        typeof node.style?.width === "number"
          ? node.style.width
          : Number(node.style?.width);
      const rawHeight =
        typeof node.style?.height === "number"
          ? node.style.height
          : Number(node.style?.height);
      const width = Number.isFinite(rawWidth) ? rawWidth : 0;
      const height = Number.isFinite(rawHeight) ? rawHeight : 0;
      const centerX = node.position.x + width / 2;
      const centerY = node.position.y + height / 2;
      instance.setCenter(centerX, centerY, { zoom: 1, duration: 600 });
      pendingFocusRef.current = null;
    },
    [displayNodes],
  );
  // Capture the ReactFlow instance and initialize a known viewport.
  const handleInit = (instance: ReactFlowInstance) => {
    instanceRef.current = instance;
    instance.setViewport({ x: 0, y: 0, zoom: 1 }, { duration: 0 });
    setViewport(instance.getViewport());
    if (pendingFocusRef.current) {
      centerOnNode(pendingFocusRef.current);
    }
  };
  // Keep viewport state in sync while the user pans/zooms.
  const handleMove = useCallback(
    (_: unknown, nextViewport: { x: number; y: number; zoom: number }) => {
      setViewport(nextViewport);
    },
    [],
  );

  // If a node is selected, center it to keep focus.
  useEffect(() => {
    const targetId = focusNodeId ?? selectedNodeId;
    if (!targetId) return;
    centerOnNode(targetId);
  }, [centerOnNode, focusNodeId, focusToken, selectedNodeId]);

  // Loading/empty UI branches render outside ReactFlow.
  if (isLoading) {
    return (
      <div className={styles.flowCanvas}>
        <div className={styles.placeholder}>플로우를 불러오는 중...</div>
      </div>
    );
  }

  if (needsNote) {
    return (
      <div className={styles.flowCanvas}>
        <div className={styles.placeholder}>플로우로 볼 기록을 선택하세요.</div>
      </div>
    );
  }

  // Axis overlay uses viewport to convert world X/Y into screen X/Y.
  const axis = (
    <AxisLayer axisLabels={axisLabels} axisY={axisY} viewport={viewport} />
  );

  if (emptyState) {
    return (
      <div className={styles.flowCanvas}>
        <div className={styles.placeholder}>플로우로 묶을 기록이 없습니다.</div>
      </div>
    );
  }

  return (
    <div className={styles.flowCanvas}>
      <ReactFlow
        key={flowKey}
        nodes={displayNodes}
        edges={displayEdges}
        onInit={handleInit}
        onMove={handleMove}
        onPaneClick={onClearSelection}
        onNodeClick={(_, node) => {
          onSelectNode(node.id);
        }}
        className={styles.flow}
        minZoom={0.2}
        maxZoom={1.6}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        proOptions={{ hideAttribution: true }}
        nodeTypes={NODE_TYPES}
        edgeTypes={EDGE_TYPES}
      >
        {/* Grid background and axis overlay are rendered within the ReactFlow tree. */}
        <Background gap={24} size={1} color="rgba(154,160,166,0.25)" />
        {axis}
      </ReactFlow>
      {/* Overlay children like FABs and detail stack sit above the canvas. */}
      {children}
    </div>
  );
}
