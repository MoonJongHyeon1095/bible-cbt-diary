"use client";

import { useEffect, useMemo, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  type ReactFlowInstance,
} from "reactflow";
import "reactflow/dist/style.css";
import Button from "@/components/ui/Button";
import FloatingActionButton from "@/components/common/FloatingActionButton";
import { Route } from "lucide-react";
import EmotionNoteNode from "./nodes/EmotionNoteNode";
import EmotionNoteDetailNode from "./nodes/EmotionNoteDetailNode";
import styles from "./EmotionGraphSection.module.css";
import { useEmotionGraphData } from "./hooks/useEmotionGraphData";
import { useElkLayout } from "./hooks/useElkLayout";
import { useTimelineGraph } from "./hooks/useTimelineGraph";
import { useFocusGraph } from "./hooks/useFocusGraph";

type EmotionGraphSectionProps = {
  accessToken: string;
  noteId: number | null;
  groupId: number | null;
};

export default function EmotionGraphSection({
  accessToken,
  noteId,
  groupId,
}: EmotionGraphSectionProps) {
  const { notes, middles, isLoading } = useEmotionGraphData({
    accessToken,
    groupId,
    noteId,
  });
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [rfInstance, setRfInstance] = useState<ReactFlowInstance | null>(null);
  const [selectedCenter, setSelectedCenter] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const { elkPositions, getNodeSize } = useElkLayout(notes, middles);
  const { timelineNodes, timelineEdges } = useTimelineGraph(
    notes,
    middles,
    elkPositions,
    getNodeSize,
  );
  const { displayNodes, displayEdges } = useFocusGraph(
    timelineNodes,
    timelineEdges,
    selectedNodeId,
    selectedCenter,
  );

  useEffect(() => {
    if (
      selectedNodeId &&
      !notes.some((note) => String(note.id) === selectedNodeId)
    ) {
      setSelectedNodeId(null);
    }
  }, [notes, selectedNodeId]);

  useEffect(() => {
    if (!rfInstance || !selectedNodeId) {
      return;
    }
    const node = rfInstance.getNode(selectedNodeId);
    if (!node) {
      return;
    }
    const position = node.positionAbsolute ?? node.position;
    const width = node.width ?? 0;
    const height = node.height ?? 0;
    const nextCenter = {
      x: position.x + width / 2,
      y: position.y + height / 2,
    };
    setSelectedCenter((prev) => {
      if (!prev) {
        return nextCenter;
      }
      if (
        Math.abs(prev.x - nextCenter.x) < 0.5 &&
        Math.abs(prev.y - nextCenter.y) < 0.5
      ) {
        return prev;
      }
      return nextCenter;
    });
  }, [displayNodes, rfInstance, selectedNodeId]);

  const nodeTypes = useMemo(
    () => ({ emotion: EmotionNoteNode, detail: EmotionNoteDetailNode }),
    [],
  );

  useEffect(() => {
    if (!rfInstance || displayNodes.length === 0) {
      return;
    }
    rfInstance.fitView({ padding: 0.25, duration: 450 });
  }, [displayNodes, rfInstance, selectedNodeId]);

  const emptyState = !isLoading && notes.length === 0;
  const needsNote = !isLoading && !noteId && !groupId;

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <div>
          <p className={styles.label}>감정 그래프</p>
          <h2 className={styles.title}>시간 흐름 DAG</h2>
          <p className={styles.hint}>
            노드를 누르면 1~2 hop 관계를 좌우 링으로 보여줍니다.
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          onClick={() => setSelectedNodeId(null)}
          disabled={!selectedNodeId}
        >
          전체 보기
        </Button>
      </div>

      <div className={styles.graphShell}>
        {isLoading ? (
          <div className={styles.placeholder}>그래프를 불러오는 중...</div>
        ) : needsNote ? (
          <div className={styles.placeholder}>
            그래프로 볼 기록을 선택하세요.
          </div>
        ) : emptyState ? (
          <div className={styles.placeholder}>그래프로 묶을 기록이 없습니다.</div>
        ) : (
          <ReactFlow
            nodes={displayNodes}
            edges={displayEdges}
            onInit={setRfInstance}
            onPaneClick={() => {
              setSelectedNodeId(null);
              setSelectedCenter(null);
            }}
            onNodeClick={(_, node) => {
              if (node.type === "detail") {
                return;
              }
              if (selectedNodeId === node.id) {
                setSelectedNodeId(null);
                setSelectedCenter(null);
                return;
              }
              setSelectedNodeId(node.id);
            }}
            fitView
            className={styles.graph}
            minZoom={0.2}
            maxZoom={1.6}
            proOptions={{ hideAttribution: true }}
            nodeTypes={nodeTypes}
          >
            <Background gap={24} size={1} color="rgba(154,160,166,0.25)" />
            <Controls />
          </ReactFlow>
        )}
        {selectedNodeId ? (
          <FloatingActionButton
            label="Go Deeper"
            helperText="Go Deeper"
            icon={<Route size={20} />}
            onClick={() => {}}
          />
        ) : null}
      </div>
    </section>
  );
}
