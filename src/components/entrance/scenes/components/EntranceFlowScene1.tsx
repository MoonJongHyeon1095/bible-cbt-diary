"use client";

import FloatingActionButton from "@/components/common/FloatingActionButton";
import type { FlowDetailNodeData } from "@/components/flow/detail/nodes/FlowDetailNode";
import { Route } from "lucide-react";
import type { Edge, Node } from "reactflow";
import styles from "../../EntranceOverlay.module.css";
import EntranceFlowCanvas from "../../flow/EntranceFlowCanvas";
import type { EntranceScene } from "../types";

type EntranceFlowSceneProps = {
  scene: EntranceScene;
  nodes: Node<FlowDetailNodeData>[];
  edges: Edge[];
  isGoDeeperVisible: boolean;
  onGoDeeper: () => void;
};

export default function EntranceFlowScene1({
  scene,
  nodes,
  edges,
  isGoDeeperVisible,
  onGoDeeper,
}: EntranceFlowSceneProps) {
  const narrationLineCount = scene.narration.split("\n").length;
  const narrationLineClassName =
    narrationLineCount >= 3
      ? styles.narrationThreeLines
      : narrationLineCount === 2
        ? styles.narrationTwoLines
        : "";
  const shouldHideNarration = scene.showGoDeeper && isGoDeeperVisible;

  return (
    <div className={styles.sceneWrap}>
      <div className={styles.canvasArea}>
        <EntranceFlowCanvas
          nodes={nodes}
          edges={edges}
          cameraMode={scene.camera}
          cameraNodeId={scene.selectedNodeId}
          cameraSignal={scene.id}
        />

        {scene.showGoDeeper && isGoDeeperVisible ? (
          <>
            <div className={styles.deepHint}>Go Deeper를 눌러주세요.</div>
            <FloatingActionButton
              label="Go Deeper"
              helperText="Go Deeper"
              icon={<Route size={20} />}
              className={styles.deepFab}
              onClick={onGoDeeper}
              style={{
                backgroundColor: "#121417",
                color: "#fff",
                borderColor: "rgba(255, 255, 255, 0.35)",
              }}
            />
          </>
        ) : null}
      </div>

      {!shouldHideNarration ? (
        <div className={`${styles.narration} ${narrationLineClassName}`.trim()}>
          <div className={styles.narrationCard}>
            <p className={styles.narrationText}>{scene.narration}</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
