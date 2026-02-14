"use client";

import { useCbtToast } from "@/components/session/common/CbtToast";
import FloatingActionButton from "@/components/common/FloatingActionButton";
import { useModalOpen } from "@/components/common/useModalOpen";
import SafeButton from "@/components/ui/SafeButton";
import { deleteEmotionFlow } from "@/lib/api/flow/deleteEmotionFlow";
import { fetchEmotionFlowList } from "@/lib/api/flow/getEmotionNoteFlow";
import { queryKeys } from "@/lib/queryKeys";
import type { AccessContext } from "@/lib/types/access";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  forceCenter,
  forceCollide,
  forceManyBody,
  forceSimulation,
} from "d3-force";
import { Route, Trash2, Waypoints } from "lucide-react";
import { useRouter } from "next/navigation";
import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./EmotionNoteFlowGroupList.module.css";
import { getFlowThemeColor } from "./utils/flowColors";

type EmotionNoteFlowGroupListProps = {
  access: AccessContext;
  noteId?: number | null;
};

type GroupNode = {
  id: number;
  noteCount: number;
  title: string;
  description: string | null;
  radius: number;
  color: string;
  rgb: [number, number, number];
  x: number;
  y: number;
};

const buildNodes = (
  flows: {
    id: number;
    note_count: number;
    title: string;
    description: string | null;
  }[],
) => {
  const minRadius = 36 + Math.min(90, 2 * 6);
  return flows.map((flow) => {
    const radius = Math.max(minRadius, 36 + Math.min(90, flow.note_count * 6));
    const theme = getFlowThemeColor(flow.id);
    return {
      id: flow.id,
      noteCount: flow.note_count,
      title: flow.title ?? "",
      description: flow.description ?? null,
      radius,
      color: theme.rgbString,
      rgb: theme.rgb,
      x: 0,
      y: 0,
    };
  });
};

const seedNodes = (
  flows: {
    id: number;
    note_count: number;
    title: string;
    description: string | null;
  }[],
  prevNodes: GroupNode[],
  size: { width: number; height: number },
) => {
  const seeded = buildNodes(flows);
  const prevById = new Map(prevNodes.map((node) => [node.id, node]));
  const width = size.width || 320;
  const height = size.height || 520;
  const centerX = width / 2;
  const centerY = height / 2;
  const jitter = Math.min(80, Math.max(30, Math.min(width, height) * 0.12));

  return seeded.map((node) => {
    const prev = prevById.get(node.id);
    if (prev) {
      return { ...node, x: prev.x, y: prev.y };
    }
    return {
      ...node,
      x: centerX + (Math.random() - 0.5) * jitter,
      y: centerY + (Math.random() - 0.5) * jitter,
    };
  });
};

export default function EmotionNoteFlowGroupList({
  access,
  noteId = null,
}: EmotionNoteFlowGroupListProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const nodesRef = useRef<GroupNode[]>([]);
  const [nodes, setNodes] = useState<GroupNode[]>([]);
  const [selectedFlowId, setSelectedFlowId] = useState<number | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [noteFilterInput, setNoteFilterInput] = useState(
    noteId ? String(noteId) : "",
  );
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const queryClient = useQueryClient();
  const { pushToast } = useCbtToast();
  useModalOpen(confirmDelete);
  const panStateRef = useRef({
    isPanning: false,
    startX: 0,
    startY: 0,
    originX: 0,
    originY: 0,
  });

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize({ width, height });
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const flowsQuery = useQuery({
    queryKey: queryKeys.flow.flows(access, noteId),
    queryFn: async () => {
      const { response, data } = await fetchEmotionFlowList(access, noteId);
      if (!response.ok) {
        throw new Error("emotion_flow fetch failed");
      }
      return data.flows ?? [];
    },
    enabled: access.mode !== "blocked",
  });

  const isLoading = flowsQuery.isPending || flowsQuery.isFetching;
  const flows = useMemo(() => flowsQuery.data ?? [], [flowsQuery.data]);
  const selectedFlow = useMemo(
    () => flows.find((flow) => flow.id === selectedFlowId) ?? null,
    [flows, selectedFlowId],
  );
  const selectedNode = useMemo(
    () => nodes.find((node) => node.id === selectedFlowId) ?? null,
    [nodes, selectedFlowId],
  );

  useEffect(() => {
    if (flowsQuery.isError) {
      setNodes([]);
      return;
    }
    setNodes((prev) => seedNodes(flows, prev, size));
  }, [flows, flowsQuery.isError, size]);

  useEffect(() => {
    if (selectedFlowId && !flows.some((flow) => flow.id === selectedFlowId)) {
      setSelectedFlowId(null);
    }
  }, [flows, selectedFlowId]);

  useEffect(() => {
    if (!selectedFlowId) {
      setConfirmDelete(false);
    }
  }, [selectedFlowId]);

  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);

  useEffect(() => {
    if (nodes.length === 0 || size.width === 0 || size.height === 0) {
      setIsSimulating(false);
      return;
    }
    let isActive = true;
    setIsSimulating(true);
    const simNodes = nodesRef.current.map((node) => ({ ...node }));
    const simulation = forceSimulation(simNodes)
      .force("charge", forceManyBody().strength(-8))
      .force("center", forceCenter(size.width / 2, size.height / 2))
      .force(
        "collide",
        forceCollide().radius((node) => (node as GroupNode).radius * 0.92),
      )
      .alpha(0.9)
      .alphaMin(0.06)
      .alphaDecay(0.12);

    let rafId: number | null = null;
    const tick = () => {
      if (rafId !== null) return;
      rafId = window.requestAnimationFrame(() => {
        setNodes(simNodes.map((node) => ({ ...node })));
        rafId = null;
      });
    };
    simulation.on("tick", tick);
    simulation.on("end", () => {
      if (isActive) {
        setIsSimulating(false);
      }
    });

    return () => {
      isActive = false;
      simulation.stop();
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
    };
  }, [nodes.length, size.height, size.width]);

  const totalCount = useMemo(
    () => nodes.reduce((sum, node) => sum + node.noteCount, 0),
    [nodes],
  );

  useEffect(() => {
    setNoteFilterInput(noteId ? String(noteId) : "");
  }, [noteId]);

  const applyNoteFilter = () => {
    const trimmed = noteFilterInput.trim();
    if (!trimmed) {
      router.push("/flow");
      return;
    }
    const parsed = Number(trimmed);
    if (Number.isNaN(parsed)) {
      return;
    }
    router.push(`/flow?noteId=${parsed}`);
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest(`.${styles.node}`)) {
      return;
    }
    setSelectedFlowId(null);
    panStateRef.current.isPanning = true;
    setIsPanning(true);
    panStateRef.current.startX = event.clientX;
    panStateRef.current.startY = event.clientY;
    panStateRef.current.originX = pan.x;
    panStateRef.current.originY = pan.y;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!panStateRef.current.isPanning) return;
    const dx = event.clientX - panStateRef.current.startX;
    const dy = event.clientY - panStateRef.current.startY;
    setPan({
      x: panStateRef.current.originX + dx,
      y: panStateRef.current.originY + dy,
    });
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!panStateRef.current.isPanning) return;
    panStateRef.current.isPanning = false;
    setIsPanning(false);
    event.currentTarget.releasePointerCapture(event.pointerId);
  };

  const handleDeleteFlow = async () => {
    if (!selectedFlowId) return;
    setIsDeleting(true);
    const { response, data } = await deleteEmotionFlow(
      access,
      { flow_id: selectedFlowId },
    );
    if (!response.ok || !data.ok) {
      setIsDeleting(false);
      pushToast(data.message ?? "플로우를 삭제하지 못했습니다.", "error");
      return;
    }
    await queryClient.invalidateQueries({
      queryKey: queryKeys.flow.flows(access, noteId),
    });
    setConfirmDelete(false);
    setSelectedFlowId(null);
    setIsDeleting(false);
    pushToast("플로우를 삭제했습니다.", "success");
  };

  return (
    <section className={styles.section}>
      <header className={styles.header}>
        <div>
          <p className={styles.label}>감정 노트 플로우</p>
          <h2 className={styles.title}>
            {nodes.length}개의 플로우, {totalCount}개의 기록
          </h2>
          <div className={styles.noteFilter}>
            <label
              className={styles.noteFilterLabel}
              htmlFor="flow-note-filter"
            >
              임시 노트 필터
            </label>
            <div className={styles.noteFilterField}>
              <input
                id="flow-note-filter"
                type="number"
                inputMode="numeric"
                placeholder="noteId 입력"
                value={noteFilterInput}
                onChange={(event) => setNoteFilterInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    applyNoteFilter();
                  }
                }}
                className={styles.noteFilterInput}
              />
              <SafeButton
                type="button"
                variant="ghost"
                size="sm"
                className={styles.noteFilterButton}
                onClick={applyNoteFilter}
              >
                적용
              </SafeButton>
            </div>
          </div>
        </div>
      </header>

      <div
        ref={containerRef}
        className={`${styles.canvas} ${isPanning ? styles.canvasPanning : ""}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        {isLoading ? (
          <div className={styles.placeholder}>플로우를 불러오는 중...</div>
        ) : nodes.length === 0 ? (
          <div className={styles.placeholder}>아직 플로우가 없습니다.</div>
        ) : (
          <div
            className={styles.canvasLayer}
            style={
              {
                "--pan-x": `${pan.x}px`,
                "--pan-y": `${pan.y}px`,
              } as CSSProperties
            }
          >
            {nodes.map((node) => {
              const displayTitle = node.title.trim() || `플로우 ${node.id}`;
              return (
                <SafeButton
                  mode="native"
                  key={node.id}
                  type="button"
                  className={`${styles.node} ${
                    selectedFlowId === node.id ? styles.nodeSelected : ""
                  } ${isSimulating ? styles.nodeNoTransition : ""}`}
                  style={
                    {
                      width: node.radius * 2,
                      height: node.radius * 2,
                      backgroundColor: node.color,
                      "--tx": `${node.x - node.radius}px`,
                      "--ty": `${node.y - node.radius}px`,
                      "--node-r": node.rgb[0],
                      "--node-g": node.rgb[1],
                      "--node-b": node.rgb[2],
                    } as CSSProperties
                  }
                  onClick={() => setSelectedFlowId(node.id)}
                >
                  <span className={styles.nodeGroup}>
                    <Waypoints size={12} className={styles.nodeGroupIcon} />
                    #{node.id}
                  </span>
                  <span className={styles.nodeTitle}>{displayTitle}</span>
                  <span className={styles.nodeCountLine}>
                    <span className={styles.nodeCount}>{node.noteCount}</span>{" "}
                    개의 기록
                  </span>
                </SafeButton>
              );
            })}
            {selectedNode && (selectedNode.description?.trim() ?? "") ? (
              <div
                className={styles.nodeTooltip}
                role="status"
                style={
                  {
                    left: `${selectedNode.x}px`,
                    top: `${selectedNode.y - selectedNode.radius - 18}px`,
                  } as CSSProperties
                }
              >
                <div className={styles.nodeTooltipTitle}>
                  {selectedNode.title.trim() || `플로우 ${selectedNode.id}`}
                </div>
                <div className={styles.nodeTooltipBody}>
                  {selectedNode.description}
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
      {selectedFlow ? (
        <>
          <FloatingActionButton
            label="삭제"
            helperText="삭제"
            icon={<Trash2 size={20} />}
            className={styles.fabPrimary}
            onClick={() => setConfirmDelete(true)}
            style={{
              backgroundColor: "#e14a4a",
              color: "#fff",
              borderColor: "#b93333",
            }}
          />
          <FloatingActionButton
            label="Flow"
            helperText="flow로 이동"
            icon={<Route size={20} />}
            className={styles.fabSecondary}
            onClick={() => router.push(`/flow?flowId=${selectedFlow.id}`)}
            style={{
              backgroundColor: "#121417",
              color: "#fff",
              borderColor: "rgba(255, 255, 255, 0.35)",
            }}
          />
        </>
      ) : null}
      {confirmDelete && selectedFlow ? (
        <div
          className={styles.confirmOverlay}
          role="dialog"
          aria-modal="true"
          onClick={() => setConfirmDelete(false)}
        >
          <div
            className={styles.confirmCard}
            onClick={(event) => event.stopPropagation()}
          >
            <p className={styles.confirmTitle}>이 플로우를 삭제할까요?</p>
            <p className={styles.confirmBody}>
              플로우의 연결 기록은 제거되지만, 노트 자체는 삭제되지 않습니다.
            </p>
            <div className={styles.confirmActions}>
              <SafeButton
                variant="danger"
                onClick={handleDeleteFlow}
                loading={isDeleting}
                loadingText="삭제 중..."
                disabled={isDeleting}
              >
                삭제
              </SafeButton>
              <SafeButton
                variant="outline"
                onClick={() => setConfirmDelete(false)}
                disabled={isDeleting}
              >
                취소
              </SafeButton>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
