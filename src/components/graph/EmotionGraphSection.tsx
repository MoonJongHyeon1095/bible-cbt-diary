"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const { notes, middles, isLoading } = useEmotionGraphData({
    accessToken,
    groupId,
    noteId,
  });
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isDeepSelecting, setIsDeepSelecting] = useState(false);
  const [selectedSubIds, setSelectedSubIds] = useState<string[]>([]);
  const [rfInstance, setRfInstance] = useState<ReactFlowInstance | null>(null);
  const [detailSize, setDetailSize] = useState<{
    width: number;
    height: number;
  } | null>(null);
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
    detailSize,
  );
  const detailNodeId = selectedNodeId ? `detail-${selectedNodeId}` : null;

  useEffect(() => {
    if (
      selectedNodeId &&
      !notes.some((note) => String(note.id) === selectedNodeId)
    ) {
      setSelectedNodeId(null);
    }
    if (!selectedNodeId) {
      setIsDeepSelecting(false);
      setSelectedSubIds([]);
    }
  }, [notes, selectedNodeId]);

  useEffect(() => {
    setDetailSize(null);
  }, [selectedNodeId]);

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

  useEffect(() => {
    if (!rfInstance || !detailNodeId) {
      return;
    }
    const node = rfInstance.getNode(detailNodeId);
    if (!node) {
      return;
    }
    const width = node.width;
    const height = node.height;
    if (typeof width !== "number" || typeof height !== "number") {
      return;
    }
    setDetailSize((prev) => {
      if (!prev) {
        return { width, height };
      }
      if (
        Math.abs(prev.width - width) < 0.5 &&
        Math.abs(prev.height - height) < 0.5
      ) {
        return prev;
      }
      return { width, height };
    });
  }, [detailNodeId, displayNodes, rfInstance]);

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
  const mainNote = selectedNodeId
    ? notes.find((note) => String(note.id) === selectedNodeId) ?? null
    : null;
  const selectableNotes = notes.filter(
    (note) => String(note.id) !== selectedNodeId,
  );
  const sortedSelectableNotes = [...selectableNotes].sort(
    (a, b) => b.id - a.id,
  );

  const openDeep = () => {
    if (!selectedNodeId) return;
    if (!groupId) {
      router.push(`/session/deep?mainId=${selectedNodeId}`);
      return;
    }
    setSelectedSubIds([]);
    setIsDeepSelecting(true);
  };

  const handleToggleSub = (id: string) => {
    setSelectedSubIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      }
      if (prev.length >= 2) {
        return prev;
      }
      return [...prev, id];
    });
  };

  const canConfirmDeep = selectedSubIds.length >= 1;

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
              if (isDeepSelecting) {
                return;
              }
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
            onClick={openDeep}
          />
        ) : null}
        {isDeepSelecting && mainNote ? (
          <div className={styles.deepOverlay} role="dialog" aria-modal="true">
            <div className={styles.deepOverlayCard}>
              <div className={styles.deepOverlayHeader}>
                <div>
                  <p className={styles.deepOverlayLabel}>Go Deeper</p>
                  <h3 className={styles.deepOverlayTitle}>
                    함께 볼 노트를 선택하세요
                  </h3>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setIsDeepSelecting(false);
                    setSelectedSubIds([]);
                  }}
                >
                  닫기
                </Button>
              </div>
              <div className={styles.deepOverlayBody}>
                <div className={styles.deepOverlaySection}>
                  <p className={styles.deepOverlaySectionTitle}>Main</p>
                  <div className={styles.deepNoteCard}>
                    <span className={styles.deepNoteTitle}>
                      {mainNote.title || "감정 노트"}
                    </span>
                    <p className={styles.deepNoteText}>
                      {mainNote.trigger_text}
                    </p>
                    <span className={styles.deepNoteMeta}>
                      #{mainNote.id}
                    </span>
                  </div>
                </div>
                <div className={styles.deepOverlaySection}>
                  <p className={styles.deepOverlaySectionTitle}>
                    Sub (최대 2개 선택)
                  </p>
                  <div className={styles.deepNoteList}>
                    {sortedSelectableNotes.map((note) => {
                      const id = String(note.id);
                      const checked = selectedSubIds.includes(id);
                      return (
                        <button
                          key={note.id}
                          type="button"
                          className={`${styles.deepNotePick} ${
                            checked ? styles.deepNotePickActive : ""
                          }`}
                          onClick={() => handleToggleSub(id)}
                        >
                          <div>
                            <span className={styles.deepNoteTitle}>
                              {note.title || "감정 노트"}
                            </span>
                            <p className={styles.deepNoteText}>
                              {note.trigger_text}
                            </p>
                          </div>
                          <span className={styles.deepNoteMeta}>
                            #{note.id}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
              <div className={styles.deepOverlayFooter}>
                <span className={styles.deepOverlayHint}>
                  최소 1개, 최대 2개를 선택해주세요.
                </span>
                <Button
                  type="button"
                  onClick={() => {
                    if (!canConfirmDeep) return;
                    router.push(
                      `/session/deep?mainId=${selectedNodeId}&subIds=${selectedSubIds.join(
                        ",",
                      )}&groupId=${groupId}`,
                    );
                  }}
                  disabled={!canConfirmDeep}
                >
                  Deep Session 시작
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
