"use client";

import type { FlowDetailNodeData } from "@/components/flow/detail/nodes/FlowDetailNode";
import FlowDetailNode from "@/components/flow/detail/nodes/FlowDetailNode";
import { useCallback, useEffect, useRef } from "react";
import ReactFlow, { Background, type Edge, type Node, type ReactFlowInstance } from "reactflow";
import "reactflow/dist/style.css";
import styles from "../EntranceOverlay.module.css";

const NODE_TYPES = { emotion: FlowDetailNode };

type EntranceFlowCanvasProps = {
  nodes: Node<FlowDetailNodeData>[];
  edges: Edge[];
  cameraMode: "center" | "overview" | "none";
  cameraNodeId: string | null;
  cameraSignal: string;
};

const centerOnNode = (
  instance: ReactFlowInstance,
  nodes: Node<FlowDetailNodeData>[],
  nodeId: string,
) => {
  const node = nodes.find((item) => item.id === nodeId);
  if (!node) return;
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
  instance.setCenter(node.position.x + width / 2, node.position.y + height / 2, {
    zoom: 1.04,
    duration: 760,
  });
};

export default function EntranceFlowCanvas({
  nodes,
  edges,
  cameraMode,
  cameraNodeId,
  cameraSignal,
}: EntranceFlowCanvasProps) {
  const instanceRef = useRef<ReactFlowInstance | null>(null);
  const applyCamera = useCallback(
    (instance: ReactFlowInstance) => {
      if (cameraMode === "overview") {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            instance.fitView({
              duration: 920,
              padding: 0.42,
              maxZoom: 0.74,
              nodes: nodes.map((node) => ({ id: node.id })),
            });
          });
        });
        return;
      }

      if (cameraMode === "center" && cameraNodeId) {
        requestAnimationFrame(() => {
          centerOnNode(instance, nodes, cameraNodeId);
        });
      }
    },
    [cameraMode, cameraNodeId, nodes],
  );

  useEffect(() => {
    const instance = instanceRef.current;
    if (!instance) return;
    applyCamera(instance);
  }, [applyCamera, cameraSignal]);

  return (
    <div className={styles.flowCanvasFrame}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onInit={(instance) => {
          instanceRef.current = instance;
          instance.setViewport({ x: 0, y: 0, zoom: 1 }, { duration: 0 });
          applyCamera(instance);
        }}
        nodeTypes={NODE_TYPES}
        proOptions={{ hideAttribution: true }}
        minZoom={0.2}
        maxZoom={1.6}
        nodesDraggable={false}
        elementsSelectable={false}
        zoomOnDoubleClick={false}
        zoomOnScroll
        zoomOnPinch
        panOnDrag
        panOnScroll={false}
        className={styles.flowCanvasInner}
      >
        <Background gap={24} size={1} color="rgba(154,160,166,0.25)" />
      </ReactFlow>
    </div>
  );
}
