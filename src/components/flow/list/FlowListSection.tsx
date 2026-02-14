"use client";

import { useModalOpen } from "@/components/common/useModalOpen";
import { useCbtToast } from "@/components/session/common/CbtToast";
import { deleteEmotionFlow } from "@/lib/api/flow/deleteEmotionFlow";
import type { AccessContext } from "@/lib/types/access";
import { useQueryClient } from "@tanstack/react-query";
import {
  forceCenter,
  forceCollide,
  forceManyBody,
  forceSimulation,
} from "d3-force";
import { useRouter } from "next/navigation";
import type { PointerEvent as ReactPointerEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { flowRoutes } from "../domain/navigation/flowRoutes";
import { invalidateFlowListQueries } from "../domain/query/flowQueryClient";
import { useFlowListQuery } from "./hooks/useFlowListQuery";
import { getFlowThemeColor } from "../utils/flowColors";
import FlowListSectionView from "./views/FlowListSectionView";
import styles from "./FlowListSection.module.css";

type FlowListSectionProps = {
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

export default function FlowListSection({
  access,
  noteId = null,
}: FlowListSectionProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { pushToast } = useCbtToast();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const nodesRef = useRef<GroupNode[]>([]);
  const panStateRef = useRef({
    isPanning: false,
    startX: 0,
    startY: 0,
    originX: 0,
    originY: 0,
  });

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

  useModalOpen(confirmDelete);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize({ width, height });
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const flowsQuery = useFlowListQuery(access, noteId);
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
      router.push(flowRoutes.root());
      return;
    }

    const parsed = Number(trimmed);
    if (Number.isNaN(parsed)) {
      return;
    }

    router.push(flowRoutes.byNote(parsed));
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
    const { response, data } = await deleteEmotionFlow(access, {
      flow_id: selectedFlowId,
    });

    if (!response.ok || !data.ok) {
      setIsDeleting(false);
      pushToast(data.message ?? "플로우를 삭제하지 못했습니다.", "error");
      return;
    }

    await invalidateFlowListQueries(queryClient, access, noteId);
    setConfirmDelete(false);
    setSelectedFlowId(null);
    setIsDeleting(false);
    pushToast("플로우를 삭제했습니다.", "success");
  };

  return (
    <FlowListSectionView
      containerRef={containerRef}
      isPanning={isPanning}
      isLoading={isLoading}
      nodes={nodes}
      pan={pan}
      selectedFlowId={selectedFlowId}
      selectedFlow={selectedFlow}
      selectedNode={selectedNode}
      isSimulating={isSimulating}
      totalCount={totalCount}
      noteFilterInput={noteFilterInput}
      confirmDelete={confirmDelete}
      isDeleting={isDeleting}
      onChangeNoteFilterInput={setNoteFilterInput}
      onApplyNoteFilter={applyNoteFilter}
      onCanvasPointerDown={handlePointerDown}
      onCanvasPointerMove={handlePointerMove}
      onCanvasPointerUp={handlePointerUp}
      onSelectFlow={setSelectedFlowId}
      onOpenDeleteConfirm={() => setConfirmDelete(true)}
      onCloseDeleteConfirm={() => setConfirmDelete(false)}
      onDeleteFlow={handleDeleteFlow}
      onOpenFlow={(selectedId) => router.push(flowRoutes.byFlow(selectedId))}
    />
  );
}
