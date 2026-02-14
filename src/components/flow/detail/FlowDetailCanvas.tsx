"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useRef } from "react";
import ReactFlow, {
  Background,
  type Edge,
  type Node,
} from "reactflow";
import "reactflow/dist/style.css";
import styles from "./FlowDetailSection.module.css";
import FlowDetailNode from "./nodes/FlowDetailNode";
import { useFlowDetailCentering } from "./hooks/useFlowDetailCentering";
import { useFlowDetailViewport } from "./hooks/useFlowDetailViewport";

// ReactFlow node/edge component registries.
const NODE_TYPES = { emotion: FlowDetailNode };
const EDGE_TYPES = {};

// Props for the canvas wrapper around ReactFlow.
type FlowDetailCanvasProps = {
  children?: ReactNode;
  flowKey: string;
  displayNodes: Node[];
  displayEdges: Edge[];
  axisLabels: { id: string; x: number; label: string }[];
  axisY: number | null;
  isLoading: boolean;
  needsNote: boolean;
  emptyState: boolean;
  autoCenterNodeId?: string | null;
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

export default function FlowDetailCanvas({
  children,
  flowKey,
  displayNodes,
  displayEdges,
  axisLabels = [],
  axisY = null,
  isLoading,
  needsNote,
  emptyState,
  autoCenterNodeId,
  onClearSelection,
  onSelectNode,
}: FlowDetailCanvasProps) {
  const { instanceRef, viewport, handleInit, handleMove } =
    useFlowDetailViewport();
  const { centerOnNode } = useFlowDetailCentering({
    displayNodes,
    instanceRef,
  });
  const handledAutoCenterRef = useRef<string | null>(null);
  const pendingCenterRef = useRef<string | null>(null);

  const selectAndCenter = useCallback(
    (nodeId: string) => {
      onSelectNode(nodeId);
      centerOnNode(nodeId);
    },
    [centerOnNode, onSelectNode],
  );

  useEffect(() => {
    if (!autoCenterNodeId) return;
    if (handledAutoCenterRef.current === autoCenterNodeId) return;
    if (!displayNodes.some((node) => node.id === autoCenterNodeId)) return;
    pendingCenterRef.current = autoCenterNodeId;
    selectAndCenter(autoCenterNodeId);
    handledAutoCenterRef.current = autoCenterNodeId;
  }, [autoCenterNodeId, displayNodes, selectAndCenter]);

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
        {children}
      </div>
    );
  }

  return (
    <div className={styles.flowCanvas}>
      <ReactFlow
        key={flowKey}
        nodes={displayNodes}
        edges={displayEdges}
        onInit={(instance) => {
          handleInit(instance);
          const pending = pendingCenterRef.current;
          if (!pending) return;
          if (!displayNodes.some((node) => node.id === pending)) return;
          requestAnimationFrame(() => {
            centerOnNode(pending);
          });
        }}
        onMove={handleMove}
        onPaneClick={onClearSelection}
        onNodeClick={(_, node) => {
          selectAndCenter(node.id);
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
