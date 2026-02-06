"use client";

import {
  forceCenter,
  forceCollide,
  forceManyBody,
  forceSimulation,
} from "d3-force";
import { useRouter } from "next/navigation";
import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./EmotionNoteFlowGroupList.module.css";
import { fetchEmotionFlows } from "@/lib/api/flow/getEmotionNoteFlow";
import { getFlowThemeColor } from "./utils/flowColors";
import SafeButton from "@/components/ui/SafeButton";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";

type EmotionNoteFlowGroupListProps = {
  accessToken: string;
  noteId?: number | null;
};

type GroupNode = {
  id: number;
  noteCount: number;
  radius: number;
  color: string;
  rgb: [number, number, number];
  x: number;
  y: number;
};

const buildNodes = (flows: { id: number; note_count: number }[]) =>
  flows.map((flow) => {
    const radius = 36 + Math.min(90, flow.note_count * 6);
    const theme = getFlowThemeColor(flow.id);
    return {
      id: flow.id,
      noteCount: flow.note_count,
      radius,
      color: theme.rgbString,
      rgb: theme.rgb,
      x: 0,
      y: 0,
    };
  });

export default function EmotionNoteFlowGroupList({
  accessToken,
  noteId = null,
}: EmotionNoteFlowGroupListProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const nodesRef = useRef<GroupNode[]>([]);
  const [nodes, setNodes] = useState<GroupNode[]>([]);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [noteFilterInput, setNoteFilterInput] = useState(
    noteId ? String(noteId) : "",
  );
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
    queryKey: queryKeys.flow.flows(accessToken, noteId),
    queryFn: async () => {
      const { response, data } = await fetchEmotionFlows(accessToken, noteId);
      if (!response.ok) {
        throw new Error("emotion_flow fetch failed");
      }
      return data.flows ?? [];
    },
    enabled: Boolean(accessToken),
  });

  const isLoading = flowsQuery.isPending || flowsQuery.isFetching;
  const flows = useMemo(() => flowsQuery.data ?? [], [flowsQuery.data]);

  useEffect(() => {
    if (flowsQuery.isError) {
      setNodes([]);
      return;
    }
    setNodes(buildNodes(flows));
  }, [flows, flowsQuery.isError]);

  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);

  useEffect(() => {
    if (nodes.length === 0 || size.width === 0 || size.height === 0) {
      return;
    }
    const simNodes = nodesRef.current.map((node) => ({ ...node }));
    const simulation = forceSimulation(simNodes)
      .force("charge", forceManyBody().strength(-8))
      .force("center", forceCenter(size.width / 2, size.height / 2))
      .force(
        "collide",
        forceCollide().radius((node) => (node as GroupNode).radius * 0.92),
      )
      .alpha(0.9);

    let rafId: number | null = null;
    const tick = () => {
      if (rafId !== null) return;
      rafId = window.requestAnimationFrame(() => {
        setNodes(simNodes.map((node) => ({ ...node })));
        rafId = null;
      });
    };
    simulation.on("tick", tick);

    return () => {
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

  return (
    <section className={styles.section}>
      <header className={styles.header}>
        <div>
          <p className={styles.label}>감정 노트 플로우</p>
          <h2 className={styles.title}>
            {nodes.length}개의 플로우, {totalCount}개의 기록
          </h2>
          <div className={styles.noteFilter}>
            <label className={styles.noteFilterLabel} htmlFor="flow-note-filter">
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
            {nodes.map((node) => (
              <SafeButton mode="native"
                key={node.id}
                type="button"
                className={styles.node}
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
                onClick={() => router.push(`/flow?flowId=${node.id}`)}
              >
                <span className={styles.nodeGroup}>플로우 {node.id}</span>
                <span className={styles.nodeText}>
                  <span className={styles.nodeCount}>{node.noteCount}</span>
                  <span className={styles.nodeUnit}>개의</span>
                </span>
                <span className={styles.nodeLabel}>기록이 있습니다</span>
              </SafeButton>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
